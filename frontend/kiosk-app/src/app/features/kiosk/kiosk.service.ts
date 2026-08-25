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
  birth_place?: string | null;
  gender: string | null;
  civil_status: string | null;
  blood_type: string | null;
  occupation: string | null;
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
  has_template?: boolean;
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

// One kiosk submission = one transaction grouping one or more service requests.
// request_number stays populated (first request) for backward compatibility.
export interface TransactionSubmission {
  transaction_id: number | null;
  transaction_number: string | null;
  request_id: number | null;
  request_number: string;
  request_date: string | null;
  status: string;
  duplicate: boolean;
  requests: {
    request_id: number;
    request_number: string;
    request_date: string | null;
    service_id: number;
    service_name: string;
  }[];
  possible_duplicates: {
    service_id: number;
    service_name: string;
    matches: { request_id: number; request_number: string; status_name: string }[];
  }[];
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

export interface RfidCardInfo {
  rfid_card_id: number;
  resident_id: number;
  card_uid: string;
  issued_date: string | null;
  expiration_date: string | null;
  status: string;
  created_at?: string;
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
  private get apiUrl(): string {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const host = window.location.hostname;
      return `${protocol}//${host}:3000/api/v1`;
    }
    return environment.apiUrl;
  }

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

  getSettings(): Observable<ApiResponse<Record<string, string>>> {
    return this.http.get<ApiResponse<Record<string, string>>>(`${this.apiUrl}/kiosk/settings`);
  }

  createRequest(data: {
    resident_id?: number;
    guest?: GuestInfo;
    service_id?: number;
    services?: {
      service_id: number;
      form_data?: Record<string, unknown>;
      photo?: string;
    }[];
    purpose?: string;
    remarks?: string;
    photo?: string;
    form_data?: Record<string, unknown>;
    idempotency_key?: string;
  }): Observable<ApiResponse<TransactionSubmission>> {
    return this.http.post<ApiResponse<TransactionSubmission>>(`${this.apiUrl}/kiosk/requests`, data);
  }

  previewRequest(data: {
    resident_id?: number;
    guest?: GuestInfo;
    service_id: number;
    form_data?: Record<string, unknown>;
  }): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/kiosk/requests/preview`, data, { responseType: 'blob' });
  }

  createBarangayId(data: {
    firstName: string;
    middleName?: string;
    lastName: string;
    suffix?: string;
    birthDate?: string;
    birthPlace?: string;
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

  previewBarangayId(data: {
    firstName: string;
    middleName?: string;
    lastName: string;
    suffix?: string;
    birthDate?: string;
    birthPlace?: string;
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
    formData?: Record<string, unknown>;
  }): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/kiosk/barangay-id/preview`, data, { responseType: 'blob' });
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

  captureWebcam(): Observable<any> {
    const hardwareHttpUrl = environment.hardwareWsUrl
      .replace(/^ws/, 'http')
      .replace(/\/ws.*$/, '');
    return this.http.post<any>(`${hardwareHttpUrl}/api/hardware/capture`, {});
  }

  captureEsp32Cam(url?: string): Observable<Blob> {
    const targetUrl = url || environment.esp32CamCaptureUrl || 'http://192.168.254.111/capture';
    return this.http.get(targetUrl, { responseType: 'blob' });
  }

  blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  reset() {
    // No-op: state is managed in the component
  }
}

