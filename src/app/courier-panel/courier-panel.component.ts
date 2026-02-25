import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourierService } from './courier-service';
import { CourierOrder } from '../shared/models/courier.models';
import { NotificationService } from '../core/notification.service';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-courier-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './courier-panel.component.html',
  styleUrls: ['./courier-panel.component.css']
})
export class CourierPanelComponent implements OnInit {
  private courierService = inject(CourierService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  orders: CourierOrder[] = [];
  isLoading = false;
  error = '';
  
  // Sorting state
  sortField: 'pickupDate' | 'brand' | 'status' | 'orderDate' = 'pickupDate';
  sortDirection: 'asc' | 'desc' = 'asc';

  ngOnInit(): void {
    // Check if user has admin privileges
    if (!this.authService.hasAdminPrivileges()) {
      this.notificationService.error('Brak uprawnień do tej strony');
      this.router.navigate(['/']);
      return;
    }

    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = '';
    
    this.courierService.getCourierOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.sortOrders();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading courier orders:', error);
        this.error = 'Błąd podczas ładowania zamówień';
        this.notificationService.error('Błąd podczas ładowania zamówień');
        this.isLoading = false;
      }
    });
  }

  private changeStatus(orderId: number, status: string): void {
    this.courierService.updateOrderStatus(orderId, status).subscribe({
      next: (response) => {
        if (response?.message) {
          this.notificationService.info(response.message);
        } else {
          this.notificationService.success('Status zamówienia został zaktualizowany');
        }
        this.loadOrders();
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        const msg = error?.error?.message;
        if (msg) {
          this.notificationService.info(msg);
        } else {
          this.notificationService.error('Błąd podczas aktualizacji statusu');
        }
      }
    });
  }

  markAsPickedUp(orderId: number): void {
    this.changeStatus(orderId, 'PICKED_UP');
  }

  markAsOnTheWay(orderId: number): void {
    this.changeStatus(orderId, 'ON_THE_WAY');
  }

  markAsDelivered(orderId: number): void {
    this.changeStatus(orderId, 'DELIVERED');
  }

  setSortField(field: 'pickupDate' | 'brand' | 'status' | 'orderDate'): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.sortOrders();
  }

  private sortOrders(): void {
    this.orders.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortField) {
        case 'pickupDate':
          aValue = new Date(a.pickupDate);
          bValue = new Date(b.pickupDate);
          break;
        case 'brand':
          aValue = a.bikeBrand || '';
          bValue = b.bikeBrand || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'orderDate':
          aValue = new Date(a.orderDate);
          bValue = new Date(b.orderDate);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'sort';
    }
    return this.sortDirection === 'asc' ? 'sort-up' : 'sort-down';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'PICKED_UP':
        return 'status-picked-up';
      case 'ON_THE_WAY':
        return 'status-on-the-way';
      case 'ON_THE_WAY_BACK':
        return 'status-returning';
      case 'DELIVERED':
        return 'status-delivered';
      default:
        return 'status-default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Do odbioru';
      case 'PICKED_UP':
        return 'Odebrany';
      case 'ON_THE_WAY':
        return 'W drodze';
      case 'ON_THE_WAY_BACK':
        return 'W drodze powrotnej';
      case 'DELIVERED':
        return 'Dostarczony';
      default:
        return status;
    }
  }

  refresh(): void {
    this.loadOrders();
  }
}