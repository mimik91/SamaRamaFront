import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router, NavigationStart, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, forkJoin, of } from 'rxjs';
import { filter, distinctUntilChanged, catchError } from 'rxjs/operators';
import {
  ServicePackagesConfigDto,
  ServicePackageDto
} from '../../shared/models/service-packages.models';
import { SessionSyncService } from '../../core/session-sync.service';
import { SeoService } from '../../core/seo.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { NotificationService } from '../../core/notification.service';
import { EnumerationService } from '../../core/enumeration.service';
import { environment } from '../../environments/environments';
import { DiscountService } from '../../shared/services/discount.service';
import { OfficeAddressDto } from '../../shared/models/office-address.model';
import { AuthService } from '../../auth/auth.service';
import { BicycleService } from '../../pages/client-panel/bicycle.service';
import { Bicycle } from '../../shared/models/bicycle.model';

interface ReservationSettings {
  acceptedDays: string[];
  estimatedReservationDay?: string | null;
  fullyBookedDates?: string[];
}

type DeliveryType = 'DOOR_TO_DOOR' | 'OFFICE';

const DAY_KEYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_LABELS: { [key: string]: string } = {
  MONDAY: 'poniedziałek', TUESDAY: 'wtorek', WEDNESDAY: 'środa',
  THURSDAY: 'czwartek', FRIDAY: 'piątek', SATURDAY: 'sobota', SUNDAY: 'niedziela'
};

@Component({
  selector: 'app-express-reservation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDatepickerModule, MatFormFieldModule, MatInputModule, RouterModule],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'pl-PL' }
  ],
  templateUrl: './express-reservation-form.component.html',
  styleUrls: ['./express-reservation-form.component.css']
})
export class ExpressReservationFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
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

  currentStep = 1;
  loading = false;
  submitting = false;

  reservationSettings: ReservationSettings | null = null;

  minDate: string;
  maxDate: string;
  minDateObj: Date;
  maxDateObj: Date;

  readonly dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const dateStr = this.dateToStr(date);
    if (this.reservationSettings?.fullyBookedDates?.includes(dateStr)) return false;
    const day = date.getDay();
    // Express always with transport — no weekends
    if (day === 0 || day === 6) return false;
    const dayKey = DAY_KEYS[day];
    const accepted = this.reservationSettings?.acceptedDays;
    if (accepted && accepted.length > 0) return accepted.includes(dayKey);
    return true;
  };

  brands: string[] = [];

  // Per-bike brand autocomplete state
  bikeBrandStates: { filtered: string[]; showDropdown: boolean }[] = [];

  // Availability for selected date
  availableSlotsForDate: number | null = null;
  checkingAvailability = false;
  availabilityError: string | null = null;

  // Wybór pakietu serwisowego (wymagany — jeden pakiet dla całej rezerwacji)
  packagesLoaded = false;
  packages: ServicePackageDto[] = [];
  selectedPackage: ServicePackageDto | null = null;
  packageSelectionAttempted = false;

  // Kupon rabatowy — tylko podgląd/UX przed submitem; realna cena i tak liczona na backendzie
  // w quoteExpressReservation (onSubmit).
  couponControl = new FormControl('');
  isApplyingCoupon = false;
  couponMessage: string | null = null;
  isCouponInvalid = false;

  // Office address autocomplete
  officeAddresses: OfficeAddressDto[] = [];
  filteredOffices: OfficeAddressDto[] = [];
  showOfficeDropdown = false;
  selectedOffice: OfficeAddressDto | null = null;
  officeNameControl = new FormControl('');

  readonly links = environment.links;

  reservationForm!: FormGroup;
  bikesArray!: FormArray;
  transportForm!: FormGroup;
  termsControl = new FormControl(false, [Validators.requiredTrue]);

  // Tryb klienta: zalogowany klient nie wypełnia danych kontaktowych (biorą się z konta) i wybiera
  // rower z listy swoich rowerów zamiast wpisywać markę/model ręcznie.
  clientMode = false;
  myBicycles: Bicycle[] = [];
  loadingMyBicycles = false;

  constructor() {
    this.clientMode = this.authService.isClient();

    const minD = new Date();
    minD.setDate(minD.getDate() + 2);
    this.minDateObj = minD;
    this.minDate = this.dateToStr(minD);

    const maxD = new Date();
    maxD.setDate(maxD.getDate() + 30);
    this.maxDateObj = maxD;
    this.maxDate = this.dateToStr(maxD);

    this.bikesArray = this.fb.array([this.createBikeGroup()]);
    this.bikeBrandStates = [{ filtered: [], showDropdown: false }];

    this.reservationForm = this.fb.group({
      firstName: [{ value: '', disabled: this.clientMode }, this.clientMode ? [] : [Validators.required, Validators.minLength(2)]],
      lastName: [{ value: '', disabled: this.clientMode }, this.clientMode ? [] : [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: this.clientMode }, this.clientMode ? [] : [Validators.required, Validators.email]],
      phone: [{ value: '', disabled: this.clientMode }, this.clientMode ? [] : [Validators.required, Validators.pattern(/^\d{9}$/)]],
      plannedDate: ['', [Validators.required, this.acceptedDayValidator.bind(this)]],
      deliveryType: ['OFFICE' as DeliveryType]
    });

    this.transportForm = this.fb.group({
      pickupStreet: ['', Validators.required],
      pickupBuildingNumber: ['', Validators.required],
      pickupCity: ['', Validators.required],
      pickupPostalCode: ['', [Validators.pattern(/^\d{2}-\d{3}$/)]],
      transportNotes: ['']
    });

    if (this.clientMode) {
      this.loadMyBicycles();
    }
  }

  // ===== Tryb klienta: wybór własnego roweru =====

  private loadMyBicycles(): void {
    this.loadingMyBicycles = true;
    this.bicycleService.getUserBicycles().subscribe({
      next: (bikes) => {
        this.myBicycles = bikes;
        this.loadingMyBicycles = false;
        this.applyOriginatingBicycleDefault();
      },
      error: () => {
        this.myBicycles = [];
        this.loadingMyBicycles = false;
      }
    });
  }

  // Ustawiane tylko gdy przyszliśmy z modala "Umów serwis" w szczegółach roweru (patrz
  // BookServiceModalComponent) — router state z bicycleId. Wejście z listy serwisów/mapy nie
  // ustawia tego state, więc żaden rower nie jest wtedy domyślnie wybrany.
  private applyOriginatingBicycleDefault(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const bicycleId = window.history.state?.bicycleId as number | undefined;
    if (!bicycleId) return;
    const bike = this.myBicycles.find(b => b.id === bicycleId);
    if (!bike) return;
    this.onBicycleSelected(0, bicycleId);
  }

  availableBicyclesFor(index: number): Bicycle[] {
    const chosenElsewhere = new Set(
      this.bikesArray.controls
        .filter((_, i) => i !== index)
        .map(c => c.get('selectedBicycleId')?.value)
        .filter((id): id is number => id != null)
    );
    return this.myBicycles.filter(b => !chosenElsewhere.has(b.id));
  }

  onBicycleSelectChange(event: Event, index: number): void {
    const value = (event.target as HTMLSelectElement).value;
    this.onBicycleSelected(index, value === 'OTHER' ? 'OTHER' : +value);
  }

  onBicycleSelected(index: number, bicycleId: number | 'OTHER'): void {
    const group = this.bikesArray.at(index) as FormGroup;
    if (bicycleId === 'OTHER') {
      group.get('selectedBicycleId')?.setValue(null);
      group.get('brand')?.enable();
      group.get('model')?.enable();
      group.get('brand')?.setValue('');
      group.get('model')?.setValue('');
      return;
    }
    const bike = this.myBicycles.find(b => b.id === bicycleId);
    if (!bike) return;
    group.get('selectedBicycleId')?.setValue(bicycleId);
    group.get('brand')?.setValue(bike.brand);
    group.get('model')?.setValue(bike.model ?? '');
    group.get('brand')?.disable();
    group.get('model')?.disable();
  }

  // ===== Bike FormArray =====

  createBikeGroup(): FormGroup {
    return this.fb.group({
      selectedBicycleId: [null as number | null],
      brand: ['', Validators.required],
      model: [''],
      additionalInfo: ['']
    });
  }

  get bikeControls(): FormGroup[] {
    return this.bikesArray.controls as FormGroup[];
  }

  get maxBikesAllowed(): number {
    if (this.availableSlotsForDate !== null) return this.availableSlotsForDate;
    return 5;
  }

  get canAddBike(): boolean {
    return this.bikesArray.length < this.maxBikesAllowed;
  }

  private checkDateAvailability(date: Date): void {
    const dateStr = this.dateToStr(date);
    const url = `${environment.apiUrl}${environment.endpoints.guestOrders.expressAvailability}`;
    this.checkingAvailability = true;
    this.availabilityError = null;
    this.availableSlotsForDate = null;
    this.http.get<{ date: string; available: boolean; availableSlots: number }[]>(
      url,
      { params: { startDate: dateStr, endDate: dateStr } }
    ).subscribe({
      next: (days) => {
        this.checkingAvailability = false;
        const day = days[0];
        if (!day) return;
        const slots = day.availableSlots ?? 0;
        if (!day.available || slots <= 0) {
          this.availabilityError = 'Ten dzień jest już w pełni zarezerwowany. Wybierz inną datę.';
          this.reservationForm.get('plannedDate')?.setValue(null);
          this.availableSlotsForDate = null;
          return;
        }
        this.availableSlotsForDate = slots;
        if (this.bikesArray.length > slots) {
          this.availabilityError = `Na ten dzień pozostało ${slots} wolne${slots === 1 ? '' : slots < 5 ? ' miejsca' : ' miejsc'}. Usuń rower lub wybierz inną datę.`;
          this.reservationForm.get('plannedDate')?.setValue(null);
          this.availableSlotsForDate = null;
        }
      },
      error: () => { this.checkingAvailability = false; }
    });
  }

  addBike(): void {
    if (!this.canAddBike) return;
    this.bikesArray.push(this.createBikeGroup());
    this.bikeBrandStates.push({ filtered: [], showDropdown: false });
  }

  removeBike(index: number): void {
    if (this.bikesArray.length <= 1) return;
    this.bikesArray.removeAt(index);
    this.bikeBrandStates.splice(index, 1);
  }

  isBikeFieldInvalid(index: number, field: string): boolean {
    const ctrl = this.bikesArray.at(index).get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  // ===== Per-bike brand autocomplete =====

  onBrandInput(event: Event, index: number): void {
    const q = (event.target as HTMLInputElement).value;
    this.bikesArray.at(index).get('brand')?.setValue(q, { emitEvent: false });
    if (q.length >= 3) {
      this.bikeBrandStates[index].filtered = this.brands.filter(b => b.toLowerCase().includes(q.toLowerCase()));
      this.bikeBrandStates[index].showDropdown = this.bikeBrandStates[index].filtered.length > 0;
    } else {
      this.bikeBrandStates[index].showDropdown = false;
    }
  }

  onBrandFocus(index: number): void {
    const q = this.bikesArray.at(index).get('brand')?.value || '';
    if (q.length >= 3) {
      this.bikeBrandStates[index].filtered = this.brands.filter(b => b.toLowerCase().includes(q.toLowerCase()));
      this.bikeBrandStates[index].showDropdown = this.bikeBrandStates[index].filtered.length > 0;
    }
  }

  onBrandBlur(index: number): void {
    setTimeout(() => { this.bikeBrandStates[index].showDropdown = false; }, 200);
  }

  selectBrand(brand: string, index: number): void {
    this.bikesArray.at(index).get('brand')?.setValue(brand);
    this.bikeBrandStates[index].showDropdown = false;
  }

  expandAllBrands(index: number): void {
    this.bikeBrandStates[index].filtered = [...this.brands];
    this.bikeBrandStates[index].showDropdown = true;
  }

  // ===== Office autocomplete =====

  onOfficeInput(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.officeNameControl.setValue(q, { emitEvent: false });
    if (q.length >= 3) {
      this.filteredOffices = this.officeAddresses.filter(o =>
        o.name.toLowerCase().includes(q.toLowerCase())
      );
      this.showOfficeDropdown = this.filteredOffices.length > 0;
    } else {
      this.showOfficeDropdown = false;
      this.filteredOffices = [];
    }
    if (this.selectedOffice) {
      this.selectedOffice = null;
      this.clearOfficeFields();
    }
  }

  onOfficeFocus(): void {
    const q = this.officeNameControl.value || '';
    if (q.length >= 3) {
      this.filteredOffices = this.officeAddresses.filter(o =>
        o.name.toLowerCase().includes(q.toLowerCase())
      );
      this.showOfficeDropdown = this.filteredOffices.length > 0;
    }
  }

  expandAllOffices(): void {
    this.filteredOffices = [...this.officeAddresses];
    this.showOfficeDropdown = this.filteredOffices.length > 0;
  }

  onOfficeBlur(): void {
    setTimeout(() => { this.showOfficeDropdown = false; }, 200);
  }

  clearOfficeSelection(): void {
    this.selectedOffice = null;
    this.officeNameControl.setValue('');
    this.showOfficeDropdown = false;
    this.filteredOffices = [];
    this.clearOfficeFields();
  }

  private clearOfficeFields(): void {
    this.transportForm.get('pickupStreet')?.setValue('');
    this.transportForm.get('pickupBuildingNumber')?.setValue('');
    this.transportForm.get('pickupCity')?.setValue('');
    this.transportForm.get('pickupPostalCode')?.setValue('');
  }

  selectOffice(office: OfficeAddressDto): void {
    this.selectedOffice = office;
    this.officeNameControl.setValue(office.name);
    this.transportForm.get('pickupStreet')?.setValue(office.street);
    this.transportForm.get('pickupBuildingNumber')?.setValue(office.building);
    this.transportForm.get('pickupCity')?.setValue(office.city);
    this.transportForm.get('pickupPostalCode')?.setValue(office.postalCode || '');
    this.showOfficeDropdown = false;
  }

  // ===== Validators =====

  acceptedDayValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const date: Date = control.value instanceof Date ? control.value : new Date(control.value + 'T00:00:00');
    const day = date.getDay();
    if (day === 0 || day === 6) return { weekendNotAllowed: true };
    const dayKey = DAY_KEYS[day];
    const accepted = this.reservationSettings?.acceptedDays;
    if (accepted && accepted.length > 0) {
      if (!accepted.includes(dayKey)) return { notAcceptedDay: true };
    }
    return null;
  }

  private dateToStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  get acceptedDaysHint(): string {
    const accepted = this.reservationSettings?.acceptedDays;
    if (!accepted || accepted.length === 0) return 'Dostępne dni: poniedziałek–piątek';
    return 'Dostępne dni: ' + accepted.filter(d => d !== 'SATURDAY' && d !== 'SUNDAY').map(d => DAY_LABELS[d] || d).join(', ');
  }

  get deliveryType(): DeliveryType {
    return this.reservationForm.get('deliveryType')?.value as DeliveryType;
  }

  get isOfficePick(): boolean {
    return this.deliveryType === 'OFFICE';
  }

  setDeliveryType(type: DeliveryType): void {
    this.reservationForm.get('deliveryType')?.setValue(type);
    this.selectedOffice = null;
    this.officeNameControl.setValue('');
    this.showOfficeDropdown = false;
    this.clearOfficeFields();
  }

  get transportDate(): string {
    const planned = this.reservationForm.get('plannedDate')?.value;
    if (!planned) return '';
    const d = planned instanceof Date ? new Date(planned) : new Date(planned + 'T00:00:00');
    if (!this.isOfficePick) {
      d.setDate(d.getDate() - 1);
    }
    return this.dateToStr(d);
  }

  ngOnInit(): void {
    this.loadBrands();
    this.loadOfficeAddresses();
    this.loadReservationSettings();
    this.loadPackages();

    this.seoService.updateFullSeoTags(
      {
        title: 'Serwis rowerowy Kraków – odbiór z biura i zwrot tego samego dnia | CycloPick',
        description: 'Zarezerwuj serwis roweru w Krakowie. Odbierzemy rower rano z Twojego biura i zwrócimy przed 17:00 tego samego dnia.',
        type: 'website',
        keywords: ['serwis rowerowy Kraków', 'serwis rowerowy odbiór z biura', 'cyclopick serwis']
      },
      '/krakow/zarezerwuj'
    );

    if (isPlatformBrowser(this.platformId)) {
      this.routerSub = this.router.events.pipe(
        filter(e => e instanceof NavigationStart)
      ).subscribe(() => this.sendSessionSync());
    }

    this.reservationForm.get('plannedDate')?.valueChanges.pipe(
      distinctUntilChanged((a, b) => {
        const sa = a instanceof Date ? this.dateToStr(a) : (a ? this.dateToStr(new Date(a + 'T00:00:00')) : '');
        const sb = b instanceof Date ? this.dateToStr(b) : (b ? this.dateToStr(new Date(b + 'T00:00:00')) : '');
        return sa === sb;
      })
    ).subscribe((val) => {
      this.availableSlotsForDate = null;
      this.availabilityError = null;
      if (val) {
        const date = val instanceof Date ? val : new Date(val + 'T00:00:00');
        if (!isNaN(date.getTime())) {
          this.checkDateAvailability(date);
        }
      }
    });

    this.transportForm.enable();
  }

  private loadBrands(): void {
    this.enumerationService.getEnumeration('BRAND').subscribe({
      next: (brands) => { this.brands = brands; },
      error: () => { this.brands = environment.settings.fallback.brands; }
    });
  }

  private loadOfficeAddresses(): void {
    const url = `${environment.apiUrl}${environment.endpoints.guestOrders.officeAddresses}`;
    this.http.get<OfficeAddressDto[]>(url).subscribe({
      next: (offices) => { this.officeAddresses = offices; },
      error: () => { this.officeAddresses = []; }
    });
  }

  private loadReservationSettings(): void {
    const url = `${environment.apiUrl}${environment.endpoints.guestOrders.expressAvailability}`;
    const today = new Date();
    const startDate = this.dateToStr(today);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);
    const endDate = this.dateToStr(futureDate);

    this.http.get<{ date: string; available: boolean }[]>(url, { params: { startDate, endDate } }).subscribe({
      next: (days) => {
        const bookedDates = days.filter(d => !d.available).map(d => d.date);
        this.reservationSettings = { acceptedDays: [], fullyBookedDates: bookedDates };
        this.updateMinDate();
        this.reservationForm.get('plannedDate')?.updateValueAndValidity();
      },
      error: () => {
        this.reservationSettings = { acceptedDays: [] };
        this.updateMinDate();
      }
    });
  }

  private updateMinDate(): void {
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const estimated = this.reservationSettings?.estimatedReservationDay;
    const estimatedStr = estimated ?? '';
    if (estimatedStr && estimatedStr > this.dateToStr(dayAfterTomorrow)) {
      this.minDate = estimatedStr;
      this.minDateObj = new Date(estimatedStr + 'T00:00:00');
    } else {
      this.minDate = this.dateToStr(dayAfterTomorrow);
      this.minDateObj = dayAfterTomorrow;
    }
  }

  // ===== Navigation =====

  nextStep(): void {
    if (this.isStep1Valid()) {
      this.currentStep = 2;
      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      this.markAllTouched(this.reservationForm);
      this.bikesArray.controls.forEach(c => this.markAllTouched(c as FormGroup));
      this.markAllTouched(this.transportForm);
      this.packageSelectionAttempted = true;
      this.notificationService.warning(
        !this.selectedPackage ? 'Wybierz pakiet serwisowy.' : 'Wypełnij wszystkie wymagane pola poprawnie.'
      );
    }
  }

  prevStep(): void {
    this.currentStep = 1;
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  isStep1Valid(): boolean {
    const officeNameFilled = !this.isOfficePick || !!this.officeNameControl.value?.trim();
    const transportValid = this.transportForm.valid && officeNameFilled;
    return this.reservationForm.valid && this.bikesArray.valid && transportValid && !!this.selectedPackage;
  }

  isStepCompleted(step: number): boolean {
    return this.currentStep > step;
  }

  isStepActive(step: number): boolean {
    return this.currentStep === step;
  }

  private markAllTouched(group: FormGroup): void {
    Object.values(group.controls).forEach(c => c.markAsTouched());
  }

  isFieldInvalid(fieldName: string, form: FormGroup = this.reservationForm): boolean {
    const f = form.get(fieldName);
    return !!(f?.invalid && (f.dirty || f.touched));
  }

  // ===== Submission =====

  onSubmit(): void {
    if (!this.isStep1Valid() || !this.termsControl.valid) {
      this.termsControl.markAsTouched();
      this.packageSelectionAttempted = true;
      this.notificationService.warning(
        !this.selectedPackage ? 'Wybierz pakiet serwisowy.' : 'Zaakceptuj regulamin aby kontynuować.'
      );
      return;
    }

    this.submitting = true;
    const orderData = this.buildServiceOrderPayload();
    const url = `${environment.apiUrl}${environment.endpoints.guestOrders.expressReservationQuote}`;

    this.http.post<{ expressServiceId: number; totalPrice: number }>(url, orderData).subscribe({
      next: (res) => {
        this.submitting = false;
        const finalOrderData = { ...orderData, serviceId: res.expressServiceId };
        this.router.navigate(['/platnosc/podsumowanie'], {
          state: {
            orderType: 'SERVICE_ORDER',
            orderData: finalOrderData,
            totalPrice: res.totalPrice,
            bikeCount: this.bikesArray.length
          }
        });
      },
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.message || 'Nie udało się wycenić rezerwacji. Spróbuj ponownie.';
        this.notificationService.error(msg);
      }
    });
  }

  /**
   * Buduje pełny payload rezerwacji + odbioru — nic jeszcze nie zapisuje w bazie.
   * ServiceOrder i powiązany (bezpłatny) TransportOrder powstają dopiero po opłaceniu.
   */
  private buildServiceOrderPayload(): Record<string, unknown> {
    const rv = this.reservationForm.value;
    const tv = this.transportForm.value;

    const plannedDateVal = rv.plannedDate;
    const plannedDateStr = plannedDateVal instanceof Date ? this.dateToStr(plannedDateVal) : plannedDateVal;

    const bikesPayload = this.bikesArray.getRawValue().map((b: { brand: string; model: string; additionalInfo: string; selectedBicycleId: number | null }) => ({
      brand: b.brand.trim(),
      model: b.model?.trim() || null,
      additionalInfo: b.additionalInfo?.trim() || null,
      bicycleId: b.selectedBicycleId ?? undefined
    }));

    const officeLabel = this.isOfficePick ? this.officeNameControl.value?.trim() : null;
    const userNotes = tv['transportNotes']?.trim() || '';
    const officePrefix = officeLabel ? `***** ${officeLabel.toUpperCase()} *****` : '';
    const transportNotes = [officePrefix, userNotes].filter(Boolean).join('\n');

    return {
      firstName: (rv.firstName ?? '').trim() || null,
      lastName: (rv.lastName ?? '').trim() || null,
      email: (rv.email ?? '').trim() || null,
      phone: (rv.phone ?? '').trim() || null,
      bicycles: bikesPayload,
      plannedDate: plannedDateStr,
      description: bikesPayload[0]?.additionalInfo || null,
      packageId: this.selectedPackage!.id,
      pickupStreet: tv['pickupStreet'],
      pickupBuildingNumber: tv['pickupBuildingNumber'],
      pickupApartmentNumber: null,
      pickupCity: tv['pickupCity'],
      pickupPostalCode: tv['pickupPostalCode'] || '',
      pickupOfficeName: officeLabel || null,
      pickupDate: this.transportDate,
      transportNotes,
      discountCoupon: this.isCouponInvalid ? null : (this.couponControl.value?.trim() || null)
    };
  }

  applyDiscountCoupon(): void {
    const coupon = this.couponControl.value?.trim();
    if (!coupon || this.isApplyingCoupon || !this.selectedPackage) return;

    const plannedDate = this.reservationForm.get('plannedDate')?.value;
    if (!plannedDate) {
      this.notificationService.warning('Wybierz najpierw datę serwisu.');
      return;
    }

    this.isApplyingCoupon = true;
    this.couponMessage = null;
    this.isCouponInvalid = false;

    const plannedDateStr = plannedDate instanceof Date ? this.dateToStr(plannedDate) : plannedDate;
    const additionalBikes = Math.max(0, this.bikesArray.length - 1);

    this.discountService.applyDiscount({
      coupon,
      scope: 'SERVICE_ORDER',
      firstUnitPrice: this.selectedPackage.price,
      remainderPrice: this.selectedPackage.price * additionalBikes,
      orderDate: plannedDateStr
    }).subscribe({
      next: (res) => {
        this.couponMessage = `Kupon zastosowany! Nowa cena: ${res.totalPrice} PLN`;
        this.isCouponInvalid = false;
        this.isApplyingCoupon = false;
      },
      error: (err) => {
        this.couponMessage = err.error?.message || 'Kupon jest nieprawidłowy lub już wygasł.';
        this.isCouponInvalid = true;
        this.isApplyingCoupon = false;
      }
    });
  }

  // ===== Packages =====

  get noPackagesAvailable(): boolean {
    return this.packagesLoaded && this.packages.length === 0;
  }

  selectPackage(pkg: ServicePackageDto): void {
    this.selectedPackage = pkg;
    this.packageSelectionAttempted = false;
  }

  private loadPackages(): void {
    const url = `${environment.apiUrl}${environment.endpoints.guestOrders.expressPackages}`;
    this.http.get<ServicePackagesConfigDto>(url).pipe(catchError(() => of(null))).subscribe({
      next: (config) => {
        this.packages = (config?.active && config.packages) ? config.packages.filter(p => p.active) : [];
        this.packagesLoaded = true;
        // Domyślnie zaznaczamy najtańszy pakiet — klient może zmienić wybór ręcznie
        if (this.packages.length > 0) {
          this.selectedPackage = this.packages.reduce((cheapest, pkg) => pkg.price < cheapest.price ? pkg : cheapest);
        }
      }
    });
  }

  formatDatePL(val: string | Date): string {
    if (!val) return '';
    const date = val instanceof Date ? val : new Date(val + 'T00:00:00');
    return date.toLocaleDateString('pl-PL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.sendSessionSync();
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.seoService.removeStructuredData();
  }

  private sendSessionSync(): void {
    if (this.sessionSyncSent) return;
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.clientMode) return; // zalogowany klient nie ma sensu "odzyskiwać" mailem — ma konto
    this.sessionSyncSent = true;
    const rv = this.reservationForm.value;
    this.sessionSyncService.send({
      firstName: rv.firstName?.trim() || '',
      lastName: rv.lastName?.trim() || '',
      email: rv.email?.trim() || '',
      phone: rv.phone?.trim() || ''
    });
  }
}
