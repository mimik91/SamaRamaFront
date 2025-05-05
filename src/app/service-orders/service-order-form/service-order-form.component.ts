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
import { ServiceSlotService, ServiceSlotAvailability, SlotAvailabilityCheck } from '../../service-slots/service-slot.service';

// Import our custom date filter, formats and adapter
import { CustomDatePickerFilter, CUSTOM_DATE_FORMATS } from '../custom-date-picker-filter';
import { CustomDateAdapter } from '../custom-date-adapter';
import { map, of, switchMap } from 'rxjs';

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
  // Używamy naszej implementacji filtra dostępności
  advancedDateFilter = this.createDateFilter();
  
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
  private serviceSlotService = inject(ServiceSlotService);
  
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
  
  // Slot availability data
  slotAvailabilities: ServiceSlotAvailability[] = [];
  loadingSlots = true;
  slotAvailabilityError: string | null = null;
  
  // Pickup date with validation for day of week and slot availability
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
  
  // Tworzenie funkcji filtrującej daty dla datepickera
  private createDateFilter(): (date: Date | null) => boolean {
    return (date: Date | null): boolean => {
      if (!date) return false;
      
      // Najpierw używamy naszego podstawowego filtra dni tygodnia
      if (!CustomDatePickerFilter.dateFilter(date)) {
        return false;
      }
      
      // Następnie sprawdzamy dostępność slotów
      const dateString = this.formatDateToISOString(date);
      
      // Jeśli mamy już dane o dostępności, sprawdzamy je
      const availability = this.slotAvailabilities.find(a => a.date === dateString);
      if (availability) {
        // Sprawdź czy liczba rowerów nie przekracza dostępnej liczby miejsc
        return availability.isAvailable && 
               availability.availableBikes >= this.selectedBicycles.length &&
               this.selectedBicycles.length <= availability.maxBikesPerOrder;
      }
      
      // Domyślnie pozwalamy na wybór daty, a później zweryfikujemy przy próbie przejścia dalej
      return true;
    };
  }
  
  // Helper function to convert Date to ISO string (YYYY-MM-DD)
  private formatDateToISOString(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  // Validator checking if the selected date is from Sunday to Thursday
  // and if there are enough available slots
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
    
    // Check if date is in the list of available dates
    const dateString = this.formatDateToISOString(selectedDate);
    const availability = this.slotAvailabilities.find(a => a.date === dateString);
    
    if (availability && !availability.isAvailable) {
      return { noSlots: true };
    }
    
    if (availability && this.selectedBicycles.length > availability.availableBikes) {
      return { notEnoughSlots: {
        available: availability.availableBikes,
        requested: this.selectedBicycles.length
      }};
    }
    
    if (availability && this.selectedBicycles.length > availability.maxBikesPerOrder) {
      return { exceedsMaxBikesPerOrder: {
        maxBikesPerOrder: availability.maxBikesPerOrder,
        requested: this.selectedBicycles.length
      }};
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
    
    // Load slot availability for the next 30 days
    this.loadSlotAvailability();
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
  
  private loadSlotAvailability(): void {
    this.loadingSlots = true;
    this.slotAvailabilityError = null;
    
    const today = new Date();
    const formattedDate = this.formatDateToISOString(today);
    
    this.serviceSlotService.getNextDaysAvailability(formattedDate, 30).subscribe({
      next: (availabilities) => {
        this.slotAvailabilities = availabilities;
        this.loadingSlots = false;
        
        // Po załadowaniu dostępności, odśwież filtr datepickera
        this.advancedDateFilter = this.createDateFilter();
      },
      error: (error) => {
        console.error('Error loading slot availability:', error);
        this.slotAvailabilityError = 'Nie udało się załadować informacji o dostępności terminów.';
        this.loadingSlots = false;
      }
    });
  }
  
  // Dodatkowa metoda do sprawdzania dostępności po wybraniu daty
  checkAvailabilityForSelectedDate(): void {
    if (!this.pickupDateControl.value) return;
    
    const selectedDate = new Date(this.pickupDateControl.value);
    const dateString = this.formatDateToISOString(selectedDate);
    
    this.serviceSlotService.checkAvailability(dateString, this.selectedBicycles.length)
      .subscribe({
        next: (result: SlotAvailabilityCheck) => {
          if (!result.available) {
            if (result.reason === 'MAX_BIKES_PER_ORDER_EXCEEDED') {
              this.notificationService.warning(
                `Maksymalna liczba rowerów na jeden dzień to ${result.maxBikesPerOrder}. Rozłóż swoją usługę na kilka dni.`
              );
              this.pickupDateControl.setErrors({
                exceedsMaxBikesPerOrder: {
                  maxBikesPerOrder: result.maxBikesPerOrder,
                  requested: this.selectedBicycles.length
                }
              });
            } else if (result.reason === 'NO_AVAILABLE_SLOTS') {
              this.notificationService.warning(
                `Na wybrany dzień dostępnych jest tylko ${result.availableBikes} miejsc, a próbujesz zamówić serwis dla ${this.selectedBicycles.length} rowerów.`
              );
              this.pickupDateControl.setErrors({
                notEnoughSlots: {
                  available: result.availableBikes,
                  requested: this.selectedBicycles.length
                }
              });
            }
          }
        },
        error: (error) => {
          console.error('Error checking availability:', error);
          this.notificationService.error('Wystąpił błąd podczas sprawdzania dostępności terminów.');
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
    if (this.currentStep === 1 && !this.selectedPackageId) {
      this.notificationService.warning('Wybierz pakiet serwisowy aby kontynuować.');
      return;
    }
    
    if (this.currentStep === 2) {
      // Przed przejściem do podsumowania, dodatkowe sprawdzenie dostępności
      this.checkAvailabilityForSelectedDate();
      
      if (this.pickupDateControl.invalid || this.addressForm.invalid) {
        this.notificationService.warning('Wypełnij poprawnie wszystkie wymagane pola.');
        return;
      }
    }
    
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
    
    // Final availability check before submission
    const selectedDate = new Date(this.pickupDateControl.value);
    const dateString = this.formatDateToISOString(selectedDate);
    
    this.serviceSlotService.checkAvailability(dateString, this.selectedBicycles.length)
      .pipe(
        switchMap((result: SlotAvailabilityCheck) => {
          if (!result.available) {
            if (result.reason === 'MAX_BIKES_PER_ORDER_EXCEEDED') {
              this.notificationService.error(
                `Maksymalna liczba rowerów na jeden dzień to ${result.maxBikesPerOrder}. Rozłóż swoją usługę na kilka dni.`
              );
              return of(null);
            } else if (result.reason === 'NO_AVAILABLE_SLOTS') {
              this.notificationService.error(
                `Na wybrany dzień dostępnych jest tylko ${result.availableBikes} miejsc, a próbujesz zamówić serwis dla ${this.selectedBicycles.length} rowerów.`
              );
              return of(null);
            }
            return of(null);
          }
          
          // If available, proceed with order submission
          this.isSubmitting = true;
          
          // Tworzenie listy ID rowerów
          const bicycleIds = this.selectedBicycles.map(bike => bike.id);
          
          // Utwórz obiekt zamówienia z listą ID rowerów
          const serviceOrder: CreateServiceOrderRequest = {
            bicycleIds: bicycleIds,  // Lista ID zamiast pojedynczego ID
            servicePackageId: this.selectedPackageId === null ? undefined : this.selectedPackageId,
            pickupDate: this.pickupDateControl.value,
            pickupAddress: `${this.addressForm.get('street')?.value}, ${this.addressForm.get('city')?.value}`,
            additionalNotes: this.addressForm.get('additionalNotes')?.value || undefined
          };
          
          console.log('Sending service order with bicycle IDs:', serviceOrder);
          
          // Return the observable from service
          return this.serviceOrderService.createServiceOrder(serviceOrder);
        })
      )
      .subscribe({
        next: (response: any) => {
          if (!response) return; // This means availability check failed
          
          this.isSubmitting = false;
          this.orderId = response.orderId;
          this.currentStep = 4; // Go to confirmation
          this.notificationService.success('Zamówienie zostało złożone pomyślnie!');
          
          // Clear the selection after successful order
          this.bicycleSelectionService.clearSelection();
          
          // Clear the slot availability cache to refresh data for future orders
          this.serviceSlotService.clearCache();
        },
        error: (error: any) => {
          this.isSubmitting = false;
          console.error('Error creating service order:', error);
          this.notificationService.error('Wystąpił błąd podczas składania zamówienia. Spróbuj ponownie.');
        }
      });
  }
}