import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { MonthlyOrderStatsDto, TechnicianStatsDto } from '../../../shared/models/service-stats.models';

@Injectable({
  providedIn: 'root'
})
export class ServiceStatsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/service-calendar`;

  /** Liczba zamkniętych zleceń per miesiąc, ostatnie 13 miesięcy (rollujące okno), rosnąco */
  getMonthlyOrderStats(serviceId: number): Observable<MonthlyOrderStatsDto[]> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.get<MonthlyOrderStatsDto[]>(`${this.apiUrl}/stats/monthly-orders`, { params });
  }

  /** Liczba wykonanych zleceń + przychód per serwisant (cumulative), w tym wiersz "Nieprzypisane" */
  getTechnicianStats(serviceId: number): Observable<TechnicianStatsDto[]> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.get<TechnicianStatsDto[]>(`${this.apiUrl}/stats/technicians`, { params });
  }
}
