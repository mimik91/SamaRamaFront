import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environments';

export type DiscountScope = 'TRANSPORT' | 'SERVICE_ORDER';

export interface ApplyDiscountRequest {
  coupon: string;
  scope: DiscountScope;
  firstUnitPrice: number;
  remainderPrice?: number | null;
  orderDate: string;
}

export interface ApplyDiscountResponse {
  firstUnitPrice: number;
  remainderPrice: number;
  totalPrice: number;
}

@Injectable({ providedIn: 'root' })
export class DiscountService {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}${environment.endpoints.guestOrders.discounts}`;

  applyDiscount(request: ApplyDiscountRequest): Observable<ApplyDiscountResponse> {
    return this.http.post<ApplyDiscountResponse>(this.url, request).pipe(
      catchError(error => {
        console.error('Error applying discount coupon:', error);
        return throwError(() => error);
      })
    );
  }
}
