import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ErrorHandlerService } from './error-handler.service';
import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const errorHandler = inject(ErrorHandlerService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Let the error handler service handle the notification
      errorHandler.handleError(error);
      
      // Special handling for authentication errors
      if (error.status === 401) {
        console.error('Unauthorized access attempt - redirecting to login');
        authService.logout(); // Clear auth state
        router.navigate(['/login']);
      } else if (error.status === 403) {
        console.error('Forbidden access attempt');
        
        // Redirect based on user role
        if (authService.isClient()) {
          router.navigate(['/welcome']);
        } else if (authService.isService()) {
          router.navigate(['/service-panel']);
        } else {
          router.navigate(['/login']);
        }
      }

      // Re-throw the error for components to handle specific logic
      return throwError(() => error);
    }),
  );
};