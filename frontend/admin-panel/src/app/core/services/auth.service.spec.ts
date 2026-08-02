import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const mockNavigate = vi.fn();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: { navigate: mockNavigate } }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have currentUser as null initially', () => {
    expect(service.currentUser()).toBeNull();
  });

  it('should not be authenticated initially', () => {
    expect(service.isAuthenticated()).toBeFalsy();
  });

  it('should not be admin initially', () => {
    expect(service.isAdmin()).toBeFalsy();
  });

  it('should login and set currentUser', () => {
    const mockUser = {
      user_id: 1, username: 'admin', first_name: 'Admin', middle_name: null,
      last_name: 'User', email: null, contact_number: null, status: 'ACTIVE',
      last_login: null, created_at: '', updated_at: '', role_id: 1, role_name: 'Administrator'
    };
    const mockResponse = {
      success: true, message: 'Login successful',
      data: { accessToken: 'test-token', user: mockUser }
    };

    service.login('admin', 'password123').subscribe(res => {
      expect(res.success).toBeTruthy();
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBeTruthy();
      expect(service.isAdmin()).toBeTruthy();
      expect(localStorage.getItem('token')).toBe('test-token');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should logout and clear token', () => {
    localStorage.setItem('token', 'test-token');
    service.logout();
    expect(localStorage.getItem('token')).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith(['/login']);
  });

  it('should return null token when not in browser', () => {
    const token = service.getToken();
    expect(token).toBeNull();
  });
});
