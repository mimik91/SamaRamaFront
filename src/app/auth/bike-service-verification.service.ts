import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environments';
import { ServiceVerificationStatus } from '../shared/models/auth.models';
import {
  BikeServiceNameIdDto,
  BikeServiceRegisteredDto
} from '../shared/models/bike-service.models';

@Injectable({
  providedIn: 'root'
})
export class BikeServiceVerificationService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.bikeServicesRegistered.base}`;

  constructor(private http: HttpClient) {}

  /**
   * Sprawdza status weryfikacji serwisu dla zalogowanego użytkownika
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
   * Pobiera listę serwisów należących do zalogowanego użytkownika
   */
  getMyServices(): Observable<BikeServiceNameIdDto[]> {
    return this.http.get<BikeServiceNameIdDto[]>(`${this.apiUrl}/my-services`).pipe(
      catchError(error => {
        console.error('Error fetching services list:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera szczegóły wybranego serwisu
   * @param serviceId ID serwisu
   */
  getMyServiceDetails(serviceId: number): Observable<BikeServiceRegisteredDto> {
    return this.http.get<BikeServiceRegisteredDto>(
      `${this.apiUrl}/my-service`, 
      { params: { serviceId: serviceId.toString() } }
    ).pipe(
      catchError(error => {
        console.error('Error fetching service details:', error);
        return throwError(() => error);
      })
    );
  }
}