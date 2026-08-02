import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { tap, catchError, of } from 'rxjs';
import { User, LoginResponse, ApiResponse } from '../../shared/interfaces/api.interfaces';
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

  login(username: string, password: string) {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API_URL}/auth/login`, { username, password })
      .pipe(
        tap(res => {
          if (res.success) {
            if (this.isBrowser) localStorage.setItem('token', res.data.accessToken);
            this.currentUser.set(res.data.user);
          }
        })
      );
  }

  logout() {
    if (this.isBrowser) localStorage.removeItem('token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('token');
  }
}
