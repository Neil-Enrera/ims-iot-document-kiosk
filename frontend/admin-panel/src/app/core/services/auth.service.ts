import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { tap, catchError, of } from 'rxjs';
import { User, LoginResponse, LoginInitiateResponse, ApiResponse } from '../../shared/interfaces/api.interfaces';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private isBrowser: boolean;

  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role_name === 'Administrator');
  isInitialized = signal(false);

  constructor(private http: HttpClient, private router: Router, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.loadUser();
    } else {
      this.isInitialized.set(true);
    }
  }

  private loadUser() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.isInitialized.set(true);
      return;
    }
    this.http.get<ApiResponse<User>>(`${this.API_URL}/auth/me`)
      .pipe(
        tap(res => {
          if (res.success) {
            this.currentUser.set(res.data);
          } else {
            this.logout();
          }
        }),
        catchError(err => {
          if (err.status === 401) {
            this.logout();
          }
          return of(null);
        })
      )
      .subscribe({
        next: () => this.isInitialized.set(true),
        error: () => this.isInitialized.set(true),
        complete: () => this.isInitialized.set(true),
      });
  }

  login(email: string, password: string) {
    return this.http.post<ApiResponse<LoginInitiateResponse>>(`${this.API_URL}/auth/login`, { email, password });
  }

  verifyLoginOtp(email: string, code: string, tempToken: string) {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API_URL}/auth/verify-otp`, { email, code, tempToken })
      .pipe(
        tap(res => {
          if (res.success && res.data) {
            if (this.isBrowser) localStorage.setItem('token', res.data.accessToken);
            this.currentUser.set(res.data.user);
          }
        })
      );
  }

  resendLoginOtp(email: string, tempToken: string) {
    return this.http.post<ApiResponse<LoginInitiateResponse>>(`${this.API_URL}/auth/resend-otp`, { email, tempToken });
  }

  logout() {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.API_URL}/auth/logout`, {}).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    if (this.isBrowser) localStorage.removeItem('token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('token');
  }

  forgotPassword(email: string) {
    return this.http.post<ApiResponse<void>>(`${this.API_URL}/auth/forgot-password`, { email });
  }

  verifyResetCode(email: string, code: string) {
    return this.http.post<ApiResponse<{ resetToken: string }>>(`${this.API_URL}/auth/verify-reset-code`, { email, code });
  }

  resetPassword(email: string, resetToken: string, newPassword: string) {
    return this.http.post<ApiResponse<void>>(`${this.API_URL}/auth/reset-password`, { email, resetToken, newPassword });
  }
}
