// src/app/transport-orders/transport-order-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../core/notification.service';
import { TransportOrderService } from './transport-order.service';
import { MapService } from '../pages/services-map-page/services/map.service';
import { EnumerationService } from '../core/enumeration.service';
import { I18nService } from '../core/i18n.service';
import { environment } from '../environments/environments';
import { BicycleFormData, BicycleData } from '../shared/models/bicycle.model';


@Component({
  selector: 'app-transport-order-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transport-order-form.component.html',
  styleUrls: ['./transport-order-form.component.css']
})
export class TransportOrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private transportOrderService = inject(TransportOrderService);
  private mapService = inject(MapService);
  private enumerationService = inject(EnumerationService);
  private i18n = inject(I18nService);

  // Multi-step form management
  currentStep = 1;
  totalSteps = 3;

  // Data
  selectedServiceInfo: any = {};
  bicyclesList: BicycleData[] = [];
  actualTransportCost: number | null = null;
  brands: string[] = [];
  loadingBrands = true;
  cities: string[] = [];
  loadingCities = true;

  // Date constraints
  minDate: string;
  maxDate: string;

  // Forms for each step
  bicyclesForm: FormGroup;
  contactAndTransportForm: FormGroup;

  // Terms acceptance control
  termsAcceptedControl = new FormControl(false, [Validators.requiredTrue]);

  // Discount Coupon Properties
  discountCouponControl = new FormControl('');
  isApplyingCoupon = false;
  couponMessage: string | null = null;
  isCouponInvalid = false;
  finalTransportPrice: number | null = null;

  // State
  loading = false;
  submitting = false;
  error: string | null = null;

  // Transport availability states
  transportNotAvailable = false;  // serwis za daleko (transportAvailable = false && city != Kraków)
  transportComingSoon = false;    // serwis w Krakowie ale transport jeszcze niedostępny

  // Expose environment links for template
  readonly links = environment.links;

  constructor() {
    // Ustawienie dat z environment
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + environment.settings.transport.minDaysInAdvance);
    this.minDate = tomorrow.toISOString().split('T')[0];

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + environment.settings.transport.maxDaysInAdvance);
    this.maxDate = maxDate.toISOString().split('T')[0];

    // Initialize forms
    this.bicyclesForm = this.fb.group({
      bicycles: this.fb.array([])
    });

    this.contactAndTransportForm = this.fb.group({
      // Dane kontaktowe
      clientEmail: ['', [Validators.required, Validators.email]],
      clientPhone: ['', [Validators.required, Validators.pattern(new RegExp(`^\\d{${environment.settings.validation.phoneNumberLength}}$`))]],

      // Szczegóły transportu
      pickupDate: ['', [Validators.required, this.dateValidator.bind(this)]],

      // ROZBITY ADRES
      pickupStreet: ['', [Validators.required, Validators.minLength(environment.settings.validation.minModelLength)]],
      pickupBuildingNumber: ['', [Validators.required]],
      pickupCity: ['', [Validators.required]],
      pickupPostalCode: ['', [Validators.pattern(environment.settings.validation.postalCodePattern)]],

      additionalNotes: ['']
    });
  }

  // Validator sprawdzający czy wybrana data to niedziela-czwartek
  dateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const selectedDate = new Date(control.value + 'T00:00:00');
    const dayOfWeek = selectedDate.getDay();

    // Sprawdź czy dzień jest w dozwolonych dniach z environment
    if (!environment.settings.transport.allowedDays.includes(dayOfWeek)) {
      return { invalidDay: true };
    }

    return null;
  }

  ngOnInit(): void {
    this.loadServiceInfo();
    this.loadBrands();
    this.loadCities();
    this.addBicycleToForm();

    this.contactAndTransportForm.get('pickupDate')?.valueChanges.subscribe(date => {
      if (date) {
        this.checkSlotAvailabilityForDate(date);
      }
    });
  }

  private loadServiceInfo(): void {
    // Najpierw sprawdź czy mamy suffix w path params (nowy format URL)
    const suffix = this.route.snapshot.paramMap.get('suffix');

    if (suffix) {
      // Nowy format: /order-transport/:suffix
      this.loadServiceBySuffix(suffix);
    } else {
      // Sprawdź stary format: /order-transport?serviceId=X
      this.route.queryParams.subscribe(params => {
        const serviceId = params['serviceId'];
        if (serviceId) {
          // Przekieruj na nowy format URL z suffixem
          this.redirectToSuffixUrl(+serviceId);
        } else {
          this.selectedServiceInfo = { id: null, name: '', address: '' };
          this.notificationService.error(this.i18n.instant('transport_order.service_info.error_no_service'));
        }
      });
    }
  }

  private loadServiceBySuffix(suffix: string): void {
    this.loading = true;
    this.transportOrderService.getServiceIdBySuffix(suffix).subscribe({
      next: (response) => {
        if (response.id) {
          this.loadServiceDetails(response.id.toString());
        } else {
          this.notificationService.error(this.i18n.instant('transport_order.service_info.error_service_not_found'));
          this.router.navigate([environment.links.homepage]);
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading service by suffix:', error);
        this.notificationService.error(this.i18n.instant('transport_order.service_info.error_service_not_found'));
        this.router.navigate([environment.links.homepage]);
        this.loading = false;
      }
    });
  }

  private redirectToSuffixUrl(serviceId: number): void {
    this.transportOrderService.getSuffixByServiceId(serviceId).subscribe({
      next: (response) => {
        if (response.suffix) {
          // Przekieruj na nowy format URL
          this.router.navigate(['/order-transport', response.suffix], { replaceUrl: true });
        } else {
          // Fallback - załaduj po serviceId jeśli suffix niedostępny
          this.loadServiceDetails(serviceId.toString());
        }
      },
      error: (error) => {
        console.error('Error getting suffix for redirect:', error);
        // Fallback - załaduj po serviceId jeśli nie udało się pobrać suffixu
        this.loadServiceDetails(serviceId.toString());
      }
    });
  }

  private loadServiceDetails(serviceId: string): void {
    this.loading = true;
    this.mapService.getServiceDetails(+serviceId).subscribe({
      next: (serviceDetails) => {
        if (serviceDetails) {
          // Sprawdź dostępność transportu
          if (!serviceDetails.transportAvailable) {
            const isKrakow = serviceDetails.city?.toLowerCase() === 'kraków';
            if (isKrakow) {
              // Serwis w Krakowie - transport będzie dostępny wkrótce
              this.transportComingSoon = true;
              this.selectedServiceInfo = {
                id: serviceDetails.id,
                name: serviceDetails.name,
                address: this.formatServiceAddress(serviceDetails),
                logoUrl: serviceDetails.logoUrl || null
              };
            } else {
              // Serwis za daleko
              this.transportNotAvailable = true;
              this.selectedServiceInfo = {
                id: serviceDetails.id,
                name: serviceDetails.name,
                address: this.formatServiceAddress(serviceDetails),
                logoUrl: serviceDetails.logoUrl || null
              };
            }
            this.loading = false;
            return;
          }

          this.selectedServiceInfo = {
            id: serviceDetails.id,
            name: serviceDetails.name,
            address: this.formatServiceAddress(serviceDetails),
            logoUrl: serviceDetails.logoUrl || null
          };
          this.actualTransportCost = serviceDetails.transportCost || null;
          console.log('Service details loaded:', this.selectedServiceInfo);
          console.log('Transport cost:', this.actualTransportCost);
        } else {
          this.notificationService.error(this.i18n.instant('transport_order.service_info.error_service_not_found'));
          this.router.navigate([environment.links.homepage]);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading service details:', error);
        this.notificationService.error(this.i18n.instant('transport_order.service_info.error_loading'));
        this.router.navigate([environment.links.homepage]);
        this.loading = false;
      }
    });
  }

  private formatServiceAddress(serviceDetails: any): string {
    let address = serviceDetails.street || '';
    if (serviceDetails.building) address += ' ' + serviceDetails.building;
    if (serviceDetails.flat) address += '/' + serviceDetails.flat;
    if (serviceDetails.city) address += ', ' + serviceDetails.city;
    if (serviceDetails.postalCode) address += ' ' + serviceDetails.postalCode;
    return address.trim();
  }

  private loadBrands(): void {
    this.loadingBrands = true;
    this.enumerationService.getEnumeration('BRAND').subscribe({
      next: (brands) => {
        this.brands = brands;
        this.loadingBrands = false;
      },
      error: () => {
        this.loadingBrands = false;
        this.brands = environment.settings.fallback.brands;
      }
    });
  }

  private loadCities(): void {
    this.loadingCities = true;
    this.enumerationService.getCities().subscribe({
      next: (cities) => {
        this.cities = cities;
        this.loadingCities = false;
      },
      error: () => {
        this.loadingCities = false;
        this.cities = environment.settings.fallback.cities;
      }
    });
  }

  checkSlotAvailabilityForDate(date: string): void {
    const bikesCount = this.getSelectedBicyclesCount();
    if (bikesCount > 0) {
      this.transportOrderService.checkSlotAvailability(date, bikesCount).subscribe({
        next: (response) => {
          const dateControl = this.contactAndTransportForm.get('pickupDate');
          if (!response.available) {
            this.notificationService.warning(
              this.i18n.instant('transport_order.validation.slots_not_available') + ` ${response.availableBikes}.`
            );
            dateControl?.setErrors({ ...dateControl.errors, notEnoughSlots: true });
          } else {
            this.notificationService.success(this.i18n.instant('transport_order.validation.slots_available'));
            // Usuń błąd notEnoughSlots, ale zachowaj inne błędy
            if (dateControl?.errors) {
              const { notEnoughSlots, availabilityCheckFailed, ...otherErrors } = dateControl.errors;
              dateControl.setErrors(Object.keys(otherErrors).length > 0 ? otherErrors : null);
            }
          }
        },
        error: (err) => {
          this.notificationService.error(this.i18n.instant('transport_order.validation.slots_check_error'));
          const dateControl = this.contactAndTransportForm.get('pickupDate');
          dateControl?.setErrors({ ...dateControl.errors, availabilityCheckFailed: true });
        }
      });
    }
  }

  // Step navigation
  nextStep(): void {
    if (this.isCurrentStepValid()) {
      if (this.currentStep < this.totalSteps) this.currentStep++;
    } else {
      this.markCurrentFormTouched();
      this.notificationService.warning(this.i18n.instant('transport_order.validation.fill_required_fields'));
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  goToStep(step: number): void {
    if (step <= this.getMaxAccessibleStep()) this.currentStep = step;
  }

  getMaxAccessibleStep(): number {
    if (!this.isStepValid(1)) return 1;
    if (!this.isStepValid(2)) return 2;
    return 3;
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 1: return this.isStepValid(1);
      case 2: return this.isStepValid(2);
      case 3: return this.isStepValid(1) && this.isStepValid(2) && this.termsAcceptedControl.valid;
      default: return false;
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1: return this.bicyclesForm.valid && this.bicyclesArray.length > 0;
      case 2: return this.contactAndTransportForm.valid;
      case 3: return true;
      default: return false;
    }
  }

  markCurrentFormTouched(): void {
    switch (this.currentStep) {
      case 1: this.markFormGroupTouched(this.bicyclesForm); break;
      case 2: this.markFormGroupTouched(this.contactAndTransportForm); break;
      case 3: this.termsAcceptedControl.markAsTouched(); break;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.values(formGroup.controls).forEach(control => {
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Bicycle management
  get bicyclesArray(): FormArray {
    return this.bicyclesForm.get('bicycles') as FormArray;
  }

  addBicycleToForm(): void {
    this.bicyclesArray.push(this.fb.group({
      brand: ['', [Validators.required]],
      model: [''],
      description: ['']
    }));
  }

  removeBicycleFromForm(index: number): void {
    if (this.bicyclesArray.length > 1) {
      this.bicyclesArray.removeAt(index);
    }
  }

  getEstimatedTransportCost(): number {
    const selectedCount = this.getSelectedBicyclesCount();
    if (selectedCount === 0) return 0;
    if (this.actualTransportCost !== null && this.actualTransportCost === 0) {
      return 0;
    }
    const baseCost = this.actualTransportCost !== null ? this.actualTransportCost : 50;
    if (selectedCount === 1) {
      return baseCost;
    }
    const perAdditionalBikeCost = 20;
    return baseCost + (selectedCount - 1) * perAdditionalBikeCost;
  }

  getFinalPriceToSend(): number {
    return this.finalTransportPrice !== null ? this.finalTransportPrice : this.getEstimatedTransportCost();
  }

  applyDiscountCoupon(): void {
    const couponCode = this.discountCouponControl.value?.trim();
    if (!couponCode || this.isApplyingCoupon) return;

    this.isApplyingCoupon = true;
    this.couponMessage = null;
    this.isCouponInvalid = false;

    const orderDate = this.contactAndTransportForm.get('pickupDate')?.value;
    if (!orderDate) {
      this.notificationService.warning(this.i18n.instant('transport_order.discount.select_date_first'));
      this.isApplyingCoupon = false;
      return;
    }

    const discountRequest = {
      coupon: couponCode,
      currentTransportPrice: this.getEstimatedTransportCost(),
      orderDate: orderDate
    };

    this.transportOrderService.checkDiscount(discountRequest).subscribe({
      next: (response) => {
        const newPrice = response.newPrice;
        if (newPrice < this.getEstimatedTransportCost()) {
          this.finalTransportPrice = newPrice;
          this.couponMessage = this.i18n.instant('transport_order.discount.coupon_applied', { coupon: couponCode });
          this.isCouponInvalid = false;
        } else {
          this.finalTransportPrice = null;
          this.couponMessage = this.i18n.instant('transport_order.discount.coupon_invalid');
          this.isCouponInvalid = true;
        }
        this.isApplyingCoupon = false;
      },
      error: () => {
        this.finalTransportPrice = null;
        this.couponMessage = this.i18n.instant('transport_order.discount.coupon_error');
        this.isCouponInvalid = true;
        this.isApplyingCoupon = false;
      }
    });
  }

  // Form submission
  onSubmit(): void {
    if (!this.isStepValid(1) || !this.isStepValid(2) || !this.termsAcceptedControl.valid) {
      this.termsAcceptedControl.markAsTouched();
      this.notificationService.warning(this.i18n.instant('transport_order.validation.fill_all_and_accept'));
      return;
    }

    if (!this.selectedServiceInfo.id) {
      this.notificationService.error(this.i18n.instant('transport_order.validation.no_service_selected'));
      return;
    }

    this.submitting = true;

    const bicyclesData = this.bicyclesForm.value.bicycles as BicycleFormData[];
    const contactAndTransportData = this.contactAndTransportForm.value;

    const bicycleInfo = bicyclesData.map((bike, index) =>
        `${this.i18n.instant('transport_order.bicycle_form.bicycle_number')} ${index + 1}: ${bike.brand} ${bike.model || ''} (${bike.type || 'brak typu'})`
    ).join('\n');

    const finalPrice = this.getFinalPriceToSend();

    const transportOrder = {
      bicycles: bicyclesData.map(bike => ({
        brand: bike.brand,
        model: bike.model || '',
        additionalInfo: bike.description || ''
      })),
      email: contactAndTransportData.clientEmail,
      phone: contactAndTransportData.clientPhone,

      pickupStreet: contactAndTransportData.pickupStreet,
      pickupBuildingNumber: contactAndTransportData.pickupBuildingNumber,
      pickupCity: contactAndTransportData.pickupCity,
      pickupPostalCode: contactAndTransportData.pickupPostalCode,

      pickupDate: contactAndTransportData.pickupDate,
      targetServiceId: this.selectedServiceInfo.id,
      transportPrice: finalPrice,
      transportNotes: contactAndTransportData.additionalNotes || '',
      additionalNotes: bicycleInfo,
      discountCoupon: this.finalTransportPrice !== null ? this.discountCouponControl.value : null
    };

    this.transportOrderService.createGuestTransportOrder(transportOrder).subscribe({
      next: (response) => {
        this.notificationService.success(this.i18n.instant('transport_order.messages.order_success'));
        this.submitting = false;
        const orderIds = response.orderIds || (response.id ? [response.id] : []);
        this.router.navigate([environment.links.orderSummary], { 
          queryParams: { orderIds: orderIds.join(',') } 
        });
      },
      error: (err) => {
        this.submitting = false;
        
        let errorMessage: string;

        if (err.error?.errors && Array.isArray(err.error.errors)) {
          errorMessage = err.error.errors.join('\n');
        } else {
          errorMessage = err.error?.message || this.i18n.instant('transport_order.messages.order_error');
        }

        this.notificationService.error(errorMessage);
      }
    });
  }

  // Helper and display methods
  getFullPickupAddress(): string {
    const form = this.contactAndTransportForm.value;
    return `${form.pickupStreet} ${form.pickupBuildingNumber}, ${form.pickupCity} ${form.pickupPostalCode || ''}`.trim();
  }

  getBicyclesData(): any[] {
    return this.bicyclesArray.value || [];
  }

  getSelectedBicyclesCount(): number {
    return this.getBicyclesData().length;
  }

  goBack(): void {
    this.router.navigate([environment.links.homepage]);
  }

  getBicycleTypes(): string[] {
    return this.i18n.instant('transport_order.bicycle_types') as string[];
  }

  getFrameMaterials(): string[] {
    return this.i18n.instant('transport_order.frame_materials') as string[];
  }

  isFieldInvalid(fieldName: string, formGroup?: FormGroup): boolean {
    const form = formGroup || this.getCurrentForm();
    const field = form.get(fieldName);
    return !!(field?.invalid && (field.dirty || field.touched));
  }

  isBicycleFieldInvalid(i: number, fieldName: string): boolean {
    const field = this.bicyclesArray.at(i)?.get(fieldName);
    return !!(field?.invalid && (field.dirty || field.touched));
  }

  getCurrentForm(): FormGroup {
    return this.currentStep === 1 ? this.bicyclesForm : this.contactAndTransportForm;
  }

  isStepCompleted(step: number): boolean {
    return this.currentStep > step && this.isStepValid(step);
  }

  isStepActive(step: number): boolean {
    return this.currentStep === step;
  }

  isStepAccessible(step: number): boolean {
    return step <= this.getMaxAccessibleStep();
  }

  getStepTitle(step: number): string {
    const stepKeys: { [key: number]: string } = {
      1: 'transport_order.steps.bicycle_data',
      2: 'transport_order.steps.contact_transport',
      3: 'transport_order.steps.summary'
    };
    return this.i18n.instant(stepKeys[step] || '');
  }

  getStepDescription(step: number): string {
    const stepKeys: { [key: number]: string } = {
      1: 'transport_order.step_descriptions.bicycle_data',
      2: 'transport_order.step_descriptions.contact_transport',
      3: 'transport_order.step_descriptions.summary'
    };
    return this.i18n.instant(stepKeys[step] || '');
  }

  // Translation helper for template
  t(key: string, params?: any): string {
    return this.i18n.instant(key, params);
  }
}