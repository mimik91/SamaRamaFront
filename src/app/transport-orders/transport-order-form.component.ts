// src/app/transport-orders/transport-order-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
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
  totalSteps = 3; // Zmieniono z 4 na 3 kroki
  
  // Data
  selectedServiceInfo: any = {};
  bicyclesList: BicycleData[] = [];
  actualTransportCost: number | null = null;
  brands: string[] = [];
  loadingBrands = true;
  
  // Date constraints
  minDate: string;
  maxDate: string;
  
  // Forms for each step
  bicyclesForm: FormGroup;
  contactAndTransportForm: FormGroup; // Połączone dane kontaktowe i transport
  
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
      // Dane kontaktowe - bez imienia i nazwiska
      clientEmail: ['', [Validators.required, Validators.email]],
      clientPhone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      // Szczegóły transportu
      pickupDate: ['', [Validators.required, this.dateValidator.bind(this)]],
      pickupAddress: ['', [Validators.required, Validators.minLength(5)]],
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
    this.addBicycleToForm(); // Dodaj pierwszy rower
  }

  private loadServiceInfo(): void {
    this.route.queryParams.subscribe(params => {
      this.selectedServiceInfo = {
        id: params['serviceId'] ? +params['serviceId'] : null,
        name: params['serviceName'] || '',
        address: params['serviceAddress'] || ''
      };
      
      // Pobierz szczegóły serwisu z API, aby uzyskać dokładny koszt transportu
      if (this.selectedServiceInfo.id) {
        this.loadServiceTransportCost();
      }
    });
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

  private loadServiceTransportCost(): void {
    this.mapService.getServiceDetails(this.selectedServiceInfo.id).subscribe({
      next: (serviceDetails) => {
        if (serviceDetails && typeof serviceDetails.transportCost === 'number') {
          this.actualTransportCost = serviceDetails.transportCost;
          console.log('Transport cost loaded from API:', this.actualTransportCost);
        } else {
          // Jeśli serwis nie ma ustawionego kosztu transportu
          this.actualTransportCost = null;
          console.log('No transport cost available for this service');
        }
      },
      error: (error) => {
        console.error('Error loading service transport cost:', error);
        this.actualTransportCost = null;
      }
    });
  }

  // Step navigation
  nextStep(): void {
    if (this.isCurrentStepValid()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
      }
    } else {
      this.markCurrentFormTouched();
      this.notificationService.warning('Wypełnij poprawnie wszystkie wymagane pola w tym kroku');
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    // Sprawdź czy można przejść do danego kroku
    if (step <= this.getMaxAccessibleStep()) {
      this.currentStep = step;
    }
  }

  getMaxAccessibleStep(): number {
    // Sprawdź do którego kroku użytkownik może przejść
    if (!this.isStepValid(1)) return 1;
    if (!this.isStepValid(2)) return 2;
    return 3;
  }

  isCurrentStepValid(): boolean {
    return this.isStepValid(this.currentStep);
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return this.bicyclesForm.valid && this.bicyclesArray.length > 0;
      case 2:
        return this.contactAndTransportForm.valid;
      case 3:
        return true; // Summary step
      default:
        return false;
    }
  }

  markCurrentFormTouched(): void {
    switch (this.currentStep) {
      case 1:
        this.markFormGroupTouched(this.bicyclesForm);
        break;
      case 2:
        this.markFormGroupTouched(this.contactAndTransportForm);
        break;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      
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
    const bicycleGroup = this.fb.group({
      brand: ['', [Validators.required]], // Usunięto minLength bo to select
      model: [''], // Opcjonalny
      type: [''], // Opcjonalny
      frameMaterial: [''],
      description: ['']
    });

    this.bicyclesArray.push(bicycleGroup);
  }

  removeBicycleFromForm(index: number): void {
    if (this.bicyclesArray.length > 1) {
      this.bicyclesArray.removeAt(index);
    }
  }

  getBicycleTypes(): string[] {
    return [
      'Górski',
      'Szosowy',
      'Miejski',
      'Trekkingowy',
      'BMX',
      'Elektryczny',
      'Składany',
      'Gravel',
      'Cruiser',
      'Inny'
    ];
  }

  getFrameMaterials(): string[] {
    return [
      'Aluminium',
      'Stal',
      'Carbon',
      'Tytan',
      'Stal chromowo-molibdenowa',
      'Inny'
    ];
  }

  // Helper methods
  getBicyclesData(): any[] {
    return this.bicyclesArray.value || [];
  }

  getSelectedBicyclesCount(): number {
    return this.getBicyclesData().length;
  }

  getEstimatedTransportCost(): number {
    // Jeśli mamy rzeczywisty koszt z API, użyj go
    if (this.actualTransportCost !== null) {
      return this.actualTransportCost;
    }
    
    // Fallback - oblicz lokalnie jeśli API nie jest dostępne
    const selectedCount = this.getSelectedBicyclesCount();
    const baseCost = 50;
    const perBikeCost = 20;
    
    if (selectedCount === 0) return 0;
    return baseCost + (selectedCount - 1) * perBikeCost;
  }

  isFieldInvalid(fieldName: string, formGroup?: FormGroup): boolean {
    const form = formGroup || this.getCurrentForm();
    const field = form.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  isBicycleFieldInvalid(bicycleIndex: number, fieldName: string): boolean {
    const bicycleControl = this.bicyclesArray.at(bicycleIndex);
    const field = bicycleControl.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  getCurrentForm(): FormGroup {
    switch (this.currentStep) {
      case 1: return this.bicyclesForm;
      case 2: return this.contactAndTransportForm;
      default: return this.contactAndTransportForm;
    }
  }

  // Step completion status
  isStepCompleted(step: number): boolean {
    return this.isStepValid(step);
  }

  isStepActive(step: number): boolean {
    return this.currentStep === step;
  }

  isStepAccessible(step: number): boolean {
    return step <= this.getMaxAccessibleStep();
  }

  // Form submission
  onSubmit(): void {
    // Sprawdź wszystkie kroki
    const allFormsValid = this.isStepValid(1) && this.isStepValid(2);
    
    if (!allFormsValid) {
      this.notificationService.warning('Wypełnij poprawnie wszystkie wymagane pola we wszystkich krokach');
      return;
    }

    if (!this.selectedServiceInfo.id) {
      this.notificationService.error('Nie wybrano serwisu docelowego');
      return;
    }

    this.submitting = true;

    // Combine all form data
    const bicyclesData = this.bicyclesForm.value.bicycles as BicycleFormData[];
    const contactAndTransportData = this.contactAndTransportForm.value;
    
    const transportOrder: TransportOrderRequest = {
      bicycleIds: bicyclesData.map((_, index) => -(index + 1)), // Tymczasowe ID
      pickupDate: contactAndTransportData.pickupDate,
      pickupAddress: contactAndTransportData.pickupAddress,
      deliveryAddress: this.selectedServiceInfo.address,
      additionalNotes: contactAndTransportData.additionalNotes || undefined,
      targetServiceId: this.selectedServiceInfo.id,
      transportPrice: this.actualTransportCost || undefined, // Użyj rzeczywistego kosztu lub undefined
      clientEmail: contactAndTransportData.clientEmail,
      clientPhone: contactAndTransportData.clientPhone,
      // Nie wysyłamy clientName - nie zbieramy tego pola
      bicyclesData: bicyclesData.map((bike, index) => ({
        id: -(index + 1),
        brand: bike.brand,
        model: bike.model,
        type: bike.type,
        frameMaterial: bike.frameMaterial,
        description: bike.description
      }))
    } as any;

    this.transportOrderService.createTransportOrder(transportOrder).subscribe({
      next: (response) => {
        this.notificationService.success(`Zamówienie transportu #${response.id} zostało złożone pomyślnie!`);
        this.submitting = false;
        
        this.router.navigate(['/'], {
          queryParams: { 
            success: 'transport-order',
            orderId: response.id 
          }
        });
      },
      error: (err) => {
        console.error('Error creating transport order:', err);
        this.submitting = false;
        
        let errorMessage = 'Wystąpił błąd podczas składania zamówienia';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.error?.errors) {
          errorMessage = err.error.errors.join(', ');
        }
        
        this.notificationService.error(errorMessage);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  // Step titles for display
  getStepTitle(step: number): string {
    const titles = {
      1: 'Dane rowerów',
      2: 'Kontakt i transport', 
      3: 'Podsumowanie'
    };
    return titles[step as keyof typeof titles] || '';
  }

  getStepDescription(step: number): string {
    const descriptions = {
      1: 'Dodaj informacje o rowerach, które mają zostać przewiezione do serwisu.',
      2: 'Podaj dane kontaktowe i szczegóły transportu.',
      3: 'Sprawdź wszystkie dane przed wysłaniem zamówienia.'
    };
    return descriptions[step as keyof typeof descriptions] || '';
  }
}