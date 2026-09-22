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
}
