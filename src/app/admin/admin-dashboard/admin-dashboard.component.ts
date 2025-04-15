import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../core/notification.service';
import { AdminService, DashboardStats } from '../admin-service';
import { ServiceOrder } from '../../service-orders/service-order.model';
import { ServiceOrderService } from '../../service-orders/service-orders.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private adminService = inject(AdminService);
  private serviceOrderService = inject(ServiceOrderService);
  
  userName: string = '';
  userRole: string = '';
  
  // Statistics
  totalUsers: number = 0;
  totalBicycles: number = 0;
  totalServices: number = 0;
  pendingOrders: number = 0;
  
  // Service Orders
  serviceOrders: ServiceOrder[] = [];
  loading: boolean = true;
  loadingOrders: boolean = true;
  
  constructor() { }

  ngOnInit(): void {
    // Get user info from auth service
    this.getUserInfo();
    
    // Load dashboard stats from backend
    this.loadDashboardStats();
    
    // Load service orders
    this.loadServiceOrders();
    
    // Welcome message based on user role
    setTimeout(() => {
      if (this.userRole === 'ADMIN') {
        this.notificationService.info('Witaj w panelu administracyjnym!');
      } else if (this.userRole === 'MODERATOR') {
        this.notificationService.info('Witaj w panelu moderatora!');
      }
    }, 500);
  }
  
  private getUserInfo(): void {
    const email = this.authService.getCurrentUserEmail();
    if (email) {
      this.userName = email;
    }
    
    const role = this.authService.getUserRole();
    if (role) {
      this.userRole = role;
    }
  }
  
  private loadDashboardStats(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (stats: DashboardStats) => {
        this.totalUsers = stats.totalUsers;
        this.totalBicycles = stats.totalBicycles;
        this.totalServices = stats.totalServices;
        this.pendingOrders = stats.pendingOrders;
        
        // If user info is returned from backend, update it
        if (stats.user) {
          this.userName = stats.user.email;
          
          // Determine role from authorities
          if (stats.authorities) {
            if (stats.authorities.includes('ROLE_ADMIN')) {
              this.userRole = 'ADMIN';
            } else if (stats.authorities.includes('ROLE_MODERATOR')) {
              this.userRole = 'MODERATOR';
            }
          }
        }
        
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading dashboard stats:', error);
        this.notificationService.error('Nie udało się załadować statystyk panelu administracyjnego');
        this.loading = false;
        
        // Set default values in case of error
        this.totalUsers = 0;
        this.totalBicycles = 0;
        this.totalServices = 0;
        this.pendingOrders = 0;
      }
    });
  }
  
  private loadServiceOrders(): void {
    this.adminService.getAllServiceOrders().subscribe({
      next: (orders: ServiceOrder[]) => {
        this.serviceOrders = orders;
        this.loadingOrders = false;
      },
      error: (error: any) => {
        console.error('Error loading service orders:', error);
        this.notificationService.error('Nie udało się załadować zamówień serwisowych');
        this.loadingOrders = false;
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
  
  viewOrderDetails(orderId: number): void {
    // Navigate to order details page (to be implemented)
    this.notificationService.info(`Szczegóły zamówienia ID: ${orderId} - funkcja w przygotowaniu`);
  }
  
  navigateToModule(module: string): void {
    // This will be implemented in future to navigate to admin submodules
    this.notificationService.info(`Moduł ${module} jest w przygotowaniu`);
  }
}