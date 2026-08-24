import { Component, OnInit, signal } from '@angular/core';
import { SettingsService, Setting } from './settings.service';
import { ButtonComponent } from '../../shared/components/button.component';
import { CardComponent } from '../../shared/components/card.component';
import { FormsModule } from '@angular/forms';

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
                    } @else if (setting.setting_key.endsWith('_reqs') || (setting.setting_value && setting.setting_value.includes('\n'))) {
                      <textarea rows="3" class="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" [(ngModel)]="setting.setting_value" [disabled]="setting.is_readonly" placeholder="One requirement per line"></textarea>
                    } @else {
                      <input type="text" class="w-full border rounded px-3 py-2" [(ngModel)]="setting.setting_value" [disabled]="setting.is_readonly" />
                    }
                  </div>
                } @empty {
                  <div class="text-gray-500 text-center py-4">No settings in this category</div>
                }
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

  constructor(
    private settingsService: SettingsService
  ) {}

  ngOnInit() {
    this.loadSettings();
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
}