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
    '/api/enumerations/CITY',
    '/api/guest-orders'  // Added guest-orders endpoint
  ];
  
  // Check if current request is to a public endpoint
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));
  
  // If it's a public endpoint, don't add a token
  if (isPublicEndpoint) {
    console.log('Public endpoint, proceeding without authentication');
    return next(req);
  }
  
  // Always include token for POST/PUT/DELETE requests
  const isPostPutDelete = ['POST', 'PUT', 'DELETE'].includes(req.method);
  
  // Always add token to requests related to photos
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
    // For other requests, also add a token if available
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