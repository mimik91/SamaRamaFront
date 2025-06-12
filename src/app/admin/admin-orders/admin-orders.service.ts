import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../core/api-config';

export interface OrderFilter {
  pickupDateFrom?: string;
  pickupDateTo?: string;
  status?: string;
  orderType?: string;
  searchTerm?: string;
  transportStatus?: string;
  transportType?: string;
  servicePackageCode?: string;
  servicePackageId?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface ServiceAndTransportOrder {
  id: number;
  orderType: 'SERVICE' | 'TRANSPORT';
  bicycleId?: number;
  bicycleBrand?: string;
  bicycleModel?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientName?: string;
  pickupDate: string;
  pickupAddress: string;
  deliveryAddress: string; // "SERWIS" dla service orders, rzeczywisty adres dla transport
  price: number;
  orderDate: string;
  additionalNotes?: string;
  status: string;
  serviceNotes?: string;
  servicePackageCode?: string;
  servicePackageName?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminOrdersService {
  private apiUrl = `${environment.apiUrl}/admin/orders`;
  private http = inject(HttpClient);

  constructor() { }

  // === ZAMÓWIENIA SERWISOWE ===

  /**
   * Pobiera wszystkie zamówienia serwisowe z filtrowaniem i paginacją
   */
  getAllServiceOrders(filter: OrderFilter = {}, page: number = 0, size: number = 20): Observable<PagedResponse<ServiceAndTransportOrder>> {
    const params = this.buildHttpParams(filter, page, size);
    
    return this.http.get<PagedResponse<ServiceAndTransportOrder>>(`${this.apiUrl}/service`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching service orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Wyszukuje zamówienia serwisowe po email/telefonie klienta
   */
  searchServiceOrders(searchTerm: string): Observable<ServiceAndTransportOrder[]> {
    const params = new HttpParams().set('searchTerm', searchTerm);
    
    return this.http.get<ServiceAndTransportOrder[]>(`${this.apiUrl}/service/search`, { params }).pipe(
      catchError(error => {
        console.error('Error searching service orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Aktualizuje zamówienie serwisowe
   */
  updateServiceOrder(orderId: number, orderData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/service/${orderId}`, orderData).pipe(
      catchError(error => {
        console.error(`Error updating service order ${orderId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Usuwa zamówienie serwisowe
   */
  deleteServiceOrder(orderId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/service/${orderId}`).pipe(
      catchError(error => {
        console.error(`Error deleting service order ${orderId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Zmienia status zamówienia serwisowego
   */
  updateServiceOrderStatus(orderId: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/service/${orderId}/status`, { status }).pipe(
      catchError(error => {
        console.error(`Error updating service order ${orderId} status:`, error);
        return throwError(() => error);
      })
    );
  }

  // === ZAMÓWIENIA TRANSPORTOWE ===

  /**
   * Pobiera wszystkie zamówienia transportowe z filtrowaniem i paginacją
   */
  getAllTransportOrders(filter: OrderFilter = {}, page: number = 0, size: number = 20): Observable<PagedResponse<ServiceAndTransportOrder>> {
    const params = this.buildHttpParams(filter, page, size);
    
    return this.http.get<PagedResponse<ServiceAndTransportOrder>>(`${this.apiUrl}/transport`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching transport orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Wyszukuje zamówienia transportowe po email/telefonie klienta
   */
  searchTransportOrders(searchTerm: string): Observable<ServiceAndTransportOrder[]> {
    const params = new HttpParams().set('searchTerm', searchTerm);
    
    return this.http.get<ServiceAndTransportOrder[]>(`${this.apiUrl}/transport/search`, { params }).pipe(
      catchError(error => {
        console.error('Error searching transport orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Aktualizuje zamówienie transportowe
   */
  updateTransportOrder(orderId: number, orderData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/transport/${orderId}`, orderData).pipe(
      catchError(error => {
        console.error(`Error updating transport order ${orderId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Usuwa zamówienie transportowe
   */
  deleteTransportOrder(orderId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/transport/${orderId}`).pipe(
      catchError(error => {
        console.error(`Error deleting transport order ${orderId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Zmienia status zamówienia transportowego
   */
  updateTransportOrderStatus(orderId: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/transport/${orderId}/status`, { status }).pipe(
      catchError(error => {
        console.error(`Error updating transport order ${orderId} status:`, error);
        return throwError(() => error);
      })
    );
  }

  // === WSZYSTKIE ZAMÓWIENIA ===

  /**
   * Pobiera wszystkie zamówienia (serwisowe + transportowe) z niezbędnymi danymi
   */
  getAllOrders(filter: OrderFilter = {}, page: number = 0, size: number = 20): Observable<PagedResponse<ServiceAndTransportOrder>> {
    const params = this.buildHttpParams(filter, page, size);
    
    return this.http.get<PagedResponse<ServiceAndTransportOrder>>(`${this.apiUrl}/all`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching all orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Wyszukuje wszystkie zamówienia po email/telefonie klienta
   */
  searchAllOrders(searchTerm: string): Observable<ServiceAndTransportOrder[]> {
    const params = new HttpParams().set('searchTerm', searchTerm);
    
    return this.http.get<ServiceAndTransportOrder[]>(`${this.apiUrl}/all/search`, { params }).pipe(
      catchError(error => {
        console.error('Error searching all orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera szczegóły konkretnego zamówienia
   */
  getOrderDetails(orderId: number): Observable<ServiceAndTransportOrder> {
    return this.http.get<ServiceAndTransportOrder>(`${this.apiUrl}/${orderId}`).pipe(
      catchError(error => {
        console.error(`Error fetching order ${orderId} details:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera statystyki zamówień
   */
  getOrderStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistics`).pipe(
      catchError(error => {
        console.error('Error fetching order statistics:', error);
        return throwError(() => error);
      })
    );
  }

  // === HELPER METHODS ===

  /**
   * Buduje HttpParams z filtrów
   */
  private buildHttpParams(filter: OrderFilter, page?: number, size?: number): HttpParams {
    let params = new HttpParams();

    // Paginacja
    if (page !== undefined) {
      params = params.set('page', page.toString());
    }
    if (size !== undefined) {
      params = params.set('size', size.toString());
    }

    // Filtry dat
    if (filter.pickupDateFrom) {
      params = params.set('pickupDateFrom', filter.pickupDateFrom);
    }
    if (filter.pickupDateTo) {
      params = params.set('pickupDateTo', filter.pickupDateTo);
    }

    // Filtry statusów
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.transportStatus) {
      params = params.set('transportStatus', filter.transportStatus);
    }
    if (filter.transportType) {
      params = params.set('transportType', filter.transportType);
    }

    // Filtr typu zamówienia
    if (filter.orderType) {
      params = params.set('orderType', filter.orderType);
    }

    // Search term
    if (filter.searchTerm) {
      params = params.set('searchTerm', filter.searchTerm);
    }

    // Filtry serwisu
    if (filter.servicePackageCode) {
      params = params.set('servicePackageCode', filter.servicePackageCode);
    }
    if (filter.servicePackageId) {
      params = params.set('servicePackageId', filter.servicePackageId.toString());
    }

    // Sortowanie
    if (filter.sortBy) {
      params = params.set('sortBy', filter.sortBy);
    }
    if (filter.sortOrder) {
      params = params.set('sortOrder', filter.sortOrder);
    }

    return params;
  }

  /**
   * Zwraca czytelną nazwę statusu
   */
  getStatusDisplayName(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': 'Oczekujące',
      'CONFIRMED': 'Potwierdzone',
      'PICKED_UP': 'Odebrane',
      'IN_SERVICE': 'W serwisie',
      'IN_TRANSPORT': 'W transporcie',
      'COMPLETED': 'Zakończone',
      'DELIVERED': 'Dostarczone',
      'DELIVERED_TO_SERVICE': 'Dostarczone do serwisu',
      'CANCELLED': 'Anulowane'
    };

    return statusMap[status] || status;
  }

  /**
   * Zwraca czytelną nazwę typu zamówienia
   */
  getOrderTypeDisplayName(orderType: string): string {
    const typeMap: Record<string, string> = {
      'SERVICE': 'Serwis',
      'TRANSPORT': 'Transport'
    };

    return typeMap[orderType] || orderType;
  }

  /**
   * Sprawdza czy zamówienie można edytować
   */
  canEditOrder(order: ServiceAndTransportOrder): boolean {
    // Admin może edytować wszystkie zamówienia
    return true;
  }

  /**
   * Sprawdza czy zamówienie można usunąć
   */
  canDeleteOrder(order: ServiceAndTransportOrder): boolean {
    // Admin może usunąć wszystkie zamówienia
    return true;
  }

  /**
   * Zwraca dostępne statusy dla zamówień serwisowych
   */
  getServiceOrderStatuses(): Array<{value: string, label: string}> {
    return [
      { value: 'PENDING', label: 'Oczekujące' },
      { value: 'CONFIRMED', label: 'Potwierdzone' },
      { value: 'PICKED_UP', label: 'Odebrane' },
      { value: 'IN_SERVICE', label: 'W serwisie' },
      { value: 'ON_THE_WAY_BACK', label: 'W drodze z porotem do klienta' },
      { value: 'FINISHED', label: 'Zakończone' },
      { value: 'CANCELLED', label: 'Anulowane' }
    ];
  }

  /**
   * Zwraca dostępne statusy dla zamówień transportowych
   */
  getTransportOrderStatuses(): Array<{value: string, label: string}> {
    return [
      { value: 'PENDING', label: 'Oczekujące' },
      { value: 'CONFIRMED', label: 'Potwierdzone' },
      { value: 'PICKED_UP', label: 'W transporcie do serwisu' },
      { value: 'IN_SERVICE', label: 'W trakcie serwisu' },
      { value: 'ON_THE_WAY_BACK', label: 'W drodze z porotem do klienta' },
      { value: 'FINISHED', label: 'Zakończone' },
      { value: 'CANCELLED', label: 'Anulowane' }
    ];
  }
}