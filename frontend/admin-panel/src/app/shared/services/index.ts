import { Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { HttpClient } from '@angular/common/http';
import { User, Resident, RfidCard, Service, DocumentRequest, AuditLog, DashboardSummary, BarangayIdApplication, GeneratedDocument } from '../interfaces/api.interfaces';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: ApiService) {}

  getAll(params?: any) {
    return this.api.getList<User>('/users', params);
  }

  getById(id: number) {
    return this.api.get<User>(`/users/${id}`);
  }

  create(data: any) {
    return this.api.post<User>('/users', data);
  }

  update(id: number, data: any) {
    return this.api.put<User>(`/users/${id}`, data);
  }

  delete(id: number) {
    return this.api.delete(`/users/${id}`);
  }

  changeStatus(id: number, status: string) {
    return this.api.patch(`/users/${id}/status`, { status });
  }
}

@Injectable({ providedIn: 'root' })
export class ResidentService {
  constructor(private api: ApiService) {}

  getAll(params?: any) {
    return this.api.getList<Resident>('/residents', params);
  }

  getById(id: number) {
    return this.api.get<Resident>(`/residents/${id}`);
  }

  create(data: any) {
    return this.api.post<Resident>('/residents', data);
  }

  update(id: number, data: any) {
    return this.api.put<Resident>(`/residents/${id}`, data);
  }

  archive(id: number) {
    return this.api.patch(`/residents/${id}/archive`);
  }

  restore(id: number) {
    return this.api.patch(`/residents/${id}/restore`);
  }

  delete(id: number) {
    return this.api.delete(`/residents/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class RfidService {
  constructor(private api: ApiService) {}

  getAll(params?: any) {
    return this.api.getList<RfidCard>('/rfid', params);
  }

  getById(id: number) {
    return this.api.get<RfidCard>(`/rfid/${id}`);
  }

  register(data: { residentId: number; cardUid: string }) {
    return this.api.post<RfidCard>('/rfid', data);
  }

  verify(rfidUid: string) {
    return this.api.post<any>('/rfid/verify', { rfidUid });
  }

  updateStatus(id: number, status: string) {
    return this.api.patch(`/rfid/${id}/status`, { status });
  }
}

@Injectable({ providedIn: 'root' })
export class ServiceService {
  constructor(private api: ApiService) {}

  getAll(params?: any) {
    return this.api.getList<Service>('/services', params);
  }

  getById(id: number) {
    return this.api.get<Service>(`/services/${id}`);
  }

  create(data: any) {
    return this.api.post<Service>('/services', data);
  }

  update(id: number, data: any) {
    return this.api.put<Service>(`/services/${id}`, data);
  }

  toggleStatus(id: number, isActive: boolean) {
    return this.api.patch(`/services/${id}/status`, { isActive });
  }

  uploadTemplate(id: number, file: File) {
    const formData = new FormData();
    formData.append('template', file);
    return this.api.post<Service>(`/services/${id}/template`, formData);
  }

  removeTemplate(id: number) {
    return this.api.delete<Service>(`/services/${id}/template`);
  }

  scanTemplatePlaceholders(id: number) {
    return this.api.get<any>(`/services/${id}/template/placeholders`);
  }

  getPlaceholderLibrary() {
    return this.api.get<any>('/services/placeholders/library');
  }

  delete(id: number) {
    return this.api.delete(`/services/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  constructor(private api: ApiService, private http: HttpClient) {}

  list(requestId: number) {
    return this.api.get<GeneratedDocument[]>(`/requests/${requestId}/documents`);
  }

  generate(requestId: number) {
    return this.api.post<any>(`/requests/${requestId}/documents/generate`, {});
  }

  fetchBlob(requestId: number, documentId: number) {
    return this.http.get(this.previewUrl(requestId, documentId), { responseType: 'blob' });
  }

  downloadUrl(requestId: number, documentId: number): string {
    return this.api.baseUrl + `/requests/${requestId}/documents/${documentId}/download`;
  }

  previewUrl(requestId: number, documentId: number): string {
    return this.api.baseUrl + `/requests/${requestId}/documents/${documentId}/preview`;
  }

  previewBlobUrl(requestId: number, documentId: number): string {
    return this.previewUrl(requestId, documentId);
  }

  review(requestId: number, documentId: number, status: string, remarks?: string) {
    return this.api.post<any>(`/requests/${requestId}/documents/${documentId}/review/${status}`, { remarks });
  }
}

@Injectable({ providedIn: 'root' })
export class RequestService {
  constructor(private api: ApiService) {}

  getAll(params?: any) {
    return this.api.getList<DocumentRequest>('/requests', params);
  }

  getById(id: number) {
    return this.api.get<DocumentRequest>(`/requests/${id}`);
  }

  create(data: { residentId: number; serviceId: number; purpose?: string }) {
    return this.api.post<DocumentRequest>('/requests', data);
  }

  approve(id: number, remarks?: string) {
    return this.api.post(`/requests/${id}/approve`, { remarks });
  }

  reject(id: number, remarks?: string) {
    return this.api.post(`/requests/${id}/reject`, { remarks });
  }

  cancel(id: number, remarks?: string) {
    return this.api.post(`/requests/${id}/cancel`, { remarks });
  }

  release(id: number, remarks?: string) {
    return this.api.post(`/requests/${id}/release`, { remarks });
  }

  update(id: number, data: { serviceId: number; purpose?: string; remarks?: string; reason?: string; formData?: any }) {
    return this.api.put<DocumentRequest>(`/requests/${id}`, data);
  }

  changeStatus(id: number, statusId: number, remarks?: string) {
    return this.api.put(`/requests/${id}/status`, { statusId, remarks });
  }

  getStats() {
    return this.api.get<any>('/requests/stats');
  }
}

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  constructor(private api: ApiService, private http: HttpClient) {}

  getAll(params?: any) {
    return this.api.getList<BarangayIdApplication>('/applications', params);
  }

  getById(id: number) {
    return this.api.get<BarangayIdApplication>(`/applications/${id}`);
  }

  // Render a DRAFT preview of the Barangay ID card. This never approves the
  // application, never assigns an ID number, and never creates a resident — it
  // is a review-only preview of the applicant's submitted information.
  previewBlob(id: number) {
    return this.http.post(`${this.api.baseUrl}/applications/${id}/preview`, {}, { responseType: 'blob' });
  }

  approve(id: number, remarks?: string) {
    return this.api.post<BarangayIdApplication>(`/applications/${id}/approve`, { remarks });
  }

  reject(id: number, remarks?: string) {
    return this.api.post<BarangayIdApplication>(`/applications/${id}/reject`, { remarks });
  }
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private api: ApiService) {}

  getSummary() {
    return this.api.get<DashboardSummary>('/dashboard/summary');
  }

  getRequestStats() {
    return this.api.get<any>('/dashboard/requests');
  }

  getResidentStats() {
    return this.api.get<any>('/dashboard/residents');
  }

  getActivities() {
    return this.api.get<any>('/dashboard/activities');
  }
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private api: ApiService) {}

  getRequests(params: any) {
    return this.api.get<any>('/reports/requests', params);
  }
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  constructor(private api: ApiService) {}

  getAll(params?: any) {
    return this.api.getList<AuditLog>('/audit-logs', params);
  }

  getModules() {
    return this.api.get<string[]>('/audit-logs/modules');
  }

  getById(id: number) {
    return this.api.get<AuditLog>(`/audit-logs/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class BarangayService {
  constructor(private api: ApiService) {}

  get(id = 1) {
    return this.api.get<any>(`/barangays/${id}`);
  }
}
