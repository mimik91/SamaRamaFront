import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environments';
import { 
  TransportOrder, 
  TransportOrderRequestDto,
  OrderFilter, 
  PagedResponse,
  getTransportOrderStatuses,
  TRANSPORT_ORDER_STATUS_LABELS
} from '../../core/models/transport-order.models';

@Injectable({
  providedIn: 'root'
})
export class AdminOrdersService {
  private readonly apiUrl = `${environment.apiUrl}${environment.endpoints.admin.orders}`;
  private http = inject(HttpClient);

  constructor() { }

  // === ZAMÓWIENIA TRANSPORTOWE ===

  /**
   * Pobiera wszystkie zamówienia transportowe z filtrowaniem i paginacją
   */
  getAllTransportOrders(
    filter: OrderFilter = {}, 
    page: number = 0, 
    size: number = 20
  ): Observable<PagedResponse<TransportOrder>> {
    const params = this.buildHttpParams(filter, page, size);
    
    return this.http.get<PagedResponse<TransportOrder>>(`${this.apiUrl}/transport`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching transport orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera szczegóły zamówienia transportowego
   */
  getTransportOrderDetails(orderId: number): Observable<TransportOrder> {
    return this.http.get<TransportOrder>(`${this.apiUrl}/transport/${orderId}`).pipe(
      catchError(error => {
        console.error(`Error fetching transport order ${orderId} details:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Wyszukuje zamówienia transportowe po email/telefonie klienta
   */
  searchTransportOrders(searchTerm: string): Observable<TransportOrder[]> {
    const params = new HttpParams().set('searchTerm', searchTerm);
    
    return this.http.get<TransportOrder[]>(`${this.apiUrl}/transport/search`, { params }).pipe(
      catchError(error => {
        console.error('Error searching transport orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Aktualizuje zamówienie transportowe
   */
  updateTransportOrder(orderId: number, orderData: TransportOrderRequestDto): Observable<any> {
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
    return this.http.delete(`${this.apiUrl}/${orderId}`).pipe(
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

    // Search term
    if (filter.searchTerm) {
      params = params.set('searchTerm', filter.searchTerm);
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
    return TRANSPORT_ORDER_STATUS_LABELS[status as keyof typeof TRANSPORT_ORDER_STATUS_LABELS] || status;
  }

  /**
   * Sprawdza czy zamówienie można edytować
   */
  canEditOrder(order: TransportOrder): boolean {
    // Admin może edytować wszystkie zamówienia
    return true;
  }

  /**
   * Sprawdza czy zamówienie można usunąć
   */
  canDeleteOrder(order: TransportOrder): boolean {
    // Admin może usunąć wszystkie zamówienia
    return true;
  }

  /**
   * Zwraca dostępne statusy dla zamówień transportowych
   */
  getTransportOrderStatuses(): Array<{value: string, label: string}> {
    return getTransportOrderStatuses();
  }
}