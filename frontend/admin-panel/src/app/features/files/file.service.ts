import { Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Observable } from 'rxjs';

export interface FileRecord {
  file_id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  category: string;
  uploaded_by: number;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class FileService {
  constructor(private api: ApiService) {}

  getAll(page = 1, limit = 20): Observable<any> {
    return this.api.get(`/files?page=${page}&limit=${limit}`);
  }

  getById(id: number): Observable<any> {
    return this.api.get(`/files/${id}`);
  }

  upload(file: File, category: string, description?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (description) formData.append('description', description);
    return this.api.post('/files/upload', formData);
  }

  download(id: number): Observable<any> {
    return this.api.get(`/files/${id}/download`);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`/files/${id}`);
  }
}
