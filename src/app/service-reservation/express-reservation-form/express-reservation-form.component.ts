import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationStart, RouterModule } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { filter, catchError } from 'rxjs/operators';
import { ServicePackageDto } from '../../shared/models/service-packages.models';
import { SessionSyncService } from '../../core/session-sync.service';
import { SeoService } from '../../core/seo.service';
import { NotificationService } from '../../core/notification.service';
import { EnumerationService } from '../../core/enumeration.service';
import { DiscountService } from '../../shared/services/discount.service';
import { AuthService } from '../../auth/auth.service';
import { BicycleService } from '../../pages/client-panel/bicycle.service';
import { PaymentNavigationState, PaymentSummaryDetails } from '../../shared/models/payment.models';
import { ReservationSuccessData, storeReservationSuccess } from '../../pages/reservation-success/reservation-success.model';
import { ReservationApiService } from '../shared/reservation-api.service';
import { ReservationDraftService } from '../shared/reservation-draft.service';
import { ReservationFormStore } from '../shared/reservation-form.store';
import {
  AsideRowView,
  CostLineView,
  DeliveryType,
  ReservationFormConfig,
  SummaryCardView
} from '../shared/reservation-form.models';
import { dateToStr, formatDatePL, formatWeekdayDate } from '../shared/reservation-form.utils';
import { ReservationStepperComponent } from '../shared/components/reservation-stepper/reservation-stepper.component';
import { ReservationBikesComponent } from '../shared/components/reservation-bikes/reservation-bikes.component';
import { ReservationDatePickerComponent } from '../shared/components/reservation-date-picker/reservation-date-picker.component';
import { DeliverySelectorComponent, DeliveryOption, deliveryOptions } from '../shared/components/delivery-selector/delivery-selector.component';
import { PickupAddressComponent } from '../shared/components/pickup-address/pickup-address.component';
import { ContactFieldsComponent } from '../shared/components/contact-fields/contact-fields.component';
import { ReservationAsideComponent } from '../shared/components/reservation-aside/reservation-aside.component';
import { ReservationSummaryComponent } from '../shared/components/reservation-summary/reservation-summary.component';
import { CouponInputComponent } from '../shared/components/coupon-input/coupon-input.component';
import { PackageCardComponent } from '../shared/components/package-card/package-card.component';

const EXPRESS_FORM_CONFIG: ReservationFormConfig = {
  allowedDeliveryTypes: ['OFFICE', 'DOOR_TO_DOOR'],
  defaultDelivery: 'OFFICE',
  additionalInfoRequired: false,
  weekendsAlwaysBlocked: true,
  clampPickupToToday: true
};

const DRAFT_KEY = 'express';
const FORM_URL = '/krakow/zarezerwuj';

@Component({
  selector: 'app-express-reservation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ReservationStepperComponent,
    ReservationBikesComponent,
    ReservationDatePickerComponent,
    DeliverySelectorComponent,
    PickupAddressComponent,
    ContactFieldsComponent,
    ReservationAsideComponent,
    ReservationSummaryComponent,
    CouponInputComponent,
    PackageCardComponent
  ],
  templateUrl: './express-reservation-form.component.html',
  styleUrls: ['../shared/reservation-form.shared.css', './express-reservation-form.component.css']
})
export class ExpressReservationFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ReservationApiService);
  private draftService = inject(ReservationDraftService);
  private notificationService = inject(NotificationService);
  private enumerationService = inject(EnumerationService);
  private sessionSyncService = inject(SessionSyncService);
  private seoService = inject(SeoService);
  private platformId = inject(PLATFORM_ID);
  private discountService = inject(DiscountService);
  private authService = inject(AuthService);
  private bicycleService = inject(BicycleService);

  private routerSub: Subscription | null = null;
  private sessionSyncSent = false;

  readonly store = new ReservationFormStore({
    fb: this.fb,
    api: this.api,
    bicycleService: this.bicycleService,
    enumerationService: this.enumerationService,
    config: EXPRESS_FORM_CONFIG,
    clientMode: this.authService.isClient(),
    defaultMaxBikes: 5
  });

  // Wybór pakietu serwisowego (wymagany — jeden pakiet dla całej rezerwacji)
  packagesLoaded = false;
  packages: ServicePackageDto[] = [];
  selectedPackage: ServicePackageDto | null = null;
  packageSelectionAttempted = false;

  /** Cena zamówienia po kuponie (tylko podgląd — realną cenę liczy backend w quote). */
  discountedTotal: number | null = null;

  private draftPackageId: number | null = null;

  // ===== Cykl życia =====

  ngOnInit(): void {
    const store = this.store;
    store.availabilityFetcher = (dateStr) => this.api.getExpressAvailability(dateStr, dateStr);

    const draft = this.draftService.consume(DRAFT_KEY);
    if (draft) {
      this.draftPackageId = (draft.extra?.['packageId'] as number | null | undefined) ?? null;
      store.applyDraft(draft);
    }

    store.loadBrands();
    store.loadOffices();
    this.loadReservationSettings();
    this.loadPackages();
    store.start();

    if (store.clientMode) {
      store.loadMyBicycles(draft ? null : this.originatingBicycleId());
    }

    this.seoService.updateFullSeoTags(
      {
        title: 'Serwis rowerowy Kraków – rezerwacja z odbiorem nawet dziś | CycloPick',
        description: 'Zarezerwuj serwis roweru w Krakowie, nawet na dziś. Wymiana dętki? Zwrot roweru zwykle w mniej niż godzinę. Przegląd ogólny? Gotowe do 48h. Odbiór i zwrot kurierem, spod biura lub domu.',
        type: 'website',
        keywords: ['serwis rowerowy Kraków', 'wymiana dętki Kraków', 'serwis rowerowy na dziś', 'cyclopick serwis']
      },
      FORM_URL
    );

    if (isPlatformBrowser(this.platformId)) {
      this.routerSub = this.router.events.pipe(
        filter(e => e instanceof NavigationStart)
      ).subscribe(() => this.sendSessionSync());
    }
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.sendSessionSync();
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.store.destroy();
    this.seoService.removeStructuredData();
  }

  private originatingBicycleId(): number | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return (window.history.state?.bicycleId as number | undefined) ?? null;
  }

  private loadReservationSettings(): void {
    const today = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 60);

    this.api.getExpressAvailability(dateToStr(today), dateToStr(future)).subscribe({
      next: (days) => {
        const bookedDates = days.filter(d => !d.available).map(d => d.date);
        this.store.applySettings({ acceptedDays: [], fullyBookedDates: bookedDates });
        this.store.preselectNearestAvailableDate();
      },
      error: () => {
        this.store.applySettings({ acceptedDays: [] });
        this.store.preselectNearestAvailableDate();
      }
    });
  }

  // ===== Pakiety =====

  get noPackagesAvailable(): boolean {
    return this.packagesLoaded && this.packages.length === 0;
  }

  selectPackage(pkg: ServicePackageDto): void {
    this.selectedPackage = pkg;
    this.packageSelectionAttempted = false;
    this.discountedTotal = null;
  }

  private loadPackages(): void {
    this.api.getExpressPackages().pipe(catchError(() => of(null))).subscribe({
      next: (config) => {
        this.packages = (config?.active && config.packages) ? config.packages.filter(p => p.active) : [];
        this.packagesLoaded = true;
        if (this.packages.length === 0) return;

        // Preselekcja pakietu przez ?pakiet=... (np. link z dedykowanej strony o wymianie dętki).
        // Bez dopasowania — domyślnie najtańszy pakiet, klient może zmienić wybór ręcznie.
        const preselect = this.route.snapshot.queryParamMap.get('pakiet');
        const matched = preselect ? this.findPackageByHint(preselect) : null;
        const fromDraft = this.draftPackageId != null
          ? this.packages.find(p => p.id === this.draftPackageId) ?? null
          : null;
        this.selectedPackage = fromDraft
          ?? matched
          ?? this.packages.reduce((cheapest, pkg) => pkg.price < cheapest.price ? pkg : cheapest);
      }
    });
  }

  /** Dopasowanie po znormalizowanym (bez polskich znaków, małe litery) fragmencie nazwy pakietu. */
  private findPackageByHint(hint: string): ServicePackageDto | null {
    const normalize = (s: string) => s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
    const needle = normalize(hint);
    return this.packages.find(p => normalize(p.displayName).includes(needle)) ?? null;
  }

  // ===== Kroki =====

  nextStep(): void {
    const store = this.store;
    if (store.isStep1Valid() && this.selectedPackage) {
      store.currentStep = 2;
      this.scrollTop();
    } else {
      store.markStep1Touched();
      this.packageSelectionAttempted = true;
      this.notificationService.warning(
        !this.selectedPackage ? 'Wybierz pakiet serwisowy.' : 'Wypełnij wszystkie wymagane pola poprawnie.'
      );
    }
  }

  prevStep(): void {
    this.store.currentStep = 1;
    this.discountedTotal = null;
    this.scrollTop();
  }

  private scrollTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ===== Wysyłka =====

  onSubmit(): void {
    const store = this.store;
    if (!store.isStep1Valid() || !this.selectedPackage || !store.termsControl.valid) {
      store.termsControl.markAsTouched();
      this.packageSelectionAttempted = true;
      this.notificationService.warning(
        !this.selectedPackage ? 'Wybierz pakiet serwisowy.' : 'Zaakceptuj regulamin aby kontynuować.'
      );
      return;
    }

    store.submitting = true;
    const orderData = this.buildServiceOrderPayload();

    this.api.quoteExpress(orderData).subscribe({
      next: (res) => {
        store.submitting = false;
        const finalOrderData = { ...orderData, serviceId: res.expressServiceId };
        this.draftService.save(DRAFT_KEY, store.toDraft({ packageId: this.selectedPackage?.id ?? null }));
        // Po opłaceniu pokażemy wspólny ekran /sukces (serwis dobiera CycloPick, więc bez nazwy serwisu).
        if (isPlatformBrowser(this.platformId)) {
          storeReservationSuccess(this.buildSuccessData());
        }
        const state: PaymentNavigationState = {
          orderType: 'SERVICE_ORDER',
          orderData: finalOrderData,
          totalPrice: res.totalPrice,
          bikeCount: store.bikesArray.length,
          details: this.buildSummaryDetails(orderData),
          returnTo: { url: FORM_URL, label: 'Wróć do zamówienia' }
        };
        this.router.navigate(['/platnosc/podsumowanie'], { state });
      },
      error: (err) => {
        store.submitting = false;
        const msg = err.error?.message || 'Nie udało się wycenić rezerwacji. Spróbuj ponownie.';
        this.notificationService.error(msg);
      }
    });
  }

  /** Dane ekranu /sukces po opłaceniu — wariant „paid-express" (rezerwacja potwierdzona, serwis jeszcze nieznany). */
  private buildSuccessData(): ReservationSuccessData {
    return {
      ...this.store.successBase(this.authService.getCurrentUserEmail()),
      variant: 'paid-express',
      serviceName: '',
      serviceAddress: '',
      logoUrl: null,
      suffix: null,
      packageName: this.selectedPackage?.displayName ?? null,
      pickupDate: this.store.transportDate,
      pickupPlace: this.store.pickupPlace || null
    };
  }

  /** Podsumowanie wybranych opcji na ekran potwierdzenia (tylko do wyświetlenia). */
  private buildSummaryDetails(orderData: Record<string, unknown>): PaymentSummaryDetails {
    return {
      ...this.store.paymentDetailsBase(),
      packageName: this.selectedPackage?.displayName,
      packagePrice: this.selectedPackage?.price,
      discountCoupon: (orderData['discountCoupon'] as string | null) ?? undefined
    };
  }

  /**
   * Buduje pełny payload rezerwacji + odbioru — nic jeszcze nie zapisuje w bazie.
   * ServiceOrder i powiązany (bezpłatny) TransportOrder powstają dopiero po opłaceniu.
   */
  private buildServiceOrderPayload(): Record<string, unknown> {
    const store = this.store;
    const rv = store.reservationForm.value;
    const tv = store.transportForm.value;

    const bikesPayload = store.bikesPayload(null);

    return {
      firstName: (rv.firstName ?? '').trim() || null,
      lastName: (rv.lastName ?? '').trim() || null,
      email: (rv.email ?? '').trim() || null,
      phone: (rv.phone ?? '').trim() || null,
      bicycles: bikesPayload,
      plannedDate: store.plannedDateStr,
      description: bikesPayload[0]?.additionalInfo || null,
      packageId: this.selectedPackage!.id,
      pickupStreet: tv['pickupStreet'],
      pickupBuildingNumber: tv['pickupBuildingNumber'],
      pickupApartmentNumber: null,
      pickupCity: tv['pickupCity'],
      pickupPostalCode: tv['pickupPostalCode'] || '',
      pickupOfficeName: store.officeLabel,
      pickupDate: store.transportDate,
      transportNotes: store.courierNotes,
      discountCoupon: store.coupon.invalid ? null : (store.couponControl.value?.trim() || null)
    };
  }

  // ===== Kupon =====

  applyDiscountCoupon(): void {
    const store = this.store;
    const coupon = store.couponControl.value?.trim();
    if (!coupon || store.coupon.applying || !this.selectedPackage) return;

    if (!store.reservationForm.get('plannedDate')?.value) {
      this.notificationService.warning('Wybierz najpierw datę serwisu.');
      return;
    }

    store.coupon.applying = true;
    store.coupon.message = null;
    store.coupon.invalid = false;

    const additionalBikes = Math.max(0, store.bikesArray.length - 1);

    this.discountService.applyDiscount({
      coupon,
      scope: 'SERVICE_ORDER',
      firstUnitPrice: this.selectedPackage.price,
      remainderPrice: this.selectedPackage.price * additionalBikes,
      orderDate: store.plannedDateStr
    }).subscribe({
      next: (res) => {
        this.discountedTotal = res.totalPrice;
        store.coupon.message = `Kupon zastosowany! Nowa cena: ${res.totalPrice} PLN`;
        store.coupon.invalid = false;
        store.coupon.applying = false;
      },
      error: (err) => {
        this.discountedTotal = null;
        store.coupon.message = err.error?.message || 'Kupon jest nieprawidłowy lub już wygasł.';
        store.coupon.invalid = true;
        store.coupon.applying = false;
      }
    });
  }

  // ===== Widoki (modele dla klocków) =====

  get deliveryOptions(): DeliveryOption[] {
    return deliveryOptions(this.store.config.allowedDeliveryTypes, 'w cenie');
  }

  get pickupLabel(): string {
    return formatDatePL(this.store.transportDate);
  }

  private get packageTotal(): number {
    return (this.selectedPackage?.price ?? 0) * this.store.bikesArray.length;
  }

  get asideRows(): AsideRowView[] {
    const store = this.store;
    const rows: AsideRowView[] = [
      { label: 'Usługa', values: ['Serwis ekspresowy z odbiorem'], note: 'w partnerskim warsztacie w Krakowie' },
      {
        label: 'Pakiet',
        values: this.selectedPackage ? [`${this.selectedPackage.displayName} · ${this.selectedPackage.price} zł`] : [],
        placeholder: 'wybierz pakiet'
      },
      {
        label: store.summaryBikes.length > 1 ? 'Rowery' : 'Rower',
        values: store.summaryBikes,
        placeholder: 'uzupełnij dane roweru'
      },
      {
        label: 'Termin',
        values: store.selectedDateObj ? [formatWeekdayDate(store.selectedDateObj, true)] : [],
        placeholder: 'wybierz termin'
      },
      {
        label: 'Odbiór',
        values: store.transportDate ? [formatWeekdayDate(store.transportDate, false)] : [],
        placeholder: 'po wyborze terminu',
        note: this.store.pickupPlace || undefined
      }
    ];
    if (!store.clientMode) {
      rows.push({
        label: 'Kontakt',
        values: store.summaryContactName ? [store.summaryContactName] : [],
        placeholder: 'uzupełnij dane'
      });
    }
    return rows;
  }

  get summaryCards(): SummaryCardView[] {
    const store = this.store;
    const contact = store.contactSummaryCard();
    const cards: SummaryCardView[] = contact ? [contact] : [];

    cards.push({
      title: 'Pakiet',
      icon: 'package',
      rows: [
        { label: 'Usługa:', value: 'Serwis ekspresowy z odbiorem i zwrotem roweru' },
        { label: 'Pakiet:', value: this.selectedPackage?.displayName ?? '' },
        { label: 'Warsztat:', value: 'partnerski serwis w Krakowie, wybierzemy go dla Ciebie' }
      ]
    });

    cards.push(store.bikesSummaryCard());

    cards.push({
      title: 'Termin i odbiór',
      icon: 'truck',
      wide: true,
      rows: [
        { label: 'Data serwisu:', value: formatDatePL(store.plannedDateStr), highlight: true },
        { label: 'Odbiór roweru:', value: formatDatePL(store.transportDate), highlight: true },
        { label: 'Miejsce odbioru:', value: this.store.pickupPlace }
      ]
    });
    return cards;
  }

  get costLines(): CostLineView[] {
    const bikes = this.store.bikesArray.length;
    const price = this.selectedPackage?.price ?? 0;
    const total = this.packageTotal;
    const discounted = this.discountedTotal !== null && this.discountedTotal !== total;
    return [
      {
        label: `Pakiet${bikes > 1 ? ` (${bikes} × ${price} PLN)` : ''}:`,
        value: `${total} PLN`
      },
      { label: 'Transport:', value: 'wliczony w cenę', neutral: true },
      {
        label: 'Do zapłaty:',
        value: `${discounted ? this.discountedTotal : total} PLN`,
        original: discounted ? `${total} PLN` : undefined,
        total: true
      }
    ];
  }

  private sendSessionSync(): void {
    if (this.sessionSyncSent) return;
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.store.clientMode) return; // zalogowany klient nie ma sensu "odzyskiwać" mailem — ma konto
    this.sessionSyncSent = true;
    const rv = this.store.reservationForm.value;
    this.sessionSyncService.send({
      firstName: rv.firstName?.trim() || '',
      lastName: rv.lastName?.trim() || '',
      email: rv.email?.trim() || '',
      phone: rv.phone?.trim() || ''
    });
  }
}
