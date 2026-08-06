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
  blood_type: string | null;
  barangay_id: number;
  address_line: string;
  contact_number: string | null;
  email: string | null;
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  photo: string | null;
  status: string;
}

export type FormFieldType =
  | 'text' | 'textarea' | 'number' | 'date' | 'tel' | 'email'
  | 'select' | 'checkbox' | 'radio' | 'signature' | 'photo' | 'file';

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  helperText?: string;
  defaultValue?: string;
  options?: string[];
  accept?: string;
  maxSize?: number;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: string;
  };
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

export interface StatusDisplay {
  updatedAt: string;
  underReview: string[];
  readyForRelease: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface GuestInfo {
  full_name: string;
  middle_name?: string;
  birth_date?: string;
  address?: string;
  contact_number?: string;
  email?: string;
}

export interface RfidVerifyResult {
  recognized: boolean;
  message?: string;
  resident?: Resident;
  rfid?: any;
}

export interface BarangayIdApplication {
  application_id: number;
  application_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  birth_date: string | null;
  gender: string | null;
  civil_status: string | null;
  occupation: string | null;
  blood_type: string | null;
  address_line: string;
  contact_number: string | null;
  email: string | null;
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  photo: string | null;
  signature: string | null;
  status: string;
  application_number_display?: string;
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
    resident_id?: number;
    guest?: GuestInfo;
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
    occupation?: string;
    bloodType?: string;
    addressLine: string;
    contactNumber?: string;
    email?: string;
    emergencyContactName?: string;
    emergencyContactNumber?: string;
    photo?: string;
    signature?: string;
    form_data?: Record<string, unknown>;
  }): Observable<ApiResponse<BarangayIdApplication>> {
    return this.http.post<ApiResponse<BarangayIdApplication>>(`${this.apiUrl}/kiosk/barangay-id`, data);
  }

  verifyRfid(rfidUid: string): Observable<ApiResponse<RfidVerifyResult>> {
    return this.http.post<ApiResponse<RfidVerifyResult>>(`${this.apiUrl}/kiosk/rfid/verify`, { rfidUid });
  }

  getHardwareStatus(): Observable<ApiResponse<HardwareStatus>> {
    return this.http.get<ApiResponse<HardwareStatus>>(`${this.apiUrl}/kiosk/hardware/status`);
  }

  getStatusDisplay(): Observable<ApiResponse<StatusDisplay>> {
    return this.http.get<ApiResponse<StatusDisplay>>(`${this.apiUrl}/kiosk/status-display`);
  }

  reset() {
    // No-op: state is managed in the component
  }
}
