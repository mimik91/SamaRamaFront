import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Nieautoryzowany dostęp - przekieruj do logowania
        console.error('Unauthorized access attempt - redirecting to login');
        router.navigate(['/login']);
      } else if (error.status === 403) {
        // Brak uprawnień
        console.error('Forbidden access attempt');
      } else if (error.status === 404) {
        // Nie znaleziono zasobu
        console.error('Resource not found');
      } else if (error.status >= 500) {
        // Błąd serwera
        console.error('Server error occurred');
      }

      // Możesz dodać wyświetlanie komunikatów błędów dla użytkownika
      // np. przez usługę powiadomień

      return throwError(() => error);
    }),
  );
};
