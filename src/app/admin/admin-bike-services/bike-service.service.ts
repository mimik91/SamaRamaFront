import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environments';

export interface BikeService {
  id: number;
  name: string;
  street: string;
  building: string;
  flat?: string;
  postalCode?: string;
  city: string;
  phoneNumber: string;
  email: string;
  latitude?: number;
  longitude?: number;
  transportCost: number;
  createdAt: string;
  updatedAt?: string;
  fullAddress?: string;
  formattedTransportCost?: string;
  transportAvailable: boolean;
}

export interface BikeServiceCreateDto {
  name: string;
  street: string;
  building: string;
  flat?: string;
  postalCode?: string;
  city: string;
  phoneNumber: string;
  email: string;
  latitude?: number;
  longitude?: number;
  transportCost: number;
  transportAvailable: boolean;
}

export interface ImportResponse {
  message: string;
  imported: number;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class BikeServiceService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.admin.bikeServices}`;
  private http = inject(HttpClient);

  constructor() { }

  /**
   * Pobiera wszystkie serwisy rowerowe
   */
  getAllBikeServices(): Observable<BikeService[]> {
    return this.http.get<BikeService[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching bike services:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera szczegóły serwisu rowerowego po ID
   */
  getBikeServiceById(id: number): Observable<BikeService> {
    return this.http.get<BikeService>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error fetching bike service ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Tworzy nowy serwis rowerowy
   */
  createBikeService(serviceData: BikeServiceCreateDto): Observable<BikeService> {
    return this.http.post<BikeService>(this.apiUrl, serviceData).pipe(
      catchError(error => {
        console.error('Error creating bike service:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Aktualizuje istniejący serwis rowerowy
   */
  updateBikeService(id: number, serviceData: Partial<BikeServiceCreateDto>): Observable<BikeService> {
    return this.http.put<BikeService>(`${this.apiUrl}/${id}`, serviceData).pipe(
      catchError(error => {
        console.error(`Error updating bike service ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Usuwa serwis rowerowy
   */
  deleteBikeService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error deleting bike service ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Importuje serwisy z pliku CSV
   */
  importFromCsv(file: File): Observable<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<ImportResponse>(`${this.apiUrl}/import`, formData).pipe(
      catchError(error => {
        console.error('Error importing CSV:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera statystyki serwisów rowerowych
   */
  getBikeServiceStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistics`).pipe(
      catchError(error => {
        console.error('Error fetching bike service statistics:', error);
        return throwError(() => error);
      })
    );
  }
}