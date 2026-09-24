import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { tap, catchError, of, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PortalAccount {
  portal_account_id: number;
  account_id: string;
  resident_id: number;
  resident_code?: string;
  email: string;
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  suffix?: string | null;
  birth_date?: string | null;
  birth_place?: string | null;
  gender?: string | null;
  civil_status?: string | null;
  blood_type?: string | null;
  occupation?: string | null;
  nationality?: string | null;
  religion?: string | null;
  house_number?: string | null;
  street?: string | null;
  subdivision?: string | null;
  block?: string | null;
  lot?: string | null;
  purok_zone?: string | null;
  sitio?: string | null;
  municipality?: string | null;
  province?: string | null;
  zip_code?: string | null;
  barangay_id?: number;
  barangay_name?: string | null;
  address_line?: string;
  contact_number?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_number?: string | null;
  photo?: string | null;
  status: string;
  resident_status?: string;
  must_change_password: boolean;
  last_login?: string | null;
}

export interface PortalLoginResponse {
  accessToken: string;
  mustChangePassword: boolean;
  account: PortalAccount;
}

export interface PortalApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const TOKEN_KEY = 'portal_token';
const MUST_CHANGE_KEY = 'portal_must_change_password';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private isBrowser: boolean;

  currentUser = signal<PortalAccount | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());
  mustChangePassword = computed(() => this.currentUser()?.must_change_password === true);
  isInitialized = signal(false);

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.loadUser();
    } else {
      this.isInitialized.set(true);
    }
  }

  private loadUser(): void {
    const token = this.getToken();
    if (!token) {
      this.isInitialized.set(true);
      return;
    }

    this.http.get<PortalApiResponse<PortalAccount>>(`${this.apiUrl}/portal/me`)
      .pipe(
        tap(res => {
          if (res.success && res.data) {
            this.currentUser.set(res.data);
          } else {
            this.clearSession();
          }
        }),
        catchError(err => {
          if (err.status === 401) {
            this.clearSession();
          }
          return of(null);
        })
      )
      .subscribe({
        next: () => this.isInitialized.set(true),
        error: () => this.isInitialized.set(true),
        complete: () => this.isInitialized.set(true)
      });
  }

  login(identifier: string, password: string): Observable<PortalApiResponse<PortalLoginResponse>> {
    return this.http.post<PortalApiResponse<PortalLoginResponse>>(`${this.apiUrl}/portal/login`, {
      email: identifier,
      accountId: identifier,
      identifier,
      password
    }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.storeToken(res.data.accessToken);
          this.setMustChange(res.data.mustChangePassword);
          this.currentUser.set(res.data.account);
        }
      })
    );
  }

  changePassword(newPassword: string): Observable<PortalApiResponse<{ mustChangePassword: boolean }>> {
    return this.http.post<PortalApiResponse<{ mustChangePassword: boolean }>>(
      `${this.apiUrl}/portal/change-password`,
      { newPassword }
    ).pipe(
      tap(res => {
        if (res.success) {
          this.setMustChange(false);
          const user = this.currentUser();
          if (user) {
            this.currentUser.set({ ...user, must_change_password: false });
          }
        }
      })
    );
  }

  forgotPassword(identifier: string): Observable<PortalApiResponse<{ maskedEmail?: string }>> {
    return this.http.post<PortalApiResponse<{ maskedEmail?: string }>>(
      `${this.apiUrl}/portal/forgot-password`,
      { accountId: identifier, email: identifier, identifier }
    );
  }

  verifyResetCode(identifier: string, code: string): Observable<PortalApiResponse<{ resetToken: string; accountId: string; email: string }>> {
    return this.http.post<PortalApiResponse<{ resetToken: string; accountId: string; email: string }>>(
      `${this.apiUrl}/portal/verify-reset-code`,
      { accountId: identifier, email: identifier, identifier, code }
    );
  }

  resetPassword(identifier: string, resetToken: string, newPassword: string): Observable<PortalApiResponse<void>> {
    return this.http.post<PortalApiResponse<void>>(`${this.apiUrl}/portal/reset-password`, {
      accountId: identifier,
      email: identifier,
      identifier,
      resetToken,
      newPassword
    });
  }

  logout(): void {
    this.clearSession();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private storeToken(token: string): void {
    if (this.isBrowser) localStorage.setItem(TOKEN_KEY, token);
  }

  private setMustChange(value: boolean): void {
    if (!this.isBrowser) return;
    if (value) {
      localStorage.setItem(MUST_CHANGE_KEY, '1');
    } else {
      localStorage.removeItem(MUST_CHANGE_KEY);
    }
  }

  private clearSession(): void {
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(MUST_CHANGE_KEY);
    }
  }
}
