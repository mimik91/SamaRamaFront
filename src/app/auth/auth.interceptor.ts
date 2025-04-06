import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log(`Intercepting request to ${req.url}`);
  
  if (token) {
    console.log(`Adding token to request: ${token.substring(0, 15)}...`);
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