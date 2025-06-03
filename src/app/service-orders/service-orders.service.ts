// src/app/service-orders/service-orders.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { CreateServiceOrderRequest, OrderStatus, ServiceOrder } from './service-order.model';
import { ServicePackage } from '../service-package/service-package.model';
import { environment } from '../core/api-config';

                               
@Injectable({
  providedIn: 'root'
})
export class ServiceOrderService {
  private apiUrl = `${environment.apiUrl}/orders/service`;
  private http = inject(HttpClient);
  
  constructor() {}
  
  // Pobierz wszystkie zamówienia serwisowe użytkownika
  getUserServiceOrders(): Observable<ServiceOrder[]> {
    return this.http.get<ServiceOrder[]>(this.apiUrl)
      .pipe(
        catchError(error => {
          console.error('Error fetching service orders:', error);
          return throwError(() => error);
        })
      );
  }
  
  // Pobierz zamówienia serwisowe dla konkretnego roweru
  getBicycleServiceOrders(bicycleId: number): Observable<ServiceOrder[]> {
    return this.http.get<ServiceOrder[]>(`${this.apiUrl}/bicycle/${bicycleId}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching service orders for bicycle ${bicycleId}:`, error);
          return throwError(() => error);
        })
      );
  }
  
  // Pobierz szczegóły zamówienia serwisowego
  getServiceOrderById(orderId: number): Observable<ServiceOrder> {
    return this.http.get<ServiceOrder>(`${this.apiUrl}/${orderId}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching service order ${orderId}:`, error);
          return throwError(() => error);
        })
      );
  }
  
  // Utwórz nowe zamówienie serwisu
  createServiceOrder(orderData: CreateServiceOrderRequest): Observable<{orderId: string}> {
    return this.http.post<{orderId: string}>(this.apiUrl, orderData)
      .pipe(
        catchError(error => {
          console.error('Error creating service order:', error);
          return throwError(() => error);
        })
      );
  }
  
  // Anuluj zamówienie serwisu
  cancelServiceOrder(orderId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${orderId}`)
      .pipe(
        catchError(error => {
          console.error(`Error cancelling service order ${orderId}:`, error);
          return throwError(() => error);
        })
      );
  }
  
  // Pobierz cenę pakietu serwisowego
  // Ta metoda może być użyta do wstecznej kompatybilności 
  getServicePackagePrice(packageCode: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/package-price/${packageCode}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching price for service package ${packageCode}:`, error);
          return throwError(() => error);
        })
      );
  }
  
  // Nowa metoda - pobierz cenę po ID pakietu
  getServicePackagePriceById(packageId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/package/${packageId}/price`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching price for service package ID ${packageId}:`, error);
          return throwError(() => error);
        })
      );
  }
  
  // Update order status method - for admin and regular users
  updateOrderStatus(orderId: number, status: OrderStatus): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${orderId}/status`, { status })
      .pipe(
        catchError(error => {
          console.error(`Error updating order ${orderId} status:`, error);
          return throwError(() => error);
        })
      );
  }
  
  // Method to update service order details
  updateServiceOrder(orderId: number, orderData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${orderId}`, orderData)
      .pipe(
        catchError(error => {
          console.error(`Error updating service order ${orderId}:`, error);
          return throwError(() => error);
        })
      );
  }
}