// src/app/service-packages/service-package.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ServicePackage } from './service-package.model';
import { environment } from '../environments/environments';


@Injectable({
  providedIn: 'root'
})
export class ServicePackageService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.servicePackages}`;
  private http = inject(HttpClient);
  
  constructor() {}
  
  /**
   * Pobiera wszystkie pakiety serwisowe
   */
  getAllPackages(): Observable<ServicePackage[]> {
    return this.http.get<ServicePackage[]>(this.apiUrl)
      .pipe(
        catchError(error => {
          console.error('Error fetching service packages:', error);
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Pobiera tylko aktywne pakiety serwisowe
   */
  getActivePackages(): Observable<ServicePackage[]> {
    return this.http.get<ServicePackage[]>(`${this.apiUrl}/active`)
      .pipe(
        catchError(error => {
          console.error('Error fetching active service packages:', error);
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Pobiera pakiet serwisowy po ID
   */
  getPackageById(id: number): Observable<ServicePackage> {
    return this.http.get<ServicePackage>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching service package with id ${id}:`, error);
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Pobiera pakiet serwisowy po kodzie
   */
  getPackageByCode(code: string): Observable<ServicePackage> {
    return this.http.get<ServicePackage>(`${this.apiUrl}/code/${code}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching service package with code ${code}:`, error);
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Tworzy nowy pakiet serwisowy (tylko dla administratorów)
   */
  createPackage(packageData: Omit<ServicePackage, 'id'>): Observable<any> {
    return this.http.post(this.apiUrl, packageData)
      .pipe(
        catchError(error => {
          console.error('Error creating service package:', error);
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Aktualizuje istniejący pakiet serwisowy (tylko dla administratorów)
   */
  updatePackage(id: number, packageData: Omit<ServicePackage, 'id'>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, packageData)
      .pipe(
        catchError(error => {
          console.error(`Error updating service package with id ${id}:`, error);
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Usuwa pakiet serwisowy (tylko dla administratorów)
   */
  deletePackage(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error deleting service package with id ${id}:`, error);
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Włącza/wyłącza pakiet serwisowy (tylko dla administratorów)
   */
  togglePackageActive(id: number, active: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/active`, { active })
      .pipe(
        catchError(error => {
          console.error(`Error toggling active state for service package with id ${id}:`, error);
          return throwError(() => error);
        })
      );
  }
}