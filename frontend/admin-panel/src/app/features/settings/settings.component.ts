import { Component, OnInit, signal } from '@angular/core';
import { SettingsService, Setting } from './settings.service';
import { BarangayService } from '../../shared/services';
import { ButtonComponent } from '../../shared/components/button.component';
import { CardComponent } from '../../shared/components/card.component';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface BarangayProfile {
  barangay_id: number;
  barangay_name: string;
  city: string;
  province: string;
  id_template_path: string | null;
  id_template_original_name: string | null;
  id_template_mime: string | null;
  id_template_size: number | null;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ButtonComponent, CardComponent, FormsModule],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">System Settings</h1>
        <app-button variant="primary" (onClick)="saveAll()" [loading]="saving()">Save Changes</app-button>
      </div>

      <div class="flex gap-6">
        <div class="w-56 flex-shrink-0">
          <app-card>
            <nav class="space-y-1">
              @for (cat of categories; track cat) {
                <button class="w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors"
                        [class]="selectedCategory() === cat ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'"
                        (click)="selectCategory(cat)">
                  {{ formatCategory(cat) }}
                </button>
              }
            </nav>
          </app-card>
        </div>

        <div class="flex-1">
          <app-card>
            <h2 class="text-lg font-semibold text-gray-800 mb-4">{{ formatCategory(selectedCategory()) }}</h2>

            @if (loading()) {
              <div class="space-y-4">
                @for (i of [1,2,3]; track i) {
                  <div class="h-10 bg-gray-200 rounded animate-pulse"></div>
                }
              </div>
            } @else {
              <div class="space-y-4">
                @for (setting of currentSettings(); track setting.setting_key) {
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      {{ setting.description || setting.setting_key }}
                    </label>
                    @if (setting.setting_type === 'boolean') {
                      <select class="w-full border rounded px-3 py-2" [(ngModel)]="setting.setting_value" [disabled]="setting.is_readonly">
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    } @else if (setting.setting_type === 'number') {
                      <input type="number" class="w-full border rounded px-3 py-2" [(ngModel)]="setting.setting_value" [disabled]="setting.is_readonly" />
                    } @else {
                      <input type="text" class="w-full border rounded px-3 py-2" [(ngModel)]="setting.setting_value" [disabled]="setting.is_readonly" />
                    }
                  </div>
                } @empty {
                  <div class="text-gray-500 text-center py-4">No settings in this category</div>
                }
              </div>
            }

            @if (selectedCategory() === 'barangay') {
              <div class="mt-6 pt-6 border-t border-gray-200">
                <h3 class="text-md font-semibold text-gray-800 mb-1">Barangay ID Card Template</h3>
                <p class="text-sm text-gray-500 mb-4">
                  Official DOCX template used to print every approved Barangay ID. Add
                  <code class="px-1 py-0.5 bg-gray-100 rounded">{{'{{'}}placeholder{{'}}'}}</code> tags
                  (e.g. <code class="px-1 py-0.5 bg-gray-100 rounded">{{'{{'}}full_name{{'}}'}}</code>,
                  <code class="px-1 py-0.5 bg-gray-100 rounded">{{'{{'}}id_number{{'}}'}}</code>,
                  <code class="px-1 py-0.5 bg-gray-100 rounded">{{'{{'}}resident_photo{{'}}'}}</code>) to auto-fill the card.
                </p>

                @if (templateLoading()) {
                  <div class="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                } @else if (templateNotice()) {
                  <div class="mb-3 px-3 py-2 rounded-lg text-sm"
                       [class]="templateNoticeClass(templateNoticeType())">{{ templateNotice() }}</div>
                }

                @if (barangay(); as profile) {
                  @if (profile.id_template_path) {
                    <div class="flex items-center justify-between gap-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-gray-800 truncate">{{ profile.id_template_original_name || 'ID card template' }}</p>
                        <p class="text-xs text-gray-500">
                          DOCX &middot; {{ formatFileSize(profile.id_template_size) }}
                          @if (profile.id_template_path) {
                            &middot; <a [href]="templateDownloadUrl(profile)" target="_blank" class="text-blue-600 hover:underline">Download</a>
                          }
                        </p>
                      </div>
                      <app-button variant="danger" size="sm" (onClick)="removeTemplate()" [loading]="uploading()">Remove</app-button>
                    </div>
                  } @else {
                    <div class="flex items-center justify-between gap-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                      <p class="text-sm text-yellow-800">No template uploaded yet. Upload a <code>.docx</code> to enable Barangay ID generation.</p>
                    </div>
                  }
                } @else if (profileLoadError()) {
                  <div class="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <p class="text-sm text-red-800">Could not load the current template information. You can still upload — it will replace the barangay's ID card template.</p>
                  </div>
                }

                <div class="mt-4 flex items-center gap-3">
                  <label class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg cursor-pointer hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <span>Upload Template</span>
                    <input type="file" accept=".docx" class="hidden" (change)="onTemplateSelected($event)" [disabled]="uploading()" />
                  </label>
                  @if (uploading()) {
                    <span class="text-sm text-gray-500">Uploading...</span>
                  }
                </div>
              </div>
            }
          </app-card>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  settings = signal<Record<string, Setting[]>>({});
  selectedCategory = signal('barangay');
  loading = signal(true);
  saving = signal(false);

  categories = ['barangay', 'kiosk', 'document', 'notification', 'system'];

  currentSettings = signal<Setting[]>([]);

  barangay = signal<BarangayProfile | null>(null);
  templateLoading = signal(false);
  uploading = signal(false);
  profileLoadError = signal(false);
  templateNotice = signal('');
  templateNoticeType = signal<'success' | 'error'>('success');

  private readonly assetBase = environment.apiUrl.replace(/\/api\/v1$/, '');

  constructor(
    private settingsService: SettingsService,
    private barangayService: BarangayService
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.loadBarangayProfile();
  }

  loadSettings() {
    this.loading.set(true);
    this.settingsService.getAll().subscribe({
      next: (result: any) => {
        this.settings.set(result?.data || {});
        this.selectCategory(this.selectedCategory());
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadBarangayProfile() {
    this.templateLoading.set(true);
    this.profileLoadError.set(false);
    this.barangayService.get().subscribe({
      next: (result: any) => {
        this.barangay.set(result?.data || null);
        this.templateLoading.set(false);
      },
      error: () => {
        this.barangay.set(null);
        this.profileLoadError.set(true);
        this.templateLoading.set(false);
      }
    });
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
    this.currentSettings.set(this.settings()[category] || []);
  }

  saveAll() {
    this.saving.set(true);
    const allSettings = this.currentSettings();
    const updates = allSettings
      .filter(s => !s.is_readonly)
      .map(s => this.settingsService.update(s.setting_key, s.setting_value));

    let completed = 0;
    const total = updates.length;
    if (total === 0) { this.saving.set(false); return; }

    updates.forEach(obs => obs.subscribe({
      next: () => {
        completed++;
        if (completed === total) {
          this.saving.set(false);
          this.loadSettings();
        }
      },
      error: () => {
        completed++;
        if (completed === total) this.saving.set(false);
      }
    }));
  }

  formatCategory(category: string): string {
    const labels: Record<string, string> = {
      barangay: 'Barangay Profile',
      kiosk: 'Kiosk Configuration',
      document: 'Document Settings',
      notification: 'Notification Settings',
      system: 'System Information'
    };
    return labels[category] || category;
  }

  onTemplateSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx')) {
      this.showNotice('The Barangay ID card template must be a .docx file.', 'error');
      input.value = '';
      return;
    }
    this.uploading.set(true);
    this.templateNotice.set('');
    const profile = this.barangay();
    const id = profile?.barangay_id ?? 1;
    this.barangayService.uploadIdTemplate(id, file).subscribe({
      next: (result: any) => {
        this.uploading.set(false);
        this.barangay.set(result?.data || null);
        this.showNotice(result?.message || 'Barangay ID card template uploaded successfully.', 'success');
        input.value = '';
      },
      error: (err) => {
        this.uploading.set(false);
        this.showNotice(err?.error?.message || 'Failed to upload the template.', 'error');
        input.value = '';
      }
    });
  }

  removeTemplate() {
    const profile = this.barangay();
    if (!profile) return;
    if (!confirm('Remove the current Barangay ID card template?')) return;
    this.uploading.set(true);
    this.barangayService.removeIdTemplate(profile.barangay_id).subscribe({
      next: (result: any) => {
        this.uploading.set(false);
        this.barangay.set(result?.data || null);
        this.showNotice(result?.message || 'Barangay ID card template removed.', 'success');
      },
      error: (err) => {
        this.uploading.set(false);
        this.showNotice(err?.error?.message || 'Failed to remove the template.', 'error');
      }
    });
  }

  templateDownloadUrl(profile: BarangayProfile): string {
    return profile.id_template_path ? `${this.assetBase}/uploads/${profile.id_template_path}` : '';
  }

  formatFileSize(bytes: number | null): string {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  private showNotice(message: string, type: 'success' | 'error') {
    this.templateNotice.set(message);
    this.templateNoticeType.set(type);
    setTimeout(() => this.templateNotice.set(''), 5000);
  }

  templateNoticeClass(type: 'success' | 'error'): string {
    return type === 'success'
      ? 'bg-green-50 text-green-800 border border-green-200'
      : 'bg-red-50 text-red-800 border border-red-200';
  }
}