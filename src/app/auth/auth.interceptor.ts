import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // List of public endpoints that don't need authentication
  const publicEndpoints = [
    '/api/auth/signin',
    '/api/auth/signup',
    '/api/verification/verify',
    '/api/verification/resend',
    '/api/service-packages/active',
    '/api/enumerations/BRAND',
    '/api/enumerations/CITY',
    '/api/guest-orders',
    '/api/password/reset-request',
    '/api/password/reset',
    '/api/service-slots/availability'
  ];
  
  // Check if current request is to a public endpoint
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));
  
  // If it's a public endpoint, don't add a token
  if (isPublicEndpoint) {
    return next(req);
  }
  
  // Only attach token if user is logged in
  if (token && authService.isLoggedIn()) {
    // Check if token is not expired
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(clonedRequest);
  } else {
    // If we need a token but don't have one, handle session expiration
    // Only for non-GET requests or specific secure endpoints
    if (req.method !== 'GET' || 
        req.url.includes('/api/service-orders') || 
        req.url.includes('/api/admin')) {
      
      // Let the request proceed but it will likely fail with 401
      setTimeout(() => {
        if (!authService.isLoggedIn() && !isPublicEndpoint) {
          console.log('Session expired, redirecting to login');
          // Skip redirect if already on login pages
          if (!window.location.href.includes('/login')) {
            router.navigate(['/login']);
          }
        }
      }, 500);
    }
    return next(req);
  }
};