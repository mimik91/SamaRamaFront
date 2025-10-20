import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError, of } from 'rxjs';
import { environment } from '../core/api-config';

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

export interface AuthResponse {
  token: string;
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: 'CLIENT' | 'SERVICE' | 'ADMIN' | 'MODERATOR';
  redirectUrl?: string;
  suffix?: string;
}

interface UserSession {
  token: string;
  role: 'CLIENT' | 'SERVICE' | 'ADMIN' | 'MODERATOR';
  userId: number;
  email: string;
  name?: string;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private http = inject(HttpClient);
  
  // Use BehaviorSubject to track authentication state
  private currentUserSubject = new BehaviorSubject<UserSession | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  
  // Token expiration time in milliseconds (24 hours)
  private tokenExpirationTime = 24 * 60 * 60 * 1000;
  
  // WAŻNE: Flagi żeby zapobiec wielokrotnemu ładowaniu
  private isSessionLoaded = false;
  private isLoadingSession = false;
  
  constructor() {
    // Load session from storage on service initialization - TYLKO RAZ
    this.initializeSession();
  }
  
  private initializeSession(): void {
    if (this.isSessionLoaded || this.isLoadingSession) {
      return; // Zapobiega wielokrotnemu ładowaniu
    }
    
    this.isLoadingSession = true;
    
    try {
      this.loadSession();
      this.isSessionLoaded = true;
    } finally {
      this.isLoadingSession = false;
    }
  }
  
  private loadSession(): void {
    if (typeof localStorage === 'undefined') {
      console.log('localStorage not available (SSR context)');
      this.currentUserSubject.next(null);
      return;
    }
    
    const sessionData = localStorage.getItem('auth_session');
    
    // USUNIĘTO zbędne logi - tylko ważne informacje
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData) as UserSession;
        
        // Check if token is expired
        if (session.expiresAt > Date.now() && !this.isTokenExpired(session.token)) {
          this.currentUserSubject.next(session);
          console.log('Valid session loaded for:', session.email);
        } else {
          // Clear expired session
          console.log('Session expired, clearing');
          this.clearSession();
        }
      } catch (e) {
        console.error('Error parsing session data', e);
        this.clearSession();
      }
    } else {
      // Tylko raz zaloguj brak sesji
      if (!this.isSessionLoaded) {
        console.log('No session found in localStorage');
      }
      this.currentUserSubject.next(null);
    }
  }
  
  loginClient(credentials: LoginCredentials): Observable<AuthResponse> {
    console.log('Attempting client login:', credentials.email);
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin/client`, credentials)
      .pipe(
        tap(response => {
          console.log('Login response:', response);
          
          // Determine the redirect URL based on role - BEZPIECZNE TRASY
          let redirectUrl = '/client-dashboard'; // Zmieniono z /bicycles
          
          if (response.role === 'ADMIN' || response.role === 'MODERATOR') {
            redirectUrl = '/admin-dashboard';
          }
          
          const authResponse = {
            ...response,
            role: response.role || 'CLIENT' as const,
            redirectUrl
          };
          this.handleAuthResponse(authResponse);
        }),
        catchError(error => {
          console.error('Login failed:', error);
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

  private handleAuthResponse(response: AuthResponse): void {
    if (response && response.token) {
      console.log('Saving auth token for:', response.email);
      
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

  private isTokenExpired(token: string): boolean {
    try {
      // Extract the expiration time from JWT
      const expiry = JSON.parse(atob(token.split('.')[1])).exp;
      return (Math.floor((new Date).getTime() / 1000)) >= expiry;
    } catch (e) {
      return true; // If we can't decode the token, consider it expired
    }
  }

  // POPRAWIONA metoda getToken - nie wywołuje loadSession za każdym razem!
  getToken(): string | null {
    // Używaj danych z BehaviorSubject zamiast ciągłego sprawdzania localStorage
    const currentUser = this.currentUserSubject.value;
    
    if (!currentUser) {
      // Załaduj sesję tylko jeśli nie została jeszcze załadowana
      if (!this.isSessionLoaded && !this.isLoadingSession) {
        this.initializeSession();
      }
      return null;
    }
    
    // Sprawdź czy token nie wygasł
    if (currentUser.expiresAt < Date.now() || this.isTokenExpired(currentUser.token)) {
      console.log('Token expired, clearing session');
      this.clearSession();
      return null;
    }
    
    return currentUser.token;
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
    console.log('Logging out user');
    this.clearSession();
  }
  
  private clearSession(): void {
    this.currentUserSubject.next(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_session');
    }
    // Reset flag żeby umożliwić ponowne załadowanie w przyszłości
    this.isSessionLoaded = false;
  }

  // POPRAWIONA metoda isLoggedIn - korzysta z BehaviorSubject
  isLoggedIn(): boolean {
    const currentUser = this.currentUserSubject.value;
    
    if (!currentUser) {
      // Nie wywołuj loadSession tutaj! To powodowało pętlę
      return false;
    }
    
    // Sprawdź czy token nie wygasł
    if (currentUser.expiresAt < Date.now() || this.isTokenExpired(currentUser.token)) {
      this.clearSession();
      return false;
    }
    
    return true;
  }

  isService(): boolean {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.role === 'SERVICE';
  }
  
  isClient(): boolean {
    if (this.hasAdminPrivileges()) {
      return true;
    }
    const currentUser = this.currentUserSubject.value;
    return currentUser?.role === 'CLIENT';
  }

  isAdmin(): boolean {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.role === 'ADMIN';
  }
  
  isModerator(): boolean {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.role === 'MODERATOR';
  }
  
  hasAdminPrivileges(): boolean {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR';
  }
  
  // Get the current user's email
  getCurrentUserEmail(): string | null {
    const currentUser = this.currentUserSubject.value;
    return currentUser ? currentUser.email : null;
  }
  
  // Get the current user's name
  getCurrentUserName(): string | null {
    const currentUser = this.currentUserSubject.value;
    return currentUser ? currentUser.name || null : null;
  }
  
  // Get the current user's ID
  getCurrentUserId(): number | null {
    const currentUser = this.currentUserSubject.value;
    return currentUser ? currentUser.userId : null;
  }
}