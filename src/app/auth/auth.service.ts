import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

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
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private http = inject(HttpClient);

  loginClient(credentials: LoginCredentials): Observable<AuthResponse> {
    console.log('Attempting client login with:', credentials);
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin/client`, credentials)
      .pipe(
        tap(response => console.log('Received login response:', response))
      );
  }

  loginService(credentials: LoginCredentials): Observable<AuthResponse> {
    console.log('Attempting service login with:', credentials);
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin/service`, credentials)
      .pipe(
        tap(response => console.log('Received service login response:', response))
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
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    const token = localStorage.getItem('auth_token');
    console.log('Retrieved token from storage:', token ? 'Token exists' : 'No token');
    return token;
  }

  removeToken(): void {
    console.log('Removing auth token');
    localStorage.removeItem('auth_token');
  }

  isLoggedIn(): boolean {
    const isLoggedIn = !!this.getToken();
    console.log('User is logged in:', isLoggedIn);
    return isLoggedIn;
  }
}