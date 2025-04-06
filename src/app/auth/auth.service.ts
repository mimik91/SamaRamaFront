import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError, of } from 'rxjs';

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
  street: string;
  building: string;
  flat?: string;
  postalCode?: string;
  city: string;
  phoneNumber: string;
  businessPhone?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
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

interface UserSession {
  token: string;
  role: 'CLIENT' | 'SERVICE';
  userId: number;
  email: string;
  name?: string;
  expiresAt: number; // Timestamp
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private http = inject(HttpClient);
  
  // Use BehaviorSubject to track authentication state
  private currentUserSubject = new BehaviorSubject<UserSession | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  
  // Token expiration time in milliseconds (24 hours)
  private tokenExpirationTime = 24 * 60 * 60 * 1000;
  
  constructor() {
    // Load session from storage on service initialization
    this.loadSession();
  }
  
  private loadSession(): void {
    if (typeof window === 'undefined') {
      return; // Skip during SSR
    }
    
    const sessionData = localStorage.getItem('auth_session'); // Zmiana z sessionStorage na localStorage
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData) as UserSession;
        
        // Check if token is expired
        if (session.expiresAt > Date.now()) {
          this.currentUserSubject.next(session);
          console.log('Loaded session:', session);
        } else {
          // Clear expired session
          console.log('Session expired, clearing');
          this.clearSession();
        }
      } catch (e) {
        console.error('Error parsing session data', e);
        this.clearSession();
      }
    }
  }
  
  loginClient(credentials: LoginCredentials): Observable<AuthResponse> {
    console.log('Attempting client login:', credentials.email);
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin/client`, credentials)
      .pipe(
        tap(response => {
          console.log('Login response:', response);
          // Upewnij się, że response.role jest ustawione na 'CLIENT'
          const authResponse = {
            ...response,
            role: 'CLIENT' as const
          };
          this.handleAuthResponse(authResponse);
        }),
        catchError(error => {
          console.error('Login failed:', error);
          return throwError(() => error);
        })
      );
  }

  loginService(credentials: LoginCredentials): Observable<AuthResponse> {
    console.log('Attempting service login:', credentials.email);
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin/service`, credentials)
      .pipe(
        tap(response => {
          console.log('Service login response:', response);
          // Upewnij się, że response.role jest ustawione na 'SERVICE'
          const authResponse = {
            ...response,
            role: 'SERVICE' as const
          };
          this.handleAuthResponse(authResponse);
        }),
        catchError(error => {
          console.error('Service login failed:', error);
          return throwError(() => error);
        })
      );
  }

  registerClient(userData: UserRegistrationData): Observable<any> {
    console.log('Registering client:', userData.email);
    return this.http.post(`${this.apiUrl}/signup/client`, userData)
      .pipe(
        catchError(error => {
          console.error('Client registration failed:', error);
          return throwError(() => error);
        })
      );
  }

  registerService(serviceData: ServiceRegistrationData): Observable<any> {
    console.log('Registering service:', serviceData.email);
    return this.http.post(`${this.apiUrl}/signup/service`, serviceData)
      .pipe(
        catchError(error => {
          console.error('Service registration failed:', error);
          return throwError(() => error);
        })
      );
  }
  
  private handleAuthResponse(response: AuthResponse): void {
    if (response && response.token) {
      console.log('Saving auth token:', response.token);
      
      const session: UserSession = {
        token: response.token,
        role: response.role,
        userId: response.id,
        email: response.email,
        name: response.firstName ? `${response.firstName} ${response.lastName}` : response.name,
        expiresAt: Date.now() + this.tokenExpirationTime
      };
      
      // Save session in memory and storage
      this.currentUserSubject.next(session);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('auth_session', JSON.stringify(session));
        console.log('Session saved to localStorage');
      }
    }
  }

  getToken(): string | null {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) {
      // Try to load from storage in case it wasn't loaded yet
      this.loadSession();
    }
    return this.currentUserSubject.value?.token || null;
  }
  
  getUserRole(): string | null {
    const currentUser = this.currentUserSubject.value;
    return currentUser ? currentUser.role : null;
  }
  
  getUserId(): number | null {
    const currentUser = this.currentUserSubject.value;
    return currentUser ? currentUser.userId : null;
  }

  logout(): void {
    this.clearSession();
  }
  
  private clearSession(): void {
    this.currentUserSubject.next(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_session');
    }
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }
  
  isClient(): boolean {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.role === 'CLIENT';
  }
  
  isService(): boolean {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.role === 'SERVICE';
  }
}