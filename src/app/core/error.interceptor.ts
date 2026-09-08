import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../environments/environments';
import { NotificationService } from './notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notificationService = inject(NotificationService);
  const isServer = isPlatformServer(inject(PLATFORM_ID));

  // Lista endpointów, które nie powinny wymuszać przekierowania do logowania przy 401
  // (np. zamówienia gościa, rejestracja, cennik)
  const publicEndpoints = [
    environment.endpoints.guestOrders.transport,
    environment.endpoints.serviceRecords,
    '/auth/login',
    '/active-transport',
    'service-records/bicycle',
    '/user/service-orders',
    '/service-calendar/clients/lookup',
    '/bike-services/logos/reservation-available'
  ];
  const isPublicEndpoint = publicEndpoints.some(url => req.url.includes(url));

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      if (error.status === 401) {
        if (isPublicEndpoint) {
          console.warn('Unauthorized on public endpoint - likely validation or session issue, not redirecting.');
        } else if (isServer) {
          // SSR nie ma tokenu, więc chronione endpointy zawsze zwracają 401. Powiadomienie
          // (auto-hide 5 s) + router.navigate() na serwerze trzymały render ~5 s, bo Angular
          // czeka na stabilność aplikacji zanim odda HTML (logi Heroku 2026-09-08).
          console.warn('Unauthorized during SSR (no token) for', req.url, '- skipping redirect');
        } else {
          console.error('Unauthorized access attempt - redirecting to login', error);
          // Bez tego komunikatu wygasła sesja wyglądała jak niewyjaśniona awaria (np. moderator
          // widział "zlecenia się nie ładują", a w rzeczywistości ciche przekierowanie na /login).
          notificationService.warning('Twoja sesja wygasła — zaloguj się ponownie');
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

      else if (error.status === 0) {
        // Request się nie wykonał w ogóle - sieć, CORS, timeout. Bez tej gałęzi ginęło
        // bez śladu (żaden z powyższych warunków go nie łapał).
        console.error('Network or CORS failure (status 0) for', req.url, error);
      }

      return throwError(() => error);
    }),
  );
};