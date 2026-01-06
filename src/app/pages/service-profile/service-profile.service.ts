import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environments';
import { 
  BikeServicePublicInfo, 
  ServiceActiveStatus 
} from '../../shared/models/bike-service-common.models';
import { OpeningHoursDto, OpeningHoursWithInfoDto } from '../../shared/models/opening-hours.models';
import { 
  ServicePricelistDto,
  CategoryWithItemsDto 
} from '../../shared/models/service-pricelist.models';
import {
  ServicePackagesConfigDto,
  ServicePackageDto
} from '../../shared/models/service-packages.models';

// ===== POMOCNICZE INTERFACES =====

export interface ServiceIdResponse {
  id: number;
}

export interface ServiceImageResponse {
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceProfileService {
  private http = inject(HttpClient);
  
  // Stała konfiguracja endpointów
  public readonly API_BASE = environment.apiUrl;

  /**
   * Pobiera ID serwisu na podstawie suffixu
   */
  getServiceIdBySuffix(suffix: string): Observable<ServiceIdResponse> {
    const url = `${this.API_BASE}/bike-services/by-suffix/${suffix}`;
    return this.http.get<ServiceIdResponse>(url);
  }

  /**
   * Pobiera publiczne informacje o serwisie
   */
  getPublicInfo(serviceId: number): Observable<BikeServicePublicInfo> {
    const url = `${this.API_BASE}/bike-services/${serviceId}/public-info`;
    return this.http.get<BikeServicePublicInfo>(url);
  }

  /**
   * Pobiera status aktywności cennika, godzin otwarcia i pakietów
   */
  getActiveStatus(serviceId: number): Observable<ServiceActiveStatus> {
    const url = `${this.API_BASE}/bike-services/${serviceId}/active-status`;
    return this.http.get<ServiceActiveStatus>(url);
  }

  /**
   * Pobiera godziny otwarcia (jeśli aktywne)
   */
  getOpeningHours(serviceId: number): Observable<OpeningHoursWithInfoDto> {
    const url = `${this.API_BASE}/bike-services/${serviceId}/opening-hours`;
    return this.http.get<OpeningHoursWithInfoDto>(url);
  }

  /**
   * Pobiera cennik (jeśli aktywny)
   */
  getPricelist(serviceId: number): Observable<ServicePricelistDto> {
    const url = `${this.API_BASE}/bike-services/${serviceId}/pricelist`;
    return this.http.get<ServicePricelistDto>(url);
  }

  /**
   * Pobiera wszystkie dostępne kategorie i itemy cennika
   */
  getAllAvailableItems(): Observable<CategoryWithItemsDto[]> {
    const url = `${this.API_BASE}/bike-services/pricelist/available-items`;
    return this.http.get<CategoryWithItemsDto[]>(url);
  }

  /**
   * Pobiera konfigurację pakietów serwisowych
   */
  getPackagesConfig(serviceId: number): Observable<ServicePackagesConfigDto> {
    const url = `${this.API_BASE}/bike-services/service-packages-config?serviceId=${serviceId}`;
    return this.http.get<ServicePackagesConfigDto>(url);
  }

  /**
   * Pobiera wszystkie typy rowerów, które serwis obsługuje
   */
  getBikeTypes(serviceId: number): Observable<string[]> {
    const url = `${this.API_BASE}/bike-services/coverages/bikeTypes/${serviceId}`;
    return this.http.get<string[]>(url);
  }

  /**
   * Pobiera obraz serwisu (LOGO, ABOUT_US, OPENING_HOURS)
   */
  getServiceImage(serviceId: number, imageType: 'LOGO' | 'ABOUT_US' | 'OPENING_HOURS'): Observable<ServiceImageResponse> {
    const url = `${this.API_BASE}/services/${serviceId}/images/${imageType}`;
    return this.http.get<ServiceImageResponse>(url);
  }
}