// src/app/transport-orders/transport-order.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../core/api-config';

export interface TransportOrderRequest {
  bicycleIds: number[];
  pickupDate: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  additionalNotes?: string;
  targetServiceId?: number;
  transportType: 'TO_SERVICE_ONLY' | 'SERVICE_WITH_TRANSPORT';
  transportPrice?: number;
  pickupTimeFrom?: string;
  pickupTimeTo?: string;
  estimatedTime?: number;
  transportNotes?: string;
  // Dodatkowe pola dla niezalogowanych użytkowników
  clientEmail?: string;
  clientName?: string;
  clientPhone?: string;
  bicyclesData?: Array<{
    brand: string;
    model: string;
    type: string;
    frameMaterial?: string;
    description?: string;
  }>;
}

export interface TransportOrderResponse {
  id: number;
  bicycleIds: number[];
  clientEmail: string;
  pickupDate: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: string;
  transportType: string;
  price: number;
  orderDate: string;
  additionalNotes?: string;
  targetServiceId?: number;
  targetServiceName?: string;
  estimatedPickupTime?: string;
  actualPickupTime?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  transportNotes?: string;
  lastModifiedDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransportOrderService {
  private apiUrl = `${environment.apiUrl}/transport-orders`;
  private http = inject(HttpClient);

  constructor() { }

  /**
   * Tworzy nowe zamówienie transportowe
   */
  createTransportOrder(orderData: TransportOrderRequest): Observable<TransportOrderResponse> {
    return this.http.post<TransportOrderResponse>(this.apiUrl, orderData).pipe(
      catchError(error => {
        console.error('Error creating transport order:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera wszystkie zamówienia transportowe użytkownika
   */
  getUserTransportOrders(): Observable<TransportOrderResponse[]> {
    return this.http.get<TransportOrderResponse[]>(`${this.apiUrl}/user`).pipe(
      catchError(error => {
        console.error('Error fetching user transport orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera szczegóły konkretnego zamówienia transportowego
   */
  getTransportOrderDetails(orderId: number): Observable<TransportOrderResponse> {
    return this.http.get<TransportOrderResponse>(`${this.apiUrl}/${orderId}`).pipe(
      catchError(error => {
        console.error(`Error fetching transport order ${orderId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Aktualizuje zamówienie transportowe
   */
  updateTransportOrder(orderId: number, orderData: Partial<TransportOrderRequest>): Observable<TransportOrderResponse> {
    return this.http.put<TransportOrderResponse>(`${this.apiUrl}/${orderId}`, orderData).pipe(
      catchError(error => {
        console.error(`Error updating transport order ${orderId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Anuluje zamówienie transportowe
   */
  cancelTransportOrder(orderId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${orderId}`).pipe(
      catchError(error => {
        console.error(`Error cancelling transport order ${orderId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Zmienia status zamówienia transportowego
   */
  updateTransportOrderStatus(orderId: number, status: string): Observable<TransportOrderResponse> {
    return this.http.patch<TransportOrderResponse>(`${this.apiUrl}/${orderId}/status`, { status }).pipe(
      catchError(error => {
        console.error(`Error updating transport order ${orderId} status:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera dostępne statusy zamówień transportowych
   */
  getAvailableStatuses(): Array<{value: string, label: string}> {
    return [
      { value: 'PENDING', label: 'Oczekujące' },
      { value: 'CONFIRMED', label: 'Potwierdzone' },
      { value: 'PICKED_UP', label: 'Odebrane' },
      { value: 'IN_TRANSPORT', label: 'W transporcie' },
      { value: 'DELIVERED_TO_SERVICE', label: 'Dostarczone do serwisu' },
      { value: 'COMPLETED', label: 'Zakończone' },
      { value: 'CANCELLED', label: 'Anulowane' }
    ];
  }

  /**
   * Sprawdza czy zamówienie można edytować
   */
  canEditOrder(order: TransportOrderResponse): boolean {
    return ['PENDING', 'CONFIRMED'].includes(order.status);
  }

  /**
   * Sprawdza czy zamówienie można anulować
   */
  canCancelOrder(order: TransportOrderResponse): boolean {
    return ['PENDING', 'CONFIRMED'].includes(order.status);
  }

  /**
   * Formatuje status do wyświetlenia
   */
  getStatusDisplayName(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': 'Oczekujące',
      'CONFIRMED': 'Potwierdzone',
      'PICKED_UP': 'Odebrane',
      'IN_TRANSPORT': 'W transporcie',
      'DELIVERED_TO_SERVICE': 'Dostarczone do serwisu',
      'COMPLETED': 'Zakończone',
      'CANCELLED': 'Anulowane'
    };

    return statusMap[status] || status;
  }

  /**
   * Formatuje typ transportu do wyświetlenia
   */
  getTransportTypeDisplayName(type: string): string {
    const typeMap: Record<string, string> = {
      'TO_SERVICE_ONLY': 'Transport do serwisu',
      'SERVICE_WITH_TRANSPORT': 'Serwis z transportem'
    };

    return typeMap[type] || type;
  }

  /**
   * Oblicza szacowany koszt transportu
   */
  calculateEstimatedCost(bicycleCount: number): number {
    const baseCost = 50; // Koszt bazowy za transport
    const perBikeCost = 20; // Koszt za każdy dodatkowy rower
    
    if (bicycleCount === 0) return 0;
    return baseCost + (bicycleCount - 1) * perBikeCost;
  }

  /**
   * Waliduje dane zamówienia transportowego
   */
  validateTransportOrder(orderData: TransportOrderRequest): string[] {
    const errors: string[] = [];

    // Walidacja danych klienta (dla niezalogowanych)
    if (orderData.clientEmail && !orderData.clientEmail.includes('@')) {
      errors.push('Podaj poprawny adres email');
    }

    if (orderData.clientName && orderData.clientName.trim().length < 2) {
      errors.push('Imię i nazwisko musi mieć co najmniej 2 znaki');
    }

    if (orderData.clientPhone && !/^\d{9}$/.test(orderData.clientPhone)) {
      errors.push('Numer telefonu musi mieć 9 cyfr');
    }

    // Walidacja rowerów
    if (orderData.bicyclesData && orderData.bicyclesData.length > 0) {
      orderData.bicyclesData.forEach((bike, index) => {
        if (!bike.brand || bike.brand.trim().length < 2) {
          errors.push(`Rower ${index + 1}: Marka jest wymagana`);
        }
        if (!bike.model || bike.model.trim().length < 2) {
          errors.push(`Rower ${index + 1}: Model jest wymagany`);
        }
        if (!bike.type) {
          errors.push(`Rower ${index + 1}: Typ roweru jest wymagany`);
        }
      });
    } else if (!orderData.bicycleIds || orderData.bicycleIds.length === 0) {
      errors.push('Wybierz co najmniej jeden rower');
    }

    if (!orderData.pickupDate) {
      errors.push('Data odbioru jest wymagana');
    } else {
      const pickupDate = new Date(orderData.pickupDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (pickupDate <= today) {
        errors.push('Data odbioru musi być w przyszłości');
      }
    }

    if (!orderData.pickupAddress || orderData.pickupAddress.trim().length < 5) {
      errors.push('Adres odbioru musi mieć co najmniej 5 znaków');
    }

    if (!orderData.deliveryAddress || orderData.deliveryAddress.trim().length < 5) {
      errors.push('Adres dostarczenia musi mieć co najmniej 5 znaków');
    }

    if (!orderData.transportType) {
      errors.push('Typ transportu jest wymagany');
    }

    return errors;
  }
}