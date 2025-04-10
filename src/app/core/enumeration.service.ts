import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnumerationService {
  private apiUrl = 'http://localhost:8080/api/enumerations';
  private http = inject(HttpClient);
  
  // Cache dla wszystkich wartości
  private enumerationsCache$: Observable<Record<string, string[]>> | null = null;
  
  // Cache dla poszczególnych typów
  private typeCache: Record<string, Observable<string[]>> = {};

  constructor() {}
  
  /**
   * Pobiera wszystkie wartości dla wszystkich typów
   */
  getAllEnumerations(): Observable<Record<string, string[]>> {
    if (!this.enumerationsCache$) {
      this.enumerationsCache$ = this.http.get<Record<string, string[]>>(this.apiUrl)
        .pipe(
          map(data => {
            // Sortowanie wszystkich list
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
   * Pobiera wartości dla konkretnego typu
   * @param type Typ (BRAND, BIKE_TYPE, FRAME_MATERIAL)
   */
  getEnumeration(type: string): Observable<string[]> {
    if (!this.typeCache[type]) {
      this.typeCache[type] = this.http.get<string[]>(`${this.apiUrl}/${type}`)
        .pipe(
          map(values => {
            // Sortowanie alfabetyczne z uwzględnieniem diakrytyków
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
   * Czyści cache, wymuszając ponowne pobranie danych
   */
  clearCache(): void {
    this.enumerationsCache$ = null;
    this.typeCache = {};
  }
}