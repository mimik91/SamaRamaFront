// service-appointments.component.ts
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
        // Sortuj zamówienia - anulowane na końcu, reszta chronologicznie
        this.serviceOrders = this.sortOrders(orders);
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

  // Nowa metoda sortowania zamówień
  private sortOrders(orders: ServiceOrder[]): ServiceOrder[] {
    return orders.sort((a, b) => {
      // Najpierw sprawdź status - anulowane idą na koniec
      const aIsCancelled = a.status === 'CANCELLED';
      const bIsCancelled = b.status === 'CANCELLED';
      
      if (aIsCancelled && !bIsCancelled) return 1;  // a (anulowane) idzie po b
      if (!aIsCancelled && bIsCancelled) return -1; // b (anulowane) idzie po a
      
      // Jeśli oba mają ten sam typ statusu (oba anulowane lub oba aktywne),
      // sortuj chronologicznie (najnowsze najpierw)
      const dateA = new Date(a.orderDate).getTime();
      const dateB = new Date(b.orderDate).getTime();
      return dateB - dateA;
    });
  }

  // Nowa metoda do wyświetlania typu zamówienia
  getOrderTypeDisplayName(orderType: string | undefined): string {
    switch (orderType) {
      case 'SERVICE': return 'Zamówienie serwisowe';
      case 'TRANSPORT': return 'Zamówienie transportowe';
      case undefined:
      case null:
        return 'Zamówienie serwisowe'; // Domyślnie serwisowe dla kompatybilności
      default: return `Zamówienie #${orderType}`;
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

  // Sprawdź czy zamówienie jest anulowane (do stylowania)
  isOrderCancelled(status: string): boolean {
    return status === 'CANCELLED';
  }

  // Zaktualizowana metoda - używa bicycleDescription z backendu
  getBicycleDisplayName(order: any): string {
    // Najpierw sprawdź czy mamy bicycleDescription z backendu
    if (order.bicycleDescription) {
      return order.bicycleDescription;
    }

    // Fallback do starych pól
    if (order.bicycleBrand || order.bicycleModel) {
      const brand = order.bicycleBrand || '';
      const model = order.bicycleModel || '';
      return brand + (model ? ' ' + model : '');
    }
    
    // Fallback do bicycle object if it exists
    if (order.bicycle && (order.bicycle.brand || order.bicycle.model)) {
      const brand = order.bicycle.brand || '';
      const model = order.bicycle.model || '';
      return brand + (model ? ' ' + model : '');
    }
    
    return 'Nie określono';
  }
  
  // Get service package display name
  getServicePackageDisplayName(order: any): string {
    if (order.servicePackageName) {
      return order.servicePackageName;
    }
    
    if (order.servicePackageCode) {
      return order.servicePackageCode;
    }
    
    // Fallback to servicePackage object if it exists
    if (order.servicePackage && order.servicePackage.name) {
      return order.servicePackage.name;
    }
    
    return 'Nie określono';
  }

  // Nowa metoda do pobierania totalPrice
  getTotalPrice(order: any): number {
    // Preferuj totalPrice z backendu
    if (order.totalPrice !== undefined && order.totalPrice !== null) {
      return order.totalPrice;
    }
    
    // Fallback do starego pola price
    if (order.price !== undefined && order.price !== null) {
      return order.price;
    }
    
    return 0;
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

  formatPrice(price: number | undefined | null): string {
    return (price ?? 0).toFixed(2) + ' zł';
  }

  orderNewService(): void {
    // Redirect to bikes list to select a bike for service
    this.router.navigate(['/bicycles']);
  }
}