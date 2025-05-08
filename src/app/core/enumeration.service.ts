import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { OrderStatus } from '../service-orders/service-order.model';
import { environment } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class EnumerationService {
  private apiUrl = `${environment.apiUrl}/enumerations`;
  private http = inject(HttpClient);
  
  // Cache for all enumerations
  private enumerationsCache$: Observable<Record<string, string[]>> | null = null;
  
  // Cache for specific enumeration types
  private typeCache: Record<string, Observable<string[]>> = {};
  
  // Cache for order statuses
  private orderStatusCache$: Observable<OrderStatus[]> | null = null;
  
  // Cache for cities 
  private citiesCache$: Observable<string[]> | null = null;

  constructor() {}
  
  /**
   * Get all enumerations (brands, types, materials)
   */
  getAllEnumerations(): Observable<Record<string, string[]>> {
    if (!this.enumerationsCache$) {
      this.enumerationsCache$ = this.http.get<Record<string, string[]>>(this.apiUrl)
        .pipe(
          map(data => {
            // Sort all lists alphabetically
            const sortedData: Record<string, string[]> = {};
            for (const key in data) {
              if (data.hasOwnProperty(key)) {
                sortedData[key] = [...data[key]].sort((a, b) => 
                  a.localeCompare(b, undefined, {sensitivity: 'base'})
                );
              }
            }
            return sortedData;
          }),
          shareReplay(1),
          catchError(error => {
            console.error('Error fetching enumerations:', error);
            return of({});
          })
        );
    }
    
    return this.enumerationsCache$;
  }
  
  /**
   * Get values for a specific enumeration type
   * @param type Enumeration type (BRAND, BIKE_TYPE, FRAME_MATERIAL, CITY)
   */
  getEnumeration(type: string): Observable<string[]> {
    if (!this.typeCache[type]) {
      this.typeCache[type] = this.http.get<string[]>(`${this.apiUrl}/${type}`)
        .pipe(
          map(values => {
            // Sort alphabetically with diacritics support
            return [...values].sort((a, b) => 
              a.localeCompare(b, undefined, {sensitivity: 'base'})
            );
          }),
          shareReplay(1),
          catchError(error => {
            console.error(`Error fetching enumeration ${type}:`, error);
            return of([]);
          })
        );
    }
    
    return this.typeCache[type];
  }
  
  /**
   * Get order status values
   */
  getOrderStatusValues(): Observable<OrderStatus[]> {
    if (!this.orderStatusCache$) {
      this.orderStatusCache$ = this.getEnumeration('ORDER_STATUS') as Observable<OrderStatus[]>;
    }
    
    return this.orderStatusCache$;
  }
  
  /**
   * Get cities values
   */
  getCities(): Observable<string[]> {
    if (!this.citiesCache$) {
      this.citiesCache$ = this.getEnumeration('CITY');
    }
    
    return this.citiesCache$;
  }
  
  /**
   * Clear all caches
   */
  clearCache(): void {
    this.enumerationsCache$ = null;
    this.typeCache = {};
    this.orderStatusCache$ = null;
    this.citiesCache$ = null;
  }
}