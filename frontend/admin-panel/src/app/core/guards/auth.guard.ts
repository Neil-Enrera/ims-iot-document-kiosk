import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // On the server, we cannot check localStorage or current user session yet.
  // Allow the route to pass so the client-side app can run and perform verification.
  if (!isBrowser) {
    return true;
  }

  // Wait for auth initialization before checking
  if (!authService.isInitialized()) {
    // Redirect to login if token doesn't exist (fast path)
    if (!authService.getToken()) {
      router.navigate(['/login']);
      return false;
    }
    // Token exists, allow navigation (loadUser will verify in background)
    return true;
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
