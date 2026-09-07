import { Injectable, inject } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MapService } from '../services-map-page/services/map.service';
import { MapPin, MapServicesRequestDto, MapServicesResponseDto, calculateCityBounds } from '../../shared/models/map.models';
import { environment } from '../../environments/environments';
import { CityConfig } from './city-services-page.component';

/** Ile serwisów ładujemy na starcie w trybie "wszystkie miasta" (reszta przez "Załaduj więcej") */
const NATIONWIDE_INITIAL_PER_PAGE = 20;

/**
 * Dane rozwiązane przez resolver - dostępne w komponencie przez route.data
 * city === null oznacza tryb "wszystkie serwisy w Polsce" (trasa /serwisy bez :city)
 */
export interface CityServicesResolvedData {
  city: CityConfig | null;
  services: MapPin[];
  total: number;
  /** true = fetch do /map/services się nie wykonał (sieć/CORS/5xx) - total=0 jest wtedy
   * zafałszowany, NIE oznacza realnie pustego wyniku. Patrz MapServicesResponseDto.requestFailed. */
  fetchFailed: boolean;
}

/**
 * Resolver dla listy serwisów — per miasto (/serwisy/:city) albo dla całej Polski (/serwisy)
 *
 * Angular Universal czeka na zakończenie resolvera przed wysłaniem HTML,
 * dzięki czemu AI crawlery (ChatGPT, Gemini, Claude) widzą pełne dane w HTML.
 */
@Injectable({ providedIn: 'root' })
export class CityServicesResolver implements Resolve<CityServicesResolvedData | null> {
  private mapService = inject(MapService);

  // Wszystkie miasta z environment
  private readonly cities: CityConfig[] = environment.settings.seoCities;

  resolve(route: ActivatedRouteSnapshot): Observable<CityServicesResolvedData | null> {
    const citySlug = route.paramMap.get('city');
    // Filtry przekazane z landing page (wyszukiwarka nawiguje tu z queryParams zamiast pokazywać
    // wyniki na miejscu — patrz landing-page.component.ts onSearchSubmit)
    const search = route.queryParamMap.get('search') || undefined;
    const coverageIdsParam = route.queryParamMap.get('coverageIds');
    const coverageIds = coverageIdsParam
      ? coverageIdsParam.split(',').map(Number).filter(n => !isNaN(n))
      : undefined;

    if (!citySlug) {
      // Brak segmentu :city w URL (trasa /serwisy) — tryb "wszystkie serwisy w Polsce"
      return this.fetchNationwide(search, coverageIds);
    }

    // Znajdź miasto w konfiguracji
    const city = this.cities.find(c => c.slug === citySlug);

    if (!city) {
      console.error('[CityServicesResolver] Nie znaleziono miasta:', citySlug);
      return of(null);
    }

    return this.fetchForCity(city, search, coverageIds);
  }

  private fetchForCity(city: CityConfig, search?: string, coverageIds?: number[]): Observable<CityServicesResolvedData> {
    const bounds = calculateCityBounds(city.latitude, city.longitude);

    const request: MapServicesRequestDto = {
      type: 'event',
      bounds: `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`,
      page: 0,
      perPage: 1000,
      search,
      coverageIds
    };

    return this.mapService.getServices(request).pipe(
      map(response => {
        const result = {
          city,
          services: response?.data || [],
          total: response?.total || 0,
          fetchFailed: !!response?.requestFailed
        };
        // Loguje się do stdout procesu SSR (Heroku), niezależnie od tego, czy backend
        // (Render) w ogóle odpowiada — w przeciwieństwie do telemetrii wysyłanej do
        // backendu (CityPageAnalyticsService), to działa nawet gdy Render jest niedostępny.
        console.log('[CityServicesResolver] view', {
          citySlug: city.slug, resultCount: result.total, fetchFailed: result.fetchFailed,
          bounds: request.bounds, search, coverageIds
        });
        return result;
      }),
      catchError(err => {
        console.error('[CityServicesResolver] Błąd pobierania serwisów:', {
          citySlug: city.slug, bounds: request.bounds, search, coverageIds, err
        });
        return of({ city, services: [], total: 0, fetchFailed: true });
      })
    );
  }

  private fetchNationwide(search?: string, coverageIds?: number[]): Observable<CityServicesResolvedData> {
    const request: MapServicesRequestDto = {
      type: 'event',
      bounds: undefined,
      page: 0,
      perPage: NATIONWIDE_INITIAL_PER_PAGE,
      search,
      coverageIds
    };

    return this.mapService.getServices(request).pipe(
      map((response: MapServicesResponseDto) => {
        const result = {
          city: null,
          services: response?.data || [],
          total: response?.total || 0,
          fetchFailed: !!response?.requestFailed
        };
        console.log('[CityServicesResolver] view', {
          citySlug: null, resultCount: result.total, fetchFailed: result.fetchFailed,
          bounds: request.bounds, search, coverageIds
        });
        return result;
      }),
      catchError(err => {
        console.error('[CityServicesResolver] Błąd pobierania wszystkich serwisów:', {
          bounds: request.bounds, search, coverageIds, err
        });
        return of({ city: null, services: [], total: 0, fetchFailed: true });
      })
    );
  }
}
