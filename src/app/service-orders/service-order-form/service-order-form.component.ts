import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// Angular Material imports
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { 
  FormBuilder, 
  FormControl, 
  FormGroup, 
  ReactiveFormsModule, 
  ValidationErrors,
  Validators 
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BicycleService } from '../../bicycles/bicycle.service';
import { Bicycle } from '../../bicycles/bicycle.model';
import { CreateServiceOrderRequest } from '../service-order.model';
import { ServiceOrderService } from '../service-orders.service';
import { NotificationService } from '../../core/notification.service';
import { ServicePackageService } from '../../service-package/service-package.service';
import { ServicePackage } from '../../service-package/service-package.model';
import { BicycleSelectionService } from '../../bicycles/bicycle-selection.service';
import { EnumerationService } from '../../core/enumeration.service';

// Import our custom date filter, formats and adapter
import { CustomDatePickerFilter, CUSTOM_DATE_FORMATS } from '../custom-date-picker-filter';
import { CustomDateAdapter } from '../custom-date-adapter';

@Component({
  selector: 'app-service-order-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'pl-PL' },
    { provide: DateAdapter, useClass: CustomDateAdapter }
  ],
  templateUrl: './service-order-form.component.html',
  styleUrls: ['./service-order-form.component.css']
})
export class ServiceOrderFormComponent implements OnInit {

  dateFilter = CustomDatePickerFilter.dateFilter;
  
  // Updated date variables to Date objects instead of strings
  minDate: Date;
  maxDate: Date;
  
  constructor() {
    // Initialize dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = tomorrow;
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    this.maxDate = maxDate;
  }

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private bicycleService = inject(BicycleService);
  private serviceOrderService = inject(ServiceOrderService);
  private notificationService = inject(NotificationService);
  private servicePackageService = inject(ServicePackageService);
  private bicycleSelectionService = inject(BicycleSelectionService);
  private enumerationService = inject(EnumerationService);
  
  // Bicycle data
  selectedBicycles: Bicycle[] = [];
  currentBicycleIndex = 0;
  bicycle: Bicycle | null = null;
  
  // Form controls
  currentStep = 1;
  selectedPackageId: number | null = null;
  
  // City list
  cities: string[] = [];
  loadingCities = true;
  
  // Pickup date with validation for day of week (Sunday-Thursday)
  pickupDateControl: FormControl = new FormControl('', [
    Validators.required,
    this.dateValidator.bind(this)
  ]);
  
  addressForm: FormGroup = this.fb.group({
    street: ['', [Validators.required]],
    city: ['', [Validators.required]],
    additionalNotes: ['']
  });
  
  termsAcceptedControl: FormControl = new FormControl(false, [Validators.requiredTrue]);
  
  // UI states
  loading = true;
  isSubmitting = false;
  orderId: string | null = null;
  
  // Available service packages from database
  availablePackages: ServicePackage[] = [];
  loadingPackages = false;
  
  // Validator checking if the selected date is from Sunday to Thursday
  dateValidator(control: FormControl): ValidationErrors | null {
    if (!control.value) {
      return { required: true };
    }
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if the date is in the future
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (selectedDate < tomorrow) {
      return { min: true };
    }
    
    // Check if the date is not too far in the future (max 30 days)
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);
    
    if (selectedDate > maxDate) {
      return { max: true };
    }
    
    // Check day of week (0 = Sunday, 4 = Thursday)
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek > 4) { // Friday and Saturday are not allowed
      return { invalidDay: true };
    }
    
    return null;
  }
  
  ngOnInit(): void {
    // Get selected bicycles from the service
    this.selectedBicycles = this.bicycleSelectionService.getSelectedBicycles();
    
    // Check route parameter for backward compatibility
    const bicycleId = this.route.snapshot.paramMap.get('id');
    
    // If we have a bicycle ID in the route and no bicycles in the selection service
    if (bicycleId && this.selectedBicycles.length === 0) {
      // Load single bicycle by ID
      this.loadBicycle(+bicycleId);
    } else if (this.selectedBicycles.length === 0) {
      // If no bicycles are selected, redirect to bicycle list
      this.notificationService.warning('Wybierz rower dla którego chcesz zamówić serwis.');
      this.router.navigate(['/bicycles']);
      return;
    } else {
      // Use bicycles from selection service
      this.bicycle = this.selectedBicycles[this.currentBicycleIndex];
      this.loading = false;
    }
    
    // Load service packages
    this.loadServicePackages();
    
    // Load cities
    this.loadCities();
  }
  
  private loadBicycle(id: number): void {
    this.loading = true;
    this.bicycleService.getBicycle(id).subscribe({
      next: (bicycle) => {
        // Add this bicycle to the selection service
        this.bicycleSelectionService.addBicycle(bicycle);
        this.selectedBicycles = [bicycle];
        this.bicycle = bicycle;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bicycle:', error);
        this.notificationService.error('Nie udało się załadować danych roweru');
        this.router.navigate(['/bicycles']);
      }
    });
  }
  
  private loadServicePackages(): void {
    this.loadingPackages = true;
    
    this.servicePackageService.getActivePackages().subscribe({
      next: (packages: ServicePackage[]) => {
        this.availablePackages = packages;
        this.loadingPackages = false;
      },
      error: (error: any) => {
        console.error('Failed to load service packages:', error);
        this.notificationService.error('An error occurred while loading service packages');
        this.loadingPackages = false;
        
        // Fallback to empty array
        this.availablePackages = [];
      }
    });
  }
  
  private loadCities(): void {
    this.loadingCities = true;
    
    this.enumerationService.getCities().subscribe({
      next: (cities: string[]) => {
        this.cities = cities;
        this.loadingCities = false;
      },
      error: (error: any) => {
        console.error('Failed to load cities:', error);
        this.notificationService.error('Nie udało się załadować listy miast');
        this.loadingCities = false;
        
        // Fallback to empty array
        this.cities = [];
      }
    });
  }
  
  isFieldInvalid(fieldName: string): boolean {
    const field = this.addressForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }
  
  isDateAndAddressValid(): boolean {
    return this.pickupDateControl.valid && this.addressForm.valid;
  }
  
  // Interface handling methods
  selectPackage(packageId: number): void {
    this.selectedPackageId = packageId;
  }
  
  getSelectedPackageInfo(): ServicePackage | null {
    if (!this.selectedPackageId) {
      return null;
    }
    
    // Find the package in available packages
    const packageInfo = this.availablePackages.find(p => p.id === this.selectedPackageId);
    if (packageInfo) {
      return packageInfo;
    }
    
    return null;
  }
  
  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }
  
  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  
  // Switch to the next bicycle in the list
  nextBicycle(): void {
    if (this.currentBicycleIndex < this.selectedBicycles.length - 1) {
      this.currentBicycleIndex++;
      this.bicycle = this.selectedBicycles[this.currentBicycleIndex];
    }
  }
  
  // Switch to the previous bicycle in the list
  prevBicycle(): void {
    if (this.currentBicycleIndex > 0) {
      this.currentBicycleIndex--;
      this.bicycle = this.selectedBicycles[this.currentBicycleIndex];
    }
  }
  
  cancel(): void {
    this.goBack();
  }
  
  goBack(): void {
    this.router.navigate(['/bicycles']);
  }
  
  goToMain(): void {
    this.router.navigate(['/welcome']);
  }
  
  goToServiceOrders(): void {
    this.router.navigate(['/service-appointments']);
  }
  
  getBicyclePhotoUrl(bicycleId: number): string {
    return this.bicycleService.getBicyclePhotoUrl(bicycleId);
  }
  
  handleImageError(): void {
    if (this.bicycle) {
      this.bicycle.hasPhoto = false;
    }
  }
  
  submitOrder(): void {
    if (!this.bicycle || !this.selectedPackageId || !this.pickupDateControl.valid || !this.addressForm.valid || !this.termsAcceptedControl.value) {
      this.notificationService.error('Proszę wypełnić wszystkie wymagane pola');
      return;
    }
    
    this.isSubmitting = true;
    
    // Tworzenie listy ID rowerów
    // Możemy użyć albo wszystkich wybranych rowerów, albo tylko aktualnie wyświetlanego
    const bicycleIds = this.selectedBicycles.map(bike => bike.id);
    
    // Alternatywnie, jeśli chcemy tylko aktualnie wyświetlany rower:
    // const bicycleIds = [this.bicycle.id];
    
    // Utwórz obiekt zamówienia z listą ID rowerów
    const serviceOrder: CreateServiceOrderRequest = {
      bicycleIds: bicycleIds,  // Lista ID zamiast pojedynczego ID
      servicePackageId: this.selectedPackageId,
      pickupDate: this.pickupDateControl.value,
      pickupAddress: `${this.addressForm.get('street')?.value}, ${this.addressForm.get('city')?.value}`,
      additionalNotes: this.addressForm.get('additionalNotes')?.value || undefined
    };
    
    console.log('Sending service order with bicycle IDs:', serviceOrder);
    
    // Wysyłanie żądania
    this.serviceOrderService.createServiceOrder(serviceOrder).subscribe({
      next: (response: {orderId: string}) => {
        this.isSubmitting = false;
        this.orderId = response.orderId;
        this.currentStep = 4; // Go to confirmation
        this.notificationService.success('Zamówienie zostało złożone pomyślnie!');
        
        // Clear the selection after successful order
        this.bicycleSelectionService.clearSelection();
      },
      error: (error: any) => {
        this.isSubmitting = false;
        console.error('Error creating service order:', error);
        this.notificationService.error('Wystąpił błąd podczas składania zamówienia. Spróbuj ponownie.');
      }
    });
  }
}