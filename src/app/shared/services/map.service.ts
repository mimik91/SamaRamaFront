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

export interface BikeRepairCoverageDto {
  id: number;
  name: string;
  categoryId: number;
}

export interface BikeRepairCoverageCategoryDto {
  id: number;
  name: string;
  displayOrder: number;
}

export interface BikeRepairCoverageMapDto {
  coveragesByCategory: { [key: string]: BikeRepairCoverageDto[] };
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
  page?: number;
  perPage?: number;
  coverageIds?: number[];
}

export interface MapServicesResponseDto {
  data: MapPin[];
  total: number;
  totalPages?: number;
  sortColumn?: string;
  sortDirection?: string;
  page?: number;
  previous?: number;
  next?: number;
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
      perPage: request.perPage || 25,
      coverageIds: request.coverageIds
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

  getAllRepairCoverages(): Observable<BikeRepairCoverageMapDto | null> {
    console.log('MapService: Fetching repair coverages');
    
    return this.http.get<BikeRepairCoverageMapDto>(`${environment.apiUrl}/bike-services/repair-coverage/all`).pipe(
      tap(coverages => {
        console.log('MapService: Received repair coverages:', coverages);
      }),
      catchError(error => {
        console.error('MapService: Error fetching repair coverages:', error);
        return of(null);
      })
    );
  }

  filterByCoverages(coverageIds: number[]): Observable<MapServicesResponseDto> {
    console.log('MapService: Filtering by coverages:', coverageIds);
    
    return this.http.post<MapServicesResponseDto>(`${this.apiUrl}/filter`, { coverageIds }).pipe(
      tap(response => {
        console.log('MapService: Filtered services:', response);
      }),
      catchError(error => {
        console.error('MapService: Error filtering services:', error);
        return of({ data: [], total: 0 });
      })
    );
  }
}