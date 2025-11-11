import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../core/api-config';

// ===== INTERFACES =====

export interface PricelistCategoryDto {
  id: number;
  name: string;
  displayOrder: number;
  createdAt: string;
}

export interface PricelistItemDto {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithItemsDto {
  category: PricelistCategoryDto;
  items: PricelistItemDto[];
}

export interface ServicePricelistDto {
  items: { [itemId: number]: number }; // itemId -> price
  pricelistInfo: string | null;
  pricelistNote: string | null;
  pricelistActive: boolean;
}

export interface ServicePricelistUpdateDto {
  items: { [itemId: number]: number }; // itemId -> price
  pricelistInfo: string | null;
  pricelistNote: string | null;
  pricelistActive: boolean;
}

// ===== POMOCNICZE INTERFEJSY DLA WIDOKU =====

export interface PricelistItemWithPrice extends PricelistItemDto {
  price: number | null;
  isAssigned: boolean;
}

export interface CategoryWithPrices {
  category: PricelistCategoryDto;
  items: PricelistItemWithPrice[];
}

@Injectable({
  providedIn: 'root'
})
export class PricelistService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bike-services-registered`;

  /**
   * Pobiera wszystkie dostępne kategorie i itemy cennika
   */
  getAllAvailableItems(): Observable<CategoryWithItemsDto[]> {
    return this.http.get<CategoryWithItemsDto[]>(
      `${this.apiUrl}/pricelist/available-items`
    );
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
}
