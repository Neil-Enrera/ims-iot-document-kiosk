import { Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Observable } from 'rxjs';

export interface Setting {
  setting_id: number;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  description: string;
  is_readonly: boolean;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private api: ApiService) {}

  getAll(): Observable<any> {
    return this.api.get('/settings');
  }

  getByCategory(category: string): Observable<any> {
    return this.api.get(`/settings/category/${category}`);
  }

  getByKey(key: string): Observable<any> {
    return this.api.get(`/settings/${key}`);
  }

  update(key: string, value: string): Observable<any> {
    return this.api.put(`/settings/${key}`, { value });
  }
}
