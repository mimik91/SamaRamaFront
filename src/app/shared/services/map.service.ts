import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../core/api-config';

export interface MapPin {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bike-services`;

  /**
   * Pobiera piny serwisów z backendu
   */
  getPins(): Observable<MapPin[]> {
    return this.http.get<MapPin[]>(`${this.apiUrl}/pins`).pipe(
      catchError(error => {
        console.error('Error fetching map pins:', error);
        // Zwracamy pustą tablicę w przypadku błędu
        return of([]);
      })
    );
  }

  /**
   * Pobiera szczegóły serwisu po ID
   */
  getServiceDetails(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching service details:', error);
        return of(null);
      })
    );
  }
}