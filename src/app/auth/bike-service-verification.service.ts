import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../core/api-config';

export interface ServiceVerificationStatus {
  hasService: boolean;
  serviceId?: number;
  serviceName?: string;
  verified?: boolean;
  suffix?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BikeServiceVerificationService {
  private apiUrl = `${environment.apiUrl}/bike-services-registered`;
  private http = inject(HttpClient);

  /**
   * Sprawdza status weryfikacji serwisu dla zalogowanego użytkownika SERVICE
   */
  checkVerificationStatus(): Observable<ServiceVerificationStatus> {
    return this.http.get<ServiceVerificationStatus>(`${this.apiUrl}/verification-status`).pipe(
      catchError(error => {
        console.error('Error checking service verification status:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera szczegóły zarejestrowanego serwisu
   */
  getMyServiceDetails(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-service`).pipe(
      catchError(error => {
        console.error('Error fetching service details:', error);
        return throwError(() => error);
      })
    );
  }
}