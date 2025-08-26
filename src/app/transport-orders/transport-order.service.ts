// src/app/transport-orders/transport-order.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../core/api-config';

export interface TransportOrderRequest {
  bicycleIds?: number[]; // dla zalogowanych
  bicycles?: Array<{ // dla gości
    brand: string;
    model: string;
    additionalInfo?: string;
  }>;
  
  // === TRANSPORT ===
  pickupDate: string;
  pickupAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  
  deliveryAddress?: string; // opcjonalne - może być z targetService
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  
  targetServiceId: number; // zewnętrzny serwis
  transportPrice?: number;
  
  pickupTimeFrom?: string;
  pickupTimeTo?: string;
  estimatedTime?: number;
  transportNotes?: string;
  additionalNotes?: string;
  
  // === DANE GOŚCI ===
  clientEmail?: string;
  clientPhone?: string;
  clientName?: string;
  city?: string;
}

export interface GuestTransportOrderRequest {
  // USUNIĘTE - już nie potrzebne, używamy TransportOrderRequest
}

export interface TransportOrderResponse {
  id: number;
  orderType: string;
  bicycleId?: number;
  bicycleBrand?: string;
  bicycleModel?: string;
  clientEmail: string;
  clientPhone?: string;
  clientName?: string;
  pickupDate: string;
  pickupAddress: string;
  deliveryAddress: string;
  price: number;
  orderDate: string;
  additionalNotes?: string;
  status: string;
  serviceNotes?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface BikeService {
  id: number;
  name: string;
  street?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  email?: string;
}

export interface TransportOrderSummaryDto {
  bicycleIds?: number[];
  bicycles?: Array<{
    brand: string;
    model: string;
  }>;
  pickupDate: string;
  pickupAddress: string;
  deliveryAddress?: string;
  transportPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransportOrderService {
  private apiUrl = `${environment.apiUrl}/guest-orders/transport`;
  // DODANY NOWY ADRES URL DLA RABATÓW
  private discountApiUrl = `${environment.apiUrl}/guest-orders/discounts`; 
  private http = inject(HttpClient);

  constructor() { }

  createGuestTransportOrder(orderData: any): Observable<any> {
    console.log('Creating guest transport order with data:', orderData);
    return this.http.post<any>(this.apiUrl, orderData).pipe(
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

  checkSlotAvailability(date: string, bikesCount: number): Observable<any> {
    const params = new HttpParams()
        .set('date', date)
        .set('bikesCount', bikesCount.toString());
    return this.http.get(`${environment.apiUrl}/service-slots/check-availability`, { params }).pipe(
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

  calculateTransportCostForBikes(bikesCount: number, serviceId?: number): Observable<any> {
  const request = {
    bicycleCount: bikesCount,
    targetServiceId: serviceId
  };
  
  return this.http.post<any>(`${environment.apiUrl}/guest-orders/calculate-transport-cost`, request).pipe(
    catchError(error => {
      console.error('Error calculating transport cost:', error);
      return throwError(() => error);
    })
  );
}

checkDiscount(data: { coupon: string; currentTransportPrice: number; orderDate: string; }): Observable<{ newPrice: number }> {
    return this.http.post<{ newPrice: number }>(this.discountApiUrl, data).pipe(
      catchError(error => {
        console.error('Error checking discount coupon:', error);
        return throwError(() => error);
      })
    );
  }

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