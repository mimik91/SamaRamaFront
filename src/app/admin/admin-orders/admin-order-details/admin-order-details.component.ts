import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/notification.service';
import { ServiceOrder } from '../../../service-orders/service-order.model';
import { ServicePackageService } from '../../../service-package/service-package.service';
import { ServicePackage } from '../../../service-package/service-package.model';
import { environment } from '../../../core/api-config';

@Component({
  selector: 'app-admin-order-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-order-details.component.html',
  styleUrls: ['./admin-order-details.component.css']
})
export class AdminOrderDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private servicePackageService = inject(ServicePackageService);

  // Order data
  serviceOrder: ServiceOrder | null = null;
  availablePackages: ServicePackage[] = [];

  // UI states
  loading = true;
  isEditing = false;
  isSaving = false;
  error: string | null = null;

  // Form
  orderForm: FormGroup;

  constructor() {
    this.orderForm = this.fb.group({
      pickupDate: ['', Validators.required],
      pickupAddress: ['', Validators.required],
      servicePackageId: [null, Validators.required],
      additionalNotes: ['']
    });
  }

  ngOnInit(): void {
    // Load service packages for the dropdown
    this.loadServicePackages();

    // Get order ID from route params
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrderDetails(+orderId);
    } else {
      this.error = 'Brak ID zamówienia';
      this.loading = false;
    }
    
    // Log when values change in the form
    this.orderForm.valueChanges.subscribe(values => {
      console.log('Form values changed:', values);
    });
  }

  private loadServicePackages(): void {
    this.servicePackageService.getAllPackages().subscribe({
      next: (packages) => {
        this.availablePackages = packages;
        console.log('Loaded service packages:', packages);
      },
      error: (err) => {
        console.error('Error loading service packages:', err);
        this.notificationService.error('Nie udało się załadować pakietów serwisowych');
      }
    });
  }

  private loadOrderDetails(orderId: number): void {
    this.loading = true;
    this.error = null;
    
    // Ensure service packages are loaded
    if (this.availablePackages.length === 0) {
      this.loadServicePackages();
    }

    this.http.get<ServiceOrder>(`${environment.apiUrl}/service-orders/${orderId}`).subscribe({
      next: (order) => {
        console.log('Loaded order details:', order); // Added logging
        this.serviceOrder = order;
        this.loading = false;
      },
      error: (err) => {
        console.error(`Error loading order details for ID ${orderId}:`, err);
        this.error = 'Nie udało się załadować szczegółów zamówienia';
        this.loading = false;
        this.notificationService.error(this.error);
      }
    });
  }

  // Helper method to safely get service package ID from various possible sources
  getServicePackageIdFromOrder(order: ServiceOrder | null): number | null {
    if (!order) return null;
    
    // Try all possible properties where service package ID might be stored
    if (order.servicePackageId) {
      return order.servicePackageId;
    }
    
    if (order.servicePackage?.id) {
      return order.servicePackage.id;
    }
    
    // If we have a service package name or code, try to find the matching package
    if (order.servicePackageName || order.servicePackageCode) {
      const packageName = order.servicePackageName || order.servicePackageCode;
      const matchingPackage = this.availablePackages.find(p => 
        p.name === packageName || p.code === order.servicePackageCode
      );
      if (matchingPackage) {
        return matchingPackage.id;
      }
    }
    
    return null;
  }

  startEditing(): void {
    if (!this.serviceOrder) return;

    // More reliable way to get the package ID
    let packageId = this.getServicePackageIdFromOrder(this.serviceOrder);
    
    console.log('Setting service package ID:', packageId);

    this.orderForm.patchValue({
      pickupDate: this.formatDateForInput(this.serviceOrder.pickupDate),
      pickupAddress: this.serviceOrder.pickupAddress,
      servicePackageId: packageId,
      additionalNotes: this.serviceOrder.additionalNotes || ''
    });

    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
  }

  saveOrder(): void {
    if (this.orderForm.invalid || !this.serviceOrder) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.orderForm.controls).forEach(key => {
        this.orderForm.get(key)?.markAsTouched();
      });
      
      this.notificationService.warning('Wypełnij poprawnie wszystkie wymagane pola');
      return;
    }

    this.isSaving = true;

    const updatedOrder = {
      pickupDate: this.orderForm.value.pickupDate,
      pickupAddress: this.orderForm.value.pickupAddress,
      servicePackageId: this.orderForm.value.servicePackageId,
      additionalNotes: this.orderForm.value.additionalNotes || '',
      bicycleIds: this.serviceOrder.bicycleId ? [this.serviceOrder.bicycleId] : 
               (this.serviceOrder.bicycle?.id ? [this.serviceOrder.bicycle.id] : [])
    };

    console.log('Saving updated order:', updatedOrder);

    this.http.put(`${environment.apiUrl}/service-orders/${this.serviceOrder.id}`, updatedOrder).subscribe({
      next: () => {
        this.notificationService.success('Zamówienie zostało zaktualizowane');
        this.isEditing = false;
        this.isSaving = false;
        
        if (this.serviceOrder && this.serviceOrder.id) {
          this.loadOrderDetails(this.serviceOrder.id);
        }
      },
      error: (err) => {
        console.error('Error updating order:', err);
        this.notificationService.error('Wystąpił błąd podczas aktualizacji zamówienia');
        this.isSaving = false;
      }
    });
  }

  cancelOrder(): void {
    if (!this.serviceOrder || !this.serviceOrder.id) return;

    if (confirm('Czy na pewno chcesz anulować to zamówienie? Ta operacja jest nieodwracalna.')) {
      this.http.delete(`${environment.apiUrl}/service-orders/${this.serviceOrder.id}`).subscribe({
        next: () => {
          this.notificationService.success('Zamówienie zostało anulowane');
          this.router.navigate(['/service-orders']);
        },
        error: (err) => {
          console.error('Error cancelling order:', err);
          this.notificationService.error('Wystąpił błąd podczas anulowania zamówienia');
        }
      });
    }
  }

  getPackageName(packageId: number | null): string {
    if (!packageId) return 'Nie określono';
    
    const foundPackage = this.availablePackages.find(p => p.id === packageId);
    return foundPackage ? foundPackage.name : 'Pakiet #' + packageId;
  }

  // Helper methods for formatting
  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatDateTime(dateString: string | undefined | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
           ' ' + date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  }

  formatPrice(price: number | undefined | null): string {
    if (price === undefined || price === null) return '0.00 zł';
    return price.toFixed(2) + ' zł';
  }

  private formatDateForInput(dateString: string | undefined | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  getStatusLabel(status: string | undefined | null): string {
    if (!status) return 'Nieznany';
    
    switch (status) {
      case 'PENDING': return 'Oczekujące';
      case 'CONFIRMED': return 'Potwierdzone';
      case 'PICKED_UP': return 'Odebrane';
      case 'IN_SERVICE': return 'W serwisie';
      case 'COMPLETED': return 'Zakończone';
      case 'DELIVERED': return 'Dostarczone';
      case 'CANCELLED': return 'Anulowane';
      default: return status;
    }
  }

  getStatusClass(status: string | undefined | null): string {
    if (!status) return '';
    
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'CONFIRMED': return 'status-confirmed';
      case 'PICKED_UP': return 'status-picked-up';
      case 'IN_SERVICE': return 'status-in-service';
      case 'COMPLETED': return 'status-completed';
      case 'DELIVERED': return 'status-delivered';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.orderForm.get(fieldName);
    return control ? control.invalid && control.touched : false;
  }

  goBack(): void {
    this.router.navigate(['/service-orders']);
  }
}