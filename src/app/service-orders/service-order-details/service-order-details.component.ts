import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceOrderService } from '../service-orders.service';
import { NotificationService } from '../../core/notification.service';
import { ServiceOrder } from '../service-order.model';

@Component({
  selector: 'app-service-order-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-order-details.component.html',
  styleUrls: ['./service-order-details.component.css']
})
export class ServiceOrderDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serviceOrderService = inject(ServiceOrderService);
  private notificationService = inject(NotificationService);

  serviceOrder: ServiceOrder | null = null;
  loading = true;
  error: string | null = null;
  isAdminView = false;

  ngOnInit(): void {
    // Check if we're in admin view based on the URL
    this.isAdminView = this.router.url.includes('/admin/orders');
    console.log('Admin view:', this.isAdminView);
    
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadServiceOrder(+orderId);
    } else {
      this.error = 'Brak identyfikatora zamówienia';
      this.loading = false;
    }
  }

  loadServiceOrder(orderId: number): void {
    this.loading = true;
    this.error = null;

    this.serviceOrderService.getServiceOrderById(orderId).subscribe({
      next: (order) => {
        console.log('Loaded service order details:', order);
        this.serviceOrder = order;
        this.loading = false;
      },
      error: (err) => {
        console.error(`Error loading service order ${orderId}:`, err);
        this.error = 'Nie udało się załadować szczegółów zamówienia. Spróbuj ponownie później.';
        this.loading = false;
        this.notificationService.error(this.error);
      }
    });
  }

  // Helper methods
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
  
  // Safe accessor for bicycle properties
  getBicycleBrand(): string {
    if (!this.serviceOrder) return 'Nie określono';
    
    if (this.serviceOrder.bicycleBrand) {
      return this.serviceOrder.bicycleBrand;
    }
    
    if (this.serviceOrder.bicycle?.brand) {
      return this.serviceOrder.bicycle.brand;
    }
    
    return 'Nie określono';
  }
  
  getBicycleModel(): string {
    if (!this.serviceOrder) return '';
    
    if (this.serviceOrder.bicycleModel) {
      return this.serviceOrder.bicycleModel;
    }
    
    if (this.serviceOrder.bicycle?.model) {
      return this.serviceOrder.bicycle.model;
    }
    
    return '';
  }
  
  getBicycleType(): string {
    if (!this.serviceOrder || !this.serviceOrder.bicycle) return '';
    return this.serviceOrder.bicycle.type || '';
  }
  
  getBicycleFrameMaterial(): string {
    if (!this.serviceOrder || !this.serviceOrder.bicycle) return '';
    return this.serviceOrder.bicycle.frameMaterial || '';
  }
  
  getBicycleFrameNumber(): string {
    if (!this.serviceOrder || !this.serviceOrder.bicycle) return '';
    return this.serviceOrder.bicycle.frameNumber || '';
  }
  
  // Safe accessor for service package
  getServicePackageName(): string {
    if (!this.serviceOrder) return 'Nie określono';
    
    if (this.serviceOrder.servicePackageName) {
      return this.serviceOrder.servicePackageName;
    }
    
    if (this.serviceOrder.servicePackage && this.serviceOrder.servicePackage.name) {
      return this.serviceOrder.servicePackage.name;
    }
    
    if (this.serviceOrder.servicePackageCode) {
      return this.serviceOrder.servicePackageCode;
    }
    
    return 'Nie określono';
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

  goBack(): void {
    if (this.isAdminView) {
      this.router.navigate(['/service-orders']);
    } else {
      this.router.navigate(['/service-appointments']);
    }
  }

  cancelOrder(): void {
    if (!this.serviceOrder) return;
    
    if (confirm('Czy na pewno chcesz anulować to zamówienie?')) {
      this.serviceOrderService.cancelServiceOrder(this.serviceOrder.id).subscribe({
        next: () => {
          this.notificationService.success('Zamówienie zostało anulowane');
          this.loadServiceOrder(this.serviceOrder!.id); // Reload to show updated status
        },
        error: (err) => {
          console.error('Error cancelling service order:', err);
          this.notificationService.error('Nie udało się anulować zamówienia');
        }
      });
    }
  }

  canCancelOrder(): boolean {
    if (!this.serviceOrder) return false;
    return this.serviceOrder.status === 'PENDING' || this.serviceOrder.status === 'CONFIRMED';
  }
  
  updateOrderStatus(newStatus: string): void {
    if (!this.serviceOrder) return;
    
    // Only admin can update status
    if (!this.isAdminView) return;
    
    this.serviceOrderService.updateOrderStatus(this.serviceOrder.id, newStatus).subscribe({
      next: () => {
        this.notificationService.success(`Status zamówienia został zmieniony na ${this.getStatusLabel(newStatus)}`);
        this.loadServiceOrder(this.serviceOrder!.id); // Reload to show updated status
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        this.notificationService.error('Nie udało się zaktualizować statusu zamówienia');
      }
    });
  }
}