import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../core/api-config';

// ===== INTERFACES =====

export interface ServiceIdResponse {
  id: number;
}

export interface BikeServicePublicInfo {
  name: string;
  description: string | null;
  email: string | null;
  street: string | null;
  building: string | null;
  flat: string | null;
  postalCode: string | null;
  city: string | null;
  phoneNumber: string | null;
  transportCost: number | null;
  transportAvailable: boolean;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
}

export interface ServiceActiveStatus {
  openingHoursActive: boolean;
  pricelistActive: boolean;
}

export interface DayInterval {
  openTime: string;
  closeTime: string;
}

export interface OpeningHours {
  intervals: { [key: string]: DayInterval };
  openingHoursInfo: string | null;
  openingHoursNote: string | null;
  openingHoursActive: boolean;
}

export interface ServicePricelist {
  items: { [itemId: number]: number };
  pricelistInfo: string | null;
  pricelistNote: string | null;
  pricelistActive: boolean;
}

export interface PricelistItem {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
}

export interface PricelistCategory {
  id: number;
  name: string;
  displayOrder: number;
}

export interface CategoryWithItems {
  category: PricelistCategory;
  items: PricelistItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ServiceProfileService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bike-services`;

  /**
   * Pobiera ID serwisu na podstawie suffixu
   */
  getServiceIdBySuffix(suffix: string): Observable<ServiceIdResponse> {
    return this.http.get<ServiceIdResponse>(`${this.apiUrl}/by-suffix/${suffix}`);
  }

  /**
   * Pobiera publiczne informacje o serwisie
   */
  getPublicInfo(serviceId: number): Observable<BikeServicePublicInfo> {
    return this.http.get<BikeServicePublicInfo>(`${this.apiUrl}/${serviceId}/public-info`);
  }

  /**
   * Pobiera status aktywności cennika i godzin otwarcia
   */
  getActiveStatus(serviceId: number): Observable<ServiceActiveStatus> {
    return this.http.get<ServiceActiveStatus>(`${this.apiUrl}/${serviceId}/active-status`);
  }

  /**
   * Pobiera godziny otwarcia (jeśli aktywne)
   */
  getOpeningHours(serviceId: number): Observable<OpeningHours> {
    return this.http.get<OpeningHours>(`${this.apiUrl}/${serviceId}/opening-hours`);
  }

  /**
   * Pobiera cennik (jeśli aktywny)
   */
  getPricelist(serviceId: number): Observable<ServicePricelist> {
    return this.http.get<ServicePricelist>(`${this.apiUrl}/${serviceId}/pricelist`);
  }

  /**
   * Pobiera wszystkie dostępne kategorie i itemy cennika
   */
  getAllAvailableItems(): Observable<CategoryWithItems[]> {
    return this.http.get<CategoryWithItems[]>(`${this.apiUrl}/pricelist/available-items`);
  }

}