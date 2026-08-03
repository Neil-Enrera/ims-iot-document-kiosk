import { Component, OnInit, signal } from '@angular/core';
import { FileService, FileRecord } from './file.service';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [TableComponent, ButtonComponent, CardComponent, InputComponent, PaginationComponent, ModalComponent, ConfirmDialogComponent, FormsModule],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">File Management</h1>
        <app-button variant="primary" (onClick)="showUploadForm.set(true)">+ Upload File</app-button>
      </div>

      <app-card>
        <div class="mb-4 flex gap-4">
          <div class="flex-1">
            <app-input placeholder="Search files..." [value]="search()" (valueChange)="onSearch($event)" />
          </div>
        </div>

        <app-table
          [columns]="columns"
          [data]="files()"
          [loading]="loading()"
          trackBy="file_id"
          emptyMessage="No files found" />

        @if (total() > limit) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            (onPageChange)="onPageChange($event)" />
        }
      </app-card>

      <app-modal [open]="showUploadForm()" title="Upload File" (onClose)="showUploadForm.set(false)">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select class="w-full border rounded px-3 py-2" [(ngModel)]="uploadCategory">
              <option value="">Select category</option>
              <option value="resident">Resident</option>
              <option value="request">Document Request</option>
              <option value="payment">Payment</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input class="w-full border rounded px-3 py-2" [(ngModel)]="uploadDescription" placeholder="File description" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">File</label>
            <input type="file" class="w-full border rounded px-3 py-2" (change)="onFileSelected($event)" accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx,.csv" />
          </div>
          <div class="flex justify-end gap-2">
            <app-button variant="secondary" (onClick)="showUploadForm.set(false)">Cancel</app-button>
            <app-button variant="primary" (onClick)="uploadFile()" [loading]="uploading()">Upload</app-button>
          </div>
        </div>
      </app-modal>

      <app-confirm-dialog
        [open]="showDeleteConfirm()"
        title="Delete File"
        message="Are you sure you want to delete this file? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        (onCancel)="showDeleteConfirm.set(false)"
        (onConfirm)="confirmDelete()"
      />
    </div>
  `
})
export class FilesComponent implements OnInit {
  files = signal<FileRecord[]>([]);
  loading = signal(true);
  search = signal('');
  page = signal(1);
  limit = 20;
  total = signal(0);

  showUploadForm = signal(false);
  uploadCategory = '';
  uploadDescription = '';
  selectedFile: File | null = null;
  uploading = signal(false);

  showDeleteConfirm = signal(false);
  deletingFile = signal<FileRecord | null>(null);

  columns: TableColumn[] = [
    { key: 'original_name', label: 'File Name' },
    { key: 'category', label: 'Category' },
    { key: 'mime_type', label: 'Type' },
    { key: 'file_size', label: 'Size' },
    { key: 'created_at', label: 'Uploaded' },
  ];

  constructor(private fileService: FileService) {}

  ngOnInit() {
    this.loadFiles();
  }

  loadFiles() {
    this.loading.set(true);
    this.fileService.getAll(this.page(), this.limit).subscribe({
      next: (result: any) => {
        this.files.set(result?.data || []);
        this.total.set(result?.pagination?.total || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(value: string) {
    this.search.set(value);
    this.page.set(1);
    this.loadFiles();
  }

  onPageChange(newPage: number) {
    this.page.set(newPage);
    this.loadFiles();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  uploadFile() {
    if (!this.selectedFile || !this.uploadCategory) return;
    this.uploading.set(true);
    this.fileService.upload(this.selectedFile, this.uploadCategory, this.uploadDescription).subscribe({
      next: () => {
        this.showUploadForm.set(false);
        this.uploading.set(false);
        this.selectedFile = null;
        this.uploadCategory = '';
        this.uploadDescription = '';
        this.loadFiles();
      },
      error: () => this.uploading.set(false)
    });
  }

  deleteFile(file: FileRecord) {
    this.deletingFile.set(file);
    this.showDeleteConfirm.set(true);
  }

  confirmDelete() {
    const file = this.deletingFile();
    if (file) {
      this.fileService.delete(file.file_id).subscribe({
        next: () => {
          this.showDeleteConfirm.set(false);
          this.loadFiles();
        }
      });
    }
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
