import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Resident {
  resident_id: number;
  resident_code: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  birth_date: string | null;
  gender: string | null;
  civil_status: string | null;
  barangay_id: number;
  address_line: string;
  contact_number: string | null;
  email: string | null;
  photo: string | null;
  status: string;
}

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'tel' | 'email' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface Service {
  service_id: number;
  service_name: string;
  description: string | null;
  requirements: string[] | null;
  form_fields: FormField[] | null;
  required_documents: string[] | null;
  processing_fee: number;
  processing_time: string | null;
  requires_photo: boolean;
  approval_workflow: string | null;
  is_active: boolean;
}

export interface DocumentRequest {
  request_id: number;
  request_number: string;
  resident_id: number;
  service_id: number;
  status_id: number;
  purpose: string | null;
  remarks: string | null;
  request_date: string;
  status_name: string;
  service_name: string;
  processing_fee: number;
  resident_name: string;
  resident_code: string;
}

export interface HardwareStatus {
  serial: boolean;
  port: string;
  lastRfid: string | null;
  uptime: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class KioskService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  searchResidents(query: string, limit = 10): Observable<ApiResponse<Resident[]>> {
    const params = new HttpParams()
      .set('q', query)
      .set('limit', String(limit));
    return this.http.get<ApiResponse<Resident[]>>(`${this.apiUrl}/kiosk/residents/search`, { params });
  }

  getResident(id: number): Observable<ApiResponse<Resident>> {
    return this.http.get<ApiResponse<Resident>>(`${this.apiUrl}/kiosk/residents/${id}`);
  }

  getServices(): Observable<ApiResponse<Service[]>> {
    return this.http.get<ApiResponse<Service[]>>(`${this.apiUrl}/kiosk/services`);
  }

  createRequest(data: {
    resident_id: number;
    service_id: number;
    purpose?: string;
    remarks?: string;
    photo?: string;
    form_data?: Record<string, unknown>;
  }): Observable<ApiResponse<DocumentRequest>> {
    return this.http.post<ApiResponse<DocumentRequest>>(`${this.apiUrl}/kiosk/requests`, data);
  }

  createBarangayId(data: {
    firstName: string;
    middleName?: string;
    lastName: string;
    suffix?: string;
    birthDate?: string;
    gender?: string;
    civilStatus?: string;
    addressLine: string;
    contactNumber?: string;
    email?: string;
    bloodType?: string;
    emergencyContactName?: string;
    emergencyContactNumber?: string;
    photo?: string;
    form_data?: Record<string, unknown>;
  }): Observable<ApiResponse<DocumentRequest>> {
    return this.http.post<ApiResponse<DocumentRequest>>(`${this.apiUrl}/kiosk/barangay-id`, data);
  }

  getHardwareStatus(): Observable<ApiResponse<HardwareStatus>> {
    return this.http.get<ApiResponse<HardwareStatus>>(`${this.apiUrl}/kiosk/hardware/status`);
  }

  reset() {
    // No-op: state is managed in the component
  }
}
