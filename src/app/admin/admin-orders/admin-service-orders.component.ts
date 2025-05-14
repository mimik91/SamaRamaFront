import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../admin-service';
import { NotificationService } from '../../core/notification.service';
import { ServiceOrder } from '../../service-orders/service-order.model';
import { AuthService } from '../../auth/auth.service';


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
  private authService = inject(AuthService);

  serviceOrders: ServiceOrder[] = [];
  displayedOrders: ServiceOrder[] = [];
  loading = true;
  error: string | null = null;
  selectedStatus: string = '';

  constructor() { 
    console.log('AdminServiceOrdersComponent constructor');
  }

  ngOnInit(): void {
    console.log('AdminServiceOrdersComponent initialized');
    this.loadServiceOrders();
  }

  loadServiceOrders(): void {
    console.log('Loading service orders...');
    this.loading = true;
    this.error = null;

    if (!this.authService.isLoggedIn()) {
    this.error = 'Sesja wygasła, prosimy o ponowne zalogowanie.';
    this.loading = false;
    this.notificationService.error(this.error);
    
    // Redirect to login
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
    return;
    }
    
    this.adminService.getAllServiceOrders().subscribe({
      next: (orders) => {
        console.log('Loaded service orders:', orders);
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
    console.log('Filtering by status:', this.selectedStatus);
    
    if (!this.selectedStatus) {
      this.displayedOrders = [...this.serviceOrders];
    } else {
      this.displayedOrders = this.serviceOrders.filter(order => order.status === this.selectedStatus);
    }
    console.log('Filtered orders:', this.displayedOrders.length);
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
    this.router.navigate(['/service-orders', orderId]);
    
    // Use a short timeout to ensure notification displays before navigation
    setTimeout(() => {
      this.router.navigate(['/service-orders', orderId]);
    }, 100);
  }

  updateOrderStatus(orderId: number): void {
    console.log(`updateOrderStatus called with ID: ${orderId}`);
    this.notificationService.info(`Edycja statusu zamówienia ${orderId}`);
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
  
  // For testing event propagation
  onRowClick(orderId: number): void {
    console.log(`Row clicked for order ID: ${orderId}`);
  }
}