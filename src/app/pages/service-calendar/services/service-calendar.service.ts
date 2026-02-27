import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environments';
import {
  CalendarConfig,
  CalendarConfigResponse,
  Technician,
  CreateTechnicianDto,
  UpdateTechnicianDto,
  CalendarWeekData,
  CalendarOrder,
  CreateCalendarOrderDto,
  UpdateCalendarOrderDto,
  CalendarOrderStatus,
  OrderImage,
  ClientLookupResult,
  ClientBike
} from '../../../shared/models/service-calendar.models';

// ============================================
// INTERFEJSY DLA ZDJEC ZLECENIA
// ============================================

export interface InitiateImageUploadRequest {
  fileName: string;
  mimeType: string;
  width?: number;
  height?: number;
  description?: string;
}

export interface InitiateImageUploadResponse {
  imageId: string;
  uploadUrl: string;
  path: string;
}

export interface StolenCheckResponse {
  stolen: boolean;
  bikeName?: string;
  frameNumber?: string;
}

export interface OrderMessage {
  id: number;
  senderType: 'SERVICE' | 'CLIENT';
  content: string;
  createdAt: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceCalendarService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private endpoints = environment.endpoints.serviceCalendar;

  // ============================================
  // KONFIGURACJA
  // ============================================

  /**
   * Pobiera konfiguracje kalendarza dla serwisu
   * Obsluguje zarowno plaska odpowiedz jak i opakowana w { config: ... }
   */
  getConfig(serviceId: number): Observable<CalendarConfig> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.get<CalendarConfig | CalendarConfigResponse>(`${this.apiUrl}${this.endpoints.config}`, { params })
      .pipe(
        map(response => {
          // Jesli odpowiedz ma pole 'config', to jest opakowana
          if ('config' in response && response.config) {
            return response.config;
          }
          // W przeciwnym razie to plaska odpowiedz
          return response as CalendarConfig;
        }),
        catchError(this.handleError('getConfig'))
      );
  }

  // ============================================
  // SERWISANCI
  // ============================================

  /**
   * Pobiera liste serwisantow dla serwisu
   */
  getTechnicians(serviceId: number): Observable<Technician[]> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.get<Technician[]>(`${this.apiUrl}${this.endpoints.technicians}`, { params })
      .pipe(catchError(this.handleError('getTechnicians')));
  }

  /**
   * Tworzy nowego serwisanta
   */
  createTechnician(serviceId: number, data: CreateTechnicianDto): Observable<Technician> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.post<Technician>(`${this.apiUrl}${this.endpoints.technicians}`, data, { params })
      .pipe(catchError(this.handleError('createTechnician')));
  }

  /**
   * Aktualizuje serwisanta
   */
  updateTechnician(technicianId: number, data: UpdateTechnicianDto): Observable<Technician> {
    return this.http.put<Technician>(`${this.apiUrl}${this.endpoints.technicians}/${technicianId}`, data)
      .pipe(catchError(this.handleError('updateTechnician')));
  }

  // ============================================
  // WIDOKI KALENDARZA
  // ============================================

  /**
   * Pobiera widok tygodnia
   */
  getWeekView(serviceId: number, startDate: string): Observable<CalendarWeekData> {
    const params = new HttpParams()
      .set('serviceId', serviceId.toString())
      .set('startDate', startDate);
    return this.http.get<CalendarWeekData>(`${this.apiUrl}${this.endpoints.weekView}`, { params })
      .pipe(catchError(this.handleError('getWeekView')));
  }


  // ============================================
  // ZLECENIA
  // ============================================

  /**
   * Tworzy nowe zlecenie
   */
  createOrder(serviceId: number, order: CreateCalendarOrderDto): Observable<CalendarOrder> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.post<CalendarOrder>(`${this.apiUrl}${this.endpoints.orders}`, order, { params })
      .pipe(catchError(this.handleError('createOrder')));
  }

  /**
   * Aktualizuje zlecenie
   */
  updateOrder(serviceId: number, orderId: number, data: UpdateCalendarOrderDto): Observable<CalendarOrder> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.put<CalendarOrder>(`${this.apiUrl}${this.endpoints.orders}/${orderId}`, data, { params })
      .pipe(catchError(this.handleError('updateOrder')));
  }

  /**
   * Aktualizuje status zlecenia
   */
  updateOrderStatus(serviceId: number, orderId: number, status: CalendarOrderStatus): Observable<CalendarOrder> {
    const url = this.endpoints.orderStatus.replace(':id', orderId.toString());
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.patch<CalendarOrder>(`${this.apiUrl}${url}`, { status }, { params })
      .pipe(catchError(this.handleError('updateOrderStatus')));
  }

  /**
   * Pobiera szczegoly zlecenia
   */
  getOrder(serviceId: number, orderId: number): Observable<CalendarOrder> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.get<CalendarOrder>(`${this.apiUrl}${this.endpoints.orders}/${orderId}`, { params })
      .pipe(catchError(this.handleError('getOrder')));
  }

  /**
   * Usuwa zlecenie
   */
  deleteOrder(orderId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${this.endpoints.orders}/${orderId}`)
      .pipe(catchError(this.handleError('deleteOrder')));
  }

  // ============================================
  // ZDJECIA ZLECENIA
  // ============================================

  /**
   * Pobiera zdjecia zlecenia
   */
  getOrderImages(serviceId: number, orderId: number): Observable<OrderImage[]> {
    const url = this.endpoints.orderImages.replace(':id', orderId.toString());
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.get<OrderImage[]>(`${this.apiUrl}${url}`, { params })
      .pipe(catchError(this.handleError('getOrderImages')));
  }

  /**
   * Inicjuje upload zdjecia - zwraca presigned URL
   */
  initiateImageUpload(serviceId: number, orderId: number, request: InitiateImageUploadRequest): Observable<InitiateImageUploadResponse> {
    const url = this.endpoints.orderImages.replace(':id', orderId.toString());
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.post<InitiateImageUploadResponse>(`${this.apiUrl}${url}`, request, { params })
      .pipe(catchError(this.handleError('initiateImageUpload')));
  }

  /**
   * Potwierdza ukonczony upload zdjecia
   */
  confirmImageUpload(serviceId: number, orderId: number, imageId: string): Observable<OrderImage> {
    const url = this.endpoints.orderImages.replace(':id', orderId.toString());
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.post<OrderImage>(`${this.apiUrl}${url}/${imageId}/confirm`, {}, { params })
      .pipe(catchError(this.handleError('confirmImageUpload')));
  }

  /**
   * Usuwa zdjecie zlecenia
   */
  deleteOrderImage(serviceId: number, orderId: number, imageId: string): Observable<void> {
    const url = this.endpoints.orderImages.replace(':id', orderId.toString());
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.delete<void>(`${this.apiUrl}${url}/${imageId}`, { params })
      .pipe(catchError(this.handleError('deleteOrderImage')));
  }

  // ============================================
  // WIADOMOŚCI ZLECENIA
  // ============================================

  getOrderMessages(serviceId: number, orderId: number): Observable<{ messages: OrderMessage[]; unreadCount: number }> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.get<{ messages: OrderMessage[]; unreadCount: number }>(
      `${this.apiUrl}${this.endpoints.orders}/${orderId}/messages`, { params }
    ).pipe(catchError(this.handleError('getOrderMessages')));
  }

  sendOrderMessage(serviceId: number, orderId: number, content: string): Observable<OrderMessage> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.post<OrderMessage>(
      `${this.apiUrl}${this.endpoints.orders}/${orderId}/messages`,
      { content }, { params }
    ).pipe(catchError(this.handleError('sendOrderMessage')));
  }

  markOrderMessagesAsRead(serviceId: number, orderId: number): Observable<void> {
    const params = new HttpParams().set('serviceId', serviceId.toString());
    return this.http.patch<void>(
      `${this.apiUrl}${this.endpoints.orders}/${orderId}/messages/read`,
      {}, { params }
    ).pipe(catchError(this.handleError('markOrderMessagesAsRead')));
  }

  // ============================================
  // WYSZUKIWANIE KLIENTA
  // ============================================

  lookupClient(email?: string, phone?: string): Observable<ClientLookupResult> {
    let params = new HttpParams();
    if (email) params = params.set('email', email);
    if (phone) params = params.set('phone', phone);
    return this.http.get<ClientLookupResult>(
      `${this.apiUrl}${this.endpoints.clientLookup}`,
      { params }
    ).pipe(catchError(this.handleError('lookupClient')));
  }

  getClientBikes(clientId: number): Observable<ClientBike[]> {
    const url = this.endpoints.clientBikes.replace(':clientId', clientId.toString());
    return this.http.get<ClientBike[]>(`${this.apiUrl}${url}`)
      .pipe(catchError(this.handleError('getClientBikes')));
  }

  // ============================================
  // SPRAWDZANIE STATUSU ROWERU
  // ============================================

  /**
   * Sprawdza czy rower o danym numerze ramy jest zgloszony jako skradziony
   */
  checkStolenBike(frameNumber: string): Observable<StolenCheckResponse> {
    const params = new HttpParams().set('frameNumber', frameNumber);
    return this.http.get<StolenCheckResponse>(
      `${this.apiUrl}${environment.endpoints.bicycleStatus.stolenCheck}`,
      { params }
    ).pipe(catchError(this.handleError('checkStolenBike')));
  }

  // ============================================
  // ERROR HANDLING
  // ============================================

  private handleError(operation: string) {
    return (error: any): Observable<never> => {
      console.error(`ServiceCalendarService.${operation} failed:`, error);
      return throwError(() => error);
    };
  }
}
