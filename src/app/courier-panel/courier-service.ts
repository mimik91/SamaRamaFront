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

  /**
   * Oznacza zamówienie jako odebrane (zmienia status z CONFIRMED na PICKED_UP)
   */
  markOrderAsPickedUp(orderId: number): Observable<any> {
    const url = `${environment.apiUrl}${environment.endpoints.admin.orderById.replace(':id', orderId.toString())}`;
    return this.http.patch(url, {
      status: 'PICKED_UP'
    }).pipe(
      catchError(error => {
        console.error('Error marking order as picked up:', error);
        return throwError(() => error);
      })
    );
  }
}