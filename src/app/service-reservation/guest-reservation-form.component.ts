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

@Component({
  selector: 'app-guest-reservation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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

  minDate: string;
  maxDate: string;

  brands: string[] = [];
  filteredBrands: string[] = [];
  showBrandDropdown = false;

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
    this.minDate = minD.toISOString().split('T')[0];

    const maxD = new Date();
    maxD.setDate(maxD.getDate() + 30);
    this.maxDate = maxD.toISOString().split('T')[0];

    this.reservationForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\d{9}$/)]],
      bicycleBrand: ['', Validators.required],
      bicycleModel: [''],
      plannedDate: ['', [Validators.required, this.weekdayValidator.bind(this)]],
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

  // Validator — only Mon–Fri (days 1–5)
  weekdayValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const day = new Date(control.value + 'T00:00:00').getDay();
    if (day === 0 || day === 6) return { notWeekday: true };
    return null;
  }

  get withTransport(): boolean {
    return this.reservationForm.get('withTransport')?.value === true;
  }

  // Transport date = 1 day before the service reservation date
  get transportDate(): string {
    const planned = this.reservationForm.get('plannedDate')?.value;
    if (!planned) return '';
    const d = new Date(planned + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadBrands();
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

  private loadServiceInfo(): void {
    const suffix = this.route.snapshot.paramMap.get('suffix');
    if (suffix) {
      // Mamy suffix w URL — musimy pobrać ID serwisu
      this.loading = true;
      const url = `${environment.apiUrl}${environment.endpoints.bikeServices.bySuffix}?suffix=${suffix}`;
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
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Nie udało się załadować danych serwisu.');
        this.router.navigate([environment.links.servicesMap]);
        this.loading = false;
      }
    });
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

    const reservationPayload = {
      firstName: rv.firstName.trim(),
      lastName: rv.lastName.trim(),
      email: rv.email.trim(),
      phone: rv.phone?.trim() || null,
      bicycleBrand: rv.bicycleBrand.trim(),
      bicycleModel: rv.bicycleModel?.trim() || null,
      plannedDate: rv.plannedDate,
      description: rv.description?.trim() || null
    };

    const url = `${environment.apiUrl}${environment.endpoints.guestOrders.serviceReservation}?serviceId=${this.serviceInfo.id}`;

    this.http.post(url, reservationPayload).subscribe({
      next: () => {
        if (this.withTransport) {
          this.submitTransport(rv);
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

  private submitTransport(rv: any): void {
    const tv = this.transportForm.value;
    const payload = {
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

  formatDatePL(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
