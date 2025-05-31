// src/app/transport-orders/transport-order-form/transport-order-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../core/notification.service';
import { TransportOrderService, TransportOrderRequest } from './transport-order.service';

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

  // Data
  selectedServiceInfo: any = {};
  bicyclesList: BicycleData[] = [];
  
  // Date constraints
  minDate: string;
  maxDate: string;
  
  // Form
  transportForm: FormGroup;
  
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

    this.transportForm = this.fb.group({
      // Dane klienta
      clientEmail: ['', [Validators.required, Validators.email]],
      clientName: ['', [Validators.required, Validators.minLength(2)]],
      clientPhone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      
      // Dane roweru/rowerów
      bicycles: this.fb.array([]),
      
      // Szczegóły transportu
      pickupDate: ['', [Validators.required, this.dateValidator.bind(this)]],
      pickupAddress: ['', [Validators.required, Validators.minLength(5)]],
      additionalNotes: ['']
    });
  }

  // Validator sprawdzający czy wybrana data to niedziela-czwartek
  dateValidator(control: any): {[key: string]: any} | null {
    if (!control.value) {
      return null; // Required validator will handle this
    }
    
    const selectedDate = new Date(control.value);
    const dayOfWeek = selectedDate.getDay();
    
    // Sprawdź dzień tygodnia (0 = niedziela, 4 = czwartek)
    if (dayOfWeek > 4) { // Piątek i sobota nie są dozwolone
      return { invalidDay: true };
    }
    
    return null;
  }

  ngOnInit(): void {
    this.loadServiceInfo();
    this.setMinPickupDate();
    this.addBicycleToForm(); // Dodaj pierwszy rower
  }

  private loadServiceInfo(): void {
    // Pobierz informacje o serwisie z query params
    this.route.queryParams.subscribe(params => {
      this.selectedServiceInfo = {
        id: params['serviceId'] ? +params['serviceId'] : null,
        name: params['serviceName'] || '',
        address: params['serviceAddress'] || ''
      };
    });
  }

  private setMinPickupDate(): void {
    // Ustaw minimalną datę odbioru na jutro i dodaj do inputa
    setTimeout(() => {
      const pickupDateInput = document.getElementById('pickupDate') as HTMLInputElement;
      if (pickupDateInput) {
        pickupDateInput.min = this.minDate;
        pickupDateInput.max = this.maxDate;
      }
    });
  }

  getBicyclesData(): any[] {
    const bicycles = this.transportForm.get('bicycles')?.value || [];
    return bicycles;
  }

  get bicyclesArray(): FormArray {
    return this.transportForm.get('bicycles') as FormArray;
  }

  addBicycleToForm(): void {
    const bicycleGroup = this.fb.group({
      brand: ['', [Validators.required, Validators.minLength(2)]],
      model: ['', [Validators.required, Validators.minLength(2)]],
      type: ['', Validators.required],
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

  onSubmit(): void {
    if (this.transportForm.invalid) {
      this.markFormGroupTouched();
      this.notificationService.warning('Wypełnij poprawnie wszystkie wymagane pola');
      return;
    }

    if (!this.selectedServiceInfo.id) {
      this.notificationService.error('Nie wybrano serwisu docelowego');
      return;
    }

    this.submitting = true;

    const formValue = this.transportForm.value;
    
    // Przekonwertuj dane rowerów na uproszczony format
    const bicycleData = (formValue.bicycles as BicycleFormData[]).map((bike: BicycleFormData, index: number) => ({
      id: -(index + 1), // Tymczasowe ID dla nowych rowerów
      brand: bike.brand,
      model: bike.model,
      type: bike.type,
      frameMaterial: bike.frameMaterial,
      description: bike.description
    }));
    
    const transportOrder: TransportOrderRequest = {
      bicycleIds: bicycleData.map(bike => bike.id), // Będą zastąpione przez backend
      pickupDate: formValue.pickupDate,
      pickupAddress: formValue.pickupAddress,
      deliveryAddress: this.selectedServiceInfo.address,
      additionalNotes: formValue.additionalNotes || undefined,
      targetServiceId: this.selectedServiceInfo.id,
      transportType: 'TO_SERVICE_ONLY',
      transportPrice: this.getEstimatedTransportCost(),
      // Dodatkowe dane
      clientEmail: formValue.clientEmail,
      clientName: formValue.clientName,
      clientPhone: formValue.clientPhone,
      bicyclesData: bicycleData
    } as any; // Rozszerzone o dodatkowe pola

    // Walidacja danych
    const validationErrors = this.validateForm();
    if (validationErrors.length > 0) {
      this.notificationService.error(validationErrors.join(', '));
      this.submitting = false;
      return;
    }

    // Wywołanie API do utworzenia zamówienia
    this.transportOrderService.createTransportOrder(transportOrder).subscribe({
      next: (response) => {
        this.notificationService.success(`Zamówienie transportu #${response.id} zostało złożone pomyślnie!`);
        this.submitting = false;
        
        // Przekieruj do strony głównej lub potwierdzenia
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

  private validateForm(): string[] {
    const errors: string[] = [];
    const formValue = this.transportForm.value;

    // Walidacja danych klienta
    if (!formValue.clientEmail || !formValue.clientEmail.includes('@')) {
      errors.push('Podaj poprawny adres email');
    }

    if (!formValue.clientName || formValue.clientName.trim().length < 2) {
      errors.push('Imię i nazwisko musi mieć co najmniej 2 znaki');
    }

    if (!formValue.clientPhone || !/^\d{9}$/.test(formValue.clientPhone)) {
      errors.push('Numer telefonu musi mieć 9 cyfr');
    }

    // Walidacja rowerów
    if (!formValue.bicycles || formValue.bicycles.length === 0) {
      errors.push('Dodaj co najmniej jeden rower');
    } else {
      (formValue.bicycles as BicycleFormData[]).forEach((bike: BicycleFormData, index: number) => {
        if (!bike.brand || bike.brand.trim().length < 2) {
          errors.push(`Rower ${index + 1}: Marka jest wymagana`);
        }
        if (!bike.model || bike.model.trim().length < 2) {
          errors.push(`Rower ${index + 1}: Model jest wymagany`);
        }
        if (!bike.type) {
          errors.push(`Rower ${index + 1}: Typ roweru jest wymagany`);
        }
      });
    }

    // Walidacja daty
    if (!formValue.pickupDate) {
      errors.push('Data odbioru jest wymagana');
    } else {
      const pickupDate = new Date(formValue.pickupDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (pickupDate <= today) {
        errors.push('Data odbioru musi być w przyszłości');
      }
    }

    // Walidacja adresu
    if (!formValue.pickupAddress || formValue.pickupAddress.trim().length < 5) {
      errors.push('Adres odbioru musi mieć co najmniej 5 znaków');
    }

    return errors;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.transportForm.controls).forEach(key => {
      const control = this.transportForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.transportForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  getSelectedBicyclesCount(): number {
    const bicycles = this.transportForm.get('bicycles')?.value || [];
    return bicycles.length;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  getEstimatedTransportCost(): number {
    const selectedCount = this.getSelectedBicyclesCount();
    return this.transportOrderService.calculateEstimatedCost(selectedCount);
  }
}
