// src/app/transport-orders/transport-order.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environments';
import { 
  TransportOrderRequest, 
  TransportOrderResponse, 
  TransportOrderSummaryDto,
  TransportOrderCreateResponse 
} from '../shared/models/transport-order.model';
import { BikeService } from '../shared/models/bike-service.models';

@Injectable({
  providedIn: 'root'
})
export class TransportOrderService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.guestOrders.transport}`;
  private discountApiUrl = `${environment.apiUrl}${environment.endpoints.guestOrders.discounts}`;
  private http = inject(HttpClient);

  constructor() { }

  /**
   * Tworzy zamówienie transportowe dla gościa
   */
  createGuestTransportOrder(orderData: any): Observable<TransportOrderCreateResponse> {
    console.log('Creating guest transport order with data:', orderData);
    return this.http.post<TransportOrderCreateResponse>(this.apiUrl, orderData).pipe(
      catchError(error => {
        console.error('Error creating guest transport order:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera wszystkie zamówienia transportowe użytkownika
   */
  getUserTransportOrders(): Observable<TransportOrderResponse[]> {
    return this.http.get<TransportOrderResponse[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching user transport orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Sprawdza dostępność slotów na daną datę
   */
  checkSlotAvailability(date: string, bikesCount: number): Observable<any> {
    const params = new HttpParams()
      .set('date', date)
      .set('bikesCount', bikesCount.toString());
    
    const url = `${environment.apiUrl}${environment.endpoints.serviceSlots.checkAvailability}`;
    
    return this.http.get(url, { params }).pipe(
      catchError(error => {
        console.error('Error checking slot availability:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera szczegóły konkretnego zamówienia transportowego
   */
  getTransportOrderDetails(orderId: number): Observable<TransportOrderResponse> {
    return this.http.get<TransportOrderResponse>(`${this.apiUrl}/${orderId}`).pipe(
      catchError(error => {
        console.error(`Error fetching transport order ${orderId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Aktualizuje zamówienie transportowe
   */
  updateTransportOrder(orderId: number, orderData: Partial<TransportOrderRequest>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${orderId}`, orderData).pipe(
      catchError(error => {
        console.error(`Error updating transport order ${orderId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Anuluje zamówienie transportowe
   */
  cancelTransportOrder(orderId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${orderId}`).pipe(
      catchError(error => {
        console.error(`Error cancelling transport order ${orderId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Zmienia status zamówienia transportowego
   */
  updateTransportOrderStatus(orderId: number, status: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${orderId}/status`, { status }).pipe(
      catchError(error => {
        console.error(`Error updating transport order ${orderId} status:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera dostępne serwisy dla transportu
   */
  getAvailableServices(): Observable<BikeService[]> {
    return this.http.get<BikeService[]>(`${this.apiUrl}/available-services`).pipe(
      catchError(error => {
        console.error('Error fetching available services:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera szczegóły serwisu
   */
  getServiceDetails(serviceId: number): Observable<BikeService> {
    return this.http.get<BikeService>(`${this.apiUrl}/service/${serviceId}`).pipe(
      catchError(error => {
        console.error(`Error fetching service ${serviceId} details:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Oblicza koszt transportu (TYLKO transport)
   */
  calculateTransportCost(request: {
    bicycleCount: number;
    distance?: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/calculate-cost`, request).pipe(
      catchError(error => {
        console.error('Error calculating transport cost:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera dostępne statusy transportu
   */
  getTransportStatuses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/statuses`).pipe(
      catchError(error => {
        console.error('Error fetching transport statuses:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Sprawdza i aplikuje kupon rabatowy
   */
  checkDiscount(data: { 
    coupon: string; 
    currentTransportPrice: number; 
    orderDate: string; 
  }): Observable<{ newPrice: number }> {
    return this.http.post<{ newPrice: number }>(this.discountApiUrl, data).pipe(
      catchError(error => {
        console.error('Error checking discount coupon:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera podsumowanie zamówień na podstawie ich ID
   */
  getOrdersSummary(orderIds: number[]): Observable<TransportOrderSummaryDto[]> {
    const requestBody = { orderIds };
    return this.http.post<TransportOrderSummaryDto[]>(`${this.apiUrl}/summary`, requestBody).pipe(
      catchError(error => {
        console.error('Error fetching order summary:', error);
        return throwError(() => error);
      })
    );
  }
}