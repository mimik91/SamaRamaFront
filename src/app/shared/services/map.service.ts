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
  verified?: boolean;
  category?: string;
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
  email: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  verified: boolean;
  transportCost?: number;
  transportAvailable: boolean;
  createdAt: string;
  updatedAt?: string;
  registered: boolean;
}

export interface CitySuggestion {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type: string;
}

export interface CityBounds {
  sw: { latitude: number; longitude: number };
  ne: { latitude: number; longitude: number };
  center: { latitude: number; longitude: number };
  zoom: number;
}

export interface MapServicesRequestDto {
  type?: string;
  payload?: {
    website?: string;
    screen?: string;
    hostname?: string;
    language?: string;
    referrer?: string;
    title?: string;
    url?: string;
  };
  bounds?: string;
  page?: number;      // DODANE
  perPage?: number;   // DODANE
}

export interface MapServicesResponseDto {
  data: MapPin[];
  total: number;
  totalPages?: number;    // DODANE
  sortColumn?: string;
  sortDirection?: string;
  page?: number;          // DODANE
  previous?: number;
  next?: number;          // DODANE
  perPage?: number;
  bounds?: any;
  cache?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/map`;

  /**
   * Pobiera serwisy z nowego endpointu MapController (POST /api/map/services)
   * Z paginacją dla sidebara
   */
  getServices(request: MapServicesRequestDto): Observable<MapServicesResponseDto> {
    console.log('MapService: Fetching services from:', `${this.apiUrl}/services`);
    
    const requestBody: MapServicesRequestDto = {
      type: request.type || 'event',
      payload: request.payload || {
        website: window.location.hostname,
        screen: `${window.screen.width}x${window.screen.height}`,
        hostname: window.location.hostname,
        language: navigator.language,
        referrer: document.referrer,
        title: document.title,
        url: window.location.href
      },
      bounds: request.bounds,
      page: request.page || 0,
      perPage: request.perPage || 25
    };
    
    return this.http.post<MapServicesResponseDto>(`${this.apiUrl}/services`, requestBody).pipe(
      tap(response => {
        console.log('MapService: Received services:', response);
        const validPins = response.data.filter(pin => 
          pin.latitude && pin.longitude && 
          !isNaN(pin.latitude) && !isNaN(pin.longitude)
        );
        console.log(`MapService: Valid pins: ${validPins.length}/${response.data.length}`);
      }),
      catchError(error => {
        console.error('MapService: Error fetching map services:', error);
        return of({ data: [], total: 0 });
      })
    );
  }

  /**
   * Pobiera szczegóły serwisu po ID z MapController
   */
  getServiceDetails(id: number): Observable<ServiceDetails | null> {
    console.log('MapService: Fetching service details for ID:', id);
    
    return this.http.get<ServiceDetails>(`${this.apiUrl}/service/${id}`).pipe(
      tap(details => {
        console.log('MapService: Received service details:', details);
      }),
      catchError(error => {
        console.error('MapService: Error fetching service details:', error);
        return of(null);
      })
    );
  }

  /**
   * Wyszukuje serwisy po nazwie/mieście
   */
  searchServices(query: string, bounds?: string, verifiedOnly = false): Observable<MapServicesResponseDto> {
    console.log('MapService: Searching services with query:', query);
    
    const params: any = {
      query,
      verifiedOnly: verifiedOnly.toString()
    };
    if (bounds) params.bounds = bounds;
    
    return this.http.get<MapServicesResponseDto>(`${this.apiUrl}/search`, { params }).pipe(
      tap(response => {
        console.log('MapService: Search results:', response);
      }),
      catchError(error => {
        console.error('MapService: Error searching services:', error);
        return of({ data: [], total: 0 });
      })
    );
  }

  /**
   * Autocomplete dla serwisów (szybkie wyszukiwanie z limitem)
   */
  searchServicesAutocomplete(query: string, limit: number = 10, registeredFirst: boolean = true): Observable<MapServicesResponseDto> {
    if (!query || query.trim().length < 3) {
      return of({ data: [], total: 0 });
    }

    console.log('MapService: Autocomplete search for:', query);
    
    const params: any = {
      q: query.trim(),
      limit: limit.toString(),
      registeredFirst: registeredFirst.toString()
    };
    
    return this.http.get<MapServicesResponseDto>(`${this.apiUrl}/services/autocomplete`, { params }).pipe(
      tap(response => {
        console.log('MapService: Autocomplete results:', response);
      }),
      catchError(error => {
        console.error('MapService: Error in autocomplete:', error);
        return of({ data: [], total: 0 });
      })
    );
  }

  /**
   * Wyszukiwanie miast (autocomplete)
   */
  searchCities(query: string): Observable<CitySuggestion[]> {
    if (!query || query.trim().length < 3) {
      return of([]);
    }

    console.log('MapService: Searching cities with query:', query);
    
    const params = { q: query.trim() };
    
    return this.http.get<CitySuggestion[]>(`${this.apiUrl}/cities/search`, { params }).pipe(
      tap(cities => {
        console.log('MapService: Found cities:', cities);
      }),
      catchError(error => {
        console.error('MapService: Error searching cities:', error);
        return of([]);
      })
    );
  }

  /**
   * Pobiera granice miasta
   */
  getCityBounds(cityName: string): Observable<CityBounds | null> {
    console.log('MapService: Fetching bounds for city:', cityName);
    
    return this.http.get<CityBounds>(`${this.apiUrl}/cities/${encodeURIComponent(cityName)}/bounds`).pipe(
      tap(bounds => {
        console.log('MapService: City bounds:', bounds);
      }),
      catchError(error => {
        console.error('MapService: Error fetching city bounds:', error);
        return of(null);
      })
    );
  }

  /**
   * Pobiera klastrowane piny z backendu
   * GET /api/map/pins/clustered?zoom=10&bounds=...
   */
  getClusteredPins(zoom: number, bounds?: string, city?: string): Observable<any> {
    console.log('MapService: Fetching clustered pins with zoom:', zoom);
    
    const params: any = { zoom: zoom.toString() };
    if (bounds) params.bounds = bounds;
    if (city) params.city = city;
    
    return this.http.get<any>(`${this.apiUrl}/pins/clustered`, { params }).pipe(
      tap(response => {
        console.log('MapService: Received clustered pins:', response);
      }),
      catchError(error => {
        console.error('MapService: Error fetching clustered pins:', error);
        return of({ data: [], total: 0 });
      })
    );
  }
}