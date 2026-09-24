import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FormField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  helperText?: string;
  defaultValue?: string;
  options?: string[];
  accept?: string;
  maxSize?: number;
}

export interface Service {
  service_id: number;
  service_name: string;
  description: string | null;
  requirements: string[] | null;
  form_fields: FormField[] | null;
  processing_fee: number;
  requires_photo: boolean;
  is_active: boolean;
  has_template?: boolean;
  request_count?: number;
}

export interface BarangayUpdate {
  id: string;
  title: string;
  summary: string;
  category: 'announcement' | 'notice' | 'information';
  published_at: string | null;
  is_pinned: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const BARANGAY_UPDATES: BarangayUpdate[] = [
  {
    id: 'portal-access',
    title: 'Online portal access now available',
    summary: 'Verified residents with an issued Barangay ID can request documents remotely through this portal.',
    category: 'announcement',
    published_at: null,
    is_pinned: true
  },
  {
    id: 'barangay-id-first',
    title: 'Apply for a Barangay ID first',
    summary: 'No online account yet? Visit the barangay office to apply for a Barangay ID and activate portal access.',
    category: 'notice',
    published_at: null,
    is_pinned: true
  },
  {
    id: 'digital-requirements',
    title: 'Digital requirements accepted',
    summary: 'Upload PDF, JPG, JPEG, or PNG files for document requests instead of submitting paper copies online.',
    category: 'information',
    published_at: null,
    is_pinned: false
  },
  {
    id: 'unified-workflow',
    title: 'One request workflow',
    summary: 'Online and kiosk requests use the same system so staff can review, approve, and release documents consistently.',
    category: 'information',
    published_at: null,
    is_pinned: false
  }
];

export interface UploadedRequirement {
  requirement_name: string;
  file_url: string;
  file_name: string;
  original_name: string;
  size?: number;
  mime_type?: string;
}

export interface RequestStatusHistoryItem {
  history_id: number;
  request_id: number;
  old_status_id?: number;
  new_status_id: number;
  status_name: string;
  remarks?: string;
  changed_at: string;
  changed_by_name?: string;
}

export interface PortalRequest {
  request_id: number;
  transaction_id: number;
  request_number: string;
  resident_id: number;
  service_id: number;
  service_name: string;
  processing_fee: number;
  service_description?: string;
  source: 'Online' | 'Kiosk';
  status_id: number;
  status_name: string;
  purpose?: string;
  remarks?: string;
  correction_remarks?: string;
  form_data: Record<string, any>;
  service_snapshot?: Record<string, any>;
  requirements: UploadedRequirement[];
  request_date: string;
  reviewed_date?: string;
  release_date?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  history?: RequestStatusHistoryItem[];
}

export interface SubmitRequestPayload {
  service_id: number;
  form_data: Record<string, any>;
  requirements: UploadedRequirement[];
  photo?: string;
  idempotency_key?: string;
}

export interface ResubmitRequestPayload {
  form_data?: Record<string, any>;
  requirements?: UploadedRequirement[];
  remarks?: string;
}

@Injectable({ providedIn: 'root' })
export class PortalService {
  private get apiUrl(): string {
    return environment.apiUrl;
  }

  constructor(private http: HttpClient) {}

  getServices(): Observable<ApiResponse<Service[]>> {
    return this.http.get<ApiResponse<Service[]>>(`${this.apiUrl}/kiosk/services`);
  }

  getPopularServices(limit = 6): Observable<ApiResponse<Service[]>> {
    return this.http.get<ApiResponse<Service[]>>(
      `${this.apiUrl}/kiosk/services/popular?limit=${limit}`
    );
  }

  getBarangayUpdates(): Observable<ApiResponse<BarangayUpdate[]>> {
    return of({
      success: true,
      message: 'Barangay updates retrieved.',
      data: BARANGAY_UPDATES
    });
  }

  uploadRequirement(file: File): Observable<ApiResponse<UploadedRequirement>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<UploadedRequirement>>(`${this.apiUrl}/portal/upload`, formData);
  }

  submitRequest(payload: SubmitRequestPayload): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/portal/requests`, payload);
  }

  getMyRequests(params?: { page?: number; limit?: number; statusId?: number; search?: string }): Observable<ApiResponse<{ requests: PortalRequest[]; total: number; page: number; limit: number }>> {
    let url = `${this.apiUrl}/portal/requests`;
    const queryParts: string[] = [];
    if (params?.page) queryParts.push(`page=${params.page}`);
    if (params?.limit) queryParts.push(`limit=${params.limit}`);
    if (params?.statusId) queryParts.push(`statusId=${params.statusId}`);
    if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (queryParts.length) url += `?${queryParts.join('&')}`;

    return this.http.get<ApiResponse<{ requests: PortalRequest[]; total: number; page: number; limit: number }>>(url);
  }

  getRequestById(id: number | string): Observable<ApiResponse<PortalRequest>> {
    return this.http.get<ApiResponse<PortalRequest>>(`${this.apiUrl}/portal/requests/${id}`);
  }

  resubmitRequest(id: number | string, payload: ResubmitRequestPayload): Observable<ApiResponse<PortalRequest>> {
    return this.http.put<ApiResponse<PortalRequest>>(`${this.apiUrl}/portal/requests/${id}/resubmit`, payload);
  }

  getPreviousServiceData(serviceId: number | string): Observable<ApiResponse<{ previous_request_id: number; previous_request_number: string; form_data: Record<string, any> }>> {
    return this.http.get<ApiResponse<{ previous_request_id: number; previous_request_number: string; form_data: Record<string, any> }>>(
      `${this.apiUrl}/portal/services/${serviceId}/previous-data`
    );
  }
}
