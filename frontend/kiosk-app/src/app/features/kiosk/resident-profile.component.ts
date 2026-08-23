import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { Resident, RfidCardInfo } from './kiosk.service';
import { TranslationService, KioskLanguage } from '../../i18n/translation.service';

@Component({
  selector: 'app-resident-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col justify-between">

      <!-- Background: subtle curve and watermarks -->
      <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
           style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0.15) 100%);"></div>
      
      <!-- Top-left orange curve decoration -->
      <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.15"/>
        </svg>
      </div>

      <!-- ============ TOP HEADER ============ -->
      <header class="relative z-10 shrink-0 px-4 sm:px-8 pt-3 pb-1">
        <div class="max-w-7xl mx-auto flex items-center justify-between relative">
          
          <!-- Back button (Left) -->
          <div class="flex items-center gap-2">
            <button (click)="onBack.emit()"
                    class="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-[#F97316] bg-white flex items-center justify-center shadow-xs hover:bg-[#FFF7ED] active:scale-95 transition-all focus:outline-none focus:ring-3 focus:ring-[#F97316]/30"
                    [attr.aria-label]="t('common.back')">
              <svg class="w-5 h-5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button (click)="onBack.emit()"
                    class="hidden sm:inline-flex text-[#0F172A] font-bold text-sm hover:text-[#F97316] transition-colors">
              {{ t('common.back') }}
            </button>
          </div>

          <!-- Centered Logo, Title, and Subtitle -->
          <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-[#F97316]/30 shadow-xs overflow-hidden flex items-center justify-center p-0.5">
              <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-contain">
            </div>
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#0F172A] mt-1 leading-tight">
              {{ t('profile.title') }}
            </h1>
            <p class="text-xs sm:text-sm font-semibold text-[#64748B] mt-0.5">
              {{ t('profile.subtitle') }}
            </p>
          </div>

          <!-- Right spacing balance -->
          <div class="w-10 sm:w-16"></div>

        </div>
      </header>

      <!-- ============ MAIN CONTENT AREA ============ -->
      <main class="relative z-10 flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-3 flex items-center justify-center">
        <div class="w-full max-w-6xl grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr] gap-4 sm:gap-5 items-stretch">
          
          <!-- ============ LEFT COLUMN: Profile Card & RFID Scanned Peach Box ============ -->
          <div class="flex flex-col gap-3.5 justify-center">
            
            <!-- Top: Profile Card -->
            <section aria-label="Profile" class="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-5 text-center flex flex-col items-center">
              <!-- Avatar -->
              <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-slate-200 shadow-sm overflow-hidden bg-[#F8FAFC] flex items-center justify-center shrink-0">
                @if (resident?.photo && !photoFailed()) {
                  <img [src]="residentPhoto()" (error)="onPhotoError()" alt="{{ residentFullName() }}"
                       class="w-full h-full object-cover" />
                } @else {
                  <div class="w-full h-full bg-[#FFF7ED] text-[#F97316] text-3xl font-black flex items-center justify-center">
                    {{ residentInitials() }}
                  </div>
                }
              </div>

              <!-- Name directly below picture -->
              <h2 class="text-lg sm:text-xl font-extrabold text-[#0F172A] mt-3 leading-tight">
                {{ residentDisplayName() }}
              </h2>

              <!-- Resident ID / Location below name -->
              <p class="text-xs font-semibold text-[#64748B] mt-1">
                @if (resident?.resident_code) {
                  {{ maskResidentCode(resident!.resident_code) }}
                } @else {
                  {{ t('landing.barangayName') }}
                }
              </p>

              <!-- Active Resident Badge below ID -->
              <div class="mt-2.5">
                <span class="inline-flex items-center gap-1.5 rounded-full border border-[#BBF7D0] bg-[#DCFCE7] px-3.5 py-1 text-xs font-bold text-[#15803D]">
                  <svg class="w-3.5 h-3.5 text-[#16A34A]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span>{{ t('profile.activeResident') }}</span>
                </span>
              </div>
            </section>

            <!-- Bottom: RFID Scanned Peach Card -->
            <section aria-label="RFID Scanned" class="bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-4 text-left shadow-2xs">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  i
                </div>
                <h3 class="text-sm font-bold text-[#C2410C]">
                  {{ t('profile.rfidScanned') }}
                </h3>
              </div>
              <p class="text-xs font-medium text-[#9A3412] mt-1.5 leading-relaxed">
                {{ t('profile.rfid.tapDesc') }}
              </p>
            </section>

          </div>

          <!-- ============ RIGHT COLUMN: Personal Information Card ============ -->
          <section aria-label="Personal Information" class="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-5 sm:p-6 lg:p-7 flex flex-col justify-between">
            <div>
              <!-- Header with Orange Icon -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#F97316] flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <h2 class="text-lg sm:text-xl font-extrabold text-[#0F172A]">
                    {{ t('profile.personalInfo') }}
                  </h2>
                </div>

                <!-- Touch-friendly Privacy Reveal Button -->
                <button
                  (click)="detailsHidden.set(!detailsHidden())"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 select-none"
                  [class]="detailsHidden()
                    ? 'border-[#F97316]/50 bg-[#FFF7ED] text-[#EA580C] hover:bg-[#FFEDD5]'
                    : 'border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100'"
                  [attr.aria-label]="detailsHidden() ? t('profile.showDetails') : t('profile.hideDetails')">
                  @if (detailsHidden()) {
                    <svg class="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    <span>{{ t('profile.showDetails') }}</span>
                  } @else {
                    <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>
                    </svg>
                    <span>{{ t('profile.hideDetails') }}</span>
                  }
                </button>
              </div>

              <!-- Orange Horizontal Divider Line -->
              <div class="h-0.5 bg-[#F97316] mt-3 mb-4 sm:mb-5 w-full rounded-full"></div>

              <!-- 2-Column Fields Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-4 sm:gap-y-5">
                
                <!-- Field 1: Birth Date -->
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#F97316] flex items-center justify-center shrink-0 mt-0.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{{ t('profile.birthDate') }}</p>
                    <p class="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5">
                      {{ mask(formatDisplayDate(resident?.birth_date) || t('profile.notProvided')) }}
                    </p>
                  </div>
                </div>

                <!-- Field 2: Sex -->
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#F97316] flex items-center justify-center shrink-0 mt-0.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <circle cx="10" cy="14" r="5"/>
                      <line x1="19" y1="5" x2="13.6" y2="10.4"/>
                      <line x1="19" y1="5" x2="14" y2="5"/>
                      <line x1="19" y1="5" x2="19" y2="10"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{{ t('profile.sex') }}</p>
                    <p class="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5">
                      {{ mask(fallback(resident?.gender)) }}
                    </p>
                  </div>
                </div>

                <!-- Field 3: Civil Status -->
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#F97316] flex items-center justify-center shrink-0 mt-0.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{{ t('profile.civilStatus') }}</p>
                    <p class="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5">
                      {{ mask(fallback(resident?.civil_status)) }}
                    </p>
                  </div>
                </div>

                <!-- Field 4: Contact Number -->
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#F97316] flex items-center justify-center shrink-0 mt-0.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{{ t('profile.contactNumber') }}</p>
                    <p class="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5">
                      {{ maskContact(resident?.contact_number) }}
                    </p>
                  </div>
                </div>

                <!-- Field 5: Email -->
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#F97316] flex items-center justify-center shrink-0 mt-0.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{{ t('profile.email') }}</p>
                    <p class="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5 break-all">
                      {{ maskEmail(resident?.email) }}
                    </p>
                  </div>
                </div>

                <!-- Field 6: Address -->
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#F97316] flex items-center justify-center shrink-0 mt-0.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{{ t('profile.address') }}</p>
                    <p class="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5 leading-snug">
                      {{ mask(fallback(resident?.address_line)) }}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </section>

        </div>
      </main>

      <!-- ============ BOTTOM ACTIONS ============ -->
      <div class="relative z-10 shrink-0 flex items-center justify-center py-2.5 px-4">
        <!-- OK Button -->
        <button (click)="onContinue.emit()"
                class="px-10 py-3 rounded-xl bg-[#F97316] text-white text-base sm:text-lg font-bold shadow-sm hover:bg-[#EA580C] active:scale-95 transition-all flex items-center gap-2 focus:outline-none focus:ring-3 focus:ring-[#F97316]/30">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          <span>{{ t('profile.ok') }}</span>
        </button>
      </div>

      <!-- ============ FOOTER ============ -->
      <footer class="relative z-10 shrink-0 border-t border-[#E5E7EB] bg-white/95 backdrop-blur-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-8 py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 items-center text-center">

          <!-- 1: Language -->
          <div class="flex flex-col items-center gap-1 min-w-0">
            <div class="flex items-center gap-1.5 text-[#0F172A]">
              <svg class="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
              <span class="text-xs font-bold text-slate-800">{{ t('landing.footer.language') }}</span>
            </div>
            <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-2xs">
              <button (click)="changeLanguage('en')"
                      class="px-2.5 py-1 text-xs font-bold transition-colors"
                      [class.bg-[#F97316]]="language === 'en'"
                      [class.text-white]="language === 'en'"
                      [class.text-[#0F172A]]="language !== 'en'">
                English
              </button>
              <button (click)="changeLanguage('fil')"
                      class="px-2.5 py-1 text-xs border-l border-[#E5E7EB] font-bold transition-colors"
                      [class.bg-[#F97316]]="language === 'fil'"
                      [class.text-white]="language === 'fil'"
                      [class.text-[#0F172A]]="language !== 'fil'">
                Filipino
              </button>
            </div>
          </div>

          <!-- 2: Need Assistance -->
          <div class="flex flex-col items-center gap-0.5 min-w-0">
            <div class="flex items-center gap-1 text-[#F97316]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>
              </svg>
              <span class="text-xs font-bold text-[#0F172A]">{{ t('landing.footer.assistance') }}</span>
            </div>
            <p class="text-[11px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
          </div>

          <!-- 3: Office Hours -->
          <div class="flex flex-col items-center gap-0.5 min-w-0">
            <div class="flex items-center gap-1 text-[#F97316]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span class="text-xs font-bold text-[#0F172A]">{{ t('landing.footer.hours') }}</span>
            </div>
            <p class="text-[11px] text-[#64748B]">{{ t('landing.footer.monFri') }} &bull; {{ t('landing.footer.hoursRange') }}</p>
          </div>

          <!-- 4: Date & Time -->
          <div class="flex flex-col items-center gap-0.5 min-w-0">
            <div class="flex items-center gap-1 text-[#F97316]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span class="text-[11px] font-medium text-[#64748B]">{{ formatFooterDate() }}</span>
            </div>
            <p class="text-sm font-extrabold text-[#F97316] font-mono leading-tight">{{ formatFooterTime() }}</p>
          </div>

        </div>
      </footer>

    </div>
  `
})
export class ResidentProfileComponent implements OnInit, OnDestroy {
  private _resident: Resident | null = null;
  @Input()
  set resident(r: Resident | null) {
    this.photoFailed.set(false);
    this.detailsHidden.set(true); // Automatically hide details on tap
    this._resident = r;
  }
  get resident(): Resident | null {
    return this._resident;
  }

  @Input() rfidCard: RfidCardInfo | null = null;
  @Input() language: KioskLanguage = 'en';

  @Output() onBack = new EventEmitter<void>();
  @Output() onContinue = new EventEmitter<void>();
  @Output() languageChange = new EventEmitter<KioskLanguage>();

  protected rfidCopied = signal(false);
  protected photoFailed = signal(false);
  protected currentDateTime = signal<Date>(new Date());
  protected detailsHidden = signal(true); // Always masked/hidden by default

  private dateTimeTimer: any;
  private copyTimer: any;

  constructor(private translations: TranslationService) {}

  ngOnInit(): void {
    this.detailsHidden.set(true);
    this.dateTimeTimer = setInterval(() => this.currentDateTime.set(new Date()), 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.dateTimeTimer);
    clearTimeout(this.copyTimer);
  }

  t(key: string, params?: Record<string, string | number>): string {
    return this.translations.translate(key, params);
  }

  changeLanguage(lang: KioskLanguage): void {
    this.languageChange.emit(lang);
  }

  residentFullName(): string {
    const r = this.resident;
    if (!r) return '';
    return [r.first_name, r.middle_name, r.last_name, r.suffix].filter(Boolean).join(' ');
  }

  residentInitials(): string {
    const r = this.resident;
    if (!r) return '';
    return ((r.first_name || '')[0] || '') + ((r.last_name || '')[0] || '');
  }

  isActiveResident(): boolean {
    const s = (this.resident?.status || '').toLowerCase();
    return s === 'active';
  }

  residentPhoto(): string {
    const p = this.resident?.photo;
    if (!p) return '';
    if (/^(https?:|data:|blob:)/i.test(p)) return p;
    const apiBase = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
    return `${apiBase}/uploads/${p.replace(/^\/+/, '')}`;
  }

  onPhotoError(): void {
    this.photoFailed.set(true);
  }

  formatDisplayDate(value: string | Date | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const raw = String(value);
    const datePart = raw.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [y, m, d] = datePart.split('-').map(Number);
      const dt = new Date(y, m - 1, d, 12, 0, 0);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString(this.language === 'fil' ? 'fil-PH' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: '2-digit'
        });
      }
    }
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleDateString(this.language === 'fil' ? 'fil-PH' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    });
  }

  fallback(value: string | null | undefined): string {
    if (value === null || value === undefined || String(value).trim() === '') {
      return this.t('profile.notProvided');
    }
    return String(value);
  }

  mask(value: string): string {
    return this.detailsHidden() ? '••••••' : value;
  }

  maskName(name: string): string {
    if (!name) return '';
    if (!this.detailsHidden()) return name;

    return name
      .split(/\s+/)
      .map(part => {
        const trimmed = part.trim();
        if (trimmed.length <= 2) {
          return trimmed;
        } else if (trimmed.length === 3) {
          return `${trimmed[0]}•${trimmed[2]}`;
        } else if (trimmed.length === 4) {
          return `${trimmed[0]}••${trimmed[3]}`;
        } else {
          const dots = '•'.repeat(trimmed.length - 3);
          return `${trimmed.slice(0, 2)}${dots}${trimmed.slice(-1)}`;
        }
      })
      .join(' ');
  }

  residentDisplayName(): string {
    return this.maskName(this.residentFullName());
  }

  maskResidentCode(code: string | null | undefined): string {
    if (!code) return '';
    if (!this.detailsHidden()) return code;

    const parts = code.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-••••-${parts.slice(2).join('-')}`;
    }
    if (code.length > 6) {
      return `${code.slice(0, 3)}••••${code.slice(-4)}`;
    }
    return '••••••';
  }

  maskContact(phone: string | null | undefined): string {
    if (!phone || !String(phone).trim()) return this.t('profile.notProvided');
    if (!this.detailsHidden()) return phone;
    const clean = String(phone).trim();
    if (clean.length >= 10) {
      return `${clean.slice(0, 4)} ••• •${clean.slice(-3)}`;
    }
    return '••••••';
  }

  maskEmail(email: string | null | undefined): string {
    if (!email || !String(email).trim()) return this.t('profile.notProvided');
    if (!this.detailsHidden()) return email;
    const clean = String(email).trim();
    const parts = clean.split('@');
    if (parts.length === 2 && parts[0].length >= 3) {
      const user = parts[0];
      const maskedUser = user.length <= 4
        ? `${user[0]}••${user.slice(-1)}`
        : `${user.slice(0, 2)}${'•'.repeat(user.length - 3)}${user.slice(-1)}`;
      return `${maskedUser}@${parts[1]}`;
    }
    return '••••••';
  }

  maskRfidUid(uid: string | null | undefined): string {
    if (!uid) return '';
    if (!this.detailsHidden()) return uid;
    if (uid.includes(':')) {
      const parts = uid.split(':');
      if (parts.length >= 3) {
        return `${parts[0]}:•••:•••:${parts[parts.length - 1]}`;
      }
    }
    if (uid.length >= 6) {
      return `${uid.slice(0, 2)}${'•'.repeat(uid.length - 4)}${uid.slice(-2)}`;
    }
    return '••••••••';
  }

  formatFooterDate(): string {
    return this.currentDateTime().toLocaleDateString(this.language === 'fil' ? 'fil-PH' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatFooterTime(): string {
    return this.currentDateTime().toLocaleTimeString(this.language === 'fil' ? 'fil-PH' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}
