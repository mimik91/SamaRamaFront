import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private apiUrl = 'http://localhost:8080/api/verification';
  private http = inject(HttpClient);

  /**
   * Weryfikuje konto użytkownika na podstawie tokenu
   * @param token Token weryfikacyjny
   */
  verifyAccount(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify?token=${token}`).pipe(
      catchError(error => {
        console.error('Verification error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Ponownie wysyła email weryfikacyjny
   * @param email Adres email użytkownika
   */
  resendVerificationEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend`, { email }).pipe(
      catchError(error => {
        console.error('Error resending verification email:', error);
        return throwError(() => error);
      })
    );
  }
}