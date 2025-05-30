import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminOrdersService, ServiceAndTransportOrder } from '../admin-orders.service';
import { NotificationService } from '../../../core/notification.service';
import { ServicePackageService } from '../../../service-package/service-package.service';
import { ServicePackage } from '../../../service-package/service-package.model';

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
  private servicePackageService = inject(ServicePackageService);
  private fb = inject(FormBuilder);

  // Data
  order: ServiceAndTransportOrder | null = null;
  availablePackages: ServicePackage[] = [];
  
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
      pickupDate: ['', Validators.required],
      pickupAddress: ['', Validators.required],
      deliveryAddress: [''],
      servicePackageId: [null],
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
    
    this.loadServicePackages();
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

  private loadServicePackages(): void {
    this.servicePackageService.getAllPackages().subscribe({
      next: (packages) => {
        this.availablePackages = packages;
      },
      error: (err) => {
        console.error('Error loading service packages:', err);
      }
    });
  }

  private populateForm(): void {
    if (!this.order) return;

    this.orderForm.patchValue({
      pickupDate: this.formatDateForInput(this.order.pickupDate),
      pickupAddress: this.order.pickupAddress,
      deliveryAddress: this.order.deliveryAddress !== 'SERWIS' ? this.order.deliveryAddress : '',
      servicePackageId: this.getServicePackageId(),
      additionalNotes: this.order.additionalNotes || '',
      serviceNotes: this.order.serviceNotes || ''
    });

    this.statusForm.patchValue({
      status: this.order.status
    });
  }

  private getServicePackageId(): number | null {
    if (!this.order || this.order.orderType !== 'SERVICE') return null;
    
    // Try to find package by code
    if (this.order.servicePackageCode) {
      const pkg = this.availablePackages.find(p => p.code === this.order!.servicePackageCode);
      if (pkg) return pkg.id;
    }
    
    return null;
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

    const orderData = {
      pickupDate: this.orderForm.value.pickupDate,
      pickupAddress: this.orderForm.value.pickupAddress,
      deliveryAddress: this.orderForm.value.deliveryAddress || undefined,
      servicePackageId: this.orderForm.value.servicePackageId || undefined,
      additionalNotes: this.orderForm.value.additionalNotes || '',
      serviceNotes: this.orderForm.value.serviceNotes || '',
      bicycleIds: this.order.bicycleId ? [this.order.bicycleId] : []
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

  getPackageName(packageId: number | null): string {
    if (!packageId) return 'Nie określono';
    
    const foundPackage = this.availablePackages.find(p => p.id === packageId);
    return foundPackage ? foundPackage.name : 'Pakiet #' + packageId;
  }

  canEdit(): boolean {
    return this.order ? this.adminOrdersService.canEditOrder(this.order) : false;
  }

  canDelete(): boolean {
    return this.order ? this.adminOrdersService.canDeleteOrder(this.order) : false;
  }
}