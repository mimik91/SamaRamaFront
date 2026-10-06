import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environments';
import {
  PricelistCategoryDto,
  PricelistItemDto,
  CategoryWithItemsDto,
  ServicePricelistDto,
  ServicePricelistUpdateDto,
  PricelistItemWithPrice,
  CategoryWithPrices
} from '../../../shared/models/service-pricelist.models';
import {
  ApprovePricelistSuggestionRequest,
  PricelistSuggestionDto
} from '../../../shared/models/pricelist-suggestion.models';

@Injectable({
  providedIn: 'root'
})
export class PricelistService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}${environment.endpoints.bikeServicesRegistered.base}`;
  private adminUrl = `${environment.apiUrl}${environment.endpoints.admin.base}`;

  private availableItemsCache$: Observable<CategoryWithItemsDto[]> | null = null;

  getAllAvailableItems(): Observable<CategoryWithItemsDto[]> {
    if (!this.availableItemsCache$) {
      this.availableItemsCache$ = this.http
        .get<CategoryWithItemsDto[]>(`${this.apiUrl}/pricelist/available-items`)
        .pipe(shareReplay(1));
    }
    return this.availableItemsCache$;
  }

  /**
   * Pobiera tylko kategorie (bez itemów)
   */
  getAllCategories(): Observable<PricelistCategoryDto[]> {
    return this.http.get<PricelistCategoryDto[]>(
      `${this.apiUrl}/pricelist/categories`
    );
  }

  /**
   * Pobiera cennik konkretnego serwisu
   */
  getMyPricelist(serviceId: number): Observable<ServicePricelistDto> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.get<ServicePricelistDto>(
      `${this.apiUrl}/my-service/pricelist`,
      { params }
    );
  }

  /**
   * Aktualizuje cennik serwisu
   */
  updateMyPricelist(
    serviceId: number,
    pricelist: ServicePricelistUpdateDto
  ): Observable<ServicePricelistDto> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.put<ServicePricelistDto>(
      `${this.apiUrl}/my-service/pricelist`,
      pricelist,
      { params }
    );
  }

  /**
   * Łączy dostępne itemy z cenami serwisu
   * Pomocnicza metoda do użycia w komponencie
   */
  mergeItemsWithPrices(
    availableCategories: CategoryWithItemsDto[],
    servicePricelist: ServicePricelistDto
  ): CategoryWithPrices[] {
    return availableCategories.map(catWithItems => {
      const itemsWithPrices: PricelistItemWithPrice[] = catWithItems.items.map(item => {
        const price = servicePricelist.items[item.id] || null;
        return {
          ...item,
          price: price,
          isAssigned: price !== null
        };
      });

      return {
        category: catWithItems.category,
        items: itemsWithPrices
      };
    });
  }

  // ============================================
  // ADMIN — kategorie i pozycje cennika
  // ============================================

  adminListCategories(): Observable<PricelistCategoryDto[]> {
    return this.http.get<PricelistCategoryDto[]>(`${this.adminUrl}/pricelist-categories`);
  }

  adminCreateCategory(name: string): Observable<{ message: string; category: PricelistCategoryDto }> {
    return this.http.post<{ message: string; category: PricelistCategoryDto }>(
      `${this.adminUrl}/pricelist-categories`,
      { name }
    );
  }

  adminUpdateCategory(id: number, name: string): Observable<{ message: string; category: PricelistCategoryDto }> {
    return this.http.put<{ message: string; category: PricelistCategoryDto }>(
      `${this.adminUrl}/pricelist-categories/${id}`,
      { name }
    );
  }

  adminDeleteCategory(id: number, force = false): Observable<{ message: string; deletedItemCount: number }> {
    const params = new HttpParams().set('force', force.toString());
    return this.http.delete<{ message: string; deletedItemCount: number }>(
      `${this.adminUrl}/pricelist-categories/${id}`,
      { params }
    );
  }

  adminListItems(): Observable<PricelistItemDto[]> {
    return this.http.get<PricelistItemDto[]>(`${this.adminUrl}/pricelist-items`);
  }

  adminCreateItem(name: string, categoryId: number): Observable<{ message: string; item: PricelistItemDto }> {
    return this.http.post<{ message: string; item: PricelistItemDto }>(
      `${this.adminUrl}/pricelist-items`,
      { name, categoryId }
    );
  }

  adminUpdateItem(id: number, name: string, categoryId: number): Observable<{ message: string; item: PricelistItemDto }> {
    return this.http.put<{ message: string; item: PricelistItemDto }>(
      `${this.adminUrl}/pricelist-items/${id}`,
      { name, categoryId }
    );
  }

  adminDeleteItem(id: number, force = false): Observable<{ message: string; affectedServices: number }> {
    const params = new HttpParams().set('force', force.toString());
    return this.http.delete<{ message: string; affectedServices: number }>(
      `${this.adminUrl}/pricelist-items/${id}`,
      { params }
    );
  }

  // ============================================
  // ADMIN — sugestie cennikowe
  // ============================================

  adminListSuggestions(): Observable<PricelistSuggestionDto[]> {
    return this.http.get<PricelistSuggestionDto[]>(`${this.adminUrl}/pricelist-suggestions`);
  }

  adminApproveSuggestion(
    id: number,
    request: ApprovePricelistSuggestionRequest
  ): Observable<{ message: string; item: PricelistItemDto; pricedServices: number }> {
    return this.http.post<{ message: string; item: PricelistItemDto; pricedServices: number }>(
      `${this.adminUrl}/pricelist-suggestions/${id}/approve`,
      request
    );
  }

  adminRejectSuggestion(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.adminUrl}/pricelist-suggestions/${id}`);
  }
}
