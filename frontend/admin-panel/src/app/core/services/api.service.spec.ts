import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should make GET request', () => {
    const mockResponse = { success: true, message: 'OK', data: { id: 1 } };

    service.get('/test').subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/v1/test');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should make GET request with params', () => {
    const mockResponse = { success: true, message: 'OK', data: [] };

    service.get('/test', { page: 1, limit: 10 }).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(r => r.url === 'http://localhost:3000/api/v1/test');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush(mockResponse);
  });

  it('should make POST request', () => {
    const mockResponse = { success: true, message: 'Created', data: { id: 1 } };
    const body = { name: 'test' };

    service.post('/test', body).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/v1/test');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockResponse);
  });

  it('should make PUT request', () => {
    const mockResponse = { success: true, message: 'Updated', data: { id: 1 } };
    const body = { name: 'updated' };

    service.put('/test/1', body).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/v1/test/1');
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should make DELETE request', () => {
    const mockResponse = { success: true, message: 'Deleted', data: null };

    service.delete('/test/1').subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/v1/test/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('should skip null/undefined params', () => {
    service.get('/test', { page: 1, search: undefined, status: null }).subscribe();

    const req = httpMock.expectOne(r => r.url === 'http://localhost:3000/api/v1/test');
    expect(req.request.params.has('page')).toBeTruthy();
    expect(req.request.params.has('search')).toBeFalsy();
    expect(req.request.params.has('status')).toBeFalsy();
    req.flush({ success: true, message: 'OK', data: [] });
  });
});
