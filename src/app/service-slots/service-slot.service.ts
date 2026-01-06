import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, shareReplay, throwError } from 'rxjs';
import { environment } from '../environments/environments';

export interface ServiceSlotAvailability {
  date: string;
  maxBikesPerDay: number;
  bookedBikes: number;
  availableBikes: number;
  isAvailable: boolean;
  maxBikesPerOrder: number;
}

export interface SlotAvailabilityCheck {
  available: boolean;
  reason?: string;
  message?: string;
  availableBikes?: number;
  maxBikesPerDay?: number;
  maxBikesPerOrder?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceSlotService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.serviceSlots.base}`;
  private http = inject(HttpClient);
  
  // Cache dla dostępności na następne dni
  private availabilityCache: Observable<ServiceSlotAvailability[]> | null = null;
  
  constructor() { }

  /**
   * Pobiera dostępność slotów na określoną datę
   * @param date Data w formacie ISO (YYYY-MM-DD)
   */
  getSlotAvailability(date: string): Observable<ServiceSlotAvailability> {
    const params = new HttpParams().set('date', date);
    
    return this.http.get<ServiceSlotAvailability>(`${this.apiUrl}/availability`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching slot availability:', error);
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Pobiera dostępność slotów na zakres dat
   * @param startDate Data początkowa w formacie ISO (YYYY-MM-DD)
   * @param endDate Data końcowa w formacie ISO (YYYY-MM-DD)
   */
  getSlotAvailabilityRange(startDate: string, endDate: string): Observable<ServiceSlotAvailability[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<ServiceSlotAvailability[]>(`${this.apiUrl}/availability/range`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching slot availability range:', error);
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Pobiera dostępność slotów na następne X dni
   * @param startDate Data początkowa w formacie ISO (YYYY-MM-DD)
   * @param days Liczba dni
   */
  getNextDaysAvailability(startDate: string, days: number = 30): Observable<ServiceSlotAvailability[]> {
    // Użyj cache jeśli istnieje
    if (this.availabilityCache) {
      return this.availabilityCache;
    }
    
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('days', days.toString());
    
    this.availabilityCache = this.http.get<ServiceSlotAvailability[]>(`${this.apiUrl}/availability/next-days`, { params })
      .pipe(
        shareReplay(1),
        catchError(error => {
          console.error('Error fetching next days availability:', error);
          this.availabilityCache = null; // Reset cache on error
          return throwError(() => error);
        })
      );
    
    return this.availabilityCache;
  }
  
  /**
   * Sprawdza, czy dla danej daty i liczby rowerów są dostępne sloty
   * @param date Data w formacie ISO (YYYY-MM-DD)
   * @param bikesCount Liczba rowerów
   */
  checkAvailability(date: string, bikesCount: number): Observable<SlotAvailabilityCheck> {
    const params = new HttpParams()
      .set('date', date)
      .set('bikesCount', bikesCount.toString());
    
    return this.http.get<SlotAvailabilityCheck>(`${this.apiUrl}/check-availability`, { params })
      .pipe(
        catchError(error => {
          console.error('Error checking slot availability:', error);
          return throwError(() => error);
        })
      );
  }
  
  /**
   * Wyczyść cache
   */
  clearCache(): void {
    this.availabilityCache = null;
  }
}