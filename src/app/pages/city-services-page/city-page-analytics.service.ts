import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../environments/environments';

export interface CityPageViewReport {
  citySlug: string | null;
  resultCount: number;
  bounds?: string;
  searchQuery?: string;
  coverageIds?: string;
  fullQueryString?: string;
}

/**
 * Telemetria wyświetleń /serwisy/:city — diagnostyka rozbieżności w liczbie wyników
 * (np. 98 vs 99 dla "tego samego" wyszukania Krakowa). Fire-and-forget, tylko z przeglądarki
 * (patrz city-services-page.component.ts) - błąd wysyłki nigdy nie może wpłynąć na UI.
 */
@Injectable({ providedIn: 'root' })
export class CityPageAnalyticsService {
  private http = inject(HttpClient);

  reportView(report: CityPageViewReport): void {
    const url = `${environment.apiUrl}${environment.endpoints.analytics.cityPageView}`;
    this.http.post(url, report).pipe(
      catchError(() => of(null))
    ).subscribe();
  }
}
