import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';
import { OfficeAddressDto } from '../../shared/models/office-address.model';
import { ServicePackagesConfigDto } from '../../shared/models/service-packages.models';
import { DayAvailability, ReservationSettings } from './reservation-form.models';

export interface PublicServiceDetails {
  name: string;
  street?: string;
  building?: string;
  flat?: string;
  city?: string;
  postalCode?: string;
  logoUrl?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  transportAvailable?: boolean;
  transportCost?: number | null;
  reservationAvailable?: boolean;
}

export interface ServicePublicInfo {
  averageRating: number | null;
  reviewCount: number;
  medianServiceDurationHours: number | null;
}

/** Całe HTTP formularzy rezerwacji (zwykłej i ekspresowej) w jednym miejscu. */
@Injectable({ providedIn: 'root' })
export class ReservationApiService {
  private http = inject(HttpClient);

  private get api(): string {
    return environment.apiUrl;
  }

  // ----- Wspólne -----

  getOfficeAddresses(): Observable<OfficeAddressDto[]> {
    return this.http.get<OfficeAddressDto[]>(`${this.api}${environment.endpoints.guestOrders.officeAddresses}`);
  }

  // ----- Zwykła rezerwacja (konkretny serwis) -----

  getServiceIdBySuffix(suffix: string): Observable<{ id: number }> {
    return this.http.get<{ id: number }>(`${this.api}${environment.endpoints.bikeServices.bySuffix}/${suffix}`);
  }

  getSuffixByServiceId(serviceId: string): Observable<{ suffix: string }> {
    return this.http.get<{ suffix: string }>(
      `${this.api}${environment.endpoints.bikeServices.base}/get-suffix`, { params: { serviceId } });
  }

  getServiceDetails(serviceId: number): Observable<PublicServiceDetails> {
    return this.http.get<PublicServiceDetails>(`${this.api}${environment.endpoints.bikeServices.base}/${serviceId}`);
  }

  getServicePublicInfo(serviceId: number): Observable<ServicePublicInfo> {
    const url = environment.endpoints.bikeServices.publicInfo.replace(':id', String(serviceId));
    return this.http.get<ServicePublicInfo>(`${this.api}${url}`);
  }

  getReservationSettings(serviceId: number): Observable<ReservationSettings> {
    return this.http.get<ReservationSettings>(
      `${this.api}${environment.endpoints.bikeServices.base}/${serviceId}/reservation-settings`);
  }

  getServiceDayAvailability(serviceId: number, dateStr: string): Observable<DayAvailability[]> {
    const url = environment.endpoints.guestOrders.serviceAvailability.replace(':serviceId', String(serviceId));
    return this.http.get<DayAvailability[]>(`${this.api}${url}`, { params: { startDate: dateStr, endDate: dateStr } });
  }

  getPackagesConfig(serviceId: number): Observable<ServicePackagesConfigDto> {
    return this.http.get<ServicePackagesConfigDto>(
      `${this.api}${environment.endpoints.bikeServices.packagesConfig}?serviceId=${serviceId}`);
  }

  getBikeTypes(serviceId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.api}${environment.endpoints.bikeServices.bikeTypes}/${serviceId}`);
  }

  createReservation(serviceId: number, payload: object): Observable<{ message: string; orderIds: number[] }> {
    const url = `${this.api}${environment.endpoints.guestOrders.serviceReservation}?serviceId=${serviceId}`;
    return this.http.post<{ message: string; orderIds: number[] }>(url, payload);
  }

  createTransport(payload: object): Observable<unknown> {
    return this.http.post(`${this.api}${environment.endpoints.guestOrders.transport}`, payload);
  }

  /** Diagnostyka — błędy wysyłki nie mogą blokować użytkownika. */
  sendDebugReport(type: string, data: object): void {
    const body = { type, timestamp: new Date().toISOString(), ...data };
    this.http.post(`${this.api}${environment.endpoints.guestOrders.report}`, body).subscribe({ error: () => {} });
  }

  // ----- Serwis ekspresowy -----

  getExpressAvailability(startDate: string, endDate: string): Observable<DayAvailability[]> {
    return this.http.get<DayAvailability[]>(
      `${this.api}${environment.endpoints.guestOrders.expressAvailability}`, { params: { startDate, endDate } });
  }

  getExpressPackages(): Observable<ServicePackagesConfigDto> {
    return this.http.get<ServicePackagesConfigDto>(`${this.api}${environment.endpoints.guestOrders.expressPackages}`);
  }

  quoteExpress(orderData: object): Observable<{ expressServiceId: number; totalPrice: number }> {
    return this.http.post<{ expressServiceId: number; totalPrice: number }>(
      `${this.api}${environment.endpoints.guestOrders.expressReservationQuote}`, orderData);
  }
}
