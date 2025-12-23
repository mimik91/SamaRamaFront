import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminOrdersService } from '../admin-orders.service';
import { NotificationService } from '../../../core/notification.service';
import { 
  TransportOrder, 
  TransportOrderRequestDto,
  transportOrderToRequestDto 
} from '../../../core/models/transport-order.models';

@Component({
  selector: 'app-admin-order-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-order-details.component.html',
  styleUrls: ['./admin-order-details.component.css']
})
export class AdminOrderDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminOrdersService = inject(AdminOrdersService);
  private notificationService = inject(NotificationService);

  order: TransportOrder | null = null;
  loading = true;
  error: string | null = null;
  editMode = false;

  // Edit form data
  editForm: TransportOrderRequestDto | null = null;

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrderDetails(+orderId);
    } else {
      this.error = 'Brak ID zamówienia';
      this.loading = false;
    }
  }

  loadOrderDetails(orderId: number): void {
    this.loading = true;
    this.error = null;

    this.adminOrdersService.getTransportOrderDetails(orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.initEditForm();
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

  initEditForm(): void {
    if (this.order) {
      this.editForm = transportOrderToRequestDto(this.order);
    }
  }

  enableEditMode(): void {
    this.editMode = true;
  }

  cancelEdit(): void {
    this.editMode = false;
    this.initEditForm();
  }

  saveChanges(): void {
    if (!this.order || !this.editForm) return;

    // Walidacja przed wysłaniem
    if (!this.validateEditForm()) {
      return;
    }

    this.adminOrdersService.updateTransportOrder(this.order.id, this.editForm).subscribe({
      next: () => {
        this.notificationService.success('Zamówienie zostało zaktualizowane');
        this.editMode = false;
        this.loadOrderDetails(this.order!.id);
      },
      error: (err) => {
        console.error('Error updating order:', err);
        this.notificationService.error('Nie udało się zaktualizować zamówienia');
      }
    });
  }

  validateEditForm(): boolean {
    if (!this.editForm) return false;

    // Podstawowa walidacja
    if (!this.editForm.email || !this.editForm.email.includes('@')) {
      this.notificationService.error('Nieprawidłowy adres email');
      return false;
    }

    if (!this.editForm.phone || this.editForm.phone.length < 9) {
      this.notificationService.error('Nieprawidłowy numer telefonu');
      return false;
    }

    if (!this.editForm.pickupStreet || !this.editForm.pickupBuildingNumber) {
      this.notificationService.error('Adres odbioru jest niepełny');
      return false;
    }

    if (!this.editForm.pickupCity || !this.editForm.pickupPostalCode) {
      this.notificationService.error('Miasto i kod pocztowy są wymagane');
      return false;
    }

    if (this.editForm.transportPrice <= 0) {
      this.notificationService.error('Cena transportu musi być większa niż 0');
      return false;
    }

    return true;
  }

  deleteOrder(): void {
    if (!this.order) return;

    if (confirm(`Czy na pewno chcesz usunąć zamówienie ${this.order.id}? Ta operacja jest nieodwracalna.`)) {
      this.adminOrdersService.deleteTransportOrder(this.order.id).subscribe({
        next: () => {
          this.notificationService.success('Zamówienie zostało usunięte');
          this.router.navigate(['/admin-orders']);
        },
        error: (err) => {
          console.error('Error deleting order:', err);
          this.notificationService.error('Nie udało się usunąć zamówienia');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin-orders']);
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

  getStatusDisplayName(status: string): string {
    return this.adminOrdersService.getStatusDisplayName(status);
  }

  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'PENDING': 'status-pending',
      'CONFIRMED': 'status-confirmed',
      'TO_PICK_UP': 'status-to-pick-up',
      'PICKED_UP': 'status-picked-up',
      'ON_THE_WAY': 'status-on-the-way',
      'DELIVERED': 'status-delivered',
      'RETURNING': 'status-returning',
      'COMPLETED': 'status-completed',
      'CANCELLED': 'status-cancelled'
    };
    return statusClasses[status] || '';
  }

  canEditOrder(): boolean {
    return this.order ? this.adminOrdersService.canEditOrder(this.order) : false;
  }

  canDeleteOrder(): boolean {
    return this.order ? this.adminOrdersService.canDeleteOrder(this.order) : false;
  }
}