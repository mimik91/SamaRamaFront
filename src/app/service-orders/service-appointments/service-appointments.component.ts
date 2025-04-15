import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ServiceOrderService } from '../service-orders.service';
import { NotificationService } from '../../core/notification.service';
import { ServiceOrder } from '../service-order.model';

@Component({
  selector: 'app-service-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-appointments.component.html',
  styleUrls: ['./service-appointments.component.css']
})
export class ServiceAppointmentsComponent implements OnInit {
  private serviceOrderService = inject(ServiceOrderService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  serviceOrders: ServiceOrder[] = [];
  loading = true;
  error: string | null = null;

  constructor() { }

  ngOnInit(): void {
    this.loadServiceOrders();
  }

  loadServiceOrders(): void {
    this.loading = true;
    this.error = null;
    
    this.serviceOrderService.getUserServiceOrders().subscribe({
      next: (orders) => {
        this.serviceOrders = orders;
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
    this.router.navigate(['/service-appointments', orderId]);
  }

  cancelOrder(orderId: number, event: Event): void {
    event.stopPropagation();
    
    if (confirm('Czy na pewno chcesz anulować to zamówienie?')) {
      this.serviceOrderService.cancelServiceOrder(orderId).subscribe({
        next: () => {
          this.notificationService.success('Zamówienie zostało anulowane');
          // Refresh the list
          this.loadServiceOrders();
        },
        error: (err) => {
          console.error('Error cancelling service order:', err);
          this.notificationService.error('Nie udało się anulować zamówienia');
        }
      });
    }
  }

  isOrderCancellable(status: string): boolean {
    // Only PENDING and CONFIRMED orders can be cancelled
    return status === 'PENDING' || status === 'CONFIRMED';
  }

  formatDate(dateString: string): string {
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

  orderNewService(): void {
    // Redirect to bikes list to select a bike for service
    this.router.navigate(['/bicycles']);
  }
}