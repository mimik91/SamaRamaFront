import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log(`Intercepting request to ${req.url}`);

  const publicEndpoints = [
    '/api/service-packages/active',
    '/api/enumerations/BRAND',
    '/api/enumerations/CITY'  // Allow CITY enumeration without authentication
  ];
  
  // Sprawdź, czy obecne żądanie jest do publicznego endpointu
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));
  
  // Jeśli to publiczny endpoint, nie dodawaj tokenu
  if (isPublicEndpoint) {
    console.log('Public endpoint, proceeding without authentication');
    return next(req);
  }
  
  // Zawsze dołączaj token do żądań POST/PUT/DELETE
  const isPostPutDelete = ['POST', 'PUT', 'DELETE'].includes(req.method);
  
  // Zawsze dodawaj token do żądań związanych ze zdjęciami
  const isPhotoEndpoint = req.url.includes('/photo');
  
  if (token && (isPostPutDelete || isPhotoEndpoint)) {
    console.log(`Adding token to request: ${token.substring(0, 15)}...`);
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(clonedRequest);
  } else if (token) {
    // Dla innych żądań też dodajemy token, jeśli jest dostępny
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(clonedRequest);
  } else {
    console.log('No token available, proceeding without authentication');
  }

  return next(req);
};