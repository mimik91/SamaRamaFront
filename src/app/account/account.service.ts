import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../core/api-config';

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface UserUpdateData {
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = `${environment.apiUrl}/account`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  constructor() { }

  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`).pipe(
      catchError(error => {
        console.error('Error fetching user profile:', error);
        return throwError(() => error);
      })
    );
  }

  updateUserProfile(userData: UserUpdateData): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, userData).pipe(
      catchError(error => {
        console.error('Error updating user profile:', error);
        return throwError(() => error);
      })
    );
  }

  changePassword(passwordData: PasswordChangeData): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-password`, passwordData).pipe(
      catchError(error => {
        console.error('Error changing password:', error);
        return throwError(() => error);
      })
    );
  }
}