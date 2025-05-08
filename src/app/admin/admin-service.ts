import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { ServiceOrder } from '../service-orders/service-order.model';
import { environment } from '../core/api-config';

export interface DashboardStats {
  totalUsers: number;
  totalBicycles: number;
  totalServices: number;
  pendingOrders: number;
  user?: any;
  authorities?: string[];
}

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles: string[];
  verified: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;
  private enumerationsUrl = `${environment.apiUrl}/enumerations`;
  private http = inject(HttpClient);

  constructor() { }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`).pipe(
      catchError(error => {
        console.error('Error fetching dashboard stats:', error);
        return of({
          totalUsers: 0,
          totalBicycles: 0,
          totalServices: 0,
          pendingOrders: 0
        });
      })
    );
  }

  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/users`).pipe(
      catchError(error => {
        console.error('Error fetching users:', error);
        return of([]);
      })
    );
  }

  getAllServiceOrders(): Observable<ServiceOrder[]> {
    return this.http.get<ServiceOrder[]>(`${this.apiUrl}/orders`).pipe(
      catchError(error => {
        console.error('Error fetching service orders:', error);
        return of([]);
      })
    );
  }

  getAllServicesByStatus(status: string): Observable<ServiceOrder[]> {
    return this.http.get<ServiceOrder[]>(`${this.apiUrl}/orders/status/${status}`).pipe(
      catchError(error => {
        console.error(`Error fetching orders with status ${status}:`, error);
        return of([]);
      })
    );
  }

  getAllEnumerations(): Observable<Record<string, string[]>> {
    return this.http.get<Record<string, string[]>>(this.enumerationsUrl).pipe(
      catchError(error => {
        console.error('Error fetching enumerations:', error);
        return of({});
      })
    );
  }

  // New method for getting a specific enumeration
  getEnumeration(type: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.enumerationsUrl}/${type}`).pipe(
      catchError(error => {
        console.error(`Error fetching enumeration ${type}:`, error);
        return of([]);
      })
    );
  }

  // New method for updating an enumeration
  updateEnumeration(type: string, values: string[]): Observable<any> {
    return this.http.post(`${this.enumerationsUrl}/${type}`, values).pipe(
      catchError(error => {
        console.error(`Error updating enumeration ${type}:`, error);
        return of({ success: false, message: 'Failed to update enumeration' });
      })
    );
  }

  updateServiceOrderStatus(orderId: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${orderId}/status`, { status }).pipe(
      catchError(error => {
        console.error(`Error updating order ${orderId} status:`, error);
        return of({ success: false, message: 'Failed to update status' });
      })
    );
  }
}