import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface ServiceRegistrationData {
  email: string;
  password: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  phoneNumber: string;
  description: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: 'CLIENT' | 'SERVICE';
  redirectUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private memoryToken: string | null = null;

  loginClient(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/signin/client`, credentials)
      .pipe(
        tap((response) => {
          console.log('Received login response:', response);
          if (response.token) {
            this.setToken(response.token);
          }
        }),
      );
  }

  loginService(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/signin/service`, credentials)
      .pipe(
        tap((response) => {
          console.log('Received service login response:', response);
          if (response.token) {
            this.setToken(response.token);
          }
        }),
      );
  }

  registerClient(userData: UserRegistrationData): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup/client`, userData);
  }

  registerService(serviceData: ServiceRegistrationData): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup/service`, serviceData);
  }

  setToken(token: string): void {
    console.log('Setting auth token:', token);
    this.memoryToken = token;

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('auth_token');
      console.log(
        'Retrieved token from storage:',
        token ? 'Token exists' : 'No token',
      );
      return token;
    }

    // Return memory token for server-side
    return this.memoryToken;
  }

  removeToken(): void {
    console.log('Removing auth token');
    this.memoryToken = null;

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
    }
  }

  isLoggedIn(): boolean {
    const isLoggedIn = !!this.getToken();
    console.log('User is logged in:', isLoggedIn);
    return isLoggedIn;
  }
}
