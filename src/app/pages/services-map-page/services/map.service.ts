// src/app/pages/services-map-page/services/map.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environments';
import {
  MapPin,
  ServiceDetails,
  CitySuggestion,
  CityBounds,
  BikeRepairCoverageMapDto,
  MapServicesRequestDto,
  MapServicesResponseDto
} from '../../../shared/models/map.models';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}${environment.endpoints.map}`;

  getServices(request: MapServicesRequestDto): Observable<MapServicesResponseDto> {
    console.log('MapService: Fetching services from:', `${this.apiUrl}/services`);
    
    const finalRequestBody: any = {
      type: request.type || 'event',
      payload: request.payload || this.getDefaultPayload(),
      bounds: request.bounds,
      page: request.page || 0,
      perPage: request.perPage || 25,
  };

  if (request.coverageIds && request.coverageIds.length > 0) {
      finalRequestBody.coverageIds = request.coverageIds;
  }
    
    return this.http.post<MapServicesResponseDto>(`${this.apiUrl}/services`, finalRequestBody).pipe(
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
    
    const params = { city: query.trim() };
    
    return this.http.get<CitySuggestion[]>(`${this.apiUrl}/cities/coords`, { params }).pipe(
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

  getClusteredPins(zoom: number, bounds?: string, city?: string, coverageIds?: number[]): Observable<any> {
    console.log('MapService: Fetching clustered pins with zoom:', zoom);
    
    const params: any = { zoom: zoom.toString() };
    if (bounds) params.bounds = bounds;
    if (city) params.city = city;
    if (coverageIds && coverageIds.length > 0) params.coveragesIds = coverageIds; 
    
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
    console.log('MapService: Filtering by coverage IDs:', coverageIds);
    
    return this.http.post<MapServicesResponseDto>(
      `${environment.apiUrl}/bike-services/filter-coverage`,
      { coverageIds }
    ).pipe(
      tap(response => {
        console.log('MapService: Filtered services response:', response);
      }),
      catchError(error => {
        console.error('MapService: Error filtering by coverages:', error);
        return of({ data: [], total: 0 });
      })
    );
  }

  getServiceSuffix(serviceId: number): Observable<{ suffix: string } | null> {
    console.log('MapService: Fetching suffix for service ID:', serviceId);
    
    // Używamy endpointu zadeklarowanego w backendzie: /get-suffix
    return this.http.get<{ suffix: string }>(`${environment.apiUrl}/bike-services/get-suffix`, {
        params: { serviceId: serviceId.toString() }
    }).pipe(
        tap(response => {
            console.log('MapService: Received service suffix:', response.suffix);
        }),
        catchError(error => {
            console.error('MapService: Error fetching service suffix:', error);
            // Zwróć null w przypadku błędu
            return of(null);
        })
    );
  }

  private getDefaultPayload(): any {
    if (typeof window === 'undefined') {
      return {};
    }
    
    return {
      website: window.location.hostname,
      screen: `${window.screen.width}x${window.screen.height}`,
      hostname: window.location.hostname,
      language: navigator.language,
      referrer: document.referrer,
      title: document.title,
      url: window.location.href
    };
  }
}