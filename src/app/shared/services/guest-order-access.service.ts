import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environments';
import { GuestOrderAccess, GuestOrderMessage } from '../models/guest-order-access.model';

@Injectable({ providedIn: 'root' })
export class GuestOrderAccessService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${environment.endpoints.guestOrders.access}`;

  getAccess(token: string): Observable<GuestOrderAccess> {
    return this.http.get<GuestOrderAccess>(`${this.baseUrl}/${token}`).pipe(
      catchError(error => {
        console.error('Error fetching guest order access:', error);
        return throwError(() => error);
      })
    );
  }

  sendMessage(token: string, content: string): Observable<GuestOrderMessage> {
    return this.http.post<GuestOrderMessage>(`${this.baseUrl}/${token}/messages`, { content }).pipe(
      catchError(error => {
        console.error('Error sending guest message:', error);
        return throwError(() => error);
      })
    );
  }

  markAsRead(token: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${token}/messages/read`, {}).pipe(
      catchError(error => {
        console.error('Error marking guest messages as read:', error);
        return throwError(() => error);
      })
    );
  }

  confirmRepairPlan(token: string, excludedItemIds: number[] = [], excludePackage = false): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${token}/repair-plan/confirm`, { excludedItemIds, excludePackage }).pipe(
      catchError(error => {
        console.error('Error confirming repair plan:', error);
        return throwError(() => error);
      })
    );
  }

  rejectRepairPlan(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${token}/repair-plan/reject`, {}).pipe(
      catchError(error => {
        console.error('Error rejecting repair plan:', error);
        return throwError(() => error);
      })
    );
  }
}
