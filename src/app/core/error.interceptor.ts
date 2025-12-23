import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Lista endpointów, które nie powinny wymuszać przekierowania do logowania przy 401
  // (np. zamówienia gościa, rejestracja, cennik)
  const publicEndpoints = ['/api/guest-orders/transport', '/api/auth/login'];
  const isPublicEndpoint = publicEndpoints.some(url => req.url.includes(url));

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      if (error.status === 401) {
        if (isPublicEndpoint) {
          console.warn('Unauthorized on public endpoint - likely validation or session issue, not redirecting.');
        } else {
          console.error('Unauthorized access attempt - redirecting to login', error);
          router.navigate(['/login']);
        }
      } 
      
      else if (error.status === 400) {
        // Logika dla błędów walidacji (np. Twoja data odbioru)
        console.error('Validation error (400):', error.error);
        // Tutaj możesz wypchnąć błąd do serwisu powiadomień, np.:
        // notificationService.show(error.error.pickupDate || 'Błędne dane');
      } 
      
      else if (error.status === 403) {
        console.error('Forbidden access attempt');
      } 
      
      else if (error.status >= 500) {
        console.error('Server error occurred');
      }

      return throwError(() => error);
    }),
  );
};