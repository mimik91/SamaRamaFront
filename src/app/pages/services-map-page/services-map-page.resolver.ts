// src/app/pages/services-map-page/services-map-page.resolver.ts

import { Injectable, inject } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MapService } from './services/map.service';
import {
  MapPin,
  MapServicesRequestDto,
  CoverageCategory,
  BikeRepairCoverageDto,
  BikeRepairCoverageCategoryDto
} from '../../shared/models/map.models';

/**
 * Dane rozwiązane przez resolver - dostępne w komponencie przez route.data
 */
export interface ServicesMapResolvedData {
  services: MapPin[];
  total: number;
  coverageCategories: CoverageCategory[];
  city?: string;
  coverageIds?: number[];
}

/**
 * Resolver dla mapy serwisów rowerowych
 *
 * Angular Universal czeka na zakończenie resolvera przed wysłaniem HTML,
 * dzięki czemu:
 * - Googlebot widzi listę serwisów w HTML
 * - AI crawlery (ChatGPT, Gemini, Claude) widzą pełne dane
 * - Użytkownik otrzymuje stronę z danymi (lepsze SEO)
 */
@Injectable({ providedIn: 'root' })
export class ServicesMapResolver implements Resolve<ServicesMapResolvedData> {
  private mapService = inject(MapService);

  // Domyślne bounds dla całej Polski
  private readonly polandBounds = {
    south: 49.0,
    west: 14.1,
    north: 54.9,
    east: 24.2
  };

  resolve(route: ActivatedRouteSnapshot): Observable<ServicesMapResolvedData> {
    // Odczytaj parametry z query string
    const city = route.queryParamMap.get('city') || undefined;
    const coveragesParam = route.queryParamMap.get('coverages');
    const coverageIds = coveragesParam
      ? coveragesParam.split(',').map(Number).filter(n => !isNaN(n) && n > 0)
      : undefined;

    // Przygotuj request dla serwisów
    const servicesRequest: MapServicesRequestDto = {
      type: 'event',
      bounds: this.getBoundsString(city),
      page: 0,
      perPage: 50, // Pierwsza strona dla SSR
      coverageIds: coverageIds && coverageIds.length > 0 ? coverageIds : undefined
    };

    // Pobierz dane równolegle: serwisy + kategorie usług
    return forkJoin({
      services: this.mapService.getServices(servicesRequest).pipe(
        catchError(err => {
          console.error('[ServicesMapResolver] Błąd pobierania serwisów:', err);
          return of({ data: [], total: 0 });
        })
      ),
      coverages: this.mapService.getAllRepairCoverages().pipe(
        catchError(err => {
          console.error('[ServicesMapResolver] Błąd pobierania kategorii:', err);
          return of(null);
        })
      )
    }).pipe(
      map(({ services, coverages }) => ({
        services: services?.data || [],
        total: services?.total || 0,
        coverageCategories: this.processCoverageCategories(coverages?.coveragesByCategory),
        city,
        coverageIds
      }))
    );
  }

  /**
   * Zwraca bounds string dla API
   * Jeśli miasto jest podane, zwraca bounds dla miasta (zoom 13)
   * W przeciwnym razie zwraca bounds dla całej Polski
   */
  private getBoundsString(city?: string): string {
    // TODO: W przyszłości można dodać mapowanie miasto -> współrzędne
    // Na razie używamy domyślnych bounds dla Polski
    const bounds = this.polandBounds;
    return `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  }

  /**
   * Przetwarza surowe dane kategorii z API na format używany przez komponent
   */
  private processCoverageCategories(
    coveragesByCategory?: { [key: string]: BikeRepairCoverageDto[] }
  ): CoverageCategory[] {
    if (!coveragesByCategory) {
      return [];
    }

    const categoriesMap = new Map<string, CoverageCategory>();

    Object.entries(coveragesByCategory).forEach(([key, coverages]) => {
      try {
        // Parse the string format: "BikeRepairCoverageCategoryDto(id=1, name=Typ roweru, displayOrder=1)"
        const idMatch = key.match(/id=(\d+)/);
        const nameMatch = key.match(/name=([^,)]+)/);
        const displayOrderMatch = key.match(/displayOrder=(\d+)/);

        if (idMatch && nameMatch) {
          const categoryData: BikeRepairCoverageCategoryDto = {
            id: parseInt(idMatch[1]),
            name: nameMatch[1].trim(),
            displayOrder: displayOrderMatch ? parseInt(displayOrderMatch[1]) : 0
          };

          if (Array.isArray(coverages) && coverages.length > 0) {
            categoriesMap.set(key, {
              category: categoryData,
              coverages: coverages
            });
          }
        }
      } catch (error) {
        console.error('[ServicesMapResolver] Błąd przetwarzania kategorii:', key, error);
      }
    });

    return Array.from(categoriesMap.values())
      .sort((a, b) => (a.category.displayOrder || 0) - (b.category.displayOrder || 0));
  }
}
