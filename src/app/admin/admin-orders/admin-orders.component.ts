import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminOrdersService } from './admin-orders.service';
import { NotificationService } from '../../core/notification.service';
import { 
  TransportOrder, 
  OrderFilter, 
  PagedResponse 
} from '../../core/models/transport-order.models';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.css']
})
export class AdminOrdersComponent implements OnInit {
  private adminOrdersService = inject(AdminOrdersService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Data
  orders: TransportOrder[] = [];
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;
  
  // State
  loading = true;
  error: string | null = null;
  
  // Filters
  filters: OrderFilter = {};
  searchTerm = '';
  statusFilter = '';
  pickupDateFrom = '';
  pickupDateTo = '';
  
  // Sorting
  sortBy = 'orderDate';
  sortOrder: 'ASC' | 'DESC' = 'DESC';
  
  // Status Modal
  showStatusModal = false;
  selectedOrder: TransportOrder | null = null;
  newStatus = '';
  
  constructor() { }

  ngOnInit(): void {
    this.loadOrders();
  }

  // === LOADING DATA ===

  loadOrders(): void {
    this.loading = true;
    this.error = null;
    
    // Build filters
    const filter: OrderFilter = {
      ...this.filters,
      searchTerm: this.searchTerm || undefined,
      status: this.statusFilter || undefined,
      pickupDateFrom: this.pickupDateFrom || undefined,
      pickupDateTo: this.pickupDateTo || undefined,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    this.adminOrdersService.getAllTransportOrders(filter, this.currentPage, this.pageSize).subscribe({
      next: (response: PagedResponse<TransportOrder>) => {
        this.orders = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading orders:', err);
        this.error = 'Nie udało się załadować zamówień. Spróbuj ponownie później.';
        this.loading = false;
        this.notificationService.error(this.error);
      }
    });
  }

  // === FILTERING ===

  onSearch(): void {
    this.currentPage = 0;
    this.loadOrders();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadOrders();
  }

  onDateFilterChange(): void {
    this.currentPage = 0;
    this.loadOrders();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.pickupDateFrom = '';
    this.pickupDateTo = '';
    this.filters = {};
  }

  // === SORTING ===

  sort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = column;
      this.sortOrder = 'ASC';
    }
    
    this.currentPage = 0;
    this.loadOrders();
  }

  // === PAGINATION ===

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadOrders();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  // === ORDER ACTIONS ===

  viewOrderDetails(orderId: number): void {
    this.router.navigate(['/admin-orders', orderId]);
  }

  updateOrderStatus(order: TransportOrder): void {
    this.selectedOrder = order;
    this.newStatus = '';
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedOrder = null;
    this.newStatus = '';
  }

  confirmStatusUpdate(): void {
    if (!this.selectedOrder || !this.newStatus) return;

    this.adminOrdersService.updateTransportOrderStatus(this.selectedOrder.id, this.newStatus).subscribe({
      next: () => {
        this.notificationService.success(`Status zamówienia ${this.selectedOrder!.id} został zaktualizowany`);
        this.closeStatusModal();
        this.loadOrders();
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        this.notificationService.error('Nie udało się zaktualizować statusu zamówienia');
      }
    });
  }

  deleteOrder(order: TransportOrder): void {
    if (confirm(`Czy na pewno chcesz usunąć zamówienie ${order.id}? Ta operacja jest nieodwracalna.`)) {
      this.adminOrdersService.deleteTransportOrder(order.id).subscribe({
        next: () => {
          this.notificationService.success(`Zamówienie ${order.id} zostało usunięte`);
          this.loadOrders();
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

  canEditOrder(order: TransportOrder): boolean {
    return this.adminOrdersService.canEditOrder(order);
  }

  canDeleteOrder(order: TransportOrder): boolean {
    return this.adminOrdersService.canDeleteOrder(order);
  }

  getSortIcon(column: string): string {
    if (this.sortBy !== column) return '';
    return this.sortOrder === 'ASC' ? '↑' : '↓';
  }

  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }

  // === AVAILABLE STATUSES ===

  getAvailableStatuses(): Array<{value: string, label: string}> {
    return this.adminOrdersService.getTransportOrderStatuses();
  }

  // === EXPORT ===

  exportOrders(): void {
    this.notificationService.info('Funkcja eksportu zostanie dodana w przyszłej wersji');
  }

  // === PAGINATION HELPERS ===

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(0, this.currentPage - halfVisible);
    let endPage = Math.min(this.totalPages - 1, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}