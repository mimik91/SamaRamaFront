import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../admin-service';
import { NotificationService } from '../../core/notification.service';
import { ServiceOrder } from '../../service-orders/service-order.model';

@Component({
  selector: 'app-admin-service-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-service-orders.component.html',
  styleUrls: ['./admin-service-orders.component.css']
})
export class AdminServiceOrdersComponent implements OnInit {
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  serviceOrders: ServiceOrder[] = [];
  displayedOrders: ServiceOrder[] = [];
  loading = true;
  error: string | null = null;
  selectedStatus: string = '';

  constructor() { }

  ngOnInit(): void {
    this.loadServiceOrders();
  }

  loadServiceOrders(): void {
    this.loading = true;
    this.error = null;
    
    this.adminService.getAllServiceOrders().subscribe({
      next: (orders) => {
        this.serviceOrders = orders;
        this.displayedOrders = [...this.serviceOrders];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading service orders:', err);
        this.error = 'Nie udało się załadować zamówień serwisowych. Spróbuj ponownie później.';
        this.loading = false;
        this.notificationService.error(this.error);
      }
    });
  }

  filterByStatus(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatus = select.value;
    
    if (!this.selectedStatus) {
      this.displayedOrders = [...this.serviceOrders];
    } else {
      this.displayedOrders = this.serviceOrders.filter(order => order.status === this.selectedStatus);
    }
  }

  // Helper methods for displaying status
  getStatusLabel(status: string): string {
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
  
  getStatusClass(status: string): string {
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

  viewOrderDetails(orderId: number): void {
    this.notificationService.info(`Szczegóły zamówienia ${orderId} - funkcja w przygotowaniu`);
  }

  updateOrderStatus(orderId: number): void {
    this.notificationService.info(`Edycja statusu zamówienia ${orderId} - funkcja w przygotowaniu`);
  }

  getClientIdentifier(order: ServiceOrder): string {
    if (order.client?.email) {
      return order.client.email;
    }
    if (order.bicycle?.owner?.email) {
      return order.bicycle.owner.email;
    }
    return 'Nieznany';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  
  formatDateOnly(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
           ' ' + date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  }

  formatPrice(price: number): string {
    return price.toFixed(2) + ' zł';
  }
}