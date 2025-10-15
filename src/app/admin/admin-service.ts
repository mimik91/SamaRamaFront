import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, throwError, map } from 'rxjs';
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

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface BikeServiceRegisteredDto {
  id: number;
  name: string;
  email: string;
  street?: string;
  building?: string;
  flat?: string;
  postalCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  transportCost?: number;
  transportAvailable: boolean;
  createdAt: string;
  updatedAt?: string;
  suffix?: string;
  contactPerson?: string;
  website?: string;
  description?: string;
  isRegistered: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;
  private serviceOrdersUrl = `${environment.apiUrl}/service-orders`;
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
    return this.http.get<PaginatedResponse<AdminUser>>(`${this.apiUrl}/users`).pipe(
      map(response => {
        console.log('Backend response:', response);
        // Extract the content array from paginated response
        return response.content || [];
      }),
      catchError(error => {
        console.error('Error fetching users:', error);
        return of([]);
      })
    );
  }

  getAllServiceOrders(): Observable<ServiceOrder[]> {
    return this.http.get<ServiceOrder[]>(`${this.serviceOrdersUrl}/admin/all`).pipe(
      catchError(error => {
        console.error('Error fetching service orders:', error);
        if (error.status === 401) {
          // Handle unauthorized specifically
          return of([]);
        }
        return of([]);
      })
    );
  }

  // This method may need updating depending on how the backend handles status filtering
  getAllServicesByStatus(status: string): Observable<ServiceOrder[]> {
    // You might need to update this endpoint if it's changed in the backend
    return this.http.get<ServiceOrder[]>(`${this.serviceOrdersUrl}?status=${status}`).pipe(
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

  getEnumeration(type: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.enumerationsUrl}/${type}`).pipe(
      catchError(error => {
        console.error(`Error fetching enumeration ${type}:`, error);
        return of([]);
      })
    );
  }

  updateEnumeration(type: string, values: string[]): Observable<any> {
    return this.http.post(`${this.enumerationsUrl}/${type}`, values).pipe(
      catchError(error => {
        console.error(`Error updating enumeration ${type}:`, error);
        return of({ success: false, message: 'Failed to update enumeration' });
      })
    );
  }

  // Metody zarządzania użytkownikami
  updateUserRoles(userId: number, roles: Set<string>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${userId}/roles`, { roles: Array.from(roles) }).pipe(
      catchError(error => {
        console.error(`Error updating user ${userId} roles:`, error);
        return throwError(() => error);
      })
    );
  }

  // This is now using the service-orders controller with the admin authorization
  updateServiceOrderStatus(orderId: number, status: string): Observable<any> {
    return this.http.patch(`${this.serviceOrdersUrl}/${orderId}/status`, { status }).pipe(
      catchError(error => {
        console.error(`Error updating order ${orderId} status:`, error);
        return of({ success: false, message: 'Failed to update status' });
      })
    );
  }

  // =================== BIKE SERVICES REGISTERED MANAGEMENT ===================

  /**
   * Pobiera wszystkie zarejestrowane serwisy rowerowe
   */
  getAllRegisteredBikeServices(): Observable<BikeServiceRegisteredDto[]> {
    return this.http.get<BikeServiceRegisteredDto[]>(`${this.apiUrl}/bike-services-registered`).pipe(
      catchError(error => {
        console.error('Error fetching registered bike services:', error);
        return of([]);
      })
    );
  }

  /**
   * Pobiera tylko serwisy oczekujące na weryfikację (isRegistered = false)
   */
  getPendingVerificationServices(): Observable<BikeServiceRegisteredDto[]> {
    return this.http.get<BikeServiceRegisteredDto[]>(`${this.apiUrl}/bike-services-registered/pending`).pipe(
      catchError(error => {
        console.error('Error fetching pending verification services:', error);
        return of([]);
      })
    );
  }

  /**
   * Weryfikuje serwis - ustawia isRegistered na true
   * Tylko dla administratorów
   */
  verifyBikeService(serviceId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/bike-services-registered/${serviceId}/verify`, {}).pipe(
      catchError(error => {
        console.error(`Error verifying bike service ${serviceId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Pobiera szczegóły konkretnego zarejestrowanego serwisu
   */
  getRegisteredServiceDetails(serviceId: number): Observable<BikeServiceRegisteredDto> {
    return this.http.get<BikeServiceRegisteredDto>(`${this.apiUrl}/bike-services-registered/${serviceId}`).pipe(
      catchError(error => {
        console.error(`Error fetching service ${serviceId} details:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Aktualizuje dane zarejestrowanego serwisu
   */
  updateRegisteredBikeService(serviceId: number, serviceData: BikeServiceRegisteredDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/bike-services-registered/${serviceId}`, serviceData).pipe(
      catchError(error => {
        console.error(`Error updating bike service ${serviceId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Usuwa serwis (używa standardowej metody deleteBikeService)
   * BikeServiceRegistered dziedziczy po BikeService więc używamy tej samej metody
   */
  deleteBikeService(serviceId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/bike-services/${serviceId}`).pipe(
      catchError(error => {
        console.error(`Error deleting bike service ${serviceId}:`, error);
        return throwError(() => error);
      })
    );
  }
}