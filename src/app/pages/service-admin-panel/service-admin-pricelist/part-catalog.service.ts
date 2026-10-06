import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { MyPartPriceDto, PartCatalogItemDto, UpdateMyPartPriceRequest } from '../../../shared/models/part-catalog.models';

@Injectable({
  providedIn: 'root'
})
export class PartCatalogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}${environment.endpoints.bikeServicesRegistered.base}`;
  private adminUrl = `${environment.apiUrl}${environment.endpoints.admin.base}`;

  // === MY-SERVICE ===

  /** Pełny katalog nazw + własna cena serwisu (null, jeśli jeszcze nie ustawiona) */
  getMyPartPrices(serviceId: number): Observable<MyPartPriceDto[]> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.get<MyPartPriceDto[]>(`${this.apiUrl}/my-service/part-prices`, { params });
  }

  /** Pojedynczy zapis ceny — bez czyszczenia reszty cennika */
  updateMyPartPrice(serviceId: number, partCatalogItemId: number, price: number): Observable<{ message: string }> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    const body: UpdateMyPartPriceRequest = { price };
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/my-service/part-prices/${partCatalogItemId}`,
      body,
      { params }
    );
  }

  // === ADMIN ===

  listPartCatalogItems(): Observable<PartCatalogItemDto[]> {
    return this.http.get<PartCatalogItemDto[]>(`${this.adminUrl}/part-catalog-items`);
  }

  createPartCatalogItem(name: string): Observable<PartCatalogItemDto> {
    return this.http.post<PartCatalogItemDto>(`${this.adminUrl}/part-catalog-items`, { name });
  }

  updatePartCatalogItem(id: number, name: string): Observable<PartCatalogItemDto> {
    return this.http.put<PartCatalogItemDto>(`${this.adminUrl}/part-catalog-items/${id}`, { name });
  }

  deletePartCatalogItem(id: number, force = false): Observable<{ message: string; affectedServices: number }> {
    const params = new HttpParams().set('force', force.toString());
    return this.http.delete<{ message: string; affectedServices: number }>(
      `${this.adminUrl}/part-catalog-items/${id}`,
      { params }
    );
  }

  mergePartCatalogItems(sourceId: number, targetId: number): Observable<{ message: string; pricesMoved: number; pricesDropped: number }> {
    return this.http.post<{ message: string; pricesMoved: number; pricesDropped: number }>(
      `${this.adminUrl}/part-catalog-items/${sourceId}/merge-into/${targetId}`,
      {}
    );
  }
}
