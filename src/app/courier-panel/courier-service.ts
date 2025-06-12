// src/app/courier/courier.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../core/api-config';

export interface CourierOrder {
  id: number;
  status: 'CONFIRMED' | 'ON_THE_WAY_BACK';
  orderDate: string;
  pickupDate: string;
  pickupTimeWindow?: string;
  pickupAddress: string;
  deliveryAddress: string;
  bikeBrand?: string;
  bikeModel?: string;
  clientEmail: string;
  clientPhone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourierService {
  private apiUrl = `${environment.apiUrl}/courier`;
  private http = inject(HttpClient);

  /**
   * Pobiera zamówienia dla kuriera (status CONFIRMED z dzisiejszą datą odbioru + ON_THE_WAY_BACK)
   */
  getCourierOrders(): Observable<CourierOrder[]> {
    return this.http.get<CourierOrder[]>(`${this.apiUrl}/orders`).pipe(
      catchError(error => {
        console.error('Error fetching courier orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Oznacza zamówienie jako odebrane (zmienia status z CONFIRMED na PICKED_UP)
   */
  markOrderAsPickedUp(orderId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/orders/${orderId}/pickup`, {}).pipe(
      catchError(error => {
        console.error('Error marking order as picked up:', error);
        return throwError(() => error);
      })
    );
  }
}