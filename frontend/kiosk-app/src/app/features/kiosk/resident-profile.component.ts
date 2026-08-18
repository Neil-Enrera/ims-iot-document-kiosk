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
    <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

      <!-- Barangay background: orange curve (upper-left), tree line-art (left) and hall line-art (right) -->
      <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
           style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
      <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
        </svg>
      </div>

      <!-- ============ HEADER: back (left) + logo (center) + RFID status (right) + title/subtitle ============ -->
      <header class="relative z-10 shrink-0">
        <div class="flex items-center justify-center relative pt-1.5 pb-0.5 [@media(max-height:768px)]:pt-1 [@media(max-height:768px)]:pb-0.5">
          <div class="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 sm:gap-2.5">
            <button (click)="onBack.emit()"
                    class="w-[42px] h-[42px] sm:w-[44px] sm:h-[44px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                    [attr.aria-label]="t('common.back')">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button (click)="onBack.emit()"
                    class="flex items-center min-h-[38px] rounded-xl px-1 text-[#0F172A] font-semibold text-[13px] sm:text-[14px] hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
              {{ t('common.back') }}
            </button>
          </div>

          <div class="w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] min-[1101px]:w-[64px] min-[1101px]:h-[64px] rounded-full bg-white border-2 border-[#F97316]/30 shadow-sm overflow-hidden flex items-center justify-center [@media(max-height:768px)]:w-[48px] [@media(max-height:768px)]:h-[48px]">
            <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
          </div>

          @if (rfidCard) {
            <div class="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-xl border-[1.5px] border-[#86EFAC] bg-[#DCFCE7] px-2.5 py-1 shadow-sm">
              <svg class="w-5 h-5 text-[#16A34A] shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="6" width="18" height="12" rx="2"/>
                <path d="M7 9.5h8M7 12h8" stroke-linecap="round"/>
                <path d="M18 9v0.01M18 12.5v0.01M18 16v0.01" stroke-linecap="round" stroke-width="2.5"/>
              </svg>
              <div>
                <p class="text-[12.5px] sm:text-[13.5px] font-bold text-[#15803D] leading-tight">{{ t('profile.rfidScanned') }}</p>
                <p class="text-[11px] sm:text-[11.5px] font-medium text-[#166534] leading-tight">{{ t('profile.rfidScannedDesc') }}</p>
              </div>
            </div>
          }
        </div>

        <div class="text-center px-4 pt-0.25 pb-0.75 [@media(max-height:768px)]:pb-0.5">
          <h1 class="text-[clamp(1.625rem,1.9vw,2rem)] font-bold tracking-tight text-[#0F172A] leading-none [@media(max-height:768px)]:text-[1.375rem]">{{ t('profile.title') }}</h1>
          <p class="text-[clamp(0.9375rem,1vw,1.0625rem)] font-medium text-[#64748B] mt-0.75 [@media(max-height:768px)]:mt-0.5">{{ t('profile.subtitle') }}</p>
        </div>
      </header>

      <!-- ============ MAIN CONTENT (only this area scrolls on short screens) ============ -->
      <main class="relative z-10 flex-1 min-h-0 overflow-y-auto">
        <div class="min-h-full mx-auto w-[calc(100%-32px)] sm:w-[calc(100%-48px)] min-[1101px]:w-[calc(100%-80px)] max-w-[1500px] grid grid-cols-1 min-[1101px]:grid-cols-[minmax(0,1fr)_380px] gap-4 min-[1101px]:gap-6 py-3 [@media(max-height:880px)]:py-1.5">

          <!-- ============ LEFT: Resident profile + history ============ -->
          <div class="min-h-0 flex flex-col gap-3 min-[1101px]:gap-4">

            <!-- Resident profile card -->
            <section aria-label="Resident Profile" class="shrink-0 bg-white border border-[#E5E7EB] rounded-[16px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] p-4 sm:p-5 [@media(max-height:768px)]:p-3">

              <!-- Identity header: photo/initials + name + status + privacy toggle button -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-[#F1F5F9]">
                <div class="flex items-center gap-3 sm:gap-4 min-w-0">
                  @if (resident?.photo && !photoFailed()) {
                    <img [src]="residentPhoto()" (error)="onPhotoError()" alt="{{ residentFullName() }}"
                         class="shrink-0 w-[84px] h-[98px] sm:w-[96px] sm:h-[112px] min-[1101px]:w-[108px] min-[1101px]:h-[126px] rounded-[8px] object-cover border border-[#E5E7EB] shadow-sm bg-[#F8FAFC] [@media(max-height:768px)]:w-[72px] [@media(max-height:768px)]:h-[84px]" />
                  } @else {
                    <div class="shrink-0 w-[84px] h-[98px] sm:w-[96px] sm:h-[112px] min-[1101px]:w-[108px] min-[1101px]:h-[126px] rounded-[8px] bg-[#FFF7ED] border border-[#F97316]/25 flex items-center justify-center text-[#F97316] text-2xl sm:text-3xl font-bold [@media(max-height:768px)]:w-[72px] [@media(max-height:768px)]:h-[84px] [@media(max-height:768px)]:text-xl"
                         aria-hidden="true">
                      {{ residentInitials() }}
                    </div>
                  }

                  <div class="min-w-0">
                    <h2 class="text-[22px] sm:text-[24px] min-[1101px]:text-[26px] font-bold text-[#0F172A] leading-tight break-words tracking-tight [@media(max-height:768px)]:text-[20px]">{{ residentDisplayName() }}</h2>
                    @if (resident?.resident_code) {
                      <p class="text-[13px] sm:text-[14px] min-[1101px]:text-[15px] font-medium text-[#64748B] mt-0.5 tracking-wide">{{ maskResidentCode(resident!.resident_code) }}</p>
                    }
                    @if (isActiveResident()) {
                      <span class="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-[#BBF7D0] bg-[#DCFCE7] px-2.5 py-0.5 [@media(max-height:768px)]:mt-1"
                            role="status">
                        <svg class="w-3 h-3 text-[#16A34A]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="7"/></svg>
                        <span class="text-[12px] sm:text-[13px] min-[1101px]:text-[14px] font-bold text-[#15803D]">{{ t('profile.activeResident') }}</span>
                      </span>
                    }
                  </div>
                </div>

                <!-- Touchscreen-friendly Show/Hide Details Privacy Control -->
                <div class="shrink-0 self-end sm:self-center">
                  <button
                    (click)="detailsHidden.set(!detailsHidden())"
                    class="inline-flex items-center gap-2 rounded-xl border px-3.5 sm:px-4 py-2 sm:py-2.5 text-[13px] sm:text-[14px] font-bold transition-all duration-150 active:scale-[0.97] focus:outline-none focus:ring-4 min-h-[44px] sm:min-h-[48px] shadow-sm select-none"
                    [class]="detailsHidden()
                      ? 'border-[#F97316]/50 bg-[#FFF7ED] text-[#EA580C] hover:bg-[#FFEDD5] focus:ring-[#F97316]/30'
                      : 'border-[#CBD5E1] bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9] focus:ring-[#94A3B8]/30'"
                    [attr.aria-label]="detailsHidden() ? t('profile.showDetails') : t('profile.hideDetails')"
                    [attr.aria-pressed]="!detailsHidden()">
                    @if (detailsHidden()) {
                      <svg class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                      <span>{{ t('profile.showDetails') }}</span>
                    } @else {
                      <svg class="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-[#64748B]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>
                      </svg>
                      <span>{{ t('profile.hideDetails') }}</span>
                    }
                  </button>
                </div>
              </div>

              <!-- Personal information: two-column grid on landscape -->
              <div class="mt-2 [@media(max-height:768px)]:mt-1.5 grid grid-cols-1 min-[900px]:grid-cols-2 gap-x-4 gap-y-1.5 [@media(max-height:768px)]:gap-y-1">

                <div class="flex items-start gap-3 pr-2 py-2.5 border-t border-[#F1F5F9] min-w-0 [@media(max-height:880px)]:py-2">
                  <span class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                    <svg class="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="3.5"/><path stroke-linecap="round" d="M5 20c0-3.8 3.1-6 7-6s7 2.2 7 6"/>
                    </svg>
                  </span>
                  <div class="min-w-0">
                    <p class="text-[13px] sm:text-[14px] font-semibold text-[#64748B]">{{ t('profile.fullName') }}</p>
                    <p class="text-[15px] sm:text-[17px] font-semibold text-[#0F172A] break-words mt-0.5">{{ maskName(residentFullName() || t('profile.notProvided')) }}</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 pr-2 py-2.5 border-t border-[#F1F5F9] sm:border-l sm:border-[#F1F5F9] sm:pl-6 min-w-0 [@media(max-height:880px)]:py-2">
                  <span class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                    <svg class="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="16" rx="2"/><path stroke-linecap="round" d="M8 3v4M16 3v4M3 10h18"/>
                    </svg>
                  </span>
                  <div class="min-w-0">
                    <p class="text-[13px] sm:text-[14px] font-semibold text-[#64748B]">{{ t('profile.birthDate') }}</p>
                    <p class="text-[15px] sm:text-[17px] font-semibold text-[#0F172A] break-words mt-0.5">{{ mask(fallback(formatDisplayDate(resident?.birth_date))) }}</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 pr-2 py-2.5 border-t border-[#F1F5F9] min-w-0 [@media(max-height:880px)]:py-2">
                  <span class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                    <svg class="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="3.5"/><path stroke-linecap="round" d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>
                    </svg>
                  </span>
                  <div class="min-w-0">
                    <p class="text-[13px] sm:text-[14px] font-semibold text-[#64748B]">{{ t('profile.sex') }}</p>
                    <p class="text-[15px] sm:text-[17px] font-semibold text-[#0F172A] break-words mt-0.5">{{ mask(fallback(resident?.gender)) }}</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 pr-2 py-2.5 border-t border-[#F1F5F9] sm:border-l sm:border-[#F1F5F9] sm:pl-6 min-w-0 [@media(max-height:880px)]:py-2">
                  <span class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                    <svg class="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <path stroke-linecap="round" d="M17 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path stroke-linecap="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </span>
                  <div class="min-w-0">
                    <p class="text-[13px] sm:text-[14px] font-semibold text-[#64748B]">{{ t('profile.civilStatus') }}</p>
                    <p class="text-[15px] sm:text-[17px] font-semibold text-[#0F172A] break-words mt-0.5">{{ mask(fallback(resident?.civil_status)) }}</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 pr-2 py-2.5 border-t border-[#F1F5F9] min-w-0 [@media(max-height:880px)]:py-2">
                  <span class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                    <svg class="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 2.7S6.5 8.6 6.5 13a5.5 5.5 0 0 0 11 0C17.5 8.6 12 2.7 12 2.7z"/>
                    </svg>
                  </span>
                  <div class="min-w-0">
                    <p class="text-[13px] sm:text-[14px] font-semibold text-[#64748B]">{{ t('profile.bloodType') }}</p>
                    <p class="text-[15px] sm:text-[17px] font-semibold text-[#0F172A] break-words mt-0.5">{{ mask(fallback(resident?.blood_type)) }}</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 pr-2 py-2.5 border-t border-[#F1F5F9] sm:border-l sm:border-[#F1F5F9] sm:pl-6 min-w-0 [@media(max-height:880px)]:py-2">
                  <span class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                    <svg class="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="2" y="7" width="20" height="14" rx="2"/><path stroke-linecap="round" d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                    </svg>
                  </span>
                  <div class="min-w-0">
                    <p class="text-[13px] sm:text-[14px] font-semibold text-[#64748B]">{{ t('profile.occupation') }}</p>
                    <p class="text-[15px] sm:text-[17px] font-semibold text-[#0F172A] break-words mt-0.5">{{ mask(fallback(resident?.occupation)) }}</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 pr-2 py-2.5 border-t border-[#F1F5F9] min-w-0 [@media(max-height:880px)]:py-2">
                  <span class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                    <svg class="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </span>
                  <div class="min-w-0">
                    <p class="text-[13px] sm:text-[14px] font-semibold text-[#64748B]">{{ t('profile.contactNumber') }}</p>
                    <p class="text-[15px] sm:text-[17px] font-semibold text-[#0F172A] break-words mt-0.5">{{ maskContact(resident?.contact_number) }}</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 pr-2 py-2.5 border-t border-[#F1F5F9] sm:border-l sm:border-[#F1F5F9] sm:pl-6 min-w-0 [@media(max-height:880px)]:py-2">
                  <span class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                    <svg class="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M22 6l-10 7L2 6"/>
                    </svg>
                  </span>
                  <div class="min-w-0">
                    <p class="text-[13px] sm:text-[14px] font-semibold text-[#64748B]">{{ t('profile.email') }}</p>
                    <p class="text-[15px] sm:text-[17px] font-semibold text-[#0F172A] break-words mt-0.5">{{ maskEmail(resident?.email) }}</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 py-2.5 border-t border-[#F1F5F9] sm:col-span-2 min-w-0 [@media(max-height:880px)]:py-2">
                  <span class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                    <svg class="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-7-4.6-7-11a7 7 0 0 1 14 0c0 6.4-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>
                    </svg>
                  </span>
                  <div class="min-w-0">
                    <p class="text-[13px] sm:text-[14px] font-semibold text-[#64748B]">{{ t('profile.address') }}</p>
                    <p class="text-[15px] sm:text-[17px] font-semibold text-[#0F172A] break-words mt-0.5">{{ mask(fallback(resident?.address_line)) }}</p>
                  </div>
                </div>
              </div>
            </section>


          </div>

          <!-- ============ RIGHT: RFID information + verified ============ -->
          <div class="min-h-0 flex flex-col gap-3 min-[1101px]:gap-4">
            @if (rfidCard) {
              <section aria-label="{{ t('profile.rfid.title') }}" class="flex-1 min-h-0 bg-white border border-[#E5E7EB] rounded-[18px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] p-5 sm:p-6 [@media(max-height:880px)]:p-4 flex flex-col">

                <div class="flex items-center gap-2.5 mb-3">
                  <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/30 flex items-center justify-center" aria-hidden="true">
                    <svg class="w-[20px] h-[20px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="6" width="18" height="12" rx="2"/>
                      <path d="M7 9.5h7M7 12h7" stroke-linecap="round"/>
                      <path d="M18 9v0.01M18 12.5v0.01M18 16v0.01" stroke-linecap="round" stroke-width="2.5"/>
                      <path d="M18.5 15l1.2-1.2M18.5 9L17.3 10.2" stroke-linecap="round"/>
                    </svg>
                  </span>
                  <h3 class="text-[16px] sm:text-[17px] font-bold text-[#0F172A]">{{ t('profile.rfid.title') }}</h3>
                </div>

                <!-- Card status (prominent) -->
                <div class="flex items-center justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2.5">
                  <div class="min-w-0">
                    <p class="text-[13px] font-semibold text-[#64748B]">{{ t('profile.rfid.cardStatus') }}</p>
                    <p class="text-[18px] font-bold text-[#0F172A] mt-0.5">{{ cardStatusLabel() }}</p>
                  </div>
                  <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] sm:text-[14px] font-bold whitespace-nowrap" [class]="cardStatusBadgeClass()">
                    {{ cardStatusLabel() }}
                  </span>
                </div>

                <!-- RFID number -->
                <div class="flex items-center justify-between gap-4 mt-2.5 rounded-xl border border-[#E5E7EB] border-dashed px-4 py-2.5">
                  <div class="min-w-0">
                    <p class="text-[13px] font-semibold text-[#64748B]">{{ t('profile.rfid.number') }}</p>
                    <p class="text-[19px] font-bold text-[#0F172A] tracking-[0.08em] mt-0.5 break-all">{{ maskRfidUid(rfidCard.card_uid) }}</p>
                  </div>
                  @if (rfidCard.card_uid) {
                    <button (click)="copyRfidNumber()"
                            class="shrink-0 w-10 h-10 rounded-xl border border-[#F97316]/40 bg-[#FFF7ED] text-[#F97316] flex items-center justify-center hover:bg-[#FFEDD5] active:scale-[0.97] transition focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                            [attr.aria-label]="rfidCopied() ? t('successCopiedLabel') : t('profile.rfid.number')">
                      @if (rfidCopied()) {
                        <svg class="w-5 h-5 text-[#16A34A]" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      } @else {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>
                        </svg>
                      }
                    </button>
                  }
                </div>

                <!-- Other card details (spread out to fill the stretched card) -->
                <div class="mt-3 flex-1 flex flex-col justify-between divide-y divide-[#F1F5F9]">

                  <div class="flex items-center gap-3 py-2.5 [@media(max-height:880px)]:py-2">
                    <span class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                      <svg class="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <rect x="3" y="5" width="18" height="16" rx="2"/><path stroke-linecap="round" d="M8 3v4M16 3v4M3 10h18"/>
                      </svg>
                    </span>
                    <div class="min-w-0">
                      <p class="text-[12.5px] font-semibold text-[#64748B]">{{ t('profile.rfid.issueDate') }}</p>
                      <p class="text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mt-0.5">{{ fallback(formatDisplayDate(rfidCard.issued_date)) }}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 py-2.5 [@media(max-height:880px)]:py-2">
                    <span class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                      <svg class="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 7v5l3 2"/>
                      </svg>
                    </span>
                    <div class="min-w-0">
                      <p class="text-[12.5px] font-semibold text-[#64748B]">{{ t('profile.rfid.expiryDate') }}</p>
                      <p class="text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mt-0.5">{{ fallback(formatDisplayDate(rfidCard.expiration_date)) }}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 py-2.5 [@media(max-height:880px)]:py-2">
                    <span class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                      <svg class="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-7-4.6-7-11a7 7 0 0 1 14 0c0 6.4-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>
                      </svg>
                    </span>
                    <div class="min-w-0">
                      <p class="text-[12.5px] font-semibold text-[#64748B]">{{ t('profile.rfid.barangay') }}</p>
                      <p class="text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mt-0.5">{{ t('landing.barangayName') }}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 py-2.5 [@media(max-height:880px)]:py-2">
                    <span class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                      <svg class="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <rect x="3" y="6" width="18" height="12" rx="2"/>
                        <path d="M7 9.5h7M7 12h7" stroke-linecap="round"/>
                      </svg>
                    </span>
                    <div class="min-w-0">
                      <p class="text-[12.5px] font-semibold text-[#64748B]">{{ t('profile.rfid.cardType') }}</p>
                      <p class="text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mt-0.5">{{ t('profile.rfid.barangayIdCard') }}</p>
                    </div>
                  </div>
                </div>
              </section>
            }

            <!-- Resident Verified panel -->
            <section class="shrink-0 rounded-[14px] border-2 border-[#BBF7D0] bg-[#DCFCE7] px-4 py-3 flex items-start gap-3" [class.mt-auto]="rfidCard === null" role="status">
              <span class="shrink-0 w-10 h-10 rounded-full bg-[#16A34A] flex items-center justify-center" aria-hidden="true">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </span>
              <div class="min-w-0 pt-0.5">
                <p class="text-[16px] sm:text-[17px] font-bold text-[#15803D]">{{ t('profile.verified.title') }}</p>
                <p class="text-[13.5px] sm:text-[14px] font-medium text-[#166534] mt-0.5">{{ rfidCard ? t('profile.verified.desc') : t('profile.verified.searchDesc') }}</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <!-- ============ ACTION AREA: OK ============ -->
      <div class="relative z-10 shrink-0 flex items-center justify-center pt-4 pb-3 [@media(max-height:880px)]:pt-2 [@media(max-height:880px)]:pb-2">
        <button (click)="onContinue.emit()"
                class="w-[240px] h-[62px] inline-flex items-center justify-center gap-3 rounded-[14px] bg-[#F97316] text-white text-[20px] font-bold shadow-sm hover:bg-[#EA580C] active:scale-[0.99] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30 [@media(max-height:880px)]:h-[54px] [@media(max-height:880px)]:text-[18px]"
                [attr.aria-label]="t('profile.ok')">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          {{ t('profile.ok') }}
        </button>
      </div>

      <!-- ============ FOOTER (normal flow, never overlaps content) ============ -->
      <footer class="relative z-10 shrink-0 border-t border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-2.5 [@media(max-height:880px)]:py-1.5 grid grid-cols-2 md:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-1.5 items-center">

          <!-- Section 1: Language -->
          <div class="flex flex-col items-center gap-1.5 text-center min-w-0">
            <div class="flex items-center gap-1.5 text-[#0F172A]">
              <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
              </svg>
              <span class="text-[13px] font-semibold">{{ t('landing.footer.language') }}</span>
            </div>
            <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-sm min-w-0">
              <button (click)="changeLanguage('en')"
                      class="px-3 sm:px-4 py-1.5 text-[12.5px] font-semibold transition-colors min-h-[34px]"
                      [class.bg-[#F97316]]="language === 'en'"
                      [class.text-white]="language === 'en'"
                      [class.bg-white]="language !== 'en'"
                      [class.text-[#0F172A]]="language !== 'en'">
                English
              </button>
              <button (click)="changeLanguage('fil')"
                      class="px-3 sm:px-4 py-1.5 text-[12.5px] border-l border-[#E5E7EB] font-semibold transition-colors min-h-[34px]"
                      [class.bg-[#F97316]]="language === 'fil'"
                      [class.text-white]="language === 'fil'"
                      [class.bg-white]="language !== 'fil'"
                      [class.text-[#0F172A]]="language !== 'fil'">
                Filipino
              </button>
            </div>
          </div>

          <!-- Section 2: Need Assistance -->
          <div class="flex flex-col items-center gap-1 text-center min-w-0">
            <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/><path d="M12 17h.01" stroke-linecap="round"/>
            </svg>
            <div>
              <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
              <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
            </div>
          </div>

          <!-- Section 3: Office Hours -->
          <div class="flex flex-col items-center gap-1 text-center min-w-0">
            <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/>
            </svg>
            <div>
              <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
              <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
              <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
            </div>
          </div>

          <!-- Section 4: Date & Time -->
          <div class="flex flex-col items-center gap-1 text-center min-w-0">
            <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>
            </svg>
            <div class="min-w-0">
              <p class="text-[11px] lg:text-[12px] font-medium text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
              <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
            </div>
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
    // Reset the photo-failed flag whenever a different resident is loaded so a
    // transient load error never permanently hides a valid photo.
    if (r?.resident_id !== this._resident?.resident_id) {
      this.photoFailed.set(false);
      // Always start private — resident decides to reveal their own data.
      this.detailsHidden.set(true);
    }
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
  protected detailsHidden = signal(true);

  private dateTimeTimer: any;
  private copyTimer: any;

  constructor(private translations: TranslationService) {}

  ngOnInit(): void {
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

  get successCopiedLabel(): string {
    return this.t('bar.success.copied');
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

  // First rows shown on the profile card; the full list is available via "View All History".


  // Builds an absolute URL for the resident photo. The API returns a relative path
  // (e.g. "resident-photos/abc.png") which is served by the backend under /uploads,
  // so a bare relative src would resolve against the frontend origin and 404.
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

  // Formats a value that is either a DATE/DATETIME (serialized ISO string or Date)
  // as a long, human-readable date. Date-only values are rendered from their
  // calendar components so the display never shifts a day due to timezones.
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

  /**
   * Returns a masked placeholder when detailsHidden is true, otherwise
   * returns the original value unchanged. This is intentionally a plain
   * method (not a pipe) so it re-evaluates whenever the signal changes.
   */
  mask(value: string): string {
    return this.detailsHidden() ? '••••••' : value;
  }

  /**
   * Masks individual name words in standard format (e.g. 'ANDREW MARANAN G.' -> 'AN•••W MA••••N G.')
   * when privacy mode is active.
   */
  maskName(name: string): string {
    if (!name) return '';
    if (!this.detailsHidden()) return name;

    return name
      .split(/\s+/)
      .map(part => {
        const trimmed = part.trim();
        if (trimmed.length <= 2) {
          return trimmed; // Single letters, initials (e.g. 'G.', 'JR', 'DE')
        } else if (trimmed.length === 3) {
          return `${trimmed[0]}•${trimmed[2]}`; // e.g. 'IAN' -> 'I•N', 'DEL' -> 'D•L'
        } else if (trimmed.length === 4) {
          return `${trimmed[0]}••${trimmed[3]}`; // e.g. 'JOHN' -> 'J••N'
        } else {
          // 5+ letters: keep first 2 and last 1, mask the rest with bullet dots (e.g. 'ANDREW' -> 'AN•••W', 'MARANAN' -> 'MA••••N')
          const dots = '•'.repeat(trimmed.length - 3);
          return `${trimmed.slice(0, 2)}${dots}${trimmed.slice(-1)}`;
        }
      })
      .join(' ');
  }

  residentDisplayName(): string {
    return this.maskName(this.residentFullName());
  }

  /**
   * Masks resident code when details are hidden (e.g., 'RES-2024-000123' -> 'RES-••••-0123')
   */
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

  /**
   * Masks contact phone numbers when hidden (e.g., '09171234567' -> '0917 ••• •567')
   */
  maskContact(phone: string | null | undefined): string {
    if (!phone || !String(phone).trim()) return this.t('profile.notProvided');
    if (!this.detailsHidden()) return phone;
    const clean = String(phone).trim();
    if (clean.length >= 10) {
      return `${clean.slice(0, 4)} ••• •${clean.slice(-3)}`;
    }
    return '••••••';
  }

  /**
   * Masks email address when hidden (e.g., 'andrew@example.com' -> 'an•••w@example.com')
   */
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

  /**
   * Masks RFID UID when hidden (e.g., '04A1B2C3D4' -> '04••••••D4' or '04:A1:B2:C3' -> '04:•••:•••:C3')
   */
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

  cardStatusLabel(): string {
    const s = (this.rfidCard?.status || '').toLowerCase();
    switch (s) {
      case 'active': return this.t('profile.status.active');
      case 'expired': return this.t('profile.status.expired');
      case 'inactive': return this.t('profile.status.inactive');
      case 'blocked': return this.t('profile.status.blocked');
      case 'cancelled': return this.t('profile.status.cancelled');
      default: return s ? s : this.t('profile.notProvided');
    }
  }

  cardStatusBadgeClass(): string {
    const s = (this.rfidCard?.status || '').toLowerCase();
    if (s === 'active') return 'border-[#86EFAC] bg-[#DCFCE7] text-[#15803D]';
    if (s === 'expired' || s === 'blocked') return 'border-[#FECACA] bg-[#FEE2E2] text-[#B91C1C]';
    return 'border-[#E2E8F0] bg-[#F1F5F9] text-[#475569]';
  }



  copyRfidNumber(): void {
    const num = this.rfidCard?.card_uid;
    if (!num) return;
    const done = () => {
      this.rfidCopied.set(true);
      clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => this.rfidCopied.set(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(num).then(done).catch(() => {
        this.copyFallback(num);
        done();
      });
    } else {
      this.copyFallback(num);
      done();
    }
  }

  private copyFallback(text: string): void {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch { /* clipboard unavailable */ }
    document.body.removeChild(ta);
  }
}
