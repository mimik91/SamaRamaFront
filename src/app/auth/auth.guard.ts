// src/app/auth/auth.guard.ts
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { isPlatformBrowser } from '@angular/common';

// Role-based auth guard
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot, 
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // During SSR, always allow access
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // Check if user is logged in
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  
  // Get allowed roles from route data
  const allowedRoles = route.data['roles'] as string[] | undefined;
  
  // If no specific roles required, any authenticated user can access
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }
  
  // Check if user has one of the required roles
  const userRole = authService.getUserRole();
  
  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }
  
  // If user has ADMIN or MODERATOR role, always allow access regardless of other roles
  if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
    return true;
  }
  
  // Redirect based on user role
  if (userRole === 'CLIENT') {
    router.navigate(['/welcome']);
  } else if (userRole === 'SERVICE') {
    router.navigate(['/service-panel']);
  } else if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
    router.navigate(['/admin']);
  } else {
    router.navigate(['/login']);
  }
  
  return false;
};

// Specific guard for client role
export const clientGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  if (!isPlatformBrowser(platformId)) {
    return true;
  }
  
  if (authService.isLoggedIn() && (authService.isClient() || authService.isAdmin())) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

// Specific guard for service role
export const serviceGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  if (!isPlatformBrowser(platformId)) {
    return true;
  }
  
  if (authService.isLoggedIn() && authService.isAdmin()) {
    return true;
  }
  
  if (authService.isClient()) {
    router.navigate(['/welcome']);
  } else {
    router.navigate(['/login-serviceman']);
  }
  
  return false;
};

// Specific guard for admin or moderator role
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  if (!isPlatformBrowser(platformId)) {
    return true;
  }
  
  if (authService.isLoggedIn() && (authService.isAdmin() || authService.isModerator())) {
    return true;
  }
  
  // Redirect based on role
  if (authService.isClient()) {
    router.navigate(['/welcome']);
  } else {
    router.navigate(['/login']);
  }
  
  return false;
};