import { HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  return next(req).pipe(
    catchError(err => {
      if (err.status === 401 && isBrowser) {
        const url = req.urlWithParams || req.url;
        const isAuthRequest = url.includes('/auth/me') || url.includes('/auth/login');

        if (!isAuthRequest && !router.url.includes('/login')) {
          localStorage.removeItem('token');
          router.navigate(['/login']);
        }
      }
      return throwError(() => err);
    })
  );
};
