import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  console.log('Auth Guard checking if user is logged in');

  // During SSR, always allow access to simplify rendering
  if (!isPlatformBrowser(platformId)) {
    console.log('Server-side rendering, allowing access');
    return true;
  }

  if (authService.isLoggedIn()) {
    console.log('Auth Guard: User is logged in, allowing access to', state.url);
    return true;
  }

  // Redirect to login page if not authenticated
  console.log('Auth Guard: User is NOT logged in, redirecting to login page');
  router.navigate(['/login']);
  return false;
};
