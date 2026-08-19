export interface User {
  user_id: number;
  username: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string | null;
  contact_number: string | null;
  status: string;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  role_id: number;
  role_name: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface LoginInitiateResponse {
  email: string;
  maskedEmail: string;
  tempToken: string;
  expiresMinutes: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Resident {
  resident_id: number;
  resident_code: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  birth_date: string | null;
  birth_place: string | null;
  nationality: string | null;
  religion: string | null;
  occupation: string | null;
  gender: string | null;
  civil_status: string | null;
  barangay_id: number;
  address_line: string;
  house_number: string | null;
  street: string | null;
  purok_zone: string | null;
  sitio: string | null;
  municipality: string | null;
  province: string | null;
  zip_code: string | null;
  contact_number: string | null;
  email: string | null;
  blood_type: string | null;
  photo: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RfidCard {
  rfid_card_id?: number | null;
  resident_id: number;
  resident_code?: string;
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  suffix?: string | null;
  card_uid?: string | null;
  status?: string | null;
  card_status?: string | null;
  registration_status?: string;
  issued_date?: string | null;
  expiration_date?: string | null;
  created_at?: string;
  resident_name?: string;
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

export type DocumentMappingSource = 'resident' | 'application' | 'system';

export interface DocumentMapping {
  placeholder: string;
  source: DocumentMappingSource;
  field: string;
}

export interface Service {
  service_id: number;
  service_name: string;
  description: string | null;
  requirements: string[] | null;
  form_fields: FormField[] | null;
  processing_fee: number;
  requires_photo: boolean;
  template_path: string | null;
  template_original_name: string | null;
  template_mime: string | null;
  template_size: number | null;
  document_mappings: DocumentMapping[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeneratedDocument {
  document_id: number;
  request_id: number;
  service_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  generated_by: number | null;
  generated_at: string;
  generated_by_first: string | null;
  generated_by_last: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  generation_warnings: string[] | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_remarks: string | null;
}

export interface DocumentRequest {
  request_id: number;
  request_number: string;
  resident_id: number;
  service_id: number;
  status_id: number;
  purpose: string | null;
  remarks: string | null;
  form_data: Record<string, unknown> | null;
  service_snapshot: {
    service_id: number;
    service_name: string;
    description: string | null;
    requirements: string[] | null;
    form_fields: FormField[] | null;
    processing_fee: number | null;
    requires_photo: boolean | null;
  } | null;
  request_date: string;
  reviewed_date: string | null;
  release_date: string | null;
  expires_at: string | null;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
  status_name: string;
  service_name: string;
  processing_fee: number;
  resident_name: string;
  resident_code: string;
  assigned_staff: string | null;
  history?: RequestStatusHistory[];
}

export interface RequestStatusHistory {
  history_id: number;
  request_id: number;
  old_status_id: number | null;
  new_status_id: number;
  changed_by: number | null;
  remarks: string | null;
  changed_at: string;
  status_name: string;
  changed_by_name: string | null;
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
  form_data: Record<string, unknown> | null;
  status: string;
  review_remarks: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  resident_id: number | null;
  id_number: string | null;
  id_issued_at: string | null;
  id_expiration_date: string | null;
  id_card_path: string | null;
  id_card_mime: string | null;
  id_card_size: number | null;
  id_card_generated_at: string | null;
  created_at: string;
  updated_at: string;
  reviewed_by_name: string | null;
}

export interface AuditLog {
  audit_log_id: number;
  user_id: number;
  action: string;
  module: string;
  ip_address: string | null;
  created_at: string;
  username?: string;
}

export interface DashboardSummary {
  totalResidents: number;
  totalRequests: number;
  pendingRequests: number;
  releasedRequests: number;
  activeServices: number;
  todayRequests: number;
}
