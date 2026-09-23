import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (!authService.isInitialized()) {
    if (!authService.getToken()) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }
    if (authService.mustChangePassword()) {
      return router.createUrlTree(['/change-password']);
    }
    return true;
  }

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  if (authService.mustChangePassword() && state.url !== '/change-password') {
    return router.createUrlTree(['/change-password']);
  }

  return true;
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (authService.isAuthenticated() && !authService.mustChangePassword()) {
    return router.createUrlTree(['/']);
  }

  return true;
};

export const changePasswordGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (!authService.getToken()) {
    return router.createUrlTree(['/login']);
  }

  if (authService.isInitialized() && authService.isAuthenticated() && !authService.mustChangePassword()) {
    return router.createUrlTree(['/']);
  }

  return true;
};
