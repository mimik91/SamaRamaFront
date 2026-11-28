import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationStart, RouterModule } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { filter, catchError } from 'rxjs/operators';
import {
  ServicePackagesConfigDto,
  ServicePackageDto,
  PackageLevel,
  ALL_PACKAGE_LEVELS,
  filterPackagesByBikeType
} from '../shared/models/service-packages.models';
import { SessionSyncService } from '../core/session-sync.service';
import { SeoService } from '../core/seo.service';
import { SchemaOrgHelper, BikeRepairShopData } from '../core/schema-org.helper';
import { SSR_RESPONSE } from '../core/ssr-tokens';
import { NotificationService } from '../core/notification.service';
import { EnumerationService } from '../core/enumeration.service';
import { environment } from '../environments/environments';
import { TRANSPORT_PRICING } from '../shared/constants/transport-pricing.constants';
import { DiscountService } from '../shared/services/discount.service';
import { formatServiceDurationBucket, getServiceDurationBucket, ServiceDurationBucket } from '../service-records/service-duration.util';
import { AuthService } from '../auth/auth.service';
import { BicycleService } from '../pages/client-panel/bicycle.service';
import { ReservationSuccessData, storeReservationSuccess } from '../pages/reservation-success/reservation-success.model';
import { PaymentNavigationState, PaymentSummaryDetails } from '../shared/models/payment.models';
import { ReservationApiService, PublicServiceDetails } from './shared/reservation-api.service';
import { ReservationDraftService } from './shared/reservation-draft.service';
import { ReservationFormStore } from './shared/reservation-form.store';
import {
  AsideRowView,
  CostLineView,
  DeliveryType,
  ReservationDraft,
  ReservationFormConfig,
  SummaryCardView
} from './shared/reservation-form.models';
import {
  formatDatePL,
  formatWeekdayDate,
  formatWeekdayShort
} from './shared/reservation-form.utils';
import { ReservationStepperComponent } from './shared/components/reservation-stepper/reservation-stepper.component';
import { ReservationBikesComponent } from './shared/components/reservation-bikes/reservation-bikes.component';
import { ReservationDatePickerComponent } from './shared/components/reservation-date-picker/reservation-date-picker.component';
import { DeliverySelectorComponent, DeliveryOption, deliveryOptions } from './shared/components/delivery-selector/delivery-selector.component';
import { PickupAddressComponent } from './shared/components/pickup-address/pickup-address.component';
import { ContactFieldsComponent } from './shared/components/contact-fields/contact-fields.component';
import { ReservationAsideComponent } from './shared/components/reservation-aside/reservation-aside.component';
import { ReservationSummaryComponent } from './shared/components/reservation-summary/reservation-summary.component';
import { CouponInputComponent } from './shared/components/coupon-input/coupon-input.component';
import { PackageCardComponent } from './shared/components/package-card/package-card.component';

interface ServiceInfo {
  id: number;
  name: string;
  address: string;
  logoUrl: string | null;
  transportAvailable: boolean;
  transportCost: number | null;
  averageRating: number | null;
  reviewCount: number;
  medianServiceDurationHours: number | null;
}

const GUEST_FORM_CONFIG: ReservationFormConfig = {
  allowedDeliveryTypes: ['SELF', 'DOOR_TO_DOOR', 'OFFICE'],
  defaultDelivery: 'DOOR_TO_DOOR',
  additionalInfoRequired: true,
  weekendsAlwaysBlocked: false,
  clampPickupToToday: false
};

@Component({
  selector: 'app-guest-reservation-form',
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
  templateUrl: './guest-reservation-form.component.html',
  styleUrls: ['./shared/reservation-form.shared.css', './guest-reservation-form.component.css']
})
export class GuestReservationFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ReservationApiService);
  private draftService = inject(ReservationDraftService);
  private notificationService = inject(NotificationService);
  private discountService = inject(DiscountService);
  private enumerationService = inject(EnumerationService);
  private sessionSyncService = inject(SessionSyncService);
  private seoService = inject(SeoService);
  private platformId = inject(PLATFORM_ID);
  private serverResponse = inject(SSR_RESPONSE, { optional: true });
  private authService = inject(AuthService);
  private bicycleService = inject(BicycleService);

  private routerSub: Subscription | null = null;
  private sessionSyncSent = false;
  private pendingDraft: ReservationDraft | null = null;

  readonly store = new ReservationFormStore({
    fb: this.fb,
    api: this.api,
    bicycleService: this.bicycleService,
    enumerationService: this.enumerationService,
    config: GUEST_FORM_CONFIG,
    clientMode: this.authService.isClient(),
    defaultMaxBikes: 0
  });

  loading = false;
  serviceSuffix: string | null = null;

  serviceInfo: ServiceInfo | null = null;
  /** Serwis bez rezerwacji online i bez transportu - pokazujemy kontakt telefoniczny. */
  reservationUnavailable = false;
  unavailableServiceName = '';
  servicePhone: string | null = null;

  cities: string[] = [];
  loadingCities = true;

  // Kupon (transport)
  finalTransportPrice: number | null = null;
  // Cena JEDNEGO dodatkowego roweru po rabacie — domyślnie = bez rabatu (transportPricing.additionalBikeCost),
  // ale kupon WHOLE_ORDER może ją obniżyć (patrz effectiveTransportPrice).
  discountedAdditionalBikePrice: number | null = null;

  // Cennik pakietów
  packagesConfig: ServicePackagesConfigDto | null = null;
  packages: ServicePackageDto[] = [];
  bikeTypes: string[] = [];
  selectedBikeType: string | null = null;
  filteredPackages: ServicePackageDto[] = [];
  packagesExpanded = false;
  readonly packageLevels = ALL_PACKAGE_LEVELS;

  readonly transportPricing = TRANSPORT_PRICING;

  readonly formatWeekdayDate = formatWeekdayDate;
  readonly formatDatePL = formatDatePL;

  // ===== Cykl życia =====

  ngOnInit(): void {
    this.store.loadBrands();
    this.loadCities();
    this.store.loadOffices();
    this.loadServiceInfo();
    this.store.start();

    if (this.store.clientMode) {
      this.store.loadMyBicycles(this.originatingBicycleId());
    }

    if (isPlatformBrowser(this.platformId)) {
      this.routerSub = this.router.events.pipe(
        filter(e => e instanceof NavigationStart)
      ).subscribe(() => this.sendSessionSync());
    }

    // Bez transportu kupon nie ma nic do obniżenia — czyścimy wyliczone ceny.
    this.store.reservationForm.get('deliveryType')?.valueChanges.subscribe((val: DeliveryType) => {
      if (val === 'SELF') {
        this.finalTransportPrice = null;
        this.discountedAdditionalBikePrice = null;
      }
    });
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

  // Ustawiane tylko gdy przyszliśmy z modala "Umów serwis" w szczegółach roweru (patrz
  // BookServiceModalComponent) — router state z bicycleId. Wejście z listy serwisów/mapy nie
  // ustawia tego state, więc żaden rower nie jest wtedy domyślnie wybrany.
  private originatingBicycleId(): number | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return (window.history.state?.bicycleId as number | undefined) ?? null;
  }

  // ===== Ładowanie danych serwisu =====

  private loadCities(): void {
    this.loadingCities = true;
    this.enumerationService.getCities().subscribe({
      next: (cities) => {
        this.cities = this.sortCitiesKrakowFirst(cities);
        this.loadingCities = false;
      },
      error: () => {
        this.cities = this.sortCitiesKrakowFirst(environment.settings.fallback.cities);
        this.loadingCities = false;
      }
    });
  }

  private sortCitiesKrakowFirst(cities: string[]): string[] {
    return [...cities].sort((a, b) => {
      if (a === 'Kraków') return -1;
      if (b === 'Kraków') return 1;
      return a.localeCompare(b, 'pl');
    });
  }

  private loadServiceInfo(): void {
    const suffix = this.route.snapshot.paramMap.get('suffix');

    if (suffix) {
      // Jeśli jesteśmy na starym URL /reserve-service/:suffix → przekieruj na /:suffix/zarezerwuj.
      // Prawdziwe zapytania HTTP (w tym crawlery) dostają teraz 301 bezpośrednio z Express
      // (server.ts, przed renderowaniem Angulara) - ten navigate() obsługuje już tylko
      // wewnętrzną nawigację SPA, więc jest bezpieczny nawet bez isPlatformBrowser.
      if (this.route.snapshot.routeConfig?.path === 'reserve-service/:suffix') {
        if (isPlatformBrowser(this.platformId)) {
          this.router.navigate(['/', suffix, 'zarezerwuj'], { replaceUrl: true });
        }
        return;
      }
      this.serviceSuffix = suffix;
      this.pendingDraft = this.draftService.consume(this.draftKey);
      const stateServiceId = isPlatformBrowser(this.platformId) ? window.history.state?.serviceId : null;
      if (stateServiceId) {
        this.loadServiceDetails(+stateServiceId);
      } else {
        this.loading = true;
        this.api.getServiceIdBySuffix(suffix).subscribe({
          next: (res) => {
            if (res.id) {
              this.loadServiceDetails(res.id);
            } else {
              // UWAGA: nigdy nie wywołuj router.navigate()/setTimeout(...navigate) tutaj bez
              // isPlatformBrowser - podczas SSR blokuje renderowanie na kilka sekund. send404()
              // już ustawia prawdziwy status 404, żadna nawigacja nie jest potrzebna.
              this.send404();
              this.notificationService.error('Nie znaleziono serwisu.');
              this.loading = false;
            }
          },
          error: () => {
            this.send404();
            this.notificationService.error('Nie znaleziono serwisu.');
            this.loading = false;
          }
        });
      }
    } else if (isPlatformBrowser(this.platformId)) {
      // Fallback dla starych URL-i: /reserve-service?serviceId=X. Wymaga zapytania do
      // backendu (serviceId -> suffix), więc nie da się tego bezpiecznie przekierować
      // podczas SSR bez większej przebudowy - ograniczone do przeglądarki (te URL-e
      // z query-param praktycznie nie mają wartości SEO/backlinków).
      this.route.queryParams.subscribe(params => {
        const serviceId = params['serviceId'];
        if (serviceId) {
          this.api.getSuffixByServiceId(serviceId).subscribe({
            next: (response) => {
              if (response.suffix) {
                this.router.navigate(['/', response.suffix, 'zarezerwuj'], { replaceUrl: true });
              } else {
                this.notificationService.error('Nie znaleziono serwisu.');
                this.router.navigate([environment.links.servicesMap]);
              }
            },
            error: () => {
              this.notificationService.error('Nie znaleziono serwisu.');
              this.router.navigate([environment.links.servicesMap]);
            }
          });
        } else {
          this.notificationService.error('Nie znaleziono serwisu.');
          this.router.navigate([environment.links.servicesMap]);
        }
      });
    }
  }

  private loadServiceDetails(serviceId: number): void {
    this.loading = true;
    this.api.getServiceDetails(serviceId).subscribe({
      next: (d) => {
        if (d.reservationAvailable === false) {
          if (d.transportAvailable) {
            this.router.navigate(['/', this.serviceSuffix, 'zamow-transport'], { replaceUrl: true });
            return;
          }
          this.reservationUnavailable = true;
          this.unavailableServiceName = d.name ?? '';
          this.servicePhone = d.phoneNumber || null;
          this.loading = false;
          return;
        }

        const parts: string[] = [];
        if (d.street) parts.push(d.street);
        if (d.building) parts.push(d.building);
        if (d.flat) parts.push('/' + d.flat);
        let address = parts.join(' ');
        if (d.city) address += (address ? ', ' : '') + d.city;

        this.serviceInfo = {
          id: serviceId, // backend nie zwraca id w GET /bike-services/{id}
          name: d.name,
          address,
          logoUrl: d.logoUrl || null,
          transportAvailable: !!d.transportAvailable,
          transportCost: d.transportCost ?? null,
          averageRating: null,
          reviewCount: 0,
          medianServiceDurationHours: null
        };

        this.store.availabilityFetcher = (dateStr) => this.api.getServiceDayAvailability(serviceId, dateStr);

        if (!d.transportAvailable) {
          this.store.reservationForm.get('deliveryType')?.setValue('SELF' as DeliveryType);
        }

        this.injectReservationSchema(d);
        this.updateReservationSeo(d.name, d.city ?? '');

        // id znamy z żądania — GET /bike-services/{id} go już nie zwraca
        this.loadReservationSettings(serviceId);
        this.loadPackages(serviceId);
        this.loadServiceStats(serviceId);
        this.restoreDraft();
        this.loading = false;
      },
      error: () => {
        this.send404();
        this.notificationService.error('Nie udało się załadować danych serwisu.');
        this.router.navigate([environment.links.servicesMap]);
        this.loading = false;
      }
    });
  }

  private loadServiceStats(serviceId: number): void {
    this.api.getServicePublicInfo(serviceId).subscribe({
      next: (info) => {
        if (!this.serviceInfo) return;
        this.serviceInfo = {
          ...this.serviceInfo,
          averageRating: info.averageRating ?? null,
          reviewCount: info.reviewCount ?? 0,
          medianServiceDurationHours: info.medianServiceDurationHours ?? null
        };
      },
      error: () => {}
    });
  }

  private loadReservationSettings(serviceId: number): void {
    this.api.getReservationSettings(serviceId).subscribe({
      next: (settings) => {
        this.store.applySettings(settings);
        this.store.preselectNearestAvailableDate();
      },
      error: () => {}
    });
  }

  get waitingTimeLabel(): string {
    return formatServiceDurationBucket(this.serviceInfo?.medianServiceDurationHours);
  }

  get waitingTimeBucket(): ServiceDurationBucket | null {
    return getServiceDurationBucket(this.serviceInfo?.medianServiceDurationHours);
  }

  // ===== Powrót z płatności (wersja robocza) =====

  private get draftKey(): string {
    return 'guest:' + (this.serviceSuffix ?? '');
  }

  private restoreDraft(): void {
    const draft = this.pendingDraft;
    if (!draft) return;
    this.pendingDraft = null;
    this.store.applyDraft(draft);
    // kupon wpisany przed płatnością — przeliczamy cenę od nowa
    if (this.store.withTransport && draft.coupon?.trim()) {
      this.applyDiscountCoupon();
    }
  }

  // ===== Nawigacja po krokach =====

  nextStep(): void {
    if (this.store.isStep1Valid()) {
      this.store.currentStep = 2;
      this.scrollTop();
    } else {
      this.store.markStep1Touched();
      this.notificationService.warning('Wypełnij wszystkie wymagane pola poprawnie.');
    }
  }

  prevStep(): void {
    this.store.currentStep = 1;
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
    if (!store.isStep1Valid() || !store.termsControl.valid || !this.serviceInfo) {
      store.termsControl.markAsTouched();
      this.notificationService.warning('Zaakceptuj regulamin aby kontynuować.');
      return;
    }

    const rv = store.reservationForm.value;

    // Płatny transport: NIE twórz rezerwacji od razu (POST /service-reservation) — backend utworzy
    // ją dopiero po opłaceniu transportu (TransportPaymentHandler.onPaymentCompleted →
    // createGuestTransportOrder, warunkowo, na podstawie plannedDate w payloadzie transportu).
    // Zapobiega to zajętym, nieopłaconym terminom gdy klient porzuci płatność.
    if (store.withTransport && this.effectiveTransportPrice > 0) {
      const orderData = this.buildTransportPayload(rv, []);
      // Po powrocie z PayU pokazujemy ekran /sukces (podsumowanie rezerwacji) zamiast ogólnego
      // "transport opłacony" — dane czekają w sessionStorage (patrz PaymentReturnComponent).
      if (isPlatformBrowser(this.platformId)) {
        storeReservationSuccess(this.buildReservationSuccessData());
      }
      this.draftService.save(this.draftKey, store.toDraft());
      const state: PaymentNavigationState & { orderType: 'TRANSPORT' } = {
        orderType: 'TRANSPORT',
        orderData,
        totalPrice: this.effectiveTransportPrice,
        bikeCount: store.bikesArray.length,
        details: this.buildSummaryDetails(),
        returnTo: { url: `/${this.serviceSuffix}/zarezerwuj`, label: 'Wróć do zamówienia' }
      };
      this.router.navigate(['/platnosc/podsumowanie'], { state });
      return;
    }

    store.submitting = true;

    const reservationPayload = {
      firstName: (rv.firstName ?? '').trim() || null,
      lastName: (rv.lastName ?? '').trim() || null,
      email: (rv.email ?? '').trim() || null,
      phone: (rv.phone ?? '').trim() || null,
      bicycles: store.bikesPayload(null),
      plannedDate: store.plannedDateStr,
      description: store.bikesPayload(null)[0]?.additionalInfo || null
    };

    this.api.sendDebugReport('reservation', reservationPayload);

    this.api.createReservation(this.serviceInfo.id, reservationPayload).subscribe({
      next: (res) => {
        if (store.withTransport) {
          // effectiveTransportPrice tutaj zawsze === 0 — płatny transport obsłużony wyżej, przed
          // utworzeniem rezerwacji.
          this.submitTransport(rv, res.orderIds);
        } else {
          this.onSuccess();
        }
      },
      error: (err) => {
        store.submitting = false;
        const msg = err.error?.message || 'Nie udało się złożyć rezerwacji. Spróbuj ponownie.';
        this.notificationService.error(msg);
      }
    });
  }

  /** Podsumowanie wybranych opcji na ekran płatności (tylko do wyświetlenia). */
  private buildSummaryDetails(): PaymentSummaryDetails {
    const store = this.store;
    return {
      ...store.paymentDetailsBase(),
      serviceName: this.serviceInfo?.name,
      discountCoupon: this.finalTransportPrice !== null ? (store.couponControl.value ?? undefined) : undefined
    };
  }

  private submitTransport(rv: Record<string, unknown>, serviceOrderIds: number[]): void {
    const payload = this.buildTransportPayload(rv, serviceOrderIds);
    this.api.sendDebugReport('transport', payload);

    this.api.createTransport(payload).subscribe({
      next: () => this.onSuccess(),
      error: (err) => {
        this.api.sendDebugReport('transport-error', {
          status: err?.status,
          message: err?.error?.message || err?.message,
          error: err?.error,
          sentPayload: payload
        });
        this.store.submitting = false;
        const msg = err.error?.message ||
          'Rezerwacja serwisu złożona, ale nie udało się zarezerwować transportu. Skontaktuj się z serwisem.';
        this.notificationService.error(msg);
      }
    });
  }

  private buildTransportPayload(rv: Record<string, unknown>, serviceOrderIds: number[]): Record<string, unknown> {
    const store = this.store;
    const tv = store.transportForm.value;

    // plannedDate — data rezerwacji u serwisu (inna niż pickupDate, data odbioru przez kuriera).
    // Backend tworzy rezerwację "przy okazji" transportu tylko gdy serviceOrderIds jest puste —
    // dla ścieżek gdzie rezerwacja już powstała (serviceOrderIds niepuste) pole jest ignorowane,
    // więc bezpiecznie wysyłamy je zawsze.
    return {
      serviceOrderIds,
      bicycles: store.bikesPayload(''),
      email: String(rv['email'] ?? '').trim(),
      phone: String(rv['phone'] ?? '').trim(),
      firstName: String(rv['firstName'] ?? '').trim(),
      lastName: String(rv['lastName'] ?? '').trim(),
      pickupStreet: tv.pickupStreet,
      pickupBuildingNumber: tv.pickupBuildingNumber,
      pickupCity: tv.pickupCity,
      pickupPostalCode: tv.pickupPostalCode || '',
      pickupDate: store.transportDate,
      plannedDate: store.plannedDateStr,
      targetServiceId: this.serviceInfo!.id,
      transportPrice: this.effectiveTransportPrice,
      transportNotes: store.courierNotes,
      additionalNotes: '',
      discountCoupon: this.finalTransportPrice !== null ? store.couponControl.value : null,
      pickupOfficeName: store.officeLabel
    };
  }

  private onSuccess(): void {
    this.store.submitting = false;
    const reservation = this.buildReservationSuccessData();
    if (isPlatformBrowser(this.platformId)) {
      storeReservationSuccess(reservation);
    }
    this.router.navigate(['/sukces'], { replaceUrl: true, state: { reservation } });
  }

  /** Dane do ekranu /sukces. Wołane po udanym wysłaniu, gdy formularz nadal ma wartości. */
  private buildReservationSuccessData(): ReservationSuccessData {
    return {
      ...this.store.successBase(this.authService.getCurrentUserEmail()),
      serviceName: this.serviceInfo?.name ?? '',
      serviceAddress: this.serviceInfo?.address ?? '',
      logoUrl: this.serviceInfo?.logoUrl ?? null,
      suffix: this.serviceSuffix,
      withTransport: this.store.withTransport
    };
  }

  // ===== Kupon i cena transportu =====

  applyDiscountCoupon(): void {
    const store = this.store;
    const coupon = store.couponControl.value?.trim();
    // !this.serviceInfo?.transportCost celowo odrzuca też transportCost === 0 (transport już
    // darmowy dla wszystkich rowerów — kupon nie ma nic do obniżenia).
    if (!coupon || store.coupon.applying || !this.serviceInfo?.transportCost) return;

    if (!store.reservationForm.get('plannedDate')?.value) {
      this.notificationService.warning('Wybierz najpierw datę serwisu.');
      return;
    }

    store.coupon.applying = true;
    store.coupon.message = null;
    store.coupon.invalid = false;

    const additionalBikes = Math.max(0, store.bikesArray.length - 1);
    const remainderPrice = additionalBikes * this.transportPricing.additionalBikeCost;

    this.discountService.applyDiscount({
      coupon,
      scope: 'TRANSPORT',
      firstUnitPrice: this.serviceInfo.transportCost,
      remainderPrice,
      orderDate: store.transportDate
    }).subscribe({
      next: (res) => {
        this.finalTransportPrice = res.firstUnitPrice;
        this.discountedAdditionalBikePrice = additionalBikes > 0 ? res.remainderPrice / additionalBikes : null;
        store.coupon.message = `Kupon zastosowany! Nowa cena: ${res.totalPrice} PLN`;
        store.coupon.invalid = false;
        store.coupon.applying = false;
      },
      error: (err) => {
        this.finalTransportPrice = null;
        this.discountedAdditionalBikePrice = null;
        store.coupon.message = err.error?.message || 'Kupon jest nieprawidłowy lub już wygasł.';
        store.coupon.invalid = true;
        store.coupon.applying = false;
      }
    });
  }

  get effectiveTransportPrice(): number {
    // Darmowy transport skonfigurowany na serwisie (transportCost === 0) obejmuje wszystkie
    // rowery — nie tylko pierwszy. Kupon nie może tu nic obniżyć (patrz guard w applyDiscountCoupon).
    if (this.serviceInfo?.transportCost === 0) {
      return 0;
    }
    const basePrice = this.finalTransportPrice ?? this.serviceInfo?.transportCost ?? this.transportPricing.partnerCost;
    const additionalBikes = Math.max(0, this.store.bikesArray.length - 1);
    // Kupon WHOLE_ORDER może obniżyć też cenę dodatkowych rowerów — jeśli tak, discountedAdditionalBikePrice
    // jest ustawione (per sztuka); w przeciwnym razie dodatkowe rowery kosztują tyle co bez kuponu.
    const additionalBikeUnitPrice = this.discountedAdditionalBikePrice ?? this.transportPricing.additionalBikeCost;
    return basePrice + additionalBikes * additionalBikeUnitPrice;
  }

  get transportCostLabel(): string {
    return `${this.serviceInfo?.transportCost ?? this.transportPricing.partnerCost} zł`;
  }

  // ===== Widoki (modele dla klocków) =====

  get deliveryOptions(): DeliveryOption[] {
    return deliveryOptions(this.store.config.allowedDeliveryTypes, this.transportCostLabel);
  }

  get asideRows(): AsideRowView[] {
    const store = this.store;
    const rows: AsideRowView[] = [
      { label: 'Serwis', values: [this.serviceInfo?.name ?? ''] },
      {
        label: store.summaryBikes.length > 1 ? 'Rowery' : 'Rower',
        values: store.summaryBikes,
        placeholder: 'uzupełnij dane roweru'
      },
      {
        label: 'Termin',
        values: store.selectedDateObj ? [formatWeekdayDate(store.selectedDateObj, true)] : [],
        placeholder: 'wybierz termin'
      }
    ];
    if (this.serviceInfo?.transportAvailable) {
      rows.push(store.withTransport
        ? {
            label: 'Transport',
            values: [`${store.isOfficePick ? 'Spod biurowca' : 'Door-to-door'} · ${this.effectiveTransportPrice} zł`],
            note: store.transportDate
              ? `odbiór ${formatWeekdayShort(store.transportDate)}, ${store.pickupWindow}`
              : undefined
          }
        : { label: 'Transport', values: ['Przywiozę rower sam'] });
    }
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
    const tv = store.transportForm.getRawValue();
    const contact = store.contactSummaryCard();
    const cards: SummaryCardView[] = contact ? [contact] : [];
    cards.push(store.bikesSummaryCard());

    cards.push({
      title: 'Termin serwisu',
      icon: 'calendar',
      rows: [
        { label: 'Data serwisu:', value: formatDatePL(store.plannedDateStr), highlight: true },
        { label: 'Serwis:', value: this.serviceInfo?.name ?? '' }
      ]
    });

    if (store.withTransport) {
      const rows = [] as { label: string; value: string; highlight?: boolean }[];
      if (store.isOfficePick && store.selectedOffice) {
        rows.push({ label: 'Kompleks biurowy:', value: store.selectedOffice.name });
      }
      rows.push(
        { label: 'Data odbioru:', value: formatDatePL(store.transportDate), highlight: true },
        {
          label: 'Adres odbioru:',
          value: `${tv.pickupStreet} ${tv.pickupBuildingNumber}, ${tv.pickupCity} ${tv.pickupPostalCode ?? ''}`.trim()
        }
      );
      if (tv.transportNotes?.trim()) rows.push({ label: 'Uwagi:', value: tv.transportNotes });
      cards.push({ title: 'Transport roweru', icon: 'truck', rows, wide: true });
    }
    return cards;
  }

  get costLines(): CostLineView[] {
    const store = this.store;
    const lines: CostLineView[] = [{ label: 'Koszt serwisu:', value: 'Płatność w serwisie', neutral: true }];
    if (store.withTransport) {
      const original = this.serviceInfo?.transportCost && this.finalTransportPrice !== null
        ? `${this.serviceInfo.transportCost} PLN` : undefined;
      lines.push({ label: 'Koszt transportu:', value: `${this.effectiveTransportPrice} PLN`, original });
    }
    lines.push({
      label: 'Łącznie do zapłaty teraz:',
      value: store.withTransport ? `${this.effectiveTransportPrice} PLN` : '0 PLN',
      total: true
    });
    return lines;
  }

  get showCoupon(): boolean {
    // ukryty gdy transport darmowy lub niewybrany — kupon nie ma nic do obniżenia
    return this.store.withTransport && !!this.serviceInfo?.transportCost;
  }

  get transportCardNumber(): number {
    return this.store.bikesArray.length + 2;
  }

  get contactCardNumber(): number {
    return this.store.bikesArray.length + 2 + (this.serviceInfo?.transportAvailable ? 1 : 0);
  }

  get pickupHint(): string {
    const date = this.store.transportDate;
    return date ? formatWeekdayDate(date, false) : '';
  }

  goBack(): void {
    this.router.navigate([environment.links.servicesMap]);
  }

  // ===== Cennik pakietów =====

  togglePackages(): void {
    this.packagesExpanded = !this.packagesExpanded;
  }

  onBikeTypeChange(type: string): void {
    this.selectedBikeType = type;
    this.filteredPackages = filterPackagesByBikeType(this.packages, type);
  }

  getPackageForLevel(level: PackageLevel): ServicePackageDto | null {
    return this.filteredPackages.find(p => p.packageLevel === level) || null;
  }

  getPackageDisplayName(pkg: ServicePackageDto): string {
    return pkg.customName || pkg.packageLevelDisplayName;
  }

  private loadPackages(serviceId: number): void {
    forkJoin({
      config: this.api.getPackagesConfig(serviceId).pipe(catchError(() => of(null))),
      bikeTypes: this.api.getBikeTypes(serviceId).pipe(catchError(() => of([] as string[])))
    }).subscribe({
      next: ({ config, bikeTypes }) => {
        if (!config?.packages?.some(p => p.active)) return;

        this.packagesConfig = config;
        this.packages = config.packages.filter(p => p.active);

        const derivedTypes = bikeTypes.length > 0
          ? bikeTypes
          : [...new Set(this.packages.flatMap(p => p.bikeTypes))].sort((a, b) => a.localeCompare(b, 'pl'));

        this.bikeTypes = derivedTypes;
        this.selectedBikeType = config.defaultBikeType || derivedTypes[0] || null;
        this.filteredPackages = filterPackagesByBikeType(this.packages, this.selectedBikeType);
      }
    });
  }

  // ===== SEO / SSR =====

  private send404(): void {
    if (this.serverResponse) {
      this.serverResponse.status(404);
    }
  }

  private updateReservationSeo(serviceName: string, city: string): void {
    if (!this.serviceSuffix) return;

    this.seoService.updateFullSeoTags(
      {
        title: `Rezerwacja wizyty – ${serviceName} | CycloPick`,
        description: `Zarezerwuj wizytę w serwisie rowerowym ${serviceName}${city ? ' w ' + city : ''}. Wybierz termin online – szybko i wygodnie.`,
        type: 'website',
        keywords: ['rezerwacja serwis rowerowy', serviceName, city, 'umów wizytę rowerowy', 'serwis rowerowy online']
      },
      // Canonical wskazuje na profil serwisu – strona rezerwacji nie konkuruje z nim w wynikach.
      `/${this.serviceSuffix}`
    );
  }

  private injectReservationSchema(d: PublicServiceDetails): void {
    if (!this.serviceSuffix) return;

    const serviceUrl = `${environment.siteUrl}/${this.serviceSuffix}`;
    const bookingUrl = `${serviceUrl}/zarezerwuj`;

    const schemaData: BikeRepairShopData = {
      name: d.name,
      url: serviceUrl,
      address: {
        street: `${d.street || ''} ${d.building || ''}${d.flat ? '/' + d.flat : ''}`.trim(),
        city: d.city || '',
        postalCode: d.postalCode || '',
        country: 'PL'
      },
      image: d.logoUrl || undefined,
      telephone: d.phoneNumber || undefined,
      email: d.email || undefined
    };

    const schema = SchemaOrgHelper.generateBookableLocalBusiness(schemaData, bookingUrl);
    if (schema) {
      this.seoService.addStructuredData(schema);
    }
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
