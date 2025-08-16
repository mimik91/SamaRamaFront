// src/app/transport-orders/transport-order-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../core/notification.service';
import { TransportOrderService, TransportOrderRequest } from './transport-order.service';
import { MapService } from '../shared/services/map.service';
import { EnumerationService } from '../core/enumeration.service';

export interface BicycleFormData {
  brand: string;
  model: string;
  type: string;
  frameMaterial?: string;
  description?: string;
}

export interface BicycleData {
  brand: string;
  model: string;
  type: string;
  frameMaterial?: string;
  description?: string;
}

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

  constructor() {
    // Ustawienie dat
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = tomorrow.toISOString().split('T')[0];

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    this.maxDate = maxDate.toISOString().split('T')[0];

    // Initialize forms
    this.bicyclesForm = this.fb.group({
      bicycles: this.fb.array([])
    });

    this.contactAndTransportForm = this.fb.group({
      // Dane kontaktowe
      clientEmail: ['', [Validators.required, Validators.email]],
      clientPhone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],

      // Szczegóły transportu
      pickupDate: ['', [Validators.required, this.dateValidator.bind(this)]],

      // ROZBITY ADRES - bez pickupApartmentNumber
      pickupStreet: ['', [Validators.required, Validators.minLength(2)]],
      pickupBuildingNumber: ['', [Validators.required]],
      pickupCity: ['', [Validators.required]],
      pickupPostalCode: ['', [Validators.pattern(/^\d{2}-\d{3}$/)]],

      additionalNotes: ['']
    });
  }

  // Validator sprawdzający czy wybrana data to niedziela-czwartek
  dateValidator(control: any): {[key: string]: any} | null {
    if (!control.value) {
      return null;
    }

    const selectedDate = new Date(control.value);
    const dayOfWeek = selectedDate.getDay();

    if (dayOfWeek > 4) { // Piątek i sobota nie są dozwolone
      return { invalidDay: true };
    }

    return null;
  }

  ngOnInit(): void {
    this.loadServiceInfo();
    this.loadBrands();
    this.loadCities();
    this.addBicycleToForm(); // Dodaj pierwszy rower
  }

  private loadServiceInfo(): void {
    this.route.queryParams.subscribe(params => {
      const serviceId = params['serviceId'];
      if (serviceId) {
        this.loadServiceDetails(serviceId);
      } else {
        this.selectedServiceInfo = { id: null, name: '', address: '' };
        this.notificationService.error('Brak informacji o serwisie. Sprawdź link.');
      }
    });
  }

  private loadServiceDetails(serviceId: string): void {
    this.loading = true;
    this.mapService.getServiceDetails(+serviceId).subscribe({
      next: (serviceDetails) => {
        if (serviceDetails) {
          this.selectedServiceInfo = {
            id: serviceDetails.id,
            name: serviceDetails.name,
            address: this.formatServiceAddress(serviceDetails)
          };
          this.actualTransportCost = serviceDetails.transportCost || null;
          console.log('Service details loaded:', this.selectedServiceInfo);
          console.log('Transport cost:', this.actualTransportCost);
        } else {
          this.notificationService.error('Nie znaleziono serwisu o podanym ID');
          this.router.navigate(['/']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading service details:', error);
        this.notificationService.error('Błąd podczas ładowania danych serwisu');
        this.router.navigate(['/']);
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
        this.brands = ['Trek', 'Specialized', 'Giant', 'Cannondale', 'Scott', 'Merida', 'Kona', 'Cube', 'Inna']; // Fallback brands
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
        this.cities = ['Kraków', 'Warszawa', 'Gdańsk', 'Poznań', 'Wrocław', 'Łódź']; // Fallback cities
      }
    });
  }

  // Step navigation
  nextStep(): void {
    if (this.isCurrentStepValid()) {
      if (this.currentStep < this.totalSteps) this.currentStep++;
    } else {
      this.markCurrentFormTouched();
      this.notificationService.warning('Wypełnij poprawnie wszystkie wymagane pola w tym kroku');
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
      case 3: return true; // Summary step
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
      type: [''],
      frameMaterial: [''],
      description: ['']
    }));
  }

  removeBicycleFromForm(index: number): void {
    if (this.bicyclesArray.length > 1) {
      this.bicyclesArray.removeAt(index);
    }
  }

  // Cost and price methods
  getEstimatedTransportCost(): number {
    if (this.actualTransportCost !== null) {
      return this.actualTransportCost * this.getSelectedBicyclesCount();
    }
    const selectedCount = this.getSelectedBicyclesCount();
    if (selectedCount === 0) return 0;
    const baseCost = 50;
    const perBikeCost = 20;
    return baseCost + (selectedCount - 1) * perBikeCost;
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
      this.notificationService.warning('Proszę najpierw wybrać datę odbioru w kroku 2.');
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
          this.couponMessage = `Kupon "${couponCode}" został zastosowany!`;
          this.isCouponInvalid = false;
        } else {
          this.finalTransportPrice = null;
          this.couponMessage = 'Kupon jest niepoprawny lub stracił ważność.';
          this.isCouponInvalid = true;
        }
        this.isApplyingCoupon = false;
      },
      error: () => {
        this.finalTransportPrice = null;
        this.couponMessage = 'Wystąpił błąd podczas sprawdzania kuponu. Spróbuj ponownie.';
        this.isCouponInvalid = true;
        this.isApplyingCoupon = false;
      }
    });
  }

  // Form submission
  onSubmit(): void {
    if (!this.isStepValid(1) || !this.isStepValid(2) || !this.termsAcceptedControl.valid) {
      this.termsAcceptedControl.markAsTouched();
      this.notificationService.warning('Wypełnij poprawnie wszystkie wymagane pola i zaakceptuj regulamin');
      return;
    }

    if (!this.selectedServiceInfo.id) {
      this.notificationService.error('Nie wybrano serwisu docelowego');
      return;
    }

    this.submitting = true;

    const bicyclesData = this.bicyclesForm.value.bicycles as BicycleFormData[];
    const contactAndTransportData = this.contactAndTransportForm.value;

    const bicycleInfo = bicyclesData.map((bike, index) =>
        `Rower ${index + 1}: ${bike.brand} ${bike.model || ''} (${bike.type || 'brak typu'})`
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
        this.notificationService.success(`Zamówienie transportu zostało złożone pomyślnie!`);
        this.submitting = false;
        // Zmiana: przekierowanie do nowego komponentu podsumowania
        const orderIds = response.orderIds || [response.id];
        this.router.navigate(['/ordersummary'], { queryParams: { orderIds: orderIds.join(',') } });
      },
      error: (err) => {
        this.submitting = false;
        const errorMessage = err.error?.message || 'Wystąpił błąd podczas składania zamówienia';
        this.notificationService.error(errorMessage);
      }
    });
  }

  // Helper and display methods
  getFullPickupAddress(): string {
    const form = this.contactAndTransportForm.value;
    return `${form.pickupStreet} ${form.pickupBuildingNumber}, ${form.pickupCity} ${form.pickupPostalCode || ''}`.trim();
  }

  getBicyclesData(): any[] { return this.bicyclesArray.value || []; }
  getSelectedBicyclesCount(): number { return this.getBicyclesData().length; }
  goBack(): void { this.router.navigate(['/']); }
  getBicycleTypes(): string[] { return ['Górski', 'Szosowy', 'Miejski', 'Trekkingowy', 'BMX', 'Elektryczny', 'Składany', 'Gravel', 'Cruiser', 'Inny']; }
  getFrameMaterials(): string[] { return ['Aluminium', 'Stal', 'Carbon', 'Tytan', 'Stal chromowo-molibdenowa', 'Inny']; }
  isFieldInvalid(fieldName: string, formGroup?: FormGroup): boolean { const form = formGroup || this.getCurrentForm(); const field = form.get(fieldName); return !!(field?.invalid && (field.dirty || field.touched)); }
  isBicycleFieldInvalid(i: number, fieldName: string): boolean { const field = this.bicyclesArray.at(i)?.get(fieldName); return !!(field?.invalid && (field.dirty || field.touched)); }
  getCurrentForm(): FormGroup { return this.currentStep === 1 ? this.bicyclesForm : this.contactAndTransportForm; }
  isStepCompleted(step: number): boolean { return this.currentStep > step && this.isStepValid(step); }
  isStepActive(step: number): boolean { return this.currentStep === step; }
  isStepAccessible(step: number): boolean { return step <= this.getMaxAccessibleStep(); }
  getStepTitle(step: number): string { return { 1: 'Dane rowerów', 2: 'Kontakt i transport', 3: 'Podsumowanie' }[step] || ''; }
  getStepDescription(step: number): string { return { 1: 'Dodaj informacje o rowerach do transportu.', 2: 'Podaj dane kontaktowe i szczegóły odbioru.', 3: 'Sprawdź wszystkie dane przed wysłaniem.' }[step] || ''; }
}