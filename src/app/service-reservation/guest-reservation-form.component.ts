import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { NotificationService } from '../core/notification.service';
import { EnumerationService } from '../core/enumeration.service';
import { environment } from '../environments/environments';

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
}

const DAY_KEYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_LABELS: { [key: string]: string } = {
  MONDAY: 'poniedziałek', TUESDAY: 'wtorek', WEDNESDAY: 'środa',
  THURSDAY: 'czwartek', FRIDAY: 'piątek', SATURDAY: 'sobota', SUNDAY: 'niedziela'
};

@Component({
  selector: 'app-guest-reservation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDatepickerModule],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'pl-PL' }
  ],
  templateUrl: './guest-reservation-form.component.html',
  styleUrls: ['./guest-reservation-form.component.css']
})
export class GuestReservationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private enumerationService = inject(EnumerationService);

  currentStep = 1;
  loading = false;
  submitting = false;

  serviceInfo: ServiceInfo | null = null;
  reservationSettings: ReservationSettings | null = null;
  isFormActive = true;
  formInactiveMessage = '';

  minDate: string;
  maxDate: string;
  minDateObj: Date;
  maxDateObj: Date;

  // Datepicker filter — greys out days not in acceptedDays
  readonly dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const dayKey = DAY_KEYS[date.getDay()];
    const accepted = this.reservationSettings?.acceptedDays;
    if (accepted && accepted.length > 0) {
      return accepted.includes(dayKey);
    }
    return true;
  };

  brands: string[] = [];
  filteredBrands: string[] = [];
  showBrandDropdown = false;

  cities: string[] = [];
  loadingCities = true;

  // Discount coupon (transport)
  couponControl = new FormControl('');
  isApplyingCoupon = false;
  couponMessage: string | null = null;
  isCouponInvalid = false;
  finalTransportPrice: number | null = null;

  readonly links = environment.links;

  reservationForm: FormGroup;
  transportForm: FormGroup;
  termsControl = new FormControl(false, [Validators.requiredTrue]);

  constructor() {
    const minD = new Date();
    minD.setDate(minD.getDate() + 1);
    this.minDateObj = minD;
    this.minDate = this.dateToStr(minD);

    const maxD = new Date();
    maxD.setDate(maxD.getDate() + 30);
    this.maxDateObj = maxD;
    this.maxDate = this.dateToStr(maxD);

    this.reservationForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\d{9}$/)]],
      bicycleBrand: ['', Validators.required],
      bicycleModel: [''],
      plannedDate: ['', [Validators.required, this.acceptedDayValidator.bind(this)]],
      description: [''],
      withTransport: [false]
    });

    this.transportForm = this.fb.group({
      pickupStreet: ['', Validators.required],
      pickupBuildingNumber: ['', Validators.required],
      pickupCity: ['', Validators.required],
      pickupPostalCode: ['', [Validators.pattern(/^\d{2}-\d{3}$/)]]
    });
  }

  // Validator — only accepted days (or Mon–Fri if no restriction set)
  acceptedDayValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const date: Date = control.value instanceof Date ? control.value : new Date(control.value + 'T00:00:00');
    const dayIndex = date.getDay();
    const dayKey = DAY_KEYS[dayIndex];
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

  get withTransport(): boolean {
    return this.reservationForm.get('withTransport')?.value === true;
  }

  setTransport(val: boolean): void {
    this.reservationForm.get('withTransport')?.setValue(val);
  }

  // Transport date = 1 day before the service reservation date
  get transportDate(): string {
    const planned = this.reservationForm.get('plannedDate')?.value;
    if (!planned) return '';
    const d = planned instanceof Date ? new Date(planned) : new Date(planned + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    return this.dateToStr(d);
  }

  ngOnInit(): void {
    this.loadBrands();
    this.loadCities();
    this.loadServiceInfo();

    this.reservationForm.get('withTransport')?.valueChanges.subscribe(val => {
      const phoneCtrl = this.reservationForm.get('phone')!;
      if (val) {
        this.transportForm.enable();
        phoneCtrl.addValidators(Validators.required);
      } else {
        this.transportForm.disable();
        phoneCtrl.removeValidators(Validators.required);
        this.couponControl.setValue('');
        this.couponMessage = null;
        this.isCouponInvalid = false;
        this.finalTransportPrice = null;
      }
      phoneCtrl.updateValueAndValidity();
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
      // Jeśli nawigacja przekazała serviceId przez state (np. z mapy) — używamy go bezpośrednio
      const stateServiceId = window.history.state?.serviceId;
      if (stateServiceId) {
        this.loadServiceDetails(+stateServiceId);
      } else {
        // Brak state — pobieramy serviceId z backendu po suffixie (np. bezpośredni link)
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
      // Mamy serviceId w query params — ładujemy detale bezpośrednio
      this.route.queryParams.subscribe(params => {
        const serviceId = params['serviceId'];
        if (serviceId) {
          this.loadServiceDetails(+serviceId);
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
        // Re-validate plannedDate with new accepted days
        this.reservationForm.get('plannedDate')?.updateValueAndValidity();
      },
      error: () => {
        // Settings not available — keep defaults (Mon–Fri, tomorrow as min)
      }
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

    // Check if there's still an upcoming window today
    const todayKey = DAY_KEYS[currentDayIndex];
    const todaySchedule = settings.formSchedule[todayKey];
    if (todaySchedule) {
      const fromMinutes = todaySchedule.fromTime ? this.timeToMinutes(todaySchedule.fromTime) : 1;
      if (fromMinutes > currentMinutes) {
        const fromStr = todaySchedule.fromTime ? todaySchedule.fromTime.substring(0, 5) : '00:01';
        return `Rezerwacja jest aktualnie wyłączona. Zapraszamy dzisiaj od ${fromStr}.`;
      }
    }

    // Check next 6 days
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
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = this.dateToStr(tomorrow);

    if (settings.estimatedReservationDay && settings.estimatedReservationDay > tomorrowStr) {
      this.minDate = settings.estimatedReservationDay;
      this.minDateObj = new Date(settings.estimatedReservationDay + 'T00:00:00');
    } else {
      this.minDate = tomorrowStr;
      this.minDateObj = tomorrow;
    }
  }

  // ===== Brand autocomplete =====

  onBrandInput(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.reservationForm.get('bicycleBrand')?.setValue(q, { emitEvent: false });
    if (q.length >= 3) {
      this.filteredBrands = this.brands.filter(b => b.toLowerCase().includes(q.toLowerCase()));
      this.showBrandDropdown = this.filteredBrands.length > 0;
    } else {
      this.showBrandDropdown = false;
    }
  }

  onBrandFocus(): void {
    const q = this.reservationForm.get('bicycleBrand')?.value || '';
    if (q.length >= 3) {
      this.filteredBrands = this.brands.filter(b => b.toLowerCase().includes(q.toLowerCase()));
      this.showBrandDropdown = this.filteredBrands.length > 0;
    }
  }

  onBrandBlur(): void {
    setTimeout(() => { this.showBrandDropdown = false; }, 200);
  }

  selectBrand(brand: string): void {
    this.reservationForm.get('bicycleBrand')?.setValue(brand);
    this.showBrandDropdown = false;
  }

  expandAllBrands(): void {
    this.filteredBrands = [...this.brands];
    this.showBrandDropdown = true;
  }

  // ===== Navigation =====

  nextStep(): void {
    if (this.isStep1Valid()) {
      this.currentStep = 2;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.markAllTouched(this.reservationForm);
      if (this.withTransport) this.markAllTouched(this.transportForm);
      this.notificationService.warning('Wypełnij wszystkie wymagane pola poprawnie.');
    }
  }

  prevStep(): void {
    this.currentStep = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isStep1Valid(): boolean {
    const reservOk = this.reservationForm.valid;
    const transportOk = !this.withTransport || this.transportForm.valid;
    return reservOk && transportOk;
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

    const reservationPayload = {
      firstName: rv.firstName.trim(),
      lastName: rv.lastName.trim(),
      email: rv.email.trim(),
      phone: rv.phone?.trim() || null,
      bicycles: [{
        brand: rv.bicycleBrand.trim(),
        model: rv.bicycleModel?.trim() || null,
        additionalInfo: rv.description?.trim() || null
      }],
      plannedDate: plannedDateStr,
      description: rv.description?.trim() || null
    };

    const url = `${environment.apiUrl}${environment.endpoints.guestOrders.serviceReservation}?serviceId=${this.serviceInfo.id}`;

    this.http.post<{ message: string; serviceOrderId: number }>(url, reservationPayload).subscribe({
      next: (res) => {
        if (this.withTransport) {
          this.submitTransport(rv, res.serviceOrderId);
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

  private submitTransport(rv: any, serviceOrderId: number): void {
    const tv = this.transportForm.value;
    const payload = {
      serviceOrderId,
      bicycles: [{
        brand: rv.bicycleBrand.trim(),
        model: rv.bicycleModel?.trim() || '',
        additionalInfo: rv.description?.trim() || ''
      }],
      email: rv.email.trim(),
      phone: rv.phone?.trim() || '',
      pickupStreet: tv.pickupStreet,
      pickupBuildingNumber: tv.pickupBuildingNumber,
      pickupCity: tv.pickupCity,
      pickupPostalCode: tv.pickupPostalCode || '',
      pickupDate: this.transportDate,
      targetServiceId: this.serviceInfo!.id,
      transportPrice: this.effectiveTransportPrice,
      transportNotes: '',
      additionalNotes: '',
      discountCoupon: this.finalTransportPrice !== null ? this.couponControl.value : null
    };

    const url = `${environment.apiUrl}${environment.endpoints.guestOrders.transport}`;
    this.http.post(url, payload).subscribe({
      next: () => this.onSuccess(),
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.message ||
          'Rezerwacja serwisu złożona, ale nie udało się zarezerwować transportu. Skontaktuj się z serwisem.';
        this.notificationService.error(msg);
      }
    });
  }

  private onSuccess(): void {
    this.submitting = false;
    this.notificationService.success('Rezerwacja złożona pomyślnie! Serwis skontaktuje się z Tobą wkrótce.');
    this.router.navigate([environment.links.homepage]);
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
}
