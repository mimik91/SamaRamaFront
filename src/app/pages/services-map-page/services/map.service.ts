// src/app/pages/services-map-page/services/map.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap, shareReplay, throwError, map } from 'rxjs';
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

  // Cache for service details to avoid redundant API calls
  private serviceDetailsCache = new Map<number, Observable<ServiceDetails | null>>();
  private citySearchCache = new Map<string, Observable<CitySuggestion[]>>();

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
      map(response => {
        // Validate response structure
        if (!response || typeof response !== 'object') {
          console.error('MapService: Invalid response structure');
          return { data: [], total: 0 };
        }

        // Ensure data is an array
        if (!Array.isArray(response.data)) {
          console.error('MapService: Response data is not an array');
          return { data: [], total: 0 };
        }

        // Filter out invalid pins
        const validPins = response.data.filter(pin =>
          pin &&
          typeof pin === 'object' &&
          pin.id != null &&
          pin.latitude != null &&
          pin.longitude != null &&
          !isNaN(pin.latitude) &&
          !isNaN(pin.longitude) &&
          Math.abs(pin.latitude) <= 90 &&
          Math.abs(pin.longitude) <= 180
        );

        const invalidCount = response.data.length - validPins.length;
        if (invalidCount > 0) {
          console.warn(`MapService: Filtered out ${invalidCount} invalid pins`);
        }

        return {
          data: validPins,
          total: typeof response.total === 'number' ? response.total : validPins.length
        };
      }),
      catchError(error => {
        console.error('MapService: Error fetching map services:', error);
        return of({ data: [], total: 0 });
      })
    );
  }

  getServiceDetails(id: number): Observable<ServiceDetails | null> {
    // Validate input ID
    if (id == null || typeof id !== 'number' || id <= 0 || !Number.isInteger(id)) {
      console.error('MapService: Invalid service ID:', id);
      return of(null);
    }

    // Check if we already have this request cached
    if (!this.serviceDetailsCache.has(id)) {
      console.log('MapService: Fetching service details for ID:', id);

      // Create the HTTP request with caching
      const request$ = this.http.get<ServiceDetails>(`${this.apiUrl}/service/${id}`).pipe(
        map(details => {
          // Validate response structure
          if (!details || typeof details !== 'object') {
            console.error('MapService: Invalid service details structure for ID:', id);
            return null;
          }

          // Validate required fields
          if (details.id == null || typeof details.id !== 'number') {
            console.error('MapService: Service details missing valid id for ID:', id);
            return null;
          }

          return details;
        }),
        // Share the result with all subscribers and cache it
        shareReplay({ bufferSize: 1, refCount: true }),
        catchError(error => {
          console.error('MapService: Error fetching service details:', error);
          // Remove from cache on error so next attempt will retry
          this.serviceDetailsCache.delete(id);
          return of(null);
        })
      );

      // Store in cache
      this.serviceDetailsCache.set(id, request$);
    }

    // Return cached observable
    return this.serviceDetailsCache.get(id)!;
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

    const normalizedQuery = query.trim().toLowerCase();

    // Check cache
    if (!this.citySearchCache.has(normalizedQuery)) {
      console.log('MapService: Searching cities with query:', query);

      const params = { city: query.trim() };

      const request$ = this.http.get<CitySuggestion[]>(`${this.apiUrl}/cities/coords`, { params }).pipe(
        map(cities => {
          // Validate response is an array
          if (!Array.isArray(cities)) {
            console.error('MapService: Cities response is not an array');
            return [];
          }

          // Filter valid city suggestions
          const validCities = cities.filter(city =>
            city &&
            typeof city === 'object' &&
            city.cityName &&
            typeof city.cityName === 'string' &&
            city.latitude != null &&
            city.longitude != null &&
            !isNaN(city.latitude) &&
            !isNaN(city.longitude)
          );

          if (validCities.length < cities.length) {
            console.warn(`MapService: Filtered out ${cities.length - validCities.length} invalid city suggestions`);
          }

          return validCities;
        }),
        // Cache the results
        shareReplay({ bufferSize: 1, refCount: true }),
        catchError(error => {
          console.error('MapService: Error searching cities:', error);
          // Remove from cache on error
          this.citySearchCache.delete(normalizedQuery);
          return of([]);
        })
      );

      this.citySearchCache.set(normalizedQuery, request$);
    }

    return this.citySearchCache.get(normalizedQuery)!;
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
    // Validate input serviceId
    if (serviceId == null || typeof serviceId !== 'number' || serviceId <= 0 || !Number.isInteger(serviceId)) {
      console.error('MapService: Invalid service ID for suffix request:', serviceId);
      return of(null);
    }

    console.log('MapService: Fetching suffix for service ID:', serviceId);

    // Używamy endpointu zadeklarowanego w backendzie: /get-suffix
    return this.http.get<{ suffix: string }>(`${environment.apiUrl}/bike-services/get-suffix`, {
        params: { serviceId: serviceId.toString() }
    }).pipe(
        map(response => {
          // Validate response structure
          if (!response || typeof response !== 'object') {
            console.error('MapService: Invalid suffix response structure for service ID:', serviceId);
            return null;
          }

          // Validate suffix field
          if (!response.suffix || typeof response.suffix !== 'string' || response.suffix.trim() === '') {
            console.error('MapService: Invalid or empty suffix for service ID:', serviceId);
            return null;
          }

          return { suffix: response.suffix };
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