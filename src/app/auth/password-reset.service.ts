// src/app/auth/password-reset.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environments';
import {
  PasswordResetRequestDto,
  PasswordResetDto,
  PasswordResetResponse
} from '../shared/models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.password}`;
  private http = inject(HttpClient);

  /**
   * Wysyła żądanie resetowania hasła
   * @param email Adres email użytkownika
   */
  requestPasswordReset(email: string): Observable<PasswordResetResponse> {
    const request: PasswordResetRequestDto = { email };
    return this.http.post<PasswordResetResponse>(`${this.apiUrl}/reset-request`, request).pipe(
      catchError(error => {
        console.error('Error requesting password reset:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Resetuje hasło użytkownika
   * @param token Token resetowania hasła
   * @param newPassword Nowe hasło
   */
  resetPassword(token: string, newPassword: string): Observable<any> {
    const resetData: PasswordResetDto = { token, newPassword };
    return this.http.post(`${this.apiUrl}/reset`, resetData).pipe(
      catchError(error => {
        console.error('Error resetting password:', error);
        return throwError(() => error);
      })
    );
  }
}