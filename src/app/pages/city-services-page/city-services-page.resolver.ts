import { Injectable, inject } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MapService } from '../services-map-page/services/map.service';
import { MapPin, MapServicesRequestDto, MapServicesResponseDto } from '../../shared/models/map.models';
import { environment } from '../../environments/environments';
import { CityConfig } from './city-services-page.component';

/**
 * Dane rozwiązane przez resolver - dostępne w komponencie przez route.data
 */
export interface CityServicesResolvedData {
  city: CityConfig;
  services: MapPin[];
  total: number;
}

/**
 * Resolver dla listy serwisów w mieście
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

    if (!citySlug) {
      console.error('[CityServicesResolver] Brak slug miasta w URL');
      return of(null);
    }

    // Znajdź miasto w konfiguracji
    const city = this.cities.find(c => c.slug === citySlug);

    if (!city) {
      console.error('[CityServicesResolver] Nie znaleziono miasta:', citySlug);
      return of(null);
    }

    // Oblicz bounds dla miasta
    const bounds = this.calculateBounds(city.latitude, city.longitude, 13, 3000, 1800);

    const request: MapServicesRequestDto = {
      type: 'event',
      bounds: `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`,
      page: 0,
      perPage: 1000
    };

    // Pobierz serwisy dla miasta
    return this.mapService.getServices(request).pipe(
      map(response => ({
        city,
        services: response?.data || [],
        total: response?.total || 0
      })),
      catchError(err => {
        console.error('[CityServicesResolver] Błąd pobierania serwisów:', err);
        // Zwróć miasto ale bez serwisów
        return of({
          city,
          services: [],
          total: 0
        });
      })
    );
  }

  private calculateBounds(
    lat: number,
    lng: number,
    zoom: number,
    viewportWidth: number,
    viewportHeight: number
  ): { south: number; west: number; north: number; east: number } {
    const metersPerPixel = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
    const halfWidthDeg = (viewportWidth * metersPerPixel) / 111320 / 2;
    const halfHeightDeg = (viewportHeight * metersPerPixel) / 110540 / 2;

    return {
      south: lat - halfHeightDeg,
      north: lat + halfHeightDeg,
      west: lng - halfWidthDeg,
      east: lng + halfWidthDeg
    };
  }
}
