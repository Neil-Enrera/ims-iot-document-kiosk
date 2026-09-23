import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  return next(req).pipe(
    catchError(err => {
      if (err.status === 0) {
        console.error('Cannot connect to server');
      }

      if (err.status === 401 && isBrowser) {
        const url = req.urlWithParams || req.url;
        const isAuthRequest =
          url.includes('/portal/login') ||
          url.includes('/portal/me') ||
          url.includes('/portal/forgot-password') ||
          url.includes('/portal/verify-reset-code') ||
          url.includes('/portal/reset-password');

        if (!isAuthRequest && !router.url.includes('/login') && !router.url.includes('/change-password')) {
          localStorage.removeItem('portal_token');
          localStorage.removeItem('portal_must_change_password');
          router.navigate(['/login']);
        }
      }

      return throwError(() => err);
    })
  );
};
