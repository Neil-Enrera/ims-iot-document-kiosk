import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
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
}
