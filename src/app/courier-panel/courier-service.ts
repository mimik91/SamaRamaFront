// src/app/courier/courier.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environments';
import { CourierOrder } from '../shared/models/courier.models';


@Injectable({
  providedIn: 'root'
})
export class CourierService {
  private http = inject(HttpClient);

  /**
   * Pobiera zamówienia dla kuriera (status CONFIRMED z dzisiejszą datą odbioru + ON_THE_WAY_BACK)
   */
  getCourierOrders(): Observable<CourierOrder[]> {
    const url = `${environment.apiUrl}${environment.endpoints.orders.courier}`;
    return this.http.get<CourierOrder[]>(url).pipe(
      catchError(error => {
        console.error('Error fetching courier orders:', error);
        return throwError(() => error);
      })
    );
  }

  verifyPickupCode(orderId: number, pickupCode: string): Observable<{ valid: boolean }> {
    const url = `${environment.apiUrl}/orders/${orderId}/verify-pickup-code`;
    return this.http.get<{ valid: boolean }>(url, { params: { pickupCode } }).pipe(
      catchError(error => {
        console.error('Error verifying pickup code:', error);
        return throwError(() => error);
      })
    );
  }

  updateOrderStatus(orderId: number, status: string): Observable<any> {
    const url = `${environment.apiUrl}${environment.endpoints.admin.orderTransportStatus.replace(':id', orderId.toString())}`;
    return this.http.patch(url, { status }).pipe(
      catchError(error => {
        console.error('Error updating order status:', error);
        return throwError(() => error);
      })
    );
  }
}