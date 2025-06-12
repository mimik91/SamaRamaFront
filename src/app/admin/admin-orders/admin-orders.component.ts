import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminOrdersService, ServiceAndTransportOrder, OrderFilter, PagedResponse } from './admin-orders.service';
import { NotificationService } from '../../core/notification.service';

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
  orders: ServiceAndTransportOrder[] = [];
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;
  
  // State
  loading = true;
  error: string | null = null;
  
  // View mode
  viewMode: 'all' | 'service' | 'transport' = 'all';
  
  // Filters
  filters: OrderFilter = {};
  searchTerm = '';
  statusFilter = '';
  orderTypeFilter = '';
  pickupDateFrom = '';
  pickupDateTo = '';
  
  // Sorting
  sortBy = 'orderDate';
  sortOrder = 'DESC';
  
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
      orderType: this.orderTypeFilter || undefined,
      pickupDateFrom: this.pickupDateFrom || undefined,
      pickupDateTo: this.pickupDateTo || undefined,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    let loadMethod: any;
    
    switch (this.viewMode) {
      case 'service':
        loadMethod = this.adminOrdersService.getAllServiceOrders(filter, this.currentPage, this.pageSize);
        break;
      case 'transport':
        loadMethod = this.adminOrdersService.getAllTransportOrders(filter, this.currentPage, this.pageSize);
        break;
      default:
        loadMethod = this.adminOrdersService.getAllOrders(filter, this.currentPage, this.pageSize);
    }

    loadMethod.subscribe({
      next: (response: PagedResponse<ServiceAndTransportOrder>) => {
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

  // === VIEW MODE CHANGES ===

  changeViewMode(mode: 'all' | 'service' | 'transport'): void {
    this.viewMode = mode;
    this.currentPage = 0;
    this.clearFilters();
    this.loadOrders();
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
    this.orderTypeFilter = '';
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

  editOrder(order: ServiceAndTransportOrder): void {
    // Navigate to edit page based on order type
    if (order.orderType === 'SERVICE') {
      this.router.navigate(['/admin-orders/service', order.id, 'edit']);
    } else if (order.orderType === 'TRANSPORT') {
      this.router.navigate(['/admin-orders/transport', order.id, 'edit']);
    }
  }

  updateOrderStatus(order: ServiceAndTransportOrder): void {
    const newStatus = prompt(`Zmień status zamówienia ${order.id}:`, order.status);
    
    if (newStatus && newStatus !== order.status) {
      const updateMethod = order.orderType === 'SERVICE' 
        ? this.adminOrdersService.updateServiceOrderStatus(order.id, newStatus)
        : this.adminOrdersService.updateTransportOrderStatus(order.id, newStatus);

      updateMethod.subscribe({
        next: () => {
          this.notificationService.success(`Status zamówienia ${order.id} został zaktualizowany`);
          this.loadOrders();
        },
        error: (err) => {
          console.error('Error updating order status:', err);
          this.notificationService.error('Nie udało się zaktualizować statusu zamówienia');
        }
      });
    }
  }

  deleteOrder(order: ServiceAndTransportOrder): void {
    if (confirm(`Czy na pewno chcesz usunąć zamówienie ${order.id}? Ta operacja jest nieodwracalna.`)) {
      const deleteMethod = order.orderType === 'SERVICE'
        ? this.adminOrdersService.deleteServiceOrder(order.id)
        : this.adminOrdersService.deleteTransportOrder(order.id);

      deleteMethod.subscribe({
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

  getOrderTypeDisplayName(orderType: string): string {
    return this.adminOrdersService.getOrderTypeDisplayName(orderType);
  }

  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'PENDING': 'status-pending',
      'CONFIRMED': 'status-confirmed',
      'PICKED_UP': 'status-picked-up',
      'IN_SERVICE': 'status-in-service',
      'ON_THE_WAY_BACK': 'status-in-transport-back',
      'FINISHED': 'status-delivered',
      'CANCELLED': 'status-cancelled'
    };

    return statusClasses[status] || '';
  }

  getOrderTypeClass(orderType: string): string {
    return orderType === 'SERVICE' ? 'order-type-service' : 'order-type-transport';
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

  canEditOrder(order: ServiceAndTransportOrder): boolean {
    return this.adminOrdersService.canEditOrder(order);
  }

  canDeleteOrder(order: ServiceAndTransportOrder): boolean {
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
    if (this.viewMode === 'service') {
      return this.adminOrdersService.getServiceOrderStatuses();
    } else if (this.viewMode === 'transport') {
      return this.adminOrdersService.getTransportOrderStatuses();
    } else {
      // For 'all' view, combine both
      const serviceStatuses = this.adminOrdersService.getServiceOrderStatuses();
      const transportStatuses = this.adminOrdersService.getTransportOrderStatuses();
      
      // Remove duplicates
      const allStatuses = [...serviceStatuses];
      transportStatuses.forEach(ts => {
        if (!allStatuses.find(as => as.value === ts.value)) {
          allStatuses.push(ts);
        }
      });
      
      return allStatuses.sort((a, b) => a.label.localeCompare(b.label));
    }
  }

  // === EXPORT / BULK ACTIONS ===

  exportOrders(): void {
    // Placeholder for export functionality
    this.notificationService.info('Funkcja eksportu zostanie dodana w przyszłej wersji');
  }

  bulkUpdateStatus(): void {
    // Placeholder for bulk update functionality
    this.notificationService.info('Funkcja zbiorczej aktualizacji zostanie dodana w przyszłej wersji');
  }

  // === PAGINATION HELPERS ===

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(0, this.currentPage - halfVisible);
    let endPage = Math.min(this.totalPages - 1, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  shouldShowPage(pageIndex: number): boolean {
    if (this.totalPages <= 10) return true;
    
    const visiblePages = this.getPaginationPages();
    return visiblePages.includes(pageIndex) || pageIndex === 0 || pageIndex === this.totalPages - 1;
  }
}
