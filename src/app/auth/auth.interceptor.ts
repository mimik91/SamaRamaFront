import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log(`Intercepting request to ${req.url}`);
  console.log(`Token available: ${token ? 'Yes' : 'No'}`);

  // List of public endpoints that don't need authentication
  const publicEndpoints = [
    '/api/auth/signin',
    '/api/auth/signup',
    '/api/verification/verify',
    '/api/verification/resend',
    '/api/service-packages/active',
    '/api/enumerations/BRAND',
    '/api/enumerations/CITY',
    '/api/guest-orders'
  ];
  
  // Check if current request is to a public endpoint
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));
  console.log(`Is public endpoint: ${isPublicEndpoint}`);
  
  // If it's a public endpoint, don't add a token
  if (isPublicEndpoint) {
    console.log('Public endpoint, proceeding without authentication');
    return next(req);
  }
  
  // If we have a token, add it to all other requests
  if (token) {
    console.log(`Adding token to request: ${token.substring(0, 15)}...`);
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(clonedRequest);
  }
  
  console.log('No token available, proceeding without authentication');
  
  // Try to reload the session from localStorage directly
  if (typeof localStorage !== 'undefined') {
    const sessionData = localStorage.getItem('auth_session');
    console.log('Direct localStorage check:', sessionData ? 'session found' : 'no session');
  }
  
  return next(req);
};