// auth.guard.ts - POPRAWIONA WERSJA
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

  console.log('AuthGuard: Checking access to:', state.url);

  // Check if user is logged in
  if (!authService.isLoggedIn()) {
    console.log('AuthGuard: User not logged in, redirecting to /login');
    router.navigate(['/login'], { replaceUrl: true }); // WAŻNE: replaceUrl!
    return false;
  }
  
  // Get allowed roles from route data
  const allowedRoles = route.data['roles'] as string[] | undefined;
  
  // If no specific roles required, any authenticated user can access
  if (!allowedRoles || allowedRoles.length === 0) {
    console.log('AuthGuard: No specific roles required, access granted');
    return true;
  }
  
  // Check if user has one of the required roles
  const userRole = authService.getUserRole();
  console.log('AuthGuard: User role:', userRole, 'Required roles:', allowedRoles);
  
  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }
  
  // If user has ADMIN or MODERATOR role, always allow access regardless of other roles
  if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
    return true;
  }
  
  // Redirect based on user role - UNIKAJ pętli przekierowań!
  console.log('AuthGuard: Access denied, redirecting based on role');
  if (userRole === 'CLIENT') {
    router.navigate(['/bicycles'], { replaceUrl: true });
  } else if (userRole === 'SERVICE') {
    router.navigate(['/service-panel'], { replaceUrl: true });
  } else if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
    router.navigate(['/admin-dashboard'], { replaceUrl: true });
  } else {
    // Jeśli nieznana rola, wyloguj użytkownika
    console.log('AuthGuard: Unknown role, logging out');
    authService.logout();
    router.navigate(['/login'], { replaceUrl: true });
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
  
  console.log('ClientGuard: Checking client access to:', state.url);
  
  if (!authService.isLoggedIn()) {
    console.log('ClientGuard: Not logged in, redirecting to /login');
    router.navigate(['/login'], { replaceUrl: true });
    return false;
  }
  
  if (authService.isClient() || authService.isAdmin()) {
    console.log('ClientGuard: Access granted');
    return true;
  }
  
  console.log('ClientGuard: Access denied');
  router.navigate(['/login'], { replaceUrl: true });
  return false;
};

// Specific guard for admin role
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  if (!isPlatformBrowser(platformId)) {
    return true;
  }
  
  console.log('AdminGuard: Checking admin access to:', state.url);
  
  if (!authService.isLoggedIn()) {
    console.log('AdminGuard: Not logged in, redirecting to /login');
    router.navigate(['/login'], { replaceUrl: true });
    return false;
  }
  
  if (authService.isAdmin() || authService.isModerator()) {
    console.log('AdminGuard: Admin access granted');
    return true;
  }
  
  // Redirect based on role
  console.log('AdminGuard: Not admin, redirecting based on role');
  if (authService.isClient()) {
    router.navigate(['/bicycles'], { replaceUrl: true });
  } else {
    router.navigate(['/login'], { replaceUrl: true });
  }
  
  return false;
};