// src/app/service-orders/service-order-form/service-order-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// Angular Material imports
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { 
  FormBuilder, 
  FormControl, 
  FormGroup, 
  ReactiveFormsModule, 
  ValidationErrors,
  Validators 
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BicycleService } from '../../bicycles/bicycle.service';
import { Bicycle } from '../../bicycles/bicycle.model';
import { CreateServiceOrderRequest } from '../service-order.model';
import { ServiceOrderService } from '../service-orders.service';
import { NotificationService } from '../../core/notification.service';
import { ServicePackageService } from '../../service-package/service-package.service';
import { ServicePackage } from '../../service-package/service-package.model';

// Import our custom date filter and formats
import { CustomDatePickerFilter, CUSTOM_DATE_FORMATS } from '../custom-date-picker-filter';
import { MAT_DATE_FORMATS } from '@angular/material/core';

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
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS }
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bicycleService = inject(BicycleService);
  private serviceOrderService = inject(ServiceOrderService);
  private notificationService = inject(NotificationService);
  private servicePackageService = inject(ServicePackageService);
  
  // Bicycle data
  bicycleId!: number;
  bicycle: Bicycle | null = null;
  
  // Form controls
  currentStep = 1;
  selectedPackageId: number | null = null;
  
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
  
  ngOnInit(): void {
    // Get bicycle ID from URL parameters
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.bicycleId = +id;
        this.loadBicycle(this.bicycleId);
      } else {
        this.loading = false;
      }
    });
    
    // Load service packages
    this.loadServicePackages();
  }
  
  private loadBicycle(id: number): void {
    this.bicycleService.getBicycle(id).subscribe({
      next: (bicycle) => {
        this.bicycle = bicycle;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bicycle:', error);
        this.notificationService.error('Failed to load bicycle data');
        this.bicycle = null;
        this.loading = false;
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
  
  // Validator checking if the selected date is from Sunday to Thursday
  private dateValidator(control: FormControl): ValidationErrors | null {
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
      this.notificationService.error('Please ensure all fields are filled correctly');
      return;
    }
    
    this.isSubmitting = true;
    
    // Create order object
    const serviceOrder: CreateServiceOrderRequest = {
      bicycleId: this.bicycle.id,
      servicePackageId: this.selectedPackageId,
      pickupDate: this.pickupDateControl.value,
      pickupAddress: `${this.addressForm.get('street')?.value}, ${this.addressForm.get('city')?.value}`,
      additionalNotes: this.addressForm.get('additionalNotes')?.value || undefined
    };
    
    // Send order to API
    this.serviceOrderService.createServiceOrder(serviceOrder).subscribe({
      next: (response: {orderId: string}) => {
        this.isSubmitting = false;
        this.orderId = response.orderId;
        this.currentStep = 4; // Go to confirmation
        this.notificationService.success('Order was placed successfully!');
      },
      error: (error: any) => {
        this.isSubmitting = false;
        console.error('Error creating service order:', error);
        this.notificationService.error('An error occurred while placing the order. Please try again.');
      }
    });
  }
}