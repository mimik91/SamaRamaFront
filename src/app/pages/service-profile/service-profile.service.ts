import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';
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
import {
  ServiceIdResponse,
  ServiceImageResponse
} from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ServiceProfileService {
  private http = inject(HttpClient);

  /**
   * Pobiera ID serwisu na podstawie suffixu
   */
  getServiceIdBySuffix(suffix: string): Observable<ServiceIdResponse> {
    const url = `${environment.apiUrl}${environment.endpoints.bikeServices.bySuffix}/${suffix}`;
    return this.http.get<ServiceIdResponse>(url);
  }

  /**
   * Pobiera publiczne informacje o serwisie
   */
  getPublicInfo(serviceId: number): Observable<BikeServicePublicInfo> {
    const url = `${environment.apiUrl}${environment.endpoints.bikeServices.publicInfo.replace(':id', serviceId.toString())}`;
    return this.http.get<BikeServicePublicInfo>(url);
  }

  /**
   * Pobiera status aktywności cennika, godzin otwarcia i pakietów
   */
  getActiveStatus(serviceId: number): Observable<ServiceActiveStatus> {
    const url = `${environment.apiUrl}${environment.endpoints.bikeServices.activeStatus.replace(':id', serviceId.toString())}`;
    return this.http.get<ServiceActiveStatus>(url);
  }

  /**
   * Pobiera godziny otwarcia (jeśli aktywne)
   */
  getOpeningHours(serviceId: number): Observable<OpeningHoursWithInfoDto> {
    const url = `${environment.apiUrl}${environment.endpoints.bikeServices.openingHours.replace(':id', serviceId.toString())}`;
    return this.http.get<OpeningHoursWithInfoDto>(url);
  }

  /**
   * Pobiera cennik (jeśli aktywny)
   */
  getPricelist(serviceId: number): Observable<ServicePricelistDto> {
    const url = `${environment.apiUrl}${environment.endpoints.bikeServices.pricelist.replace(':id', serviceId.toString())}`;
    return this.http.get<ServicePricelistDto>(url);
  }

  /**
   * Pobiera wszystkie dostępne kategorie i itemy cennika
   */
  getAllAvailableItems(): Observable<CategoryWithItemsDto[]> {
    const url = `${environment.apiUrl}${environment.endpoints.bikeServices.pricelistAvailableItems}`;
    return this.http.get<CategoryWithItemsDto[]>(url);
  }

  /**
   * Pobiera konfigurację pakietów serwisowych
   */
  getPackagesConfig(serviceId: number): Observable<ServicePackagesConfigDto> {
    const url = `${environment.apiUrl}${environment.endpoints.bikeServices.packagesConfig}?serviceId=${serviceId}`;
    return this.http.get<ServicePackagesConfigDto>(url);
  }

  /**
   * Pobiera wszystkie typy rowerów, które serwis obsługuje
   */
  getBikeTypes(serviceId: number): Observable<string[]> {
    const url = `${environment.apiUrl}${environment.endpoints.bikeServices.bikeTypes}/${serviceId}`;
    return this.http.get<string[]>(url);
  }

  /**
   * Pobiera obraz serwisu (LOGO, ABOUT_US, OPENING_HOURS)
   */
  getServiceImage(serviceId: number, imageType: 'LOGO' | 'ABOUT_US' | 'OPENING_HOURS'): Observable<ServiceImageResponse> {
    const url = `${environment.apiUrl}${environment.endpoints.services.images.replace(':id', serviceId.toString()).replace(':type', imageType)}`;
    return this.http.get<ServiceImageResponse>(url);
  }
}