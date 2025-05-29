import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../core/api-config';

export interface MapPin {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
}

export interface ServiceDetails {
  id: number;
  name: string;
  street: string;
  building: string;
  flat?: string;
  postalCode?: string;
  city: string;
  phoneNumber: string;
  businessPhone?: string;
  email: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  verified: boolean;
  active: boolean;
  createdAt: string;
  lastModifiedAt?: string;
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
    console.log('MapService: Fetching pins from:', `${this.apiUrl}/pins`);
    
    return this.http.get<MapPin[]>(`${this.apiUrl}/pins`).pipe(
      tap(pins => {
        console.log('MapService: Received pins:', pins);
        // Sprawdź jakość danych
        const validPins = pins.filter(pin => 
          pin.latitude && pin.longitude && 
          !isNaN(pin.latitude) && !isNaN(pin.longitude)
        );
        console.log(`MapService: Valid pins: ${validPins.length}/${pins.length}`);
      }),
      catchError(error => {
        console.error('MapService: Error fetching map pins:', error);
        
        // Zwróć pustą tablicę zamiast testowych danych, aby nie spowalniać strony
        return of([]);
      })
    );
  }

  /**
   * Pobiera szczegóły serwisu po ID
   */
  getServiceDetails(id: number): Observable<ServiceDetails | null> {
    console.log('MapService: Fetching service details for ID:', id);
    
    return this.http.get<ServiceDetails>(`${this.apiUrl}/${id}`).pipe(
      tap(details => {
        console.log('MapService: Received service details:', details);
      }),
      catchError(error => {
        console.error('MapService: Error fetching service details:', error);
        
        // W przypadku błędu, zwróć przykładowe dane testowe
        const testService: ServiceDetails = {
          id: id,
          name: `Serwis Testowy ${id}`,
          street: 'ul. Testowa',
          building: '123',
          city: 'Kraków',
          phoneNumber: '123456789',
          email: 'test@example.com',
          latitude: 50.0647,
          longitude: 19.9450,
          description: 'To jest testowy serwis rowerowy.',
          verified: true,
          active: true,
          createdAt: new Date().toISOString()
        };
        
        console.log('MapService: Using test service data:', testService);
        return of(testService);
      })
    );
  }
}