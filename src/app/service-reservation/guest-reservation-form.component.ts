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
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { filter, switchMap, distinctUntilChanged } from 'rxjs/operators';
import { SessionSyncService } from '../core/session-sync.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { NotificationService } from '../core/notification.service';
import { EnumerationService } from '../core/enumeration.service';
import { environment } from '../environments/environments';
import { ServiceNavComponent } from '../pages/service-profile/service-nav.component';
import { OfficeAddressDto } from '../shared/models/office-address.model';

interface ServiceInfo {
  id: number;
  name: string;
  address: string;
  logoUrl: string | null;
  transportAvailable: boolean;
  transportCost: number | null;
}

interface ReservationSettings {
  acceptedDays: string[];
  formSchedule: { [key: string]: { fromTime: string | null; toTime: string | null } };
  estimatedReservationDay?: string | null;
  maxBikesPerDay?: number | null;
  fullyBookedDates?: string[];
}

type DeliveryType = 'SELF' | 'DOOR_TO_DOOR' | 'OFFICE';

const DAY_KEYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_LABELS: { [key: string]: string } = {
  MONDAY: 'poniedziałek', TUESDAY: 'wtorek', WEDNESDAY: 'środa',
  THURSDAY: 'czwartek', FRIDAY: 'piątek', SATURDAY: 'sobota', SUNDAY: 'niedziela'
};

@Component({
  selector: 'app-guest-reservation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDatepickerModule, ServiceNavComponent],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'pl-PL' }
  ],
  templateUrl: './guest-reservation-form.component.html',
  styleUrls: ['./guest-reservation-form.component.css']
})
export class GuestReservationFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private enumerationService = inject(EnumerationService);
  private sessionSyncService = inject(SessionSyncService);
  private platformId = inject(PLATFORM_ID);

  private routerSub: Subscription | null = null;
  private sessionSyncSent = false;

  currentStep = 1;
  loading = false;
  submitting = false;
  serviceSuffix: string | null = null;

  serviceInfo: ServiceInfo | null = null;
  reservationSettings: ReservationSettings | null = null;
  isFormActive = true;
  formInactiveMessage = '';

  minDate: string;
  maxDate: string;
  minDateObj: Date;
  maxDateObj: Date;

  readonly dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const dateStr = this.dateToStr(date);
    if (this.reservationSettings?.fullyBookedDates?.includes(dateStr)) return false;
    const dayKey = DAY_KEYS[date.getDay()];
    const accepted = this.reservationSettings?.acceptedDays;
    if (accepted && accepted.length > 0) return accepted.includes(dayKey);
    return true;
  };

  brands: string[] = [];
  cities: string[] = [];
  loadingCities = true;

  // Per-bike brand autocomplete state
  bikeBrandStates: { filtered: string[]; showDropdown: boolean }[] = [];

  // Availability for selected date
  availableSlotsForDate: number | null = null;
  checkingAvailability = false;
  availabilityError: string | null = null;

  // Discount coupon (transport)
  couponControl = new FormControl('');
  isApplyingCoupon = false;
  couponMessage: string | null = null;
  isCouponInvalid = false;
  finalTransportPrice: number | null = null;

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

  constructor() {
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
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      plannedDate: ['', [Validators.required, this.acceptedDayValidator.bind(this)]],
      deliveryType: ['SELF' as DeliveryType]
    });

    this.transportForm = this.fb.group({
      pickupStreet: ['', Validators.required],
      pickupBuildingNumber: ['', Validators.required],
      pickupCity: ['', Validators.required],
      pickupPostalCode: ['', [Validators.pattern(/^\d{2}-\d{3}$/)]],
      transportNotes: ['']
    });
  }

  // ===== Bike FormArray =====

  createBikeGroup(): FormGroup {
    return this.fb.group({
      brand: ['', Validators.required],
      model: [''],
      additionalInfo: ['', Validators.required]
    });
  }

  get bikeControls(): FormGroup[] {
    return this.bikesArray.controls as FormGroup[];
  }

  get maxBikesPerReservation(): number {
    if (this.availableSlotsForDate !== null) return this.availableSlotsForDate;
    const max = this.reservationSettings?.maxBikesPerDay;
    return max && max > 0 ? Math.ceil(max / 2) : 0;
  }

  get canAddBike(): boolean {
    const limit = this.maxBikesPerReservation;
    return limit === 0 || this.bikesArray.length < limit;
  }

  private checkDateAvailability(date: Date): void {
    if (!this.serviceInfo?.id) return;
    const dateStr = this.dateToStr(date);
    const url = environment.endpoints.guestOrders.serviceAvailability
      .replace(':serviceId', String(this.serviceInfo.id));
    this.checkingAvailability = true;
    this.availabilityError = null;
    this.availableSlotsForDate = null;
    this.http.get<{ date: string; available: boolean; availableSlots: number }[]>(
      `${environment.apiUrl}${url}`,
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
      error: () => {
        this.checkingAvailability = false;
      }
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
      this.transportForm.get('pickupStreet')?.setValue('');
      this.transportForm.get('pickupBuildingNumber')?.setValue('');
      this.transportForm.get('pickupCity')?.setValue('');
      this.transportForm.get('pickupPostalCode')?.setValue('');
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
    const dayKey = DAY_KEYS[date.getDay()];
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
    if (!accepted || accepted.length === 0) return 'Dostępne terminy: wszystkie dni tygodnia';
    return 'Dostępne dni: ' + accepted.map(d => DAY_LABELS[d] || d).join(', ');
  }

  get deliveryType(): DeliveryType {
    return this.reservationForm.get('deliveryType')?.value as DeliveryType;
  }

  get withTransport(): boolean {
    return this.deliveryType !== 'SELF';
  }

  get isOfficePick(): boolean {
    return this.deliveryType === 'OFFICE';
  }

  setDeliveryType(type: DeliveryType): void {
    this.reservationForm.get('deliveryType')?.setValue(type);
    // Reset office selection and clear address when switching type
    this.selectedOffice = null;
    this.officeNameControl.setValue('');
    this.showOfficeDropdown = false;
    this.transportForm.get('pickupStreet')?.setValue('');
    this.transportForm.get('pickupBuildingNumber')?.setValue('');
    this.transportForm.get('pickupCity')?.setValue('');
    this.transportForm.get('pickupPostalCode')?.setValue('');
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
    this.loadCities();
    this.loadOfficeAddresses();
    this.loadServiceInfo();

    if (isPlatformBrowser(this.platformId)) {
      this.routerSub = this.router.events.pipe(
        filter(e => e instanceof NavigationStart)
      ).subscribe(() => this.sendSessionSync());
    }

    this.reservationForm.get('plannedDate')?.valueChanges.pipe(
      distinctUntilChanged((a, b) => this.dateToStr(a instanceof Date ? a : new Date(a + 'T00:00:00')) === this.dateToStr(b instanceof Date ? b : new Date(b + 'T00:00:00')))
    ).subscribe((val) => {
      this.availableSlotsForDate = null;
      this.availabilityError = null;
      if (val) {
        const date = val instanceof Date ? val : new Date(val + 'T00:00:00');
        if (!isNaN(date.getTime())) this.checkDateAvailability(date);
      }
    });

    this.reservationForm.get('deliveryType')?.valueChanges.subscribe((val: DeliveryType) => {
      if (val !== 'SELF') {
        this.transportForm.enable();
      } else {
        this.transportForm.disable();
        this.couponControl.setValue('');
        this.couponMessage = null;
        this.isCouponInvalid = false;
        this.finalTransportPrice = null;
      }
    });

    this.transportForm.disable();
  }

  private loadBrands(): void {
    this.enumerationService.getEnumeration('BRAND').subscribe({
      next: (brands) => { this.brands = brands; },
      error: () => { this.brands = environment.settings.fallback.brands; }
    });
  }

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

  private loadOfficeAddresses(): void {
    const url = `${environment.apiUrl}${environment.endpoints.guestOrders.officeAddresses}`;
    this.http.get<OfficeAddressDto[]>(url).subscribe({
      next: (offices) => { this.officeAddresses = offices; },
      error: () => { this.officeAddresses = []; }
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
      // Jeśli jesteśmy na starym URL /reserve-service/:suffix → przekieruj na /:suffix/zarezerwuj
      if (this.route.snapshot.routeConfig?.path === 'reserve-service/:suffix') {
        this.router.navigate(['/', suffix, 'zarezerwuj'], { replaceUrl: true });
        return;
      }
      this.serviceSuffix = suffix;
      const stateServiceId = window.history.state?.serviceId;
      if (stateServiceId) {
        this.loadServiceDetails(+stateServiceId);
      } else {
        this.loading = true;
        const url = `${environment.apiUrl}${environment.endpoints.bikeServices.bySuffix}/${suffix}`;
        this.http.get<{ id: number }>(url).subscribe({
          next: (res) => {
            if (res.id) {
              this.loadServiceDetails(res.id);
            } else {
              this.notificationService.error('Nie znaleziono serwisu.');
              this.router.navigate([environment.links.servicesMap]);
              this.loading = false;
            }
          },
          error: () => {
            this.notificationService.error('Nie znaleziono serwisu.');
            this.router.navigate([environment.links.servicesMap]);
            this.loading = false;
          }
        });
      }
    } else {
      // Fallback dla starych URL-i: /reserve-service?serviceId=X
      this.route.queryParams.subscribe(params => {
        const serviceId = params['serviceId'];
        if (serviceId) {
          const url = `${environment.apiUrl}${environment.endpoints.bikeServices.base}/get-suffix`;
          this.http.get<{ suffix: string }>(url, { params: { serviceId } }).subscribe({
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
    const url = `${environment.apiUrl}${environment.endpoints.bikeServices.base}/${serviceId}`;
    this.http.get<any>(url).subscribe({
      next: (d) => {
        if (d.reservationAvailable === false) {
          this.router.navigate(['/', this.serviceSuffix, 'zamow-transport'], { replaceUrl: true });
          return;
        }

        const parts: string[] = [];
        if (d.street) parts.push(d.street);
        if (d.building) parts.push(d.building);
        if (d.flat) parts.push('/' + d.flat);
        let address = parts.join(' ');
        if (d.city) address += (address ? ', ' : '') + d.city;

        this.serviceInfo = {
          id: d.id,
          name: d.name,
          address,
          logoUrl: d.logoUrl || null,
          transportAvailable: !!d.transportAvailable,
          transportCost: d.transportCost ?? null
        };
        this.loadReservationSettings(d.id);
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Nie udało się załadować danych serwisu.');
        this.router.navigate([environment.links.servicesMap]);
        this.loading = false;
      }
    });
  }

  private loadReservationSettings(serviceId: number): void {
    const url = `${environment.apiUrl}${environment.endpoints.bikeServices.base}/${serviceId}/reservation-settings`;
    this.http.get<ReservationSettings>(url).subscribe({
      next: (settings) => {
        this.reservationSettings = settings;
        this.computeFormAvailability(settings);
        this.updateMinDate(settings);
        this.reservationForm.get('plannedDate')?.updateValueAndValidity();
      },
      error: () => {}
    });
  }

  private computeFormAvailability(settings: ReservationSettings): void {
    if (!settings.formSchedule || Object.keys(settings.formSchedule).length === 0) {
      this.isFormActive = true;
      return;
    }

    const now = new Date();
    const currentDayKey = DAY_KEYS[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const schedule = settings.formSchedule[currentDayKey];

    if (schedule) {
      const fromMinutes = schedule.fromTime ? this.timeToMinutes(schedule.fromTime) : 1;
      const toMinutes = schedule.toTime ? this.timeToMinutes(schedule.toTime) : 23 * 60 + 59;
      if (currentMinutes >= fromMinutes && currentMinutes <= toMinutes) {
        this.isFormActive = true;
        return;
      }
    }

    this.isFormActive = false;
    this.formInactiveMessage = this.findNextAvailableMessage(settings, now);
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private findNextAvailableMessage(settings: ReservationSettings, now: Date): string {
    const currentDayIndex = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const todayKey = DAY_KEYS[currentDayIndex];
    const todaySchedule = settings.formSchedule[todayKey];
    if (todaySchedule) {
      const fromMinutes = todaySchedule.fromTime ? this.timeToMinutes(todaySchedule.fromTime) : 1;
      if (fromMinutes > currentMinutes) {
        const fromStr = todaySchedule.fromTime ? todaySchedule.fromTime.substring(0, 5) : '00:01';
        return `Rezerwacja jest aktualnie wyłączona. Zapraszamy dzisiaj od ${fromStr}.`;
      }
    }

    for (let i = 1; i <= 6; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDayKey = DAY_KEYS[nextDayIndex];
      const nextSchedule = settings.formSchedule[nextDayKey];
      if (nextSchedule) {
        const dayName = DAY_LABELS[nextDayKey];
        const fromStr = nextSchedule.fromTime ? nextSchedule.fromTime.substring(0, 5) : '00:01';
        return `Rezerwacja jest aktualnie wyłączona. Zapraszamy w ${dayName} od ${fromStr}.`;
      }
    }

    return 'Rezerwacja jest aktualnie wyłączona.';
  }

  private updateMinDate(settings: ReservationSettings): void {
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const dayAfterTomorrowStr = this.dateToStr(dayAfterTomorrow);

    if (settings.estimatedReservationDay && settings.estimatedReservationDay > dayAfterTomorrowStr) {
      this.minDate = settings.estimatedReservationDay;
      this.minDateObj = new Date(settings.estimatedReservationDay + 'T00:00:00');
    } else {
      this.minDate = dayAfterTomorrowStr;
      this.minDateObj = dayAfterTomorrow;
    }
  }

  // ===== Navigation =====

  nextStep(): void {
    if (this.isStep1Valid()) {
      this.currentStep = 2;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.markAllTouched(this.reservationForm);
      this.bikesArray.controls.forEach(c => this.markAllTouched(c as FormGroup));
      if (this.withTransport) this.markAllTouched(this.transportForm);
      this.notificationService.warning('Wypełnij wszystkie wymagane pola poprawnie.');
    }
  }

  prevStep(): void {
    this.currentStep = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isStep1Valid(): boolean {
    const officeNameFilled = !this.isOfficePick || !!this.officeNameControl.value?.trim();
    const transportValid = !this.withTransport || (this.transportForm.valid && officeNameFilled);
    return this.reservationForm.valid && this.bikesArray.valid && transportValid;
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
    if (!this.isStep1Valid() || !this.termsControl.valid || !this.serviceInfo) {
      this.termsControl.markAsTouched();
      this.notificationService.warning('Zaakceptuj regulamin aby kontynuować.');
      return;
    }

    this.submitting = true;
    const rv = this.reservationForm.value;

    const plannedDateVal = rv.plannedDate;
    const plannedDateStr = plannedDateVal instanceof Date ? this.dateToStr(plannedDateVal) : plannedDateVal;

    const bikesPayload = this.bikesArray.value.map((b: { brand: string; model: string; additionalInfo: string }) => ({
      brand: b.brand.trim(),
      model: b.model?.trim() || null,
      additionalInfo: b.additionalInfo?.trim() || null
    }));

    const reservationPayload = {
      firstName: rv.firstName.trim(),
      lastName: rv.lastName.trim(),
      email: rv.email.trim(),
      phone: rv.phone?.trim() || null,
      bicycles: bikesPayload,
      plannedDate: plannedDateStr,
      description: bikesPayload[0]?.additionalInfo || null
    };

    const url = `${environment.apiUrl}${environment.endpoints.guestOrders.serviceReservation}?serviceId=${this.serviceInfo.id}`;

    this.sendDebugReport('reservation', reservationPayload);

    this.http.post<{ message: string; orderIds: number[] }>(url, reservationPayload).subscribe({
      next: (res) => {
        if (this.withTransport) {
          this.submitTransport(rv, res.orderIds);
        } else {
          this.onSuccess();
        }
      },
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.message || 'Nie udało się złożyć rezerwacji. Spróbuj ponownie.';
        this.notificationService.error(msg);
      }
    });
  }

  applyDiscountCoupon(): void {
    const coupon = this.couponControl.value?.trim();
    if (!coupon || this.isApplyingCoupon || !this.serviceInfo?.transportCost) return;

    this.isApplyingCoupon = true;
    this.couponMessage = null;
    this.isCouponInvalid = false;

    const plannedDate = this.reservationForm.get('plannedDate')?.value;
    if (!plannedDate) {
      this.notificationService.warning('Wybierz najpierw datę serwisu.');
      this.isApplyingCoupon = false;
      return;
    }

    const url = `${environment.apiUrl}${environment.endpoints.guestOrders.discounts}`;
    this.http.post<{ newPrice: number }>(url, {
      coupon,
      currentTransportPrice: this.serviceInfo.transportCost,
      orderDate: this.transportDate
    }).subscribe({
      next: (res) => {
        if (res.newPrice < this.serviceInfo!.transportCost!) {
          this.finalTransportPrice = res.newPrice;
          this.couponMessage = `Kupon zastosowany! Nowa cena: ${res.newPrice} PLN`;
          this.isCouponInvalid = false;
        } else {
          this.finalTransportPrice = null;
          this.couponMessage = 'Kupon jest nieprawidłowy lub już wygasł.';
          this.isCouponInvalid = true;
        }
        this.isApplyingCoupon = false;
      },
      error: () => {
        this.finalTransportPrice = null;
        this.couponMessage = 'Nie udało się sprawdzić kuponu. Spróbuj ponownie.';
        this.isCouponInvalid = true;
        this.isApplyingCoupon = false;
      }
    });
  }

  get effectiveTransportPrice(): number {
    return this.finalTransportPrice ?? this.serviceInfo?.transportCost ?? 0;
  }

  private submitTransport(rv: any, serviceOrderIds: number[]): void {
    const tv = this.transportForm.value;
    const bikesPayload = this.bikesArray.value.map((b: { brand: string; model: string; additionalInfo: string }) => ({
      brand: b.brand.trim(),
      model: b.model?.trim() || '',
      additionalInfo: b.additionalInfo?.trim() || ''
    }));

    const officeLabel = this.isOfficePick ? this.officeNameControl.value?.trim() : null;
    const userNotes = tv.transportNotes?.trim() || '';
    const officePrefix = officeLabel ? `***** ${officeLabel.toUpperCase()} *****` : '';
    const transportNotes = [officePrefix, userNotes].filter(Boolean).join('\n');

    const payload = {
      serviceOrderIds,
      bicycles: bikesPayload,
      email: rv.email.trim(),
      phone: rv.phone?.trim() || '',
      pickupStreet: tv.pickupStreet,
      pickupBuildingNumber: tv.pickupBuildingNumber,
      pickupCity: tv.pickupCity,
      pickupPostalCode: tv.pickupPostalCode || '',
      pickupDate: this.transportDate,
      targetServiceId: this.serviceInfo!.id,
      transportPrice: this.effectiveTransportPrice,
      transportNotes,
      additionalNotes: '',
      discountCoupon: this.finalTransportPrice !== null ? this.couponControl.value : null,
      pickupOfficeName: officeLabel || null
    };

    const url = `${environment.apiUrl}${environment.endpoints.guestOrders.transport}`;

    this.sendDebugReport('transport', payload);

    this.http.post(url, payload).subscribe({
      next: () => this.onSuccess(),
      error: (err) => {
        this.sendDebugReport('transport-error', {
          status: err?.status,
          message: err?.error?.message || err?.message,
          error: err?.error,
          sentPayload: payload
        });
        this.submitting = false;
        const msg = err.error?.message ||
          'Rezerwacja serwisu złożona, ale nie udało się zarezerwować transportu. Skontaktuj się z serwisem.';
        this.notificationService.error(msg);
      }
    });
  }

  private sendDebugReport(type: string, data: object): void {
    const reportUrl = `${environment.apiUrl}${environment.endpoints.guestOrders.report}`;
    const body = { type, timestamp: new Date().toISOString(), ...data };
    this.http.post(reportUrl, body).subscribe({ error: () => {} });
  }

  private onSuccess(): void {
    this.submitting = false;
    this.router.navigate(['/sukces'], { queryParams: { typ: 'rezerwacja' }, replaceUrl: true });
  }

  goBack(): void {
    this.router.navigate([environment.links.servicesMap]);
  }

  formatDatePL(val: string | Date): string {
    if (!val) return '';
    const date = val instanceof Date ? val : new Date(val + 'T00:00:00');
    return date.toLocaleDateString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.sendSessionSync();
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private sendSessionSync(): void {
    if (this.sessionSyncSent) return;
    if (!isPlatformBrowser(this.platformId)) return;
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
