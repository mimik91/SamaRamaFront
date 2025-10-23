import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../core/api-config';

// Interfejsy
export interface ServiceVerificationStatus {
  hasService: boolean;
  serviceId?: number;
  serviceName?: string;
  verified?: boolean;
  suffix?: string;
}

export interface BikeServiceNameIdDto {
  id: number;
  name: string;
}

export interface BikeServiceRegisteredDto {
  id: number;
  name: string;
  email?: string;
  street?: string;
  building?: string;
  flat?: string;
  postalCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  transportCost?: number;
  transportAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
  suffix?: string;
  contactPerson?: string;
  website?: string;
  description?: string;
  isRegistered: boolean;
  openingHours?: {
    [key: string]: {
      open: string;
      close: string;
    }
  };
  openingHoursInfo?: string;
  openingHoursNote?: string;
  pricelistInfo?: string;
  pricelistNote?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BikeServiceVerificationService {
  private apiUrl = `${environment.apiUrl}/bike-services-registered`;

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