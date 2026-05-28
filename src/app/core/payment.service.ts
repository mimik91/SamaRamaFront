import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environments';
import {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentStatusResponse,
} from '../shared/models/payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private initiateUrl = `${environment.apiUrl}${environment.endpoints.payment.initiate}`;
  private statusUrl = `${environment.apiUrl}${environment.endpoints.payment.status}`;

  initiatePayment(request: InitiatePaymentRequest): Observable<InitiatePaymentResponse> {
    return this.http
      .post<InitiatePaymentResponse>(this.initiateUrl, request)
      .pipe(catchError(error => throwError(() => error)));
  }

  getPaymentStatus(payuOrderId: string): Observable<PaymentStatusResponse> {
    return this.http
      .get<PaymentStatusResponse>(`${this.statusUrl}/${payuOrderId}`)
      .pipe(catchError(error => throwError(() => error)));
  }
}
