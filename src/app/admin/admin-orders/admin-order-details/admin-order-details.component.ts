import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminOrdersService, ServiceAndTransportOrder } from '../admin-orders.service';
import { NotificationService } from '../../../core/notification.service';

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
  private adminOrdersService = inject(AdminOrdersService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  // Data
  order: ServiceAndTransportOrder | null = null;
  
  // State
  loading = true;
  saving = false;
  isEditing = false;
  error: string | null = null;
  
  // Forms
  orderForm: FormGroup;
  statusForm: FormGroup;

  constructor() {
    this.orderForm = this.fb.group({
      // Client data (required but not modified much)
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      
      // Modifiable fields
      pickupDate: ['', Validators.required],
      pickupStreet: ['', Validators.required],
      pickupBuildingNumber: ['', Validators.required],
      pickupApartmentNumber: [''],
      pickupCity: ['', Validators.required],
      pickupPostalCode: [''],
      
      // Bicycle data (modifiable)
      bicycleBrand: [''],
      bicycleModel: [''],
      
      // Transport data
      transportPrice: [0, [Validators.required, Validators.min(0)]],
      transportNotes: [''],
      targetServiceId: [null],
      
      // Additional notes
      additionalNotes: [''],
      serviceNotes: ['']
    });

    this.statusForm = this.fb.group({
      status: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrderDetails(+orderId);
    } else {
      this.error = 'Brak ID zamówienia';
      this.loading = false;
    }
  }

  private loadOrderDetails(orderId: number): void {
    this.loading = true;
    this.error = null;

    this.adminOrdersService.getOrderDetails(orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.populateForm();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading order details:', err);
        this.error = 'Nie udało się załadować szczegółów zamówienia';
        this.loading = false;
        this.notificationService.error(this.error);
      }
    });
  }

  private populateForm(): void {
    if (!this.order) return;

    // Parse pickup address
    const pickupAddressParts = this.parseAddress(this.order.pickupAddress);

    this.orderForm.patchValue({
      // Client data
      email: this.order.clientEmail || '',
      phone: this.order.clientPhone || '',
      
      // Pickup address
      pickupDate: this.formatDateForInput(this.order.pickupDate),
      pickupStreet: pickupAddressParts.street || '',
      pickupBuildingNumber: pickupAddressParts.buildingNumber || '',
      pickupApartmentNumber: pickupAddressParts.apartmentNumber || '',
      pickupCity: pickupAddressParts.city || '',
      pickupPostalCode: pickupAddressParts.postalCode || '',
      
      // Bicycle data
      bicycleBrand: this.order.bicycleBrand || '',
      bicycleModel: this.order.bicycleModel || '',
      
      // Transport data
      transportPrice: this.order.totalPrice || 0,
      transportNotes: '', // This field might not exist in current order
      targetServiceId: this.getTargetServiceIdFromDeliveryAddress(this.order.deliveryAddress),
      
      // Notes
      additionalNotes: this.order.additionalNotes || '',
      serviceNotes: this.order.serviceNotes || ''
    });

    this.statusForm.patchValue({
      status: this.order.status
    });
  }

  private getTargetServiceIdFromDeliveryAddress(deliveryAddress: string): number | null {
    // If delivery address is "SERWIS", it means target service ID is 1 (own service)
    // Otherwise, we need to determine the target service ID based on the address
    // For now, return null for external services, 1 for own service
    return deliveryAddress === 'SERWIS' ? 1 : null;
  }

  private parseAddress(address: string): any {
    if (!address || address === 'SERWIS') {
      return {};
    }

    // Simple address parsing - adjust regex based on your address format
    const parts = address.split(', ');
    const result: any = {};

    if (parts.length >= 1) {
      // First part: street and building number
      const streetPart = parts[0];
      const streetMatch = streetPart.match(/^(.+?)\s+(\d+[a-zA-Z]?)(?:\/(\d+[a-zA-Z]?))?$/);
      
      if (streetMatch) {
        result.street = streetMatch[1];
        result.buildingNumber = streetMatch[2];
        result.apartmentNumber = streetMatch[3] || '';
      } else {
        result.street = streetPart;
      }
    }

    if (parts.length >= 2) {
      // Second part: city and postal code
      const cityPart = parts[1];
      const cityMatch = cityPart.match(/^(.+?)\s+(\d{2}-\d{3})$/);
      
      if (cityMatch) {
        result.city = cityMatch[1];
        result.postalCode = cityMatch[2];
      } else {
        result.city = cityPart;
      }
    }

    return result;
  }

  // === EDITING ===

  startEditing(): void {
    this.isEditing = true;
    this.populateForm();
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.populateForm();
  }

  saveOrder(): void {
    if (!this.order || this.orderForm.invalid) {
      this.markFormGroupTouched(this.orderForm);
      this.notificationService.warning('Wypełnij poprawnie wszystkie wymagane pola');
      return;
    }

    this.saving = true;

    const formValues = this.orderForm.value;
    
    // Create the DTO according to ServiceOrTransportOrderDto structure
    const orderData = {
      // Bicycle data - we'll send the existing bicycle ID and update its brand/model separately if needed
      bicycleIds: this.order.bicycleId ? [this.order.bicycleId] : [],
      
      // If this is a guest order, we need to include bicycle data for update
      bicycles: this.order.clientEmail ? [{
        brand: formValues.bicycleBrand,
        model: formValues.bicycleModel,
        // Add other bicycle fields if needed
      }] : null,
      
      // User/Guest data
      userId: this.order.clientEmail ? null : 1, // Determine based on order type
      email: formValues.email,
      phone: formValues.phone,
      
      // Pickup address data
      pickupAddressId: null, // We're using new address data
      pickupStreet: formValues.pickupStreet,
      pickupBuildingNumber: formValues.pickupBuildingNumber,
      pickupApartmentNumber: formValues.pickupApartmentNumber || null,
      pickupCity: formValues.pickupCity,
      pickupPostalCode: formValues.pickupPostalCode || null,
      pickupLatitude: null,
      pickupLongitude: null,
      
      // Transport data
      pickupDate: formValues.pickupDate,
      transportPrice: formValues.transportPrice,
      transportNotes: formValues.transportNotes || null,
      targetServiceId: formValues.targetServiceId,
      
      // Service data (for service orders)
      serviceNotes: formValues.serviceNotes || null,
      
      // Additional data
      additionalNotes: formValues.additionalNotes || null
    };

    const updateMethod = this.order.orderType === 'SERVICE'
      ? this.adminOrdersService.updateServiceOrder(this.order.id, orderData)
      : this.adminOrdersService.updateTransportOrder(this.order.id, orderData);

    updateMethod.subscribe({
      next: () => {
        this.notificationService.success('Zamówienie zostało zaktualizowane');
        this.saving = false;
        this.isEditing = false;
        this.loadOrderDetails(this.order!.id);
      },
      error: (err) => {
        console.error('Error updating order:', err);
        this.notificationService.error('Wystąpił błąd podczas aktualizacji zamówienia');
        this.saving = false;
      }
    });
  }

  // === STATUS UPDATE ===

  updateStatus(): void {
    if (!this.order || this.statusForm.invalid) {
      this.markFormGroupTouched(this.statusForm);
      return;
    }

    const newStatus = this.statusForm.value.status;
    if (newStatus === this.order.status) {
      this.notificationService.info('Status nie uległ zmianie');
      return;
    }

    const updateMethod = this.order.orderType === 'SERVICE'
      ? this.adminOrdersService.updateServiceOrderStatus(this.order.id, newStatus)
      : this.adminOrdersService.updateTransportOrderStatus(this.order.id, newStatus);

    updateMethod.subscribe({
      next: () => {
        this.notificationService.success(`Status zamówienia został zaktualizowany na: ${this.getStatusDisplayName(newStatus)}`);
        this.loadOrderDetails(this.order!.id);
      },
      error: (err) => {
        console.error('Error updating status:', err);
        this.notificationService.error('Nie udało się zaktualizować statusu zamówienia');
      }
    });
  }

  // === DELETE ===

  deleteOrder(): void {
    if (!this.order) return;

    if (confirm(`Czy na pewno chcesz usunąć zamówienie ${this.order.id}? Ta operacja jest nieodwracalna.`)) {
      const deleteMethod = this.order.orderType === 'SERVICE'
        ? this.adminOrdersService.deleteServiceOrder(this.order.id)
        : this.adminOrdersService.deleteTransportOrder(this.order.id);

      deleteMethod.subscribe({
        next: () => {
          this.notificationService.success(`Zamówienie ${this.order!.id} zostało usunięte`);
          this.router.navigate(['/admin-orders']);
        },
        error: (err) => {
          console.error('Error deleting order:', err);
          this.notificationService.error('Nie udało się usunąć zamówienia');
        }
      });
    }
  }

  // === HELPER METHODS ===

  getStatusDisplayName(status: string): string {
    return this.adminOrdersService.getStatusDisplayName(status);
  }

  getOrderTypeDisplayName(orderType: string): string {
    return this.adminOrdersService.getOrderTypeDisplayName(orderType);
  }

  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'PENDING': 'status-pending',
      'CONFIRMED': 'status-confirmed',
      'PICKED_UP': 'status-picked-up',
      'IN_SERVICE': 'status-in-service',
      'IN_TRANSPORT': 'status-in-transport',
      'COMPLETED': 'status-completed',
      'DELIVERED': 'status-delivered',
      'DELIVERED_TO_SERVICE': 'status-delivered',
      'CANCELLED': 'status-cancelled'
    };

    return statusClasses[status] || '';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(price: number): string {
    return price ? price.toFixed(2) + ' zł' : '0.00 zł';
  }

  private formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const control = formGroup.get(fieldName);
    return control ? control.invalid && control.touched : false;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getAvailableStatuses(): Array<{value: string, label: string}> {
    if (!this.order) return [];
    
    return this.order.orderType === 'SERVICE'
      ? this.adminOrdersService.getServiceOrderStatuses()
      : this.adminOrdersService.getTransportOrderStatuses();
  }

  goBack(): void {
    this.router.navigate(['/admin-orders']);
  }

  canEdit(): boolean {
    return this.order ? this.adminOrdersService.canEditOrder(this.order) : false;
  }

  canDelete(): boolean {
    return this.order ? this.adminOrdersService.canDeleteOrder(this.order) : false;
  }
}