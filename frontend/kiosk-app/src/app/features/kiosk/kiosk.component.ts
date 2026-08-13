import { Component, OnInit, OnDestroy, signal, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KioskService, Resident, Service, GuestInfo, FormField, RfidCardInfo, HistoryEntry } from './kiosk.service';
import { RfidScanService } from './rfid-scan.service';
import { KioskStateService, KioskState } from './kiosk-state.service';
import { ButtonComponent } from './button.component';
import { SignaturePadComponent } from './signature-pad.component';
import { BarangayPreviewModalComponent } from './barangay-preview-modal.component';
import { DocumentPreviewModalComponent } from './document-preview-modal.component';
import { ResidentProfileComponent } from './resident-profile.component';
import { TranslationService, KioskLanguage } from '../../i18n/translation.service';

export type KioskMode = 'home' | 'rfid' | 'guest' | 'documents' | 'barangay';

// Documents flow (shared by RFID-resident and guest temporary sessions)
export type DocStep =
  | 'welcome'     // 0: resident welcome (RFID path only)
  | 'guest-info'  // 0: guest basic info (temporary session path only)
  | 'services'    // 1: select service
  | 'requirements'// 2: show service requirements
  | 'form'        // 3: dynamic form
  | 'photo'       // 4: capture photo (only if service requires)
  | 'review'      // 5: review & confirm
  | 'success';    // 6: success

// RFID scan flow
export type RfidStep = 'scan' | 'search' | 'error';

// Barangay ID application flow
export type BarangayStep =
  | 'requirements' // 0: show ID requirements
  | 'form'         // 1: registration form
  | 'photo'        // 2: capture photo (required)
  | 'signature'    // 3: capture digital signature (required)
  | 'review'       // 4: review & submit
  | 'success';     // 5: success

@Component({
  selector: 'app-kiosk',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, SignaturePadComponent, BarangayPreviewModalComponent, DocumentPreviewModalComponent, ResidentProfileComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white select-none flex">

      <!-- MAIN KIOSK AREA -->
      <div class="flex-1 relative">

        <!-- ============ HOME: Landing (Production-ready) ============ -->
        @if (mode() === 'home') {
          <div class="absolute inset-0 overflow-hidden bg-[#F8FAFC] text-[#0F172A] select-none flex flex-col [font-family:'Inter',sans-serif]">

            <!-- Background image (uploaded) -->
            <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
            <!-- Subtle radial glow centered behind the headline keeps text legible without washing the orange -->
            <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                 style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>

            <!-- Curved orange header accent (top-left) -->
            <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
              <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
              </svg>
            </div>

            <div class="relative flex-1 overflow-y-auto">
              <div class="min-h-full flex flex-col items-center justify-center px-4 sm:px-8 py-6">

              <!-- Header -->
              <div class="text-center mb-10 lg:mb-16">
                <div class="mx-auto mb-6 lg:mb-8 flex items-center justify-center">
                  <div class="w-24 h-24 lg:w-[120px] lg:h-[120px] rounded-full bg-white border-2 border-[#F97316]/40 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                    <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                  </div>
                </div>
                <p class="text-[11px] sm:text-[13px] font-semibold tracking-[0.35em] text-[#F97316] mb-2.5">{{ t('landing.welcome') }}</p>
                <h1 class="text-[clamp(1.875rem,5.5vw,3.25rem)] font-bold tracking-tight text-[#0F172A] leading-[1.1]">{{ t('landing.barangayName') }}</h1>
                <p class="text-[clamp(1rem,2vw,1.25rem)] font-medium text-[#64748B] mt-2 lg:mt-3 mb-6 lg:mb-10">{{ t('landing.subtitle') }}</p>
                <p class="text-[clamp(1rem,2.2vw,1.375rem)] text-[#64748B] max-w-xl mx-auto font-normal px-2">{{ t('landing.prompt') }}</p>
              </div>

              <!-- Primary Action Cards -->
              <div class="flex flex-wrap justify-center items-stretch gap-6 lg:gap-10 w-full max-w-6xl">

                <!-- Card 1: Scan Barangay ID (RFID) -->
                <button
                  (click)="startRfid()"
                  class="group flex items-center gap-5 lg:gap-8 rounded-[18px] border border-[#F97316]/60 bg-white p-6 lg:p-8 shadow-sm hover:shadow-md hover:border-[#F97316] transition-all duration-200 text-left flex-1 min-w-[min(100%,320px)] max-w-[560px]">
                  <div class="shrink-0 w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-xl bg-[#FFF7ED] flex items-center justify-center">
                    <svg class="w-10 h-10 lg:w-11 lg:h-11 text-[#F97316] transition-transform group-hover:scale-105" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <!-- RFID card with wireless signal -->
                      <rect x="3" y="6" width="18" height="12" rx="2"/>
                      <path d="M7 9.5h7M7 12h7" stroke-linecap="round"/>
                      <path d="M18 9v0.01 M18 12.5v0.01 M18 16v0.01" stroke-linecap="round" stroke-width="2.5"/>
                      <path d="M18.5 15l1.2-1.2M18.5 9L17.3 10.2" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[clamp(1.25rem,2.4vw,1.625rem)] font-bold text-[#0F172A] pb-2 lg:pb-3">{{ t('landing.scanId.title') }}</p>
                    <p class="text-[clamp(0.95rem,1.6vw,1.125rem)] text-[#64748B] leading-snug font-normal">{{ t('landing.scanId.desc') }}</p>
                  </div>
                  <div class="shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#F97316] flex items-center justify-center shadow-sm group-hover:shadow transition-all ml-1">
                    <svg class="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </button>

                <!-- Card 2: Continue Without Barangay ID -->
                <button
                  (click)="continueWithout()"
                  class="group flex items-center gap-5 lg:gap-8 rounded-[18px] border border-[#F97316]/60 bg-white p-6 lg:p-8 text-left hover:shadow-md hover:border-[#F97316] transition-all duration-200 shadow-sm flex-1 min-w-[min(100%,320px)] max-w-[560px]">
                  <div class="shrink-0 w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-xl bg-[#FFF7ED] flex items-center justify-center">
                    <svg class="w-10 h-10 lg:w-11 lg:h-11 text-[#F97316] transition-transform group-hover:scale-105" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <!-- Person + document/certificate -->
                      <circle cx="9" cy="8" r="3.5"/>
                      <path d="M4 20c0-3.3 2.2-5 5-5s5 1.7 5 5"/>
                      <rect x="13" y="6" width="9" height="12" rx="1.5"/>
                      <path d="M15 10h5M15 13h5M15 16h4"/>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[clamp(1.25rem,2.4vw,1.625rem)] font-bold text-[#0F172A] pb-2 lg:pb-3 leading-snug">{{ t('landing.continue.title') }}</p>
                    <p class="text-[clamp(0.95rem,1.6vw,1.125rem)] text-[#64748B] leading-snug font-normal">{{ t('landing.continue.desc') }}</p>
                  </div>
                  <div class="shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#F97316] flex items-center justify-center shadow-sm ml-1 group-hover:shadow transition-shadow">
                    <svg class="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </button>
              </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="relative border-t border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
              <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-2 lg:gap-y-3 items-center">

                <!-- Section 1: Language -->
                <div class="flex flex-col items-center gap-1.5 text-center min-w-0">
                  <div class="flex items-center gap-1.5 text-[#0F172A]">
                    <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
                    </svg>
                    <span class="text-[13px] font-semibold">{{ t('landing.footer.language') }}</span>
                  </div>
                  <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-sm min-w-0">
                    <button
                      (click)="setLanguage('en')"
                      class="px-3 sm:px-5 py-1.5 text-[13px] font-semibold transition-colors min-h-[34px]"
                      [class.bg-[#F97316]]="language() === 'en'"
                      [class.text-white]="language() === 'en'"
                      [class.bg-white]="language() !== 'en'"
                      [class.text-[#0F172A]]="language() !== 'en'">
                      English
                    </button>
                    <button
                      (click)="setLanguage('fil')"
                      class="px-3 sm:px-5 py-1.5 text-[13px] border-l border-[#E5E7EB] font-semibold transition-colors min-h-[34px]"
                      [class.bg-[#F97316]]="language() === 'fil'"
                      [class.text-white]="language() === 'fil'"
                      [class.bg-white]="language() !== 'fil'"
                      [class.text-[#0F172A]]="language() !== 'fil'">
                      Filipino
                    </button>
                  </div>
                </div>

                <!-- Section 2: Need Assistance -->
                <div class="flex flex-col items-center gap-1 text-center min-w-0">
                  <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                    <path d="M12 17h.01" stroke-linecap="round"/>
                  </svg>
                  <div>
                    <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                    <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                  </div>
                </div>

                <!-- Section 3: Office Hours -->
                <div class="flex flex-col items-center gap-1 text-center min-w-0">
                  <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 7v5l3 2" stroke-linecap="round"/>
                  </svg>
                  <div>
                    <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                    <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                    <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                  </div>
                </div>

                <!-- Section 4: Date & Time -->
                <div class="flex flex-col items-center gap-1 text-center min-w-0">
                  <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="16" rx="2"/>
                    <path d="M8 3v4M16 3v4M3 10h18"/>
                  </svg>
                  <div class="min-w-0">
                    <p class="text-[11px] lg:text-[12px] font-medium text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                    <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ============ RFID: Scan Barangay ID ============ -->
        @if (mode() === 'rfid') {

          <!-- RFID STEP: scan -->
          @if (rfidStep() === 'scan') {
            <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

              <!-- Background image (same as the kiosk landing page) -->
              <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
              <!-- Subtle radial glow keeps the content legible without washing the orange -->
              <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                   style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
              <!-- Curved orange header accent (top-left, same as landing) -->
              <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 H256 V40 C256 128 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
                </svg>
              </div>

              <div class="relative flex-1 overflow-y-auto">
                <div class="min-h-full flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-10">

                  <!-- Back button (pinned top-left: circular icon + "Back" text outside) -->
                  <div class="fixed top-4 left-4 z-40 flex items-center gap-2.5 sm:gap-3">
                    <button (click)="goBack()"
                            class="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                            [attr.aria-label]="t('common.back')">
                      <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                      </svg>
                    </button>
                    <button (click)="goBack()"
                            class="flex items-center min-h-[44px] rounded-xl px-1 text-[#0F172A] font-semibold text-[15px] sm:text-base hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                      {{ t('common.back') }}
                    </button>
                  </div>

                  <!-- Centered logo + title -->
                  <div class="text-center mb-8 sm:mb-10 mt-10 sm:mt-6">
                    <div class="mx-auto mb-5 sm:mb-6 w-[clamp(84px,11vw,116px)] h-[clamp(84px,11vw,116px)] rounded-full bg-white border-2 border-[#F97316]/40 overflow-hidden flex items-center justify-center shadow-sm">
                      <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                    </div>
                    <h1 class="text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('rfid.title') }}</h1>
                    <p class="text-[clamp(1rem,1.9vw,1.25rem)] font-medium text-[#64748B] mt-2.5 sm:mt-3 max-w-xl mx-auto px-2">{{ t('rfid.subtitle') }}</p>
                  </div>

                  <!-- Scanning area -->
                  <div class="flex flex-col items-center mb-8 sm:mb-10 w-full">
                    <div class="relative w-[clamp(210px,40vmin,340px)] h-[clamp(210px,40vmin,340px)] flex items-center justify-center">
                      @if (!rfidDetected()) {
                        <!-- RFID radar pulse: 4 identical rings expanding from the center.
                          Negative animation-delays start each ring already mid-cycle, so
                          the radar is visibly moving the instant the screen renders. -->
                        <div class="rfid-pulse-ring absolute inset-0 rounded-full border-2 border-[#F97316]/50" style="animation-delay:-2.4s"></div>
                        <div class="rfid-pulse-ring absolute inset-0 rounded-full border-2 border-[#F97316]/40" style="animation-delay:-1.6s"></div>
                        <div class="rfid-pulse-ring absolute inset-0 rounded-full border-2 border-[#F97316]/30" style="animation-delay:-0.8s"></div>
                        <div class="rfid-pulse-ring absolute inset-0 rounded-full border-2 border-[#F97316]/20" style="animation-delay:0s"></div>
                      }
                      <!-- Center RFID card icon / detected success -->
                      <div class="relative z-10 w-[clamp(140px,24vmin,200px)] h-[clamp(140px,24vmin,200px)] rounded-full bg-white border-2 border-[#F97316]/30 shadow-sm flex items-center justify-center"
                           [class.border-[#10B981]]="rfidDetected()">
                        @if (!rfidDetected()) {
                          <svg class="w-[clamp(72px,12.5vmin,128px)] h-[clamp(72px,12.5vmin,128px)] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <rect x="3" y="6" width="18" height="12" rx="2"/>
                            <path d="M7 9.5h7M7 12.5h7" stroke-linecap="round"/>
                            <path d="M18 9.2v.01M18 12.4v.01M18 15.6v.01" stroke-linecap="round" stroke-width="2.6"/>
                            <path d="M18.6 16.2l1.6-1.6M18.6 7.8L20.2 9.4" stroke-linecap="round"/>
                          </svg>
                        } @else {
                          <svg class="w-[clamp(72px,12.5vmin,128px)] h-[clamp(72px,12.5vmin,128px)] text-[#10B981] rfid-success-pop" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke-width="1.8"/>
                            <path d="M15.5 9.5l-4.5 5-2.5-2.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        }
                      </div>
                    </div>
                    <p class="mt-5 sm:mt-6 text-base sm:text-lg font-medium text-[#64748B]">
                      @if (rfidDetected()) {
                        <span class="text-[#10B981] font-semibold">{{ t('rfid.found') }}</span>
                      } @else {
                        {{ t('rfid.waiting') }}
                      }
                    </p>
                  </div>

                  <!-- Scanner status card -->
                  @if (!rfidConnected()) {
                    <div class="w-full max-w-xl bg-white/95 border border-[#E5E7EB] rounded-2xl px-5 sm:px-6 py-4 sm:py-5 flex items-start gap-4 mb-6 sm:mb-8 shadow-sm backdrop-blur-sm">
                      <div class="w-11 h-11 rounded-full bg-[#FFF5EE] flex items-center justify-center shrink-0">
                        <svg class="w-6 h-6 text-[#F59E0B]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                        </svg>
                      </div>
                      <div class="text-left">
                        <p class="text-[15px] font-bold text-[#0F172A]">{{ t('rfid.notDetected') }}</p>
                        <p class="text-sm text-[#64748B] mt-0.5 leading-snug">{{ t('rfid.notDetectedDesc') }}</p>
                      </div>
                    </div>
                  } @else {
                    <div class="w-full max-w-xl bg-white/95 border border-[#E5E7EB] rounded-2xl px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-4 mb-6 sm:mb-8 shadow-sm backdrop-blur-sm">
                      <div class="w-11 h-11 rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0">
                        <svg class="w-6 h-6 text-[#10B981]" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="9"/>
                          <path d="M8.5 12.5l2.2 2.2 4.8-4.8" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                      <div class="text-left">
                        <p class="text-[15px] font-bold text-[#0F172A]">{{ t('rfid.ready') }}</p>
                        <p class="text-sm text-[#64748B] mt-0.5 leading-snug">{{ t('rfid.readyDesc') }}</p>
                      </div>
                    </div>
                  }

                  <!-- Primary action -->
                  <button (click)="rfidStep.set('search')"
                          class="w-full max-w-xl min-h-[64px] sm:min-h-[80px] px-8 py-4 sm:py-5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.995] text-white text-lg sm:text-xl font-semibold flex items-center justify-center transition-all focus:outline-none focus:ring-4 focus:ring-[#F97316]/30 shadow-sm">
                    {{ t('rfid.findRecord') }}
                  </button>

                  <!-- Secondary action -->
                  <button (click)="continueWithout()"
                          class="mt-5 sm:mt-6 min-h-[56px] px-8 text-[#F97316] hover:text-[#EA580C] text-base sm:text-lg font-semibold hover:underline underline-offset-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                    {{ t('rfid.continueWithout') }}
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- RFID STEP: error / not recognized -->
          @if (rfidStep() === 'error') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full text-center">
                <div class="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                  </svg>
                </div>
                <h2 class="text-3xl font-bold mb-4">{{ t('rfid.error.title') }}</h2>
                <p class="text-xl text-blue-200 mb-8">
                  {{ rfidError() }}
                  <br/>
                  {{ t('rfid.error.desc') }}
                </p>
                <div class="flex flex-col gap-4">
                  <app-button variant="primary" size="lg" class="w-full" (onClick)="retryRfid()">{{ t('common.scanAgain') }}</app-button>
                  <app-button variant="secondary" size="lg" class="w-full" (onClick)="continueWithout()">
                    {{ t('rfid.continueWithout') }}
                  </app-button>
                </div>
              </div>
            </div>
          }

          <!-- RFID STEP: search fallback -->
          @if (rfidStep() === 'search') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full">
                <div class="flex items-center justify-between mb-6">
                  <div>
                    <h2 class="text-2xl font-bold">{{ t('rfid.search.title') }}</h2>
                    <p class="text-blue-300 text-sm mt-1">{{ t('rfid.search.subtitle') }}</p>
                  </div>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="rfidStep.set('scan')">{{ t('common.back') }}</button>
                </div>

                <div class="bg-blue-800/50 rounded-2xl p-6 backdrop-blur">
                  <p class="text-blue-300 text-sm mb-4">{{ t('rfid.search.hint') }}</p>
                  <div class="relative">
                    <input
                      type="text"
                      [(ngModel)]="searchQuery"
                      (ngModelChange)="onSearchChange($event)"
                      [placeholder]="t('rfid.search.placeholder')"
                      class="w-full bg-white text-gray-800 rounded-xl px-5 py-4 text-lg placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-400"
                      autofocus
                    />
                    @if (searchQuery) {
                      <button class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              (click)="clearSearch()">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    }
                  </div>

                  @if (searchResults().length > 0) {
                    <div class="mt-4 bg-white rounded-xl overflow-hidden text-left max-h-72 overflow-y-auto">
                      @for (r of searchResults(); track r.resident_id) {
                        <button class="w-full px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors"
                                (click)="selectResident(r)">
                          @if (r.photo) {
                            <img [src]="r.photo" class="w-10 h-10 rounded-full object-cover" />
                          } @else {
                            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                              {{ r.first_name.charAt(0) }}{{ r.last_name.charAt(0) }}
                            </div>
                          }
                          <div class="flex-1 min-w-0">
                            <p class="font-medium text-gray-800 truncate">{{ r.first_name }} {{ r.last_name }}</p>
                            <p class="text-xs text-gray-500 truncate">{{ r.address_line }}</p>
                          </div>
                          <span class="text-xs text-gray-400">{{ r.resident_code }}</span>
                        </button>
                      }
                    </div>
                  }

                  @if (searchQuery && searchQuery.length >= 2 && !searching() && searchResults().length === 0) {
                    <p class="mt-4 text-blue-300 text-sm">{{ t('rfid.search.noResults') }}</p>
                  }

                  @if (searching()) {
                    <div class="mt-4 flex items-center justify-center gap-2 text-blue-300">
                      <div class="animate-spin w-5 h-5 border-2 border-blue-300 border-t-transparent rounded-full"></div>
                      <span class="text-sm">{{ t('rfid.search.searching') }}</span>
                    </div>
                  }
                </div>

                @if (errorMessage()) {
                  <div class="mt-6 bg-red-500/20 border border-red-400 rounded-xl p-4">
                    <p class="text-red-200">{{ errorMessage() }}</p>
                  </div>
                }
              </div>
            </div>
          }
        }

        <!-- ============ GUEST: Continue Without Barangay ID options ============ -->
        @if (mode() === 'guest') {
          <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

            <!-- Background image (same as the kiosk landing page) -->
            <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
            <!-- Subtle radial glow keeps the text legible without washing the orange -->
            <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                 style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
            <!-- Curved orange header accent (top-left, same as landing) -->
            <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
              <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0 H256 V40 C256 128 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
              </svg>
            </div>

            <!-- Back button (pinned top-left: circular icon + "Back" text outside) -->
            <div class="fixed top-4 left-4 z-40 flex items-center gap-2.5 sm:gap-3">
              <button (click)="goBack()"
                      class="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                      [attr.aria-label]="t('common.back')">
                <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <button (click)="goBack()"
                      class="flex items-center min-h-[44px] rounded-xl px-1 text-[#0F172A] font-semibold text-[15px] sm:text-base hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                {{ t('common.back') }}
              </button>
            </div>

            <!-- Main content -->
            <div class="relative flex-1 overflow-y-auto">
              <div class="min-h-full flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-10">

                <!-- Centered logo + title -->
                <div class="text-center mb-6 sm:mb-10 mt-10 sm:mt-6">
                  <div class="mx-auto mb-5 sm:mb-6 w-[clamp(84px,11vw,116px)] h-[clamp(84px,11vw,116px)] rounded-full bg-white border-2 border-[#F97316]/40 overflow-hidden flex items-center justify-center shadow-sm">
                    <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                  </div>
                  <h1 class="text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('guest.title') }}</h1>
                  <p class="text-[clamp(1rem,1.9vw,1.25rem)] font-medium text-[#64748B] mt-2.5 sm:mt-3 px-2">{{ t('guest.subtitle') }}</p>
                </div>

                <!-- Two horizontal cards (same responsive layout as the landing page) -->
                <div class="flex flex-wrap justify-center items-stretch gap-5 sm:gap-8 lg:gap-10 w-full max-w-6xl mb-5 sm:mb-6">

                  <!-- Card 1: Request Documents -->
                  <button class="group flex items-center gap-5 lg:gap-8 rounded-[18px] border border-[#F97316]/50 bg-white p-6 lg:p-8 shadow-sm hover:shadow-md hover:border-[#F97316] transition-all duration-200 text-left flex-1 min-w-[min(100%,320px)] max-w-[560px]"
                          (click)="startGuestRequest()">
                    <div class="shrink-0 w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-xl bg-[#FFF7ED] flex items-center justify-center">
                      <svg class="w-10 h-10 lg:w-11 lg:h-11 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[clamp(1.25rem,2.4vw,1.625rem)] font-bold text-[#0F172A] pb-2 lg:pb-3 leading-snug">{{ t('guest.requestDocs.title') }}</p>
                      <p class="text-[clamp(0.95rem,1.6vw,1.125rem)] text-[#64748B] leading-snug font-normal">{{ t('guest.requestDocs.desc') }}</p>
                    </div>
                    <div class="shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#F97316] flex items-center justify-center shadow-sm group-hover:shadow transition-all ml-1">
                      <svg class="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </button>

                  <!-- Card 2: Apply for Barangay ID -->
                  <button class="group flex items-center gap-5 lg:gap-8 rounded-[18px] border border-[#F97316]/50 bg-white p-6 lg:p-8 shadow-sm hover:shadow-md hover:border-[#F97316] transition-all duration-200 text-left flex-1 min-w-[min(100%,320px)] max-w-[560px]"
                          (click)="startBarangay()">
                    <div class="shrink-0 w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-xl bg-[#FFF7ED] flex items-center justify-center">
                      <svg class="w-10 h-10 lg:w-11 lg:h-11 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"/>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[clamp(1.25rem,2.4vw,1.625rem)] font-bold text-[#0F172A] pb-2 lg:pb-3 leading-snug">{{ t('guest.applyId.title') }}</p>
                      <p class="text-[clamp(0.95rem,1.6vw,1.125rem)] text-[#64748B] leading-snug font-normal">{{ t('guest.applyId.desc') }}</p>
                    </div>
                    <div class="shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#F97316] flex items-center justify-center shadow-sm group-hover:shadow transition-all ml-1">
                      <svg class="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </button>
                </div>

                <!-- Information card -->
                <div class="flex items-start gap-3 w-full max-w-6xl bg-white/95 border border-[#E5E7EB] rounded-2xl px-4 sm:px-6 py-4 sm:py-5 shadow-sm">
                  <div class="w-11 h-11 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                    <svg class="w-6 h-6 text-[#64748B]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 16v-4M12 8h.01" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <p class="text-sm sm:text-base text-[#64748B] leading-snug pt-1.5">{{ t('guest.info') }}</p>
                </div>
              </div>
            </div>

            <!-- Footer: four sections, outline icons only -->
            <div class="relative border-t border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
              <div class="max-w-5xl mx-auto px-4 sm:px-8 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 lg:gap-y-3 items-center">

                <!-- Need Assistance -->
                <div class="flex flex-col items-center gap-1 text-center min-w-0">
                  <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                    <path d="M12 17h.01" stroke-linecap="round"/>
                  </svg>
                  <div>
                    <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                    <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                  </div>
                </div>

                <!-- Office Hours -->
                <div class="flex flex-col items-center gap-1 text-center min-w-0">
                  <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 7v5l3 2" stroke-linecap="round"/>
                  </svg>
                  <div>
                    <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                    <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                    <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                  </div>
                </div>

                <!-- Current Date -->
                <div class="flex flex-col items-center gap-1 text-center min-w-0">
                  <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="16" rx="2"/>
                    <path d="M8 3v4M16 3v4M3 10h18"/>
                  </svg>
                  <div class="min-w-0">
                    <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.date') }}</p>
                    <p class="text-[11px] lg:text-[12px] text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                  </div>
                </div>

                <!-- Current Time -->
                <div class="flex flex-col items-center gap-1 text-center min-w-0">
                  <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 7v5l3 2" stroke-linecap="round"/>
                  </svg>
                  <div class="min-w-0">
                    <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.time') }}</p>
                    <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ============ DOCUMENTS: Request flow (resident + guest temporary session) ============ -->
        @if (mode() === 'documents') {

          <!-- DOC STEP 0a: Welcome / Resident Profile (RFID + manual search paths) -->
          @if (currentStep() === 'welcome' && resident()) {
            <app-resident-profile
              [resident]="resident()"
              [rfidCard]="rfidCard()"
              [history]="residentHistory()"
              [historyLoading]="historyLoading()"
              [language]="language()"
              (onBack)="goBack()"
              (onContinue)="proceedToServices()"
              (languageChange)="setLanguage($event)"></app-resident-profile>
          }

          <!-- DOC STEP 0b: Guest basic info (temporary session only) -->
          @if (currentStep() === 'guest-info') {
            <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

              <!-- Background image (same as the kiosk landing page) -->
              <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
              <!-- Subtle radial glow keeps the form legible without washing the orange -->
              <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                   style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
              <!-- Curved orange header accent (top-left, same as landing) -->
              <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
                </svg>
              </div>

              <!-- Top navigation: back (left) + logo (center) -->
              <div class="relative z-10 flex items-center justify-center px-6 pt-[18px] pb-2">
                <div class="absolute left-4 sm:left-6 top-[26px] z-40 flex items-center gap-2.5 sm:gap-3">
                  <button (click)="goBack()"
                          class="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                          [attr.aria-label]="t('common.back')">
                    <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <button (click)="goBack()"
                          class="flex items-center min-h-[44px] rounded-xl px-1 text-[#0F172A] font-semibold text-[15px] sm:text-base hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                    {{ t('common.back') }}
                  </button>
                </div>

                <div class="w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-full bg-white border-2 border-[#F97316]/30 shadow-sm overflow-hidden flex items-center justify-center">
                  <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                </div>
              </div>

              <!-- Progress indicator -->
              <div class="relative z-10 flex items-center justify-center px-4 pb-1">
                <ol class="flex items-center gap-1.5 sm:gap-2.5" aria-label="Kiosk progress">
                  <li class="flex items-center gap-1.5 sm:gap-2.5">
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-white bg-[#F97316] border-2 border-[#F97316] shadow-sm" aria-hidden="true">1</span>
                    <span class="hidden lg:block text-[14px] font-bold text-[#0F172A] whitespace-nowrap">{{ t('progress.yourInfo') }}</span>
                  </li>
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">2</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.selectDoc') }}</span>
                  </li>
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">3</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.review') }}</span>
                  </li>
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">4</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.submit') }}</span>
                  </li>
                </ol>
              </div>

              <!-- Main content -->
              <div class="relative flex-1 overflow-y-auto">
                <div class="min-h-full flex items-center justify-center px-5 sm:px-10 py-5 sm:py-8">

                  <div class="w-full max-w-[660px]">

                    <!-- Page header -->
                    <div class="text-center mb-5 sm:mb-7">
                      <h1 class="text-[clamp(1.375rem,2.2vw,2rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('doc.guestInfo.title') }}</h1>
                      <p class="text-[clamp(0.925rem,1.1vw,1.075rem)] font-medium text-[#64748B] mt-1.5 sm:mt-2">{{ t('doc.guestInfo.desc') }}</p>
                    </div>

                    <!-- Form card -->
                    <div class="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-7 py-5 sm:py-6">
                      <div class="space-y-3.5 sm:space-y-4">

                        <!-- Full Name -->
                        <div>
                          <label for="guest-fullName" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.fullName') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="guestInvalid('fullName')">
                            <div class="shrink-0 w-12 sm:w-14 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <circle cx="12" cy="8" r="4"/>
                                <path d="M4 20c0-3.6 3.6-5 8-5s8 1.4 8 5" stroke-linecap="round"/>
                              </svg>
                            </div>
                            <input id="guest-fullName" type="text" name="fullName" [(ngModel)]="guestForm.fullName"
                                   [placeholder]="t('doc.guestInfo.fullNamePh')" autocomplete="name"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (guestForm.fullName) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                          @if (guestInvalid('fullName')) {
                            <p class="mt-2 flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.guest.fullName') }}
                            </p>
                          }
                        </div>

                        <!-- Date of Birth -->
                        <div>
                          <label for="guest-birthDate" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.birthDate') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="guestInvalid('birthDate')">
                            <div class="shrink-0 w-12 sm:w-14 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <rect x="3" y="5" width="18" height="16" rx="2"/>
                                <path d="M8 3v4M16 3v4M3 10h18" stroke-linecap="round"/>
                              </svg>
                            </div>
                            <input id="guest-birthDate" type="date" name="birthDate" [(ngModel)]="guestForm.birthDate"
                                   [placeholder]="t('doc.guestInfo.birthDatePh')"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] font-medium text-[#0F172A] bg-transparent outline-none border-none" />
                            @if (guestForm.birthDate) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                          @if (guestInvalid('birthDate')) {
                            <p class="flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.guest.birthDate') }}
                            </p>
                          }
                        </div>

                        <!-- Address -->
                        <div>
                          <label for="guest-address" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.address') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="guestInvalid('address')">
                            <div class="shrink-0 w-12 sm:w-14 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" stroke-linejoin="round"/>
                                <circle cx="12" cy="10" r="2.5"/>
                              </svg>
                            </div>
                            <input id="guest-address" type="text" name="address" [(ngModel)]="guestForm.address"
                                   [placeholder]="t('doc.guestInfo.addressPh')" autocomplete="street-address"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (guestForm.address) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                          @if (guestInvalid('address')) {
                            <p class="flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.guest.address') }}
                            </p>
                          }
                        </div>

                        <!-- Contact Number -->
                        <div>
                          <label for="guest-contactNumber" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.contact') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="guestInvalid('contactNumber')">
                            <div class="shrink-0 w-12 sm:w-14 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path d="M6.5 5h3l1.6 4-2 1.2a11 11 0 005.7 5.7l1.2-2 4 1.6v3a1.5 1.5 0 01-1.6 1.5A15.5 15.5 0 015 6.6 1.5 1.5 0 016.5 5z" stroke-linejoin="round"/>
                              </svg>
                            </div>
                            <input id="guest-contactNumber" type="tel" name="contactNumber" [(ngModel)]="guestForm.contactNumber"
                                   [placeholder]="t('doc.guestInfo.contactPh')" autocomplete="tel" inputmode="tel"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (guestForm.contactNumber) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                          @if (guestInvalid('contactNumber')) {
                            <p class="flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.guest.contact') }}
                            </p>
                          }
                        </div>

                        <!-- Email (optional) -->
                        <div>
                          <label for="guest-email" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.email') }}
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden">
                            <div class="shrink-0 w-12 sm:w-14 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <rect x="3" y="5" width="18" height="14" rx="2"/>
                                <path d="M3.5 7l8.5 6 8.5-6" stroke-linejoin="round"/>
                              </svg>
                            </div>
                            <input id="guest-email" type="email" name="email" [(ngModel)]="guestForm.email"
                                   [placeholder]="t('doc.guestInfo.emailPh')" autocomplete="email" inputmode="email"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (guestForm.email) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                        </div>
                      </div>

                      <!-- Form actions -->
                      <div class="flex items-center justify-center mt-5 sm:mt-6">
                        <button (click)="validateGuestForm()"
                                class="flex items-center justify-center gap-2.5 min-h-[56px] min-w-[200px] sm:min-w-[220px] px-6 sm:px-8 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-lg font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40">
                          {{ t('common.continue') }}
                          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer: same as the kiosk landing page (includes the language selector) -->
              <div class="relative z-10 border-t border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-2 lg:gap-y-3 items-center">

                  <!-- Section 1: Language (same as landing) -->
                  <div class="flex flex-col items-center gap-1.5 text-center min-w-0">
                    <div class="flex items-center gap-1.5 text-[#0F172A]">
                      <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
                      </svg>
                      <span class="text-[13px] font-semibold">{{ t('landing.footer.language') }}</span>
                    </div>
                    <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-sm min-w-0">
                      <button
                        (click)="setLanguage('en')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'en'"
                        [class.text-white]="language() === 'en'"
                        [class.bg-white]="language() !== 'en'"
                        [class.text-[#0F172A]]="language() !== 'en'">
                        English
                      </button>
                      <button
                        (click)="setLanguage('fil')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] border-l border-[#E5E7EB] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'fil'"
                        [class.text-white]="language() === 'fil'"
                        [class.bg-white]="language() !== 'fil'"
                        [class.text-[#0F172A]]="language() !== 'fil'">
                        Filipino
                      </button>
                    </div>
                  </div>

                  <!-- Section 2: Need Assistance -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                      <path d="M12 17h.01" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                    </div>
                  </div>

                  <!-- Section 3: Office Hours -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 7v5l3 2" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                    </div>
                  </div>

                  <!-- Section 4: Date & Time -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="16" rx="2"/>
                      <path d="M8 3v4M16 3v4M3 10h18"/>
                    </svg>
                    <div class="min-w-0">
                      <p class="text-[11px] lg:text-[12px] font-medium text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                      <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- DOC STEP 1: Service Selection -->
          @if (currentStep() === 'services') {
            <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

              <!-- Background: same as the other kiosk pages -->
              <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
              <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                   style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
              <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
                </svg>
              </div>

              <!-- Header: back (left) + logo (center) + title/subtitle -->
              <header class="relative z-10 shrink-0">
                <div class="flex items-center justify-center relative pt-1.5 pb-0.5 min-[1101px]:pt-2 [@media(max-height:880px)]:pt-1">
                  <div class="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2.5 sm:gap-3">
                    <button (click)="goBack()"
                            class="w-[44px] h-[44px] sm:w-[46px] sm:h-[46px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                            [attr.aria-label]="t('common.back')">
                      <svg class="w-5 h-5 sm:w-6 sm:h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                      </svg>
                    </button>
                    <button (click)="goBack()"
                            class="flex items-center min-h-[40px] rounded-xl px-1 text-[#0F172A] font-semibold text-[13px] sm:text-[14px] hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                      {{ t('common.back') }}
                    </button>
                  </div>

                  <div class="w-[84px] h-[84px] sm:w-[96px] sm:h-[96px] rounded-full bg-white border-2 border-[#F97316]/30 shadow-md overflow-hidden flex items-center justify-center [@media(max-height:880px)]:w-[72px] [@media(max-height:880px)]:h-[72px]">
                    <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                  </div>
                </div>

                <div class="text-center px-4 pt-0.5 pb-1 [@media(max-height:880px)]:pb-0.5">
                  <h1 class="text-[clamp(1.5rem,1.8vw,2rem)] font-bold tracking-tight text-[#0F172A] leading-none [@media(max-height:880px)]:text-[1.375rem]">{{ t('doc.services.title') }}</h1>
                  <p class="text-[clamp(0.875rem,1vw,1rem)] font-medium text-[#64748B] mt-0.5">{{ t('doc.services.subtitle') }}</p>
                </div>
              </header>

              <!-- Main: service cards in a responsive grid (one column, two columns when space allows) -->
              <main class="relative z-10 flex-1 min-h-0 overflow-y-auto">
                <div class="min-h-full mx-auto w-[calc(100%-32px)] sm:w-[calc(100%-48px)] min-[1101px]:w-[calc(100%-80px)] max-w-[980px] py-2 sm:py-2.5 [@media(max-height:880px)]:py-1.5 grid grid-cols-1 gap-2.5 sm:gap-3.5 content-start">
                  @for (service of services(); track service.service_id) {
                    <button type="button"
                            (click)="selectService(service)"
                            class="w-full text-left flex items-center gap-4 sm:gap-5 rounded-[18px] border-2 border-[#E5E7EB] bg-white shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-4 sm:px-6 py-4 sm:py-5 transition-all duration-150 hover:border-[#F97316]/50 hover:bg-[#FFF7ED]/40 hover:shadow-[0_4px_18px_rgba(249,115,22,0.12)] active:border-[#F97316] active:bg-[#FFF7ED] active:scale-[0.995] focus:outline-none focus:ring-4 focus:ring-[#F97316]/30 [@media(max-height:880px)]:py-3">
                      <!-- Left: icon in a light-orange rounded square -->
                      <div class="shrink-0 w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-[14px] sm:rounded-[16px] bg-[#FFF7ED] border border-[#F97316]/15 flex items-center justify-center text-[#F97316] [@media(max-height:880px)]:w-[52px] [@media(max-height:880px)]:h-[52px]" aria-hidden="true">
                        <svg class="w-8 h-8 sm:w-9 sm:h-9" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                          <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M14 3v5h5M8 13h8M8 17h5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>

                      <!-- Center: service name + description -->
                      <div class="flex-1 min-w-0 flex flex-col justify-center">
                        <h2 class="text-[clamp(1.125rem,1.4vw,1.5rem)] font-bold text-[#0F172A] leading-snug tracking-tight uppercase break-words">{{ service.service_name }}</h2>
                        @if (service.description) {
                          <p class="text-[clamp(0.875rem,1vw,0.9375rem)] font-medium text-[#64748B] leading-snug mt-0.5 sm:mt-1 line-clamp-3">{{ service.description }}</p>
                        }
                      </div>

                      <!-- Right: processing fee + chevron -->
                      <div class="shrink-0 flex items-center justify-end gap-3 sm:gap-4 text-right">
                        <div class="min-w-0 text-right">
                          @if (service.processing_fee > 0) {
                            <p class="text-[clamp(1.25rem,1.8vw,1.75rem)] font-bold text-[#0F172A] leading-none tracking-tight whitespace-nowrap">₱{{ formatServiceFee(service.processing_fee) }}</p>
                            <p class="text-[11px] sm:text-[12px] font-semibold text-[#64748B] uppercase tracking-wide mt-1 whitespace-nowrap">{{ t('doc.services.processingFee') }}</p>
                          } @else {
                            <p class="text-[clamp(1.25rem,1.8vw,1.75rem)] font-bold text-[#10B981] leading-none tracking-tight whitespace-nowrap">{{ t('doc.services.free') }}</p>
                            <p class="text-[11px] sm:text-[12px] font-semibold text-[#64748B] uppercase tracking-wide mt-1 whitespace-nowrap">{{ t('doc.services.processingFee') }}</p>
                          }
                        </div>
                        <svg class="w-7 h-7 sm:w-8 sm:h-8 text-[#F97316] shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </button>
                  }
                </div>
              </main>

              <!-- Footer: same as the kiosk landing page (includes the language selector) -->
              <footer class="relative z-10 shrink-0 border-t border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-2 lg:gap-y-3 items-center">

                  <!-- Section 1: Language (same as landing) -->
                  <div class="flex flex-col items-center gap-1.5 text-center min-w-0">
                    <div class="flex items-center gap-1.5 text-[#0F172A]">
                      <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
                      </svg>
                      <span class="text-[13px] font-semibold">{{ t('landing.footer.language') }}</span>
                    </div>
                    <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-sm min-w-0">
                      <button
                        (click)="setLanguage('en')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'en'"
                        [class.text-white]="language() === 'en'"
                        [class.bg-white]="language() !== 'en'"
                        [class.text-[#0F172A]]="language() !== 'en'">
                        English
                      </button>
                      <button
                        (click)="setLanguage('fil')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] border-l border-[#E5E7EB] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'fil'"
                        [class.text-white]="language() === 'fil'"
                        [class.bg-white]="language() !== 'fil'"
                        [class.text-[#0F172A]]="language() !== 'fil'">
                        Filipino
                      </button>
                    </div>
                  </div>

                  <!-- Section 2: Need Assistance -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                      <path d="M12 17h.01" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                    </div>
                  </div>

                  <!-- Section 3: Office Hours -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 7v5l3 2" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                    </div>
                  </div>

                  <!-- Section 4: Date & Time -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="16" rx="2"/>
                      <path d="M8 3v4M16 3v4M3 10h18"/>
                    </svg>
                    <div class="min-w-0">
                      <p class="text-[11px] lg:text-[12px] font-medium text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                      <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          }

          <!-- DOC STEP 2: Requirements -->
          @if (currentStep() === 'requirements') {
            <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

              <!-- Background: same as the other kiosk pages -->
              <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
              <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                   style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
              <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
                </svg>
              </div>

              <!-- Header: back (left) + logo (center) + title/subtitle -->
              <header class="relative z-10 shrink-0">
                <div class="flex items-center justify-center relative pt-1.5 pb-0.5 min-[1101px]:pt-2 [@media(max-height:880px)]:pt-1">
                  <div class="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2.5 sm:gap-3">
                    <button (click)="goBack()"
                            class="w-[44px] h-[44px] sm:w-[46px] sm:h-[46px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                            [attr.aria-label]="t('common.back')">
                      <svg class="w-5 h-5 sm:w-6 sm:h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                      </svg>
                    </button>
                    <button (click)="goBack()"
                            class="flex items-center min-h-[40px] rounded-xl px-1 text-[#0F172A] font-semibold text-[13px] sm:text-[14px] hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                      {{ t('common.back') }}
                    </button>
                  </div>

                  <div class="w-[84px] h-[84px] sm:w-[96px] sm:h-[96px] rounded-full bg-white border-2 border-[#F97316]/30 shadow-md overflow-hidden flex items-center justify-center [@media(max-height:880px)]:w-[72px] [@media(max-height:880px)]:h-[72px]">
                    <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                  </div>
                </div>

                <div class="text-center px-4 pt-0.5 pb-1 [@media(max-height:880px)]:pb-0.5">
                  <h1 class="text-[clamp(1.5rem,1.8vw,2rem)] font-bold tracking-tight text-[#0F172A] leading-none [@media(max-height:880px)]:text-[1.375rem]">{{ t('doc.requirements.title') }}</h1>
                  <p class="text-[clamp(0.875rem,1vw,1rem)] font-medium text-[#64748B] mt-0.5">{{ t('doc.requirements.subtitle') }}</p>
                </div>
              </header>

              <!-- Main: requirements card + page actions -->
              <main class="relative z-10 flex-1 min-h-0 overflow-y-auto">
                <div class="min-h-full mx-auto w-[calc(100%-32px)] sm:w-[calc(100%-48px)] min-[1101px]:w-[calc(100%-80px)] max-w-[860px] py-2 sm:py-2.5 flex flex-col justify-center gap-3 sm:gap-4">

                  <!-- Requirements card -->
                  <section class="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-4 sm:px-7 py-4 sm:py-5" aria-label="Service requirements">

                    <!-- Service header -->
                    <div class="flex items-start gap-3 sm:gap-4">
                      <div class="shrink-0 w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-[14px] sm:rounded-[16px] bg-[#FFF7ED] border border-[#F97316]/15 flex items-center justify-center text-[#F97316]" aria-hidden="true">
                        <svg class="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                          <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M14 3v5h5M8 13h8M8 17h5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                      <div class="min-w-0">
                        <h2 class="text-[clamp(1.125rem,1.4vw,1.5rem)] font-bold text-[#0F172A] leading-tight uppercase break-words">{{ selectedService()?.service_name }}</h2>
                        @if (selectedService()?.description) {
                          <p class="text-[clamp(0.875rem,1vw,0.9375rem)] font-medium text-[#64748B] leading-relaxed mt-1.5 max-w-[62ch]">{{ selectedService()?.description }}</p>
                        }
                      </div>
                    </div>

                    @if (selectedService()?.requirements && selectedService()!.requirements!.length > 0) {

                      <!-- Divider -->
                      <div class="border-t border-[#E5E7EB] my-4 sm:my-5"></div>

                      <!-- What to Bring heading -->
                      <div class="flex items-center gap-2 mb-3">
                        <svg class="w-5 h-5 text-[#F97316] shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="5" y="4" width="14" height="17" rx="2"/>
                          <path d="M9 4.5V3h6v1.5" stroke-linecap="round"/>
                          <path d="M8.5 12.5l2.3 2.3 4.7-4.7" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <h3 class="text-[clamp(1rem,1.2vw,1.125rem)] font-bold text-[#0F172A]">{{ t('doc.requirements.whatToBring') }}</h3>
                      </div>

                      <!-- Requirement rows -->
                      <ul class="flex flex-col gap-2.5 sm:gap-3">
                        @for (req of selectedService()!.requirements!; track req) {
                          <li class="w-full flex items-center gap-3 sm:gap-4 bg-[#FCF8F5] border border-[#E5E7EB] rounded-[12px] px-3.5 sm:px-4 py-3">
                            <div class="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#FFF7ED] border border-[#F97316]/15 text-[#F97316] flex items-center justify-center" aria-hidden="true">
                              <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <rect x="5" y="4" width="14" height="17" rx="2"/>
                                <path d="M9 4.5V3h6v1.5" stroke-linecap="round"/>
                                <path d="M9 12h6M9 16h6" stroke-linecap="round"/>
                              </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                              <p class="text-[clamp(0.9375rem,1.1vw,1.0625rem)] font-bold text-[#0F172A] leading-snug break-words">{{ req }}</p>
                            </div>
                            <div class="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center" aria-hidden="true">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                              </svg>
                            </div>
                          </li>
                        }
                      </ul>
                    } @else {
                      <div class="border-t border-[#E5E7EB] my-4 sm:my-5"></div>
                      <p class="text-[clamp(0.9375rem,1vw,1rem)] font-medium text-[#64748B]">{{ t('doc.requirements.none') }}</p>
                    }
                  </section>

                  <!-- Bottom actions -->
                  <div class="flex items-center justify-center gap-3 sm:gap-4 pt-1 pb-2">
                    <button (click)="goBack()"
                            class="flex items-center justify-center gap-2 min-h-[54px] min-w-[160px] sm:min-w-[180px] px-6 rounded-[14px] border-2 border-[#F97316] bg-white text-[#F97316] text-base sm:text-lg font-bold shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/25">
                      <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                      </svg>
                      {{ t('common.back') }}
                    </button>
                    <button (click)="proceedToForm()"
                            class="flex items-center justify-center gap-2 min-h-[54px] min-w-[200px] sm:min-w-[220px] px-8 rounded-[14px] bg-[#F97316] text-white text-base sm:text-lg font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:bg-[#EA580C] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40">
                      {{ t('common.continue') }}
                      <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </main>

              <!-- Footer: same as the kiosk landing page (includes the language selector) -->
              <footer class="relative z-10 shrink-0 border-t border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-2 lg:gap-y-3 items-center">

                  <!-- Section 1: Language (same as landing) -->
                  <div class="flex flex-col items-center gap-1.5 text-center min-w-0">
                    <div class="flex items-center gap-1.5 text-[#0F172A]">
                      <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
                      </svg>
                      <span class="text-[13px] font-semibold">{{ t('landing.footer.language') }}</span>
                    </div>
                    <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-sm min-w-0">
                      <button
                        (click)="setLanguage('en')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'en'"
                        [class.text-white]="language() === 'en'"
                        [class.bg-white]="language() !== 'en'"
                        [class.text-[#0F172A]]="language() !== 'en'">
                        English
                      </button>
                      <button
                        (click)="setLanguage('fil')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] border-l border-[#E5E7EB] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'fil'"
                        [class.text-white]="language() === 'fil'"
                        [class.bg-white]="language() !== 'fil'"
                        [class.text-[#0F172A]]="language() !== 'fil'">
                        Filipino
                      </button>
                    </div>
                  </div>

                  <!-- Section 2: Need Assistance -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                      <path d="M12 17h.01" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                    </div>
                  </div>

                  <!-- Section 3: Office Hours -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 7v5l3 2" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                    </div>
                  </div>

                  <!-- Section 4: Date & Time -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="16" rx="2"/>
                      <path d="M8 3v4M16 3v4M3 10h18"/>
                    </svg>
                    <div class="min-w-0">
                      <p class="text-[11px] lg:text-[12px] font-medium text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                      <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          }



          <!-- DOC STEP 3: Application Form -->
          @if (currentStep() === 'form') {
            <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

              <!-- Background image (same as the kiosk landing page) -->
              <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
              <!-- Subtle radial glow keeps the form legible without washing the orange -->
              <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                   style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
              <!-- Curved orange header accent (top-left, same as landing) -->
              <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
                </svg>
              </div>

              <!-- Top navigation: circular back (left) + logo (center) + RFID status (right) -->
              <div class="relative z-10 flex items-center justify-center px-6 pt-[18px] pb-1">
                <div class="absolute left-4 sm:left-6 top-[26px] z-40 flex items-center gap-2.5 sm:gap-3">
                  <button (click)="goBack()"
                          class="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                          [attr.aria-label]="t('common.back')">
                    <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <button (click)="goBack()"
                          class="flex items-center min-h-[44px] rounded-xl px-1 text-[#0F172A] font-semibold text-[15px] sm:text-base hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                    {{ t('common.back') }}
                  </button>
                </div>

                <div class="w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-full bg-white border-2 border-[#F97316]/30 shadow-sm overflow-hidden flex items-center justify-center">
                  <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                </div>

                <!-- RFID verification status (RFID-authenticated resident only) -->
                @if (resident()) {
                  <div class="absolute right-4 sm:right-6 top-[26px] z-40 flex items-center gap-2.5 rounded-2xl border border-[#BBF7D0] bg-[#DCFCE7]/95 backdrop-blur-sm px-3.5 sm:px-4 py-2 shadow-sm" role="status">
                    <div class="shrink-0 w-9 h-9 rounded-full bg-[#16A34A] flex items-center justify-center" aria-hidden="true">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 2l7 3v6c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V5l7-3z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="m8.7 12 2.3 2.3 4.3-4.3"/>
                      </svg>
                    </div>
                    <div class="text-left">
                      <p class="text-[13px] sm:text-[14px] font-bold text-[#166534] leading-tight">{{ t('doc.form.rfidVerified') }}</p>
                      <p class="text-[11px] sm:text-[12px] font-semibold text-[#15803D] leading-tight">{{ t('doc.form.activeResident') }}</p>
                    </div>
                  </div>
                }
              </div>

              <!-- Page header -->
              <div class="relative z-10 text-center px-4 pt-0.5 pb-0.5">
                <h1 class="text-[clamp(1.5rem,2.1vw,2.25rem)] font-bold tracking-tight text-[#0F172A] leading-tight uppercase">{{ selectedService()?.service_name }}</h1>
                <p class="text-[clamp(0.925rem,1.05vw,1.075rem)] font-medium text-[#64748B] mt-1">{{ t('doc.form.desc') }}</p>
              </div>

              <!-- Progress indicator (6 steps) -->
              <div class="relative z-10 flex items-center justify-center px-4 pb-1">
                <ol class="flex items-center gap-1.5 sm:gap-2.5" aria-label="Kiosk progress">
                  @for (num of [1, 2, 3, 4, 5, 6]; track num) {
                    <li class="flex items-center gap-1.5 sm:gap-2.5">
                      @if (num > 1) {
                        <span class="w-5 sm:w-8 h-[3px] rounded-full"
                              [class.bg-[#F97316]]="docProgressState(num) !== 'upcoming'"
                              [class.bg-[#E5E7EB]]="docProgressState(num) === 'upcoming'"></span>
                      }
                      @if (docProgressState(num) === 'done') {
                        <span class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFF7ED] border-2 border-[#F97316] flex items-center justify-center" aria-hidden="true">
                          <svg class="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.6" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        </span>
                        <span class="hidden lg:block text-[13px] sm:text-[14px] font-bold text-[#0F172A] whitespace-nowrap">{{ t('doc.progress.' + num) }}</span>
                      } @else if (docProgressState(num) === 'current') {
                        <span class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F97316] border-2 border-[#F97316] text-white flex items-center justify-center text-sm sm:text-base font-bold shadow-sm" aria-hidden="true">{{ num }}</span>
                        <span class="hidden lg:block text-[13px] sm:text-[14px] font-bold text-[#F97316] whitespace-nowrap">{{ t('doc.progress.' + num) }}</span>
                      } @else {
                        <span class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border-2 border-[#CBD5E1] text-[#94A3B8] flex items-center justify-center text-sm sm:text-base font-bold" aria-hidden="true">{{ num }}</span>
                        <span class="hidden lg:block text-[13px] sm:text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('doc.progress.' + num) }}</span>
                      }
                    </li>
                  }
                </ol>
              </div>

              <!-- Resident summary (compact, subtle) -->
              <div class="relative z-10 px-4 sm:px-8 pb-1">
                <div class="mx-auto w-full max-w-[820px] flex items-center justify-between gap-3 bg-white/80 border border-[#E5E7EB] rounded-2xl shadow-sm px-4 sm:px-5 py-2.5">
                  <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div class="shrink-0 w-9 h-9 rounded-full bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center text-[#F97316]" aria-hidden="true">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 20c0-3.6 3.6-5 8-5s8 1.4 8 5" stroke-linecap="round"/>
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-[15px] sm:text-[16px] font-bold text-[#0F172A] leading-tight truncate">{{ displayName() }}</p>
                      <p class="text-[12px] sm:text-[13px] font-medium text-[#64748B] leading-snug">
                        @if (resident()) {
                          {{ t('doc.form.rfidNo') }} {{ rfidDisplayNumber() }}
                        } @else {
                          {{ displayCode() }}
                        }
                      </p>
                    </div>
                  </div>
                  @if (resident()) {
                    <span class="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] px-3 py-1 text-[12px] sm:text-[13px] font-bold text-[#166534]">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      {{ t('doc.form.activeResident') }}
                    </span>
                  }
                </div>
              </div>

              <!-- Main content: Request Details form -->
              <div class="relative z-10 flex-1 overflow-y-auto">
                <div class="min-h-full flex items-center justify-center px-5 sm:px-8 py-4 sm:py-5">

                  <div class="w-full max-w-[820px]">

                    <!-- Request details card -->
                    <div class="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-8 py-5 sm:py-6">

                      <!-- Section heading -->
                      <div class="flex items-center gap-2.5 mb-4 sm:mb-5">
                        <div class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center text-[#F97316]" aria-hidden="true">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24">
                            <rect x="5" y="4" width="14" height="17" rx="2"/>
                            <path d="M9 4.5V3h6v1.5" stroke-linecap="round"/>
                            <path d="M8.5 12.5l2.3 2.3 4.7-4.7" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </div>
                        <h2 class="text-[clamp(1rem,1.3vw,1.1875rem)] font-bold tracking-[0.02em] text-[#0F172A] uppercase">{{ t('doc.form.requestDetails') }}</h2>
                      </div>



                      @if (selectedService()?.form_fields && selectedService()!.form_fields!.length > 0) {
                        <div class="flex flex-wrap gap-x-5 gap-y-4 sm:gap-y-5">
                          @for (field of selectedService()!.form_fields!; track field.key) {
                            <div [class]="formGridClass(field)">
                              <label [attr.for]="'doc-form-' + field.key" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                                {{ fieldLabel(field) }} @if (field.required) { <span class="text-[#F97316]">*</span> }
                              </label>

                              @switch (field.type) {
                                @case ('select') {
                                  <div class="relative flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                                       [class.border-[#DC2626]]="formErrors()[field.key]">
                                    <select
                                      [id]="'doc-form-' + field.key"
                                      [name]="field.key"
                                      [(ngModel)]="formValues()[field.key]"

                                      (ngModelChange)="updateFormValue(field.key, $event)"
                                      class="appearance-none flex-1 min-w-0 bg-transparent px-3.5 sm:px-4 py-3 text-[15px] sm:text-[17px] outline-none border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                      [class.text-[#0F172A]]="!!formValues()[field.key]"
                                      [class.text-[#94A3B8]]="!formValues()[field.key]">
                                      <option value="">{{ t('doc.form.select') }}</option>
                                      @for (opt of field.options || []; track opt) {
                                        <option [value]="opt">{{ opt }}</option>
                                      }
                                    </select>
                                    <div class="pointer-events-none absolute right-3 text-[#64748B]" aria-hidden="true">
                                      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/>
                                      </svg>
                                    </div>
                                  </div>
                                }
                                @case ('textarea') {
                                  <textarea
                                    [id]="'doc-form-' + field.key"
                                    [name]="field.key"
                                    [(ngModel)]="formValues()[field.key]"
                                    (ngModelChange)="updateFormValue(field.key, $event)"
                                    [placeholder]="fieldPlaceholder(field)"
                                    rows="3"
                                    class="w-full rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm px-3.5 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/15 transition-all duration-150 resize-none"
                                    [class.border-[#DC2626]]="formErrors()[field.key]"></textarea>
                                }
                                @case ('radio') {
                                  <div class="flex flex-col gap-2">
                                    @for (opt of field.options || []; track opt) {
                                      <label class="flex items-center gap-3 rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 cursor-pointer transition-colors duration-150 hover:border-[#F97316]/40 mb-0"
                                             [class.border-[#F97316]]="formValues()[field.key] === opt"
                                             [class.bg-[#FFF7ED]]="formValues()[field.key] === opt"
                                             >
                                        <input type="radio" [name]="field.key" [value]="opt"
                                               [checked]="formValues()[field.key] === opt"
                                               (change)="updateFormValue(field.key, opt)"
                                               class="w-5 h-5 accent-[#F97316] shrink-0" />
                                        <span class="text-[15px] sm:text-base font-medium text-[#0F172A]">{{ opt }}</span>
                                      </label>
                                    }
                                  </div>
                                }
                                @case ('checkbox') {
                                  <div class="flex flex-col gap-2">
                                    @for (opt of field.options || []; track opt) {
                                      <label class="flex items-center gap-3 rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 cursor-pointer transition-colors duration-150 hover:border-[#F97316]/40 mb-0"
                                             [class.border-[#F97316]]="isCheckboxChecked(field, opt)"
                                             [class.bg-[#FFF7ED]]="isCheckboxChecked(field, opt)"
                                             >
                                        <input type="checkbox" [value]="opt"
                                               [checked]="isCheckboxChecked(field, opt)"
                                               (change)="toggleCheckboxOption(field, opt, $event)"
                                               class="w-5 h-5 accent-[#F97316] shrink-0" />
                                        <span class="text-[15px] sm:text-base font-medium text-[#0F172A]">{{ opt }}</span>
                                      </label>
                                    }
                                  </div>
                                }
                                @case ('signature') {
                                  <div>
                                    @if (!formValues()[field.key]) {
                                      <app-signature-pad [showError]="!!formErrors()[field.key]" (signature)="onFieldSignature(field.key, $event)" />
                                    } @else {
                                      <div class="flex flex-wrap items-center gap-3">
                                        <img [src]="formValues()[field.key]" alt="Signature" class="h-24 rounded-xl border border-[#E5E7EB] object-contain bg-white" />
                                        <button type="button" (click)="clearFieldValue(field.key)"
                                                class="min-h-[48px] px-4 rounded-xl border-2 border-[#F97316] bg-white text-[#F97316] text-sm sm:text-base font-bold shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/25">
                                          {{ t('common.clear') }}
                                        </button>
                                      </div>
                                    }
                                  </div>
                                }
                                @case ('photo') {
                                  <div>
                                    @if (activePhotoField() === field.key) {
                                      <div class="bg-[#0F172A] rounded-2xl overflow-hidden mb-2">
                                        <video #inlineVideoEl autoplay playsinline class="w-full aspect-video object-cover"></video>
                                      </div>
                                      <div class="flex flex-wrap gap-3 justify-center">
                                        <button (click)="captureInlinePhoto(field.key)"
                                                class="flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-[#F97316] text-white text-sm sm:text-base font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:bg-[#EA580C] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40">
                                          {{ t('doc.form.takePhoto') }}
                                        </button>
                                        <button (click)="cancelInlinePhoto(field.key)"
                                                class="flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl border-2 border-[#F97316] bg-white text-[#F97316] text-sm sm:text-base font-bold shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/25">
                                          {{ t('common.cancel') }}
                                        </button>
                                      </div>
                                    } @else if (formValues()[field.key]) {
                                      <div class="flex flex-wrap items-center gap-3">
                                        <img [src]="formValues()[field.key]" [alt]="t('err.captured')" class="w-36 h-36 rounded-2xl object-cover border border-[#E5E7EB]" />
                                        <button (click)="retakeInlinePhoto(field.key)"
                                                class="flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl border-2 border-[#F97316] bg-white text-[#F97316] text-sm sm:text-base font-bold shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/25">
                                          {{ t('common.retake') }}
                                        </button>
                                      </div>
                                    } @else {
                                      <button (click)="startInlineCamera(field.key)"
                                              class="flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-[#F97316] text-white text-sm sm:text-base font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:bg-[#EA580C] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" aria-hidden="true">
                                          <rect x="3" y="6" width="18" height="13" rx="2"/>
                                          <path d="M8 6l1.5-2h5L16 6" stroke-linejoin="round"/>
                                          <circle cx="12" cy="12.5" r="3"/>
                                        </svg>
                                        {{ t('doc.form.openCamera') }}
                                      </button>
                                    }
                                  </div>
                                }
                                @case ('file') {
                                  <div>
                                    <input type="file" [accept]="field.accept || '*'" (change)="onFileSelected(field, $event)"
                                           class="w-full text-[13px] sm:text-sm text-[#64748B] file:mr-4 file:inline-block file:border-0 file:rounded-lg file:bg-[#F97316] file:px-4 file:py-2.5 file:text-white file:text-sm file:font-bold file:cursor-pointer file:hover:bg-[#EA580C]" />
                                    @if (formValues()[field.key]) {
                                      <p class="mt-1.5 flex items-center gap-1.5 text-[13px] sm:text-sm font-semibold text-[#16A34A]">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true">
                                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                        </svg>
                                        {{ t('doc.form.fileAttached') }}
                                      </p>
                                    }
                                  </div>
                                }
                                @default {
                                  <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                                       [class.border-[#DC2626]]="formErrors()[field.key]">
                                    <input
                                      [id]="'doc-form-' + field.key"
                                      [type]="field.type"
                                      [name]="field.key"
                                      [(ngModel)]="formValues()[field.key]"
                                      (ngModelChange)="updateFormValue(field.key, $event)"
                                      [placeholder]="fieldPlaceholder(field)"
                                      class="flex-1 min-w-0 bg-transparent px-3.5 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] outline-none border-none" />
                                  </div>
                                }
                              }

                              @if (field.helperText) {
                                <p class="mt-1.5 text-[13px] sm:text-[14px] text-[#64748B]">{{ field.helperText }}</p>
                              }
                              @if (formErrors()[field.key]) {
                                <p class="mt-2 flex items-center gap-1.5 text-[14px] sm:text-[15px] font-medium text-[#B91C1C]">
                                  <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                    <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                                  </svg>
                                  {{ formErrors()[field.key] }}
                                </p>
                              }
                            </div>
                          }
                        </div>
                      } @else {
                        <p class="text-[clamp(0.9375rem,1vmax,1rem)] font-medium text-[#64748B]">{{ t('doc.form.noFields') }}</p>
                      }

                      <!-- Bottom action: single Continue (the circular back nav handles going back) -->
                      <div class="flex items-center justify-center mt-5 sm:mt-7">
                        <button (click)="validateForm()"
                                class="flex items-center justify-center gap-2 min-h-[56px] min-w-[220px] sm:min-w-[240px] px-7 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-base sm:text-lg font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40">
                          {{ t('common.continue') }}
                          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer: same as the kiosk landing page (includes the language selector) -->
              <footer class="relative z-10 shrink-0 border-t border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-2 lg:gap-y-3 items-center">

                  <!-- Section 1: Language (same as landing) -->
                  <div class="flex flex-col items-center gap-1.5 text-center min-w-0">
                    <div class="flex items-center gap-1.5 text-[#0F172A]">
                      <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
                      </svg>
                      <span class="text-[13px] font-semibold">{{ t('landing.footer.language') }}</span>
                    </div>
                    <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-sm min-w-0">
                      <button
                        (click)="setLanguage('en')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'en'"
                        [class.text-white]="language() === 'en'"
                        [class.bg-white]="language() !== 'en'"
                        [class.text-[#0F172A]]="language() !== 'en'">
                        English
                      </button>
                      <button
                        (click)="setLanguage('fil')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] border-l border-[#E5E7EB] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'fil'"
                        [class.text-white]="language() === 'fil'"
                        [class.bg-white]="language() !== 'fil'"
                        [class.text-[#0F172A]]="language() !== 'fil'">
                        Filipino
                      </button>
                    </div>
                  </div>

                  <!-- Section 2: Need Assistance -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                      <path d="M12 17h.01" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                    </div>
                  </div>

                  <!-- Section 3: Office Hours -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 7v5l3 2" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                    </div>
                  </div>

                  <!-- Section 4: Date & Time -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="16" rx="2"/>
                      <path d="M8 3v4M16 3v4M3 10h18"/>
                    </svg>
                    <div class="min-w-0">
                      <p class="text-[11px] lg:text-[12px] font-medium text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                      <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          }

          <!-- DOC STEP 4: Photo Capture (only if service requires photo) -->
          @if (currentStep() === 'photo') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full">
                <h2 class="text-3xl font-bold mb-6 text-center">{{ t('doc.photo.title') }}</h2>
                @if (!capturedPhoto()) {
                  <div class="bg-black rounded-2xl overflow-hidden mb-6">
                    <video #videoEl autoplay playsinline class="w-full aspect-video object-cover"></video>
                  </div>
                  <div class="flex gap-4 justify-center">
                    <app-button variant="primary" size="lg" (onClick)="capturePhoto()">{{ t('doc.form.takePhoto') }}</app-button>
                    <app-button variant="secondary" size="lg" (onClick)="skipPhoto()">{{ t('common.skip') }}</app-button>
                  </div>
                } @else {
                  <div class="text-center">
                    <img [src]="capturedPhoto()" class="w-64 h-64 rounded-2xl mx-auto mb-6 object-cover border-4 border-white" />
                    <div class="flex gap-4 justify-center">
                      <app-button variant="primary" size="lg" (onClick)="confirmPhoto()">{{ t('doc.photo.useThis') }}</app-button>
                      <app-button variant="secondary" size="lg" (onClick)="retakePhoto()">{{ t('common.retake') }}</app-button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- DOC STEP 5: Review & Confirm -->
          @if (currentStep() === 'review') {
            <div class="absolute inset-0 flex flex-col p-8">
              <div class="max-w-2xl mx-auto w-full flex-1 flex flex-col">

                <!-- Header: title + back -->
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-3xl font-bold">{{ t('doc.review.title') }}</h2>
                  <button class="text-blue-300 hover:text-white text-lg" (click)="goBack()">{{ t('common.back') }}</button>
                </div>

                <!-- Scrollable content: summary + document preview -->
                <div class="flex-1 overflow-y-auto space-y-4">
                  <div class="bg-blue-800/50 rounded-2xl p-6 backdrop-blur space-y-4">
                    <div class="flex items-center gap-4">
                      @if (displayPhoto()) {
                        <img [src]="displayPhoto()" class="w-16 h-16 rounded-full object-cover" />
                      } @else {
                        <div class="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                          {{ displayName().charAt(0) }}
                        </div>
                      }
                      <div>
                        <p class="font-bold text-lg">{{ displayName() }}</p>
                        <p class="text-blue-200 text-sm">{{ displayAddress() }}</p>
                        @if (displayCode()) {
                          <p class="text-blue-300 text-xs mt-1">{{ displayCode() }}</p>
                        }
                      </div>
                    </div>
                    <hr class="border-blue-700" />
                    <div>
                      <p class="text-blue-300 text-sm">{{ t('doc.review.service') }}</p>
                      <p class="font-bold text-lg">{{ selectedService()!.service_name }}</p>
                    </div>
                    <div>
                      <p class="text-blue-300 text-sm">{{ t('doc.review.fee') }}</p>
                      @if (selectedService()!.processing_fee > 0) {
                        <p class="font-bold text-lg">₱{{ selectedService()!.processing_fee }}</p>
                      } @else {
                        <p class="font-bold text-lg text-green-300">{{ t('doc.services.free') }}</p>
                      }
                    </div>
                    @if (selectedService()?.form_fields && selectedService()!.form_fields!.length > 0) {
                      <div>
                        <p class="text-blue-300 text-sm mb-2">{{ t('doc.review.details') }}</p>
                        <div class="space-y-2">
                          @for (field of selectedService()!.form_fields!; track field.key) {
                            <div class="flex justify-between items-start gap-4 text-sm">
                              <span class="text-blue-300 flex-1">{{ field.label }}</span>
                              <span class="text-white font-medium text-right">
                                {{ displayFormValue(field, formValues()[field.key]) }}
                              </span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Pre-submission document preview (hidden when the service has no template) -->
                  @if (selectedService()?.has_template) {
                    <div class="bg-blue-800/50 rounded-2xl p-6 backdrop-blur">
                      <div class="flex items-center justify-between gap-4">
                        <div class="min-w-0">
                          <h3 class="font-bold text-lg">{{ t('doc.review.previewTitle') }}</h3>
                          <p class="text-blue-200 text-sm">{{ t('doc.review.previewHint') }}</p>
                        </div>
                        <button
                          (click)="openDocPreview()"
                          [disabled]="docPreviewRendering()"
                          class="shrink-0 flex items-center gap-2 h-11 px-6 rounded-xl bg-[#F97316] text-white text-sm font-bold shadow-[0_2px_10px_rgba(249,115,22,0.35)] hover:bg-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 disabled:opacity-60 disabled:cursor-not-allowed">
                          @if (docPreviewRendering()) {
                            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                            {{ t('doc.review.previewLoading') }}
                          } @else {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            {{ t('doc.review.previewDocument') }}
                          }
                        </button>
                      </div>

                      @if (docPreviewError()) {
                        <p class="text-red-300 text-sm mt-3">{{ docPreviewError() }}</p>
                      }
                    </div>
                  }
 
                  <!-- Error Message Alert -->
                  @if (errorMessage()) {
                    <div class="mt-4 bg-red-500/20 border border-red-400 rounded-xl p-4">
                      <p class="text-red-200 text-sm">{{ errorMessage() }}</p>
                    </div>
                  }
                </div>

                <!-- Actions: Edit Information + Submit Request (the form stays the source of truth) -->
                <div class="flex gap-4 mt-6">
                  <app-button variant="secondary" size="lg" class="flex-1" (onClick)="editInformation()">{{ t('doc.review.edit') }}</app-button>
                  <app-button variant="primary" size="lg" class="flex-1" (onClick)="submitRequest()" [loading]="submitting()">{{ t('doc.review.submit') }}</app-button>
                </div>
              </div>
            </div>
          }

          <!-- DOC STEP 6: Success -->
          @if (currentStep() === 'success') {
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div class="max-w-lg w-full text-center">
                <div class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h2 class="text-3xl font-bold mb-4">{{ t('doc.success.title') }}</h2>
                <p class="text-xl text-blue-200 mb-2">{{ t('doc.success.requestNumber') }}</p>
                <p class="text-4xl font-bold text-yellow-300 mb-6">{{ requestNumber() }}</p>
                <p class="text-blue-200 mb-3">{{ t('doc.success.instructions') }}</p>
                <p class="text-blue-200 mb-8">{{ t('doc.success.monitor') }}</p>
                <app-button variant="primary" size="lg" (onClick)="finish()">{{ t('common.done') }}</app-button>
              </div>
            </div>
          }
        }

        <!-- ============ BARANGAY ID: Application workflow ============ -->
        @if (mode() === 'barangay') {

          <!-- BAR STEP 0: Requirements -->
          @if (barangayStep() === 'requirements') {
            <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

              <!-- Background image (same as the kiosk landing page) -->
              <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
              <!-- Subtle radial glow keeps the form legible without washing the orange -->
              <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                   style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
              <!-- Curved orange header accent (top-left, same as landing) -->
              <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
                </svg>
              </div>

              <!-- Top navigation: back (left) + logo (center) -->
              <div class="relative z-10 flex items-center justify-center px-6 pt-[18px] pb-2">
                <div class="absolute left-4 sm:left-6 top-[26px] z-40 flex items-center gap-2.5 sm:gap-3">
                  <button (click)="goBack()"
                          class="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                          [attr.aria-label]="t('common.back')">
                    <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <button (click)="goBack()"
                          class="flex items-center min-h-[44px] rounded-xl px-1 text-[#0F172A] font-semibold text-[15px] sm:text-base hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                    {{ t('common.back') }}
                  </button>
                </div>

                <div class="w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-full bg-white border-2 border-[#F97316]/30 shadow-sm overflow-hidden flex items-center justify-center">
                  <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                </div>
              </div>

              <!-- Progress indicator -->
              <div class="relative z-10 flex items-center justify-center px-4 pb-1">
                <ol class="flex items-center gap-1.5 sm:gap-2.5" aria-label="Kiosk progress">
                  <li class="flex items-center gap-1.5 sm:gap-2.5">
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-white bg-[#F97316] border-2 border-[#F97316] shadow-sm" aria-hidden="true">1</span>
                    <span class="hidden lg:block text-[14px] font-bold text-[#0F172A] whitespace-nowrap">{{ t('progress.yourInfo') }}</span>
                  </li>
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">2</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.selectDoc') }}</span>
                  </li>
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">3</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.review') }}</span>
                  </li>
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">4</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.submit') }}</span>
                  </li>
                </ol>
              </div>

              <!-- Main content -->
              <div class="relative flex-1 overflow-y-auto">
                <div class="min-h-full flex items-center justify-center px-5 sm:px-10 py-6 sm:py-9">

                  <div class="w-full max-w-[700px]">

                    <!-- Page header -->
                    <div class="text-center mb-4 sm:mb-6">
                      <h1 class="text-[clamp(1.5rem,2.2vw,2.125rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('bar.requirements.title') }}</h1>
                      <p class="text-[clamp(0.925rem,1.1vw,1.075rem)] font-medium text-[#64748B] mt-1.5 sm:mt-2 max-w-2xl mx-auto">{{ t('bar.requirements.desc') }}</p>
                    </div>

                    <!-- Requirements card -->
                    <div class="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-7 py-5 sm:py-6">

                      <!-- Requirement 1 -->
                      <div class="flex items-start gap-3.5 sm:gap-4">
                        <div class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                          <svg class="w-6 h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h3 class="text-[clamp(1rem,1.4vw,1.1875rem)] font-bold text-[#0F172A] leading-tight">{{ t('bar.requirements.req1.title') }}</h3>
                          <p class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#64748B] mt-1 leading-snug">{{ t('bar.requirements.req1.desc') }}</p>
                        </div>
                      </div>

                      <!-- Divider -->
                      <div class="h-px bg-[#E5E7EB] my-4 sm:my-5"></div>

                      <!-- Requirement 2 -->
                      <div class="flex items-start gap-3.5 sm:gap-4">
                        <div class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                          <svg class="w-6 h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H18.375c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h3 class="text-[clamp(1rem,1.4vw,1.1875rem)] font-bold text-[#0F172A] leading-tight">{{ t('bar.requirements.req2.title') }}</h3>
                          <p class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#64748B] mt-1 leading-snug">{{ t('bar.requirements.req2.desc') }}</p>
                        </div>
                      </div>

                      <!-- Divider -->
                      <div class="h-px bg-[#E5E7EB] my-4 sm:my-5"></div>

                      <!-- Requirement 3 -->
                      <div class="flex items-start gap-3.5 sm:gap-4">
                        <div class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                          <svg class="w-6 h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <rect x="3" y="5" width="18" height="14" rx="2" stroke-linejoin="round"/>
                            <path d="m3.5 7 8.5 6 8.5-6" stroke-linejoin="round"/>
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h3 class="text-[clamp(1rem,1.4vw,1.1875rem)] font-bold text-[#0F172A] leading-tight">{{ t('bar.requirements.req3.title') }}</h3>
                          <p class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#64748B] mt-1 leading-snug">{{ t('bar.requirements.req3.desc') }}</p>
                        </div>
                      </div>

                      <!-- Important notice -->
                      <div class="flex items-start gap-3 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 px-4 sm:px-5 py-3.5 mt-5 sm:mt-6">
                        <svg class="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                          <circle cx="12" cy="12" r="9"/>
                          <path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                        </svg>
                        <div class="flex-1 min-w-0">
                          <p class="text-[14px] sm:text-[15px] font-bold text-[#0F172A]">{{ t('bar.requirements.note') }}</p>
                          <p class="text-[13px] sm:text-[14px] text-[#64748B] mt-1 leading-snug">{{ t('bar.requirements.noteDesc') }}</p>
                        </div>
                      </div>
                    </div>

                    <!-- Continue button (single primary action, centered) -->
                    <div class="flex items-center justify-center mt-5 sm:mt-6">
                      <button (click)="proceedToBarangayForm()"
                              class="flex items-center justify-center gap-2 min-h-[56px] min-w-[220px] sm:min-w-[240px] px-7 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-base sm:text-lg font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40">
                        {{ t('common.continue') }}
                        <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer: same as the kiosk landing page (includes the language selector) -->
              <div class="relative z-10 border-t border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-2 lg:gap-y-3 items-center">

                  <!-- Section 1: Language (same as landing) -->
                  <div class="flex flex-col items-center gap-1.5 text-center min-w-0">
                    <div class="flex items-center gap-1.5 text-[#0F172A]">
                      <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
                      </svg>
                      <span class="text-[13px] font-semibold">{{ t('landing.footer.language') }}</span>
                    </div>
                    <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-sm min-w-0">
                      <button
                        (click)="setLanguage('en')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'en'"
                        [class.text-white]="language() === 'en'"
                        [class.bg-white]="language() !== 'en'"
                        [class.text-[#0F172A]]="language() !== 'en'">
                        English
                      </button>
                      <button
                        (click)="setLanguage('fil')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] border-l border-[#E5E7EB] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'fil'"
                        [class.text-white]="language() === 'fil'"
                        [class.bg-white]="language() !== 'fil'"
                        [class.text-[#0F172A]]="language() !== 'fil'">
                        Filipino
                      </button>
                    </div>
                  </div>

                  <!-- Section 2: Need Assistance -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                      <path d="M12 17h.01" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                    </div>
                  </div>

                  <!-- Section 3: Office Hours -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 7v5l3 2" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                    </div>
                  </div>

                  <!-- Section 4: Date & Time -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="16" rx="2"/>
                      <path d="M8 3v4M16 3v4M3 10h18"/>
                    </svg>
                    <div class="min-w-0">
                      <p class="text-[11px] lg:text-[12px] font-medium text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                      <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- BAR STEP 1: Application Form -->
          @if (barangayStep() === 'form') {
            <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

              <!-- Background image (same as the kiosk landing page) -->
              <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
              <!-- Subtle radial glow keeps the form legible without washing the orange -->
              <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                   style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
              <!-- Curved orange header accent (top-left, same as landing) -->
              <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
                </svg>
              </div>

              <!-- Top navigation: back (left) + logo (center) -->
              <div class="relative z-10 flex items-center justify-center px-6 pt-[18px] pb-2">
                <div class="absolute left-4 sm:left-6 top-[26px] z-40 flex items-center gap-2.5 sm:gap-3">
                  <button (click)="goBack()"
                          class="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                          [attr.aria-label]="t('common.back')">
                    <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <button (click)="goBack()"
                          class="flex items-center min-h-[44px] rounded-xl px-1 text-[#0F172A] font-semibold text-[15px] sm:text-base hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                    {{ t('common.back') }}
                  </button>
                </div>

                <div class="w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-full bg-white border-2 border-[#F97316]/30 shadow-sm overflow-hidden flex items-center justify-center">
                  <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                </div>
              </div>

              <!-- Progress indicator -->
              <div class="relative z-10 flex items-center justify-center px-4 pb-1">
                <ol class="flex items-center gap-1.5 sm:gap-2.5" aria-label="Kiosk progress">
                  <li class="flex items-center gap-1.5 sm:gap-2.5">
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-white bg-[#F97316] border-2 border-[#F97316] shadow-sm" aria-hidden="true">1</span>
                    <span class="hidden lg:block text-[14px] font-bold text-[#0F172A] whitespace-nowrap">{{ t('progress.yourInfo') }}</span>
                  </li>
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">2</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.selectDoc') }}</span>
                  </li>
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">3</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.review') }}</span>
                  </li>
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">4</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.submit') }}</span>
                  </li>
                </ol>
              </div>

              <!-- Main content -->
              <div class="relative flex-1 overflow-y-auto">
                <div class="min-h-full flex items-center justify-center px-5 sm:px-8 py-5 sm:py-7">

                  <div class="w-full max-w-[920px]">

                    <!-- Page header -->
                    <div class="text-center mb-4 sm:mb-5">
                      <h1 class="text-[clamp(1.5rem,2.2vw,2.125rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('bar.form.title') }}</h1>
                      <p class="text-[clamp(0.925rem,1.1vw,1.075rem)] font-medium text-[#64748B] mt-1.5 sm:mt-2">{{ t('bar.form.desc') }}</p>
                    </div>

                    <!-- Form card -->
                    <div class="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-7 py-5 sm:py-6">

                      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-4 sm:gap-y-5">

                        <!-- First Name -->
                        <div>
                          <label for="barangay-firstName" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('bar.form.firstName') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="barangayInvalid('firstName')">
                            <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <circle cx="12" cy="8" r="4"/>
                                <path d="M4 20c0-3.6 3.6-5 8-5s8 1.4 8 5" stroke-linecap="round"/>
                              </svg>
                            </div>
                            <input id="barangay-firstName" type="text" name="firstName" [(ngModel)]="barangayForm.firstName"
                                   [placeholder]="t('bar.form.firstNamePh')" autocomplete="given-name"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (barangayForm.firstName) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                          @if (barangayInvalid('firstName')) {
                            <p class="mt-2 flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.bar.firstName') }}
                            </p>
                          }
                        </div>

                        <!-- Middle Name -->
                        <div>
                          <label for="barangay-middleName" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('bar.form.middleName') }}
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden">
                            <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <circle cx="12" cy="8" r="4"/>
                                <path d="M4 20c0-3.6 3.6-5 8-5s8 1.4 8 5" stroke-linecap="round"/>
                              </svg>
                            </div>
                            <input id="barangay-middleName" type="text" name="middleName" [(ngModel)]="barangayForm.middleName"
                                   [placeholder]="t('bar.form.middleNamePh')" autocomplete="additional-name"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (barangayForm.middleName) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                        </div>

                        <!-- Last Name -->
                        <div>
                          <label for="barangay-lastName" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('bar.form.lastName') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="barangayInvalid('lastName')">
                            <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <circle cx="12" cy="8" r="4"/>
                                <path d="M4 20c0-3.6 3.6-5 8-5s8 1.4 8 5" stroke-linecap="round"/>
                              </svg>
                            </div>
                            <input id="barangay-lastName" type="text" name="lastName" [(ngModel)]="barangayForm.lastName"
                                   [placeholder]="t('bar.form.lastNamePh')" autocomplete="family-name"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (barangayForm.lastName) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                          @if (barangayInvalid('lastName')) {
                            <p class="mt-2 flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.bar.lastName') }}
                            </p>
                          }
                        </div>

                        <!-- Suffix -->
                        <div>
                          <label for="barangay-suffix" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('bar.form.suffix') }}
                          </label>
                          <div class="relative flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden">
                            <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <circle cx="12" cy="8" r="4"/>
                                <path d="M4 20c0-3.6 3.6-5 8-5s8 1.4 8 5" stroke-linecap="round"/>
                              </svg>
                            </div>
                            <select id="barangay-suffix" [(ngModel)]="barangayForm.suffix"
                                    class="appearance-none flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] bg-transparent outline-none border-none cursor-pointer"
                                    [class.text-[#94A3B8]]="!barangayForm.suffix">
                              <option value="">{{ t('bar.form.suffixNone') }}</option>
                              <option value="Jr.">Jr.</option>
                              <option value="Sr.">Sr.</option>
                              <option value="II">II</option>
                              <option value="III">III</option>
                              <option value="IV">IV</option>
                            </select>
                            <div class="pointer-events-none absolute right-3 text-[#64748B]" aria-hidden="true">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/>
                              </svg>
                            </div>
                          </div>
                        </div>

                        <!-- Birth Date -->
                        <div>
                          <label for="barangay-birthDate" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('bar.form.birthDate') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="barangayInvalid('birthDate')">
                            <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <rect x="3" y="5" width="18" height="16" rx="2"/>
                                <path d="M8 3v4M16 3v4M3 10h18"/>
                              </svg>
                            </div>
                            <input id="barangay-birthDate" type="date" name="birthDate" [(ngModel)]="barangayForm.birthDate"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] bg-transparent outline-none border-none" />
                            @if (barangayForm.birthDate) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                          @if (barangayInvalid('birthDate')) {
                            <p class="mt-2 flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.bar.birthDate') }}
                            </p>
                          }
                        </div>

                        <!-- Sex -->
                        <div>
                          <label for="barangay-gender" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('bar.form.sex') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="relative flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="barangayInvalid('gender')">
                            <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <circle cx="12" cy="9" r="3.5"/>
                                <path d="M5 20c0-3.6 3.6-5 8-5s8 1.4 8 5" stroke-linecap="round"/>
                              </svg>
                            </div>
                            <select id="barangay-gender" name="gender" [(ngModel)]="barangayForm.gender"
                                    class="appearance-none flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] bg-transparent outline-none border-none cursor-pointer"
                                    [class.text-[#94A3B8]]="!barangayForm.gender">
                              <option value="">{{ t('bar.form.select') }}</option>
                              <option value="Male">{{ t('bar.form.sexMale') }}</option>
                              <option value="Female">{{ t('bar.form.sexFem') }}</option>
                              <option value="Other">{{ t('bar.form.sexOther') }}</option>
                            </select>
                            <div class="pointer-events-none absolute right-3 text-[#64748B]" aria-hidden="true">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/>
                              </svg>
                            </div>
                          </div>
                          @if (barangayInvalid('gender')) {
                            <p class="mt-2 flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.bar.sex') }}
                            </p>
                          }
                        </div>

                        <!-- Civil Status -->
                        <div>
                          <label for="barangay-civilStatus" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('bar.form.civilStatus') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="relative flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="barangayInvalid('civilStatus')">
                            <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4.6 6.5a4.5 4.5 0 0 1 6.4 0l1 1 1-1a4.5 4.5 0 1 1 6.4 6.4L12 21l-7.4-8.1a4.5 4.5 0 0 1 0-6.4Z"/>
                              </svg>
                            </div>
                            <select id="barangay-civilStatus" name="civilStatus" [(ngModel)]="barangayForm.civilStatus"
                                    class="appearance-none flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] bg-transparent outline-none border-none cursor-pointer"
                                    [class.text-[#94A3B8]]="!barangayForm.civilStatus">
                              <option value="">{{ t('bar.form.select') }}</option>
                              <option value="Single">{{ t('bar.form.civilSingle') }}</option>
                              <option value="Married">{{ t('bar.form.civilMarried') }}</option>
                              <option value="Widowed">{{ t('bar.form.civilWidowed') }}</option>
                              <option value="Separated">{{ t('bar.form.civilSeparated') }}</option>
                              <option value="Divorced">{{ t('bar.form.civilDivorced') }}</option>
                            </select>
                            <div class="pointer-events-none absolute right-3 text-[#64748B]" aria-hidden="true">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/>
                              </svg>
                            </div>
                          </div>
                          @if (barangayInvalid('civilStatus')) {
                            <p class="mt-2 flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.bar.civilStatus') }}
                            </p>
                          }
                        </div>

                        <!-- Occupation -->
                        <div>
                          <label for="barangay-occupation" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('bar.form.occupation') }}
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden">
                            <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <rect x="3" y="7" width="18" height="13" rx="2"/>
                                <path d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1M3 12h18" stroke-linecap="round"/>
                              </svg>
                            </div>
                            <input id="barangay-occupation" type="text" name="occupation" [(ngModel)]="barangayForm.occupation"
                                   [placeholder]="t('bar.form.occupationPh')" autocomplete="organization-title"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (barangayForm.occupation) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                        </div>

                        <!-- Blood Type -->
                        <div>
                          <label for="barangay-bloodType" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('bar.form.bloodType') }}
                          </label>
                          <div class="relative flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden">
                            <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" stroke-linejoin="round"/>
                              </svg>
                            </div>
                            <select id="barangay-bloodType" name="bloodType" [(ngModel)]="barangayForm.bloodType"
                                    class="appearance-none flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] bg-transparent outline-none border-none cursor-pointer"
                                    [class.text-[#94A3B8]]="!barangayForm.bloodType">
                              <option value="">{{ t('bar.form.bloodUnknown') }}</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                            </select>
                            <div class="pointer-events-none absolute right-3 text-[#64748B]" aria-hidden="true">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/>
                              </svg>
                            </div>
                          </div>
                        </div>

                        <!-- Contact Number -->
                        <div>
                          <label for="barangay-contactNumber" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('bar.form.contact') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="barangayInvalid('contactNumber')">
                            <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>
                              </svg>
                            </div>
                            <input id="barangay-contactNumber" type="tel" name="contactNumber" [(ngModel)]="barangayForm.contactNumber"
                                   [placeholder]="t('bar.form.contactPh')" autocomplete="tel" inputmode="tel"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (barangayForm.contactNumber) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                          @if (barangayInvalid('contactNumber')) {
                            <p class="mt-2 flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.bar.contact') }}
                            </p>
                          }
                        </div>

                        <!-- Address -->
                        <div class="xl:col-span-2">
                          <label for="barangay-addressLine" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('bar.form.address') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="barangayInvalid('addressLine')">
                            <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke-linejoin="round"/>
                                <circle cx="12" cy="10" r="2.5"/>
                              </svg>
                            </div>
                            <input id="barangay-addressLine" type="text" name="addressLine" [(ngModel)]="barangayForm.addressLine"
                                   [placeholder]="t('bar.form.addressPh')" autocomplete="street-address"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (barangayForm.addressLine) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                          @if (barangayInvalid('addressLine')) {
                            <p class="mt-2 flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.bar.address') }}
                            </p>
                          }
                        </div>

                        <!-- Email -->
                        <div class="xl:col-span-2">
                          <label for="barangay-email" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('bar.form.email') }}
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden">
                            <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <rect x="3" y="5" width="18" height="14" rx="2"/>
                                <path d="m3 7 9 6 9-6" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </div>
                            <input id="barangay-email" type="email" name="email" [(ngModel)]="barangayForm.email"
                                   [placeholder]="t('bar.form.emailPh')" autocomplete="email" inputmode="email"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (barangayForm.email) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                        </div>

                        <!-- Emergency Contact Person -->
                        <div class="xl:col-span-2">
                          <label for="barangay-emergencyContactName" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('bar.form.emergencyName') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="barangayInvalid('emergencyContactName')">
                            <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <circle cx="12" cy="8" r="4"/>
                                <path d="M4 20c0-3.6 3.6-5 8-5s8 1.4 8 5" stroke-linecap="round"/>
                                <path d="M17 3l1.5 1.5L21 3M17 6.5l1.5 1.5L21 6.5" stroke-linecap="round"/>
                              </svg>
                            </div>
                            <input id="barangay-emergencyContactName" type="text" name="emergencyContactName" [(ngModel)]="barangayForm.emergencyContactName"
                                   [placeholder]="t('bar.form.emergencyNamePh')" autocomplete="name"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (barangayForm.emergencyContactName) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                          @if (barangayInvalid('emergencyContactName')) {
                            <p class="mt-2 flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.bar.emergencyName') }}
                            </p>
                          }
                        </div>

                        <!-- Emergency Contact Number -->
                        <div class="xl:col-span-2">
                          <label for="barangay-emergencyContactNumber" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('bar.form.emergencyNumber') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="barangayInvalid('emergencyContactNumber')">
                            <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>
                              </svg>
                            </div>
                            <input id="barangay-emergencyContactNumber" type="tel" name="emergencyContactNumber" [(ngModel)]="barangayForm.emergencyContactNumber"
                                   [placeholder]="t('bar.form.emergencyNumberPh')" autocomplete="tel" inputmode="tel"
                                   class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                            @if (barangayForm.emergencyContactNumber) {
                              <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                </svg>
                              </div>
                            }
                          </div>
                          @if (barangayInvalid('emergencyContactNumber')) {
                            <p class="mt-2 flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
                              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                              </svg>
                              {{ t('err.bar.emergencyNumber') }}
                            </p>
                          }
                        </div>

                      </div>

                      @if (formError()) {
                        <div class="mt-5 sm:mt-6 flex items-start gap-3 rounded-xl border-2 border-[#DC2626] bg-[#FEF2F2] px-4 py-3.5" role="alert">
                          <svg class="w-6 h-6 shrink-0 text-[#DC2626]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                          </svg>
                          <p class="text-[15px] sm:text-base font-semibold text-[#B91C1C]">{{ formError() }}</p>
                        </div>
                      }
                    </div>

                    <!-- Continue button (single primary action, centered) -->
                    <div class="flex items-center justify-center mt-5 sm:mt-6">
                      <button (click)="validateBarangayForm()"
                              class="flex items-center justify-center gap-2 min-h-[56px] min-w-[220px] sm:min-w-[240px] px-7 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-base sm:text-lg font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40">
                        {{ t('common.continue') }}
                        <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer: same as the kiosk landing page (includes the language selector) -->
              <div class="relative z-10 border-t border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-2 lg:gap-y-3 items-center">

                  <!-- Section 1: Language (same as landing) -->
                  <div class="flex flex-col items-center gap-1.5 text-center min-w-0">
                    <div class="flex items-center gap-1.5 text-[#0F172A]">
                      <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
                      </svg>
                      <span class="text-[13px] font-semibold">{{ t('landing.footer.language') }}</span>
                    </div>
                    <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-sm min-w-0">
                      <button
                        (click)="setLanguage('en')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'en'"
                        [class.text-white]="language() === 'en'"
                        [class.bg-white]="language() !== 'en'"
                        [class.text-[#0F172A]]="language() !== 'en'">
                        English
                      </button>
                      <button
                        (click)="setLanguage('fil')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] border-l border-[#E5E7EB] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'fil'"
                        [class.text-white]="language() === 'fil'"
                        [class.bg-white]="language() !== 'fil'"
                        [class.text-[#0F172A]]="language() !== 'fil'">
                        Filipino
                      </button>
                    </div>
                  </div>

                  <!-- Section 2: Need Assistance -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                      <path d="M12 17h.01" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                    </div>
                  </div>

                  <!-- Section 3: Office Hours -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 7v5l3 2" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                    </div>
                  </div>

                  <!-- Section 4: Date & Time -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="16" rx="2"/>
                      <path d="M8 3v4M16 3v4M3 10h18"/>
                    </svg>
                    <div class="min-w-0">
                      <p class="text-[11px] lg:text-[12px] font-medium text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                      <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- BAR STEP 2: Photo Capture (required) -->
          @if (barangayStep() === 'photo') {
            <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

              <!-- Background image (same as the kiosk landing page) -->
              <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
              <!-- Subtle radial glow keeps the form legible without washing the orange -->
              <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                   style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
              <!-- Curved orange header accent (top-left, same as landing) -->
              <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
                </svg>
              </div>

              <!-- Top navigation: back (left) + logo (center) -->
              <div class="relative z-10 flex items-center justify-center px-6 pt-[18px] pb-2">
                <div class="absolute left-4 sm:left-6 top-[26px] z-40 flex items-center gap-2.5 sm:gap-3">
                  <button (click)="goBack()"
                          class="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                          [attr.aria-label]="t('common.back')">
                    <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <button (click)="goBack()"
                          class="flex items-center min-h-[44px] rounded-xl px-1 text-[#0F172A] font-semibold text-[15px] sm:text-base hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                    {{ t('common.back') }}
                  </button>
                </div>

                <div class="w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-full bg-white border-2 border-[#F97316]/30 shadow-sm overflow-hidden flex items-center justify-center">
                  <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                </div>
              </div>

              <!-- Progress indicator -->
              <div class="relative z-10 flex items-center justify-center px-4 pb-1">
                <ol class="flex items-center gap-1.5 sm:gap-2.5" aria-label="Kiosk progress">
                  <!-- Step 1: completed -->
                  <li class="flex items-center gap-1.5 sm:gap-2.5">
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-[#F97316] border-2 border-[#F97316] shadow-sm" aria-hidden="true">
                      <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </span>
                    <span class="hidden lg:block text-[14px] font-bold text-[#0F172A] whitespace-nowrap">{{ t('progress.yourInfo') }}</span>
                  </li>
                  <!-- Step 2: active -->
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#F97316]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-white bg-[#F97316] border-2 border-[#F97316] shadow-sm">2</span>
                    <span class="hidden lg:block text-[14px] font-bold text-[#0F172A] whitespace-nowrap">{{ t('progress.capturePhoto') }}</span>
                  </li>
                  <!-- Step 3: upcoming -->
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">3</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.reviewDetails') }}</span>
                  </li>
                  <!-- Step 4: upcoming -->
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">4</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.confirmSubmit') }}</span>
                  </li>
                </ol>
              </div>

              <!-- Main content -->
              <div class="relative flex-1 overflow-y-auto">
                <div class="min-h-full flex flex-col items-center justify-center px-5 sm:px-8 py-5 sm:py-7">

                  <!-- Page header -->
                  <div class="text-center mb-4 sm:mb-5">
                    <h1 class="text-[clamp(1.5rem,2.2vw,2.125rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('bar.photo.title') }}</h1>
                    <p class="text-[clamp(0.925rem,1.1vw,1.075rem)] font-medium text-[#64748B] mt-1.5 sm:mt-2">{{ t('bar.photo.desc') }}</p>
                  </div>

                  <div class="w-full max-w-[1180px]">
                    <div class="grid grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)_240px] gap-4 sm:gap-5 items-stretch">

                      <!-- LEFT: Photo Guidelines -->
                      <aside aria-label="Photo Guidelines" class="order-2 xl:order-1 flex flex-col justify-center rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-6 py-5 sm:py-6">
                        <div class="flex items-center gap-3 mb-3">
                          <div class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                            <svg class="w-6 h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z"/>
                              <path stroke-linecap="round" d="M8.5 14.5c1.8 1.6 5.2 1.6 7 0"/>
                              <circle cx="9" cy="10.2" r=".5" fill="currentColor"/>
                              <circle cx="15" cy="10.2" r=".5" fill="currentColor"/>
                            </svg>
                          </div>
                          <h3 class="text-[clamp(1rem,1.4vw,1.1875rem)] font-bold text-[#0F172A] leading-tight">{{ t('bar.photo.guideTitle') }}</h3>
                        </div>
                        <ul class="space-y-3 sm:space-y-3.5">
                          <li class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                              <circle cx="12" cy="8" r="3.5"/>
                              <path d="M5 20c0-3.8 3.1-6 7-6s7 2.2 7 6" stroke-linecap="round"/>
                            </svg>
                            <span class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#334155] leading-snug">{{ t('bar.photo.guide1') }}</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                              <circle cx="12" cy="12" r="7"/>
                              <path d="M9 15.5h6" stroke-linecap="round"/>
                              <circle cx="9" cy="10" r=".5" fill="currentColor"/>
                              <circle cx="15" cy="10" r=".5" fill="currentColor"/>
                            </svg>
                            <span class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#334155] leading-snug">{{ t('bar.photo.guide2') }}</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M4 13c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke-linecap="round"/>
                              <path d="M2 14h4M18 14h4M5 16.5c0 1.8 3 2.6 7 2.6s7-.8 7-2.6" stroke-linecap="round"/>
                              <path d="M2 3l20 18" stroke-linecap="round"/>
                            </svg>
                            <span class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#334155] leading-snug">{{ t('bar.photo.guide3') }}</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            <span class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#334155] leading-snug">{{ t('bar.photo.guide4') }}</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                              <circle cx="12" cy="12" r="4"/>
                              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" stroke-linecap="round"/>
                            </svg>
                            <span class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#334155] leading-snug">{{ t('bar.photo.guide5') }}</span>
                          </li>
                        </ul>
                      </aside>

                      <!-- CENTER: Camera preview -->
                      <div class="order-1 xl:order-2 w-full max-w-[520px] mx-auto">
                        <div class="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] p-2 sm:p-2.5">

                          <!-- Camera viewport -->
                          <div class="relative aspect-[4/3] rounded-[14px] overflow-hidden bg-[#0F172A]">
                            @if (capturedPhoto()) {
                              <img [src]="capturedPhoto()" alt="Captured ID photo" class="absolute inset-0 w-full h-full object-cover" />
                            } @else if (errorMessage() && !cameraReady()) {
                              <!-- Camera unavailable warning (compact) -->
                              <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-[#0F172A]">
                                <svg class="w-9 h-9 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M2 2l20 20M8.5 4h7L17 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-1"/>
                                  <path stroke-linecap="round" d="M4 6h.5a2.5 2.5 0 0 0 2.5 2.5V9"/>
                                  <circle cx="12" cy="14" r="3"/>
                                </svg>
                                <p class="text-white text-base font-semibold">{{ t('bar.photo.unavailable') }}</p>
                                <p class="text-white/70 text-[13px] sm:text-sm max-w-xs">{{ t('bar.photo.unavailableDesc') }}</p>
                                <button (click)="retryPhotoCamera()"
                                        class="mt-1 flex items-center gap-2 min-h-[48px] px-6 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40">
                                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0 1 14-4M20 14a8 8 0 0 1-14 4"/>
                                  </svg>
                                  {{ t('bar.photo.tryAgain') }}
                                </button>
                              </div>
                            } @else {
                              <video #videoEl autoplay playsinline class="absolute inset-0 w-full h-full object-cover"></video>

                              <!-- Face-positioning guide (fades out when the camera is live) -->
                              <div class="absolute inset-0 pointer-events-none transition-opacity duration-300" [class.opacity-40]="cameraReady()">
                                <!-- Corner markers -->
                                <div class="absolute inset-[18%]" aria-hidden="true">
                                  <span class="absolute left-0 top-0 h-[2.5px] w-6 rounded bg-[#F97316]/90"></span>
                                  <span class="absolute left-0 top-0 h-6 w-[2.5px] rounded bg-[#F97316]/90"></span>
                                  <span class="absolute right-0 top-0 h-[2.5px] w-6 rounded bg-[#F97316]/90"></span>
                                  <span class="absolute right-0 top-0 h-6 w-[2.5px] rounded bg-[#F97316]/90"></span>
                                  <span class="absolute left-0 bottom-0 h-[2.5px] w-6 rounded bg-[#F97316]/90"></span>
                                  <span class="absolute left-0 bottom-0 h-6 w-[2.5px] rounded bg-[#F97316]/90"></span>
                                  <span class="absolute right-0 bottom-0 h-[2.5px] w-6 rounded bg-[#F97316]/90"></span>
                                  <span class="absolute right-0 bottom-0 h-6 w-[2.5px] rounded bg-[#F97316]/90"></span>
                                </div>
                                <!-- Head-and-shoulders silhouette -->
                                <svg class="absolute inset-0 m-auto w-36 max-w-[42%] text-white/40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 120 140" aria-hidden="true">
                                  <circle cx="60" cy="46" r="24"/>
                                  <path d="M28 126c2-26 16-40 32-40s30 14 32 40" stroke-linecap="round"/>
                                </svg>
                                <!-- Caption -->
                                <div class="absolute inset-x-0 bottom-3 flex justify-center px-4">
                                  <span class="rounded-full bg-black/50 backdrop-blur-sm px-4 py-1.5 text-white text-[13px] font-medium">{{ t('bar.photo.positionGuide') }}</span>
                                </div>
                              </div>

                              <!-- Camera status chip -->
                              <div class="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1.5">
                                <span class="h-2.5 w-2.5 rounded-full shrink-0"
                                      [class.bg-[#10B981]]="cameraReady()"
                                      [class.bg-[#FBBF24]]="!cameraReady()"></span>
                                @if (cameraReady()) {
                                  <span class="text-white text-[13px] font-semibold">{{ t('bar.photo.cameraReady') }}</span>
                                }
                              </div>
                            }
                          </div>

                          <!-- Actions -->
                          <div class="flex flex-col items-center justify-center gap-2.5 pt-3 sm:pt-3.5 pb-0.5">
                            @if (!capturedPhoto()) {
                              <button (click)="capturePhoto()" [disabled]="!cameraReady()"
                                      class="flex items-center justify-center gap-2.5 min-h-[56px] min-w-[300px] px-7 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-base sm:text-lg font-semibold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                                <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/>
                                  <circle cx="12" cy="13" r="3.5"/>
                                </svg>
                                {{ t('bar.photo.take') }}
                              </button>
                              @if (cameraReady()) {
                                <p class="text-[13px] sm:text-sm text-[#64748B]">{{ t('bar.photo.waiting') }}</p>
                              }
                            } @else {
                              <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <button (click)="confirmBarangayPhoto()"
                                        class="flex items-center justify-center gap-2.5 min-h-[56px] min-w-[200px] px-7 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-base sm:text-lg font-semibold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40">
                                  {{ t('bar.photo.use') }}
                                  <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                                  </svg>
                                </button>
                                <button (click)="retakePhoto()"
                                        class="flex items-center justify-center gap-2 min-h-[56px] min-w-[160px] px-6 rounded-xl bg-white border-2 border-[#F97316] text-[#F97316] hover:bg-[#FFF7ED] active:scale-[0.98] text-base sm:text-lg font-semibold transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30">
                                  <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0 1 14-4M20 14a8 8 0 0 1-14 4"/>
                                  </svg>
                                  {{ t('bar.photo.retake') }}
                                </button>
                              </div>
                            }
                          </div>
                        </div>
                      </div>

                      <!-- RIGHT: Tips -->
                      <aside aria-label="Photo Tips" class="order-3 flex flex-col justify-center rounded-[20px] border border-[#F97316]/20 bg-[#FFF7ED] px-5 sm:px-6 py-5 sm:py-6">
                        <div class="flex items-center gap-3 mb-3">
                          <div class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                            <svg class="w-6 h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3a5.5 5.5 0 0 1 3.4 9.8c-.6.5-1.1 1.2-1.3 2.2h-4.2c-.2-1-.7-1.7-1.3-2.2A5.5 5.5 0 0 1 12 3z"/>
                              <path stroke-linecap="round" d="M9.5 17.5h5M10.5 21h3"/>
                            </svg>
                          </div>
                          <h3 class="text-[clamp(1rem,1.4vw,1.1875rem)] font-bold text-[#0F172A] leading-tight">{{ t('bar.photo.tipsTitle') }}</h3>
                        </div>
                        <p class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#64748B] leading-relaxed">{{ t('bar.photo.tipsDesc') }}</p>
                      </aside>

                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer: same as the kiosk landing page (includes the language selector) -->
              <div class="relative z-10 border-t border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-2 lg:gap-y-3 items-center">

                  <!-- Section 1: Language (same as landing) -->
                  <div class="flex flex-col items-center gap-1.5 text-center min-w-0">
                    <div class="flex items-center gap-1.5 text-[#0F172A]">
                      <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
                      </svg>
                      <span class="text-[13px] font-semibold">{{ t('landing.footer.language') }}</span>
                    </div>
                    <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-sm min-w-0">
                      <button
                        (click)="setLanguage('en')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'en'"
                        [class.text-white]="language() === 'en'"
                        [class.bg-white]="language() !== 'en'"
                        [class.text-[#0F172A]]="language() !== 'en'">
                        English
                      </button>
                      <button
                        (click)="setLanguage('fil')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] border-l border-[#E5E7EB] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'fil'"
                        [class.text-white]="language() === 'fil'"
                        [class.bg-white]="language() !== 'fil'"
                        [class.text-[#0F172A]]="language() !== 'fil'">
                        Filipino
                      </button>
                    </div>
                  </div>

                  <!-- Section 2: Need Assistance -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                      <path d="M12 17h.01" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                    </div>
                  </div>

                  <!-- Section 3: Office Hours -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 7v5l3 2" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                    </div>
                  </div>

                  <!-- Section 4: Date & Time -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="16" rx="2"/>
                      <path d="M8 3v4M16 3v4M3 10h18"/>
                    </svg>
                    <div class="min-w-0">
                      <p class="text-[11px] lg:text-[12px] font-medium text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                      <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- BAR STEP 3: Signature Capture (required) -->
          @if (barangayStep() === 'signature') {
            <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

              <!-- Background image (same as the kiosk landing page) -->
              <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
              <!-- Subtle radial glow keeps the screen legible without washing the orange -->
              <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                   style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
              <!-- Curved orange header accent (top-left, same as landing) -->
              <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
                </svg>
              </div>

              <!-- Top navigation: back (left) + logo (center) -->
              <div class="relative z-10 flex items-center justify-center px-6 pt-[18px] pb-2">
                <div class="absolute left-4 sm:left-6 top-[26px] z-40 flex items-center gap-2.5 sm:gap-3">
                  <button (click)="goBack()"
                          class="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                          [attr.aria-label]="t('common.back')">
                    <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <button (click)="goBack()"
                          class="flex items-center min-h-[44px] rounded-xl px-1 text-[#0F172A] font-semibold text-[15px] sm:text-base hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                    {{ t('common.back') }}
                  </button>
                </div>

                <div class="w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-full bg-white border-2 border-[#F97316]/30 shadow-sm overflow-hidden flex items-center justify-center">
                  <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                </div>
              </div>

              <!-- Progress indicator -->
              <div class="relative z-10 flex items-center justify-center px-4 pb-1">
                <ol class="flex items-center gap-1.5 sm:gap-2.5" aria-label="Kiosk progress">
                  <!-- Step 1: completed -->
                  <li class="flex items-center gap-1.5 sm:gap-2.5">
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-[#F97316] border-2 border-[#F97316] shadow-sm" aria-hidden="true">
                      <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </span>
                    <span class="hidden lg:block text-[14px] font-bold text-[#0F172A] whitespace-nowrap">{{ t('progress.yourInfo') }}</span>
                  </li>
                  <!-- Step 2: completed -->
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#F97316]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-[#F97316] border-2 border-[#F97316] shadow-sm" aria-hidden="true">
                      <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </span>
                    <span class="hidden lg:block text-[14px] font-bold text-[#0F172A] whitespace-nowrap">{{ t('progress.capturePhoto') }}</span>
                  </li>
                  <!-- Step 3: active -->
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#F97316]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-white bg-[#F97316] border-2 border-[#F97316] shadow-sm">3</span>
                    <span class="hidden lg:block text-[14px] font-bold text-[#0F172A] whitespace-nowrap">{{ t('progress.captureSignature') }}</span>
                  </li>
                  <!-- Step 4: upcoming -->
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">4</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.reviewSubmit') }}</span>
                  </li>
                </ol>
              </div>

              <!-- Main content -->
              <div class="relative flex-1 overflow-y-auto">
                <div class="min-h-full flex flex-col items-center justify-center px-5 sm:px-8 py-5 sm:py-7">

                  <!-- Page header -->
                  <div class="text-center mb-4 sm:mb-5">
                    <h1 class="text-[clamp(1.5rem,2.2vw,2.125rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('bar.signature.title') }}</h1>
                    <p class="text-[clamp(0.925rem,1.1vw,1.075rem)] font-medium text-[#64748B] mt-1.5 sm:mt-2">{{ t('bar.signature.desc') }}</p>
                  </div>

                  <div class="w-full max-w-[1180px]">
                    <div class="grid grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)_240px] gap-4 sm:gap-5 items-stretch">

                      <!-- LEFT: Signature Guidelines -->
                      <aside aria-label="Signature Guidelines" class="order-2 xl:order-1 flex flex-col justify-center rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-6 py-5 sm:py-6">
                        <div class="flex items-center gap-3 mb-3">
                          <div class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                            <svg class="w-6 h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                            </svg>
                          </div>
                          <h3 class="text-[clamp(1rem,1.4vw,1.1875rem)] font-bold text-[#0F172A] leading-tight">{{ t('bar.signature.guideTitle') }}</h3>
                        </div>
                        <ul class="space-y-3 sm:space-y-3.5">
                          <li class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M4 9V4h14v14H9"/>
                            </svg>
                            <span class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#334155] leading-snug">{{ t('bar.signature.guide1') }}</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                            </svg>
                            <span class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#334155] leading-snug">{{ t('bar.signature.guide2') }}</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h12M4 17h9"/>
                            </svg>
                            <span class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#334155] leading-snug">{{ t('bar.signature.guide3') }}</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M7 20L12 4l5 16M10.2 14h3.6"/>
                            </svg>
                            <span class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#334155] leading-snug">{{ t('bar.signature.guide4') }}</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0 1 14-4M20 14a8 8 0 0 1-14 4"/>
                            </svg>
                            <span class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#334155] leading-snug">{{ t('bar.signature.guide5') }}</span>
                          </li>
                        </ul>
                      </aside>

                      <!-- CENTER: Signature pad -->
                      <div class="order-1 xl:order-2 w-full max-w-[720px] mx-auto">
                        <div class="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] p-4 sm:p-5">
                          <app-signature-pad (signature)="onSignatureCaptured($event)"
                                             [heightClass]="'sm:h-[340px] xl:h-[400px]'" />
                          @if (errorMessage()) {
                            <div class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert">
                              <p class="flex items-center justify-center gap-2 text-[15px] font-semibold text-[#DC2626]">
                                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                  <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 8v4M12 16h.01"/>
                                </svg>
                                {{ errorMessage() }}
                              </p>
                            </div>
                          }
                          <!-- Privacy / security indicator -->
                          <div class="flex items-center justify-end gap-1.5 mt-2.5">
                            <svg class="w-4 h-4 text-[#10B981]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3l7 3v6c0 4.5-2.8 7.6-7 9-4.2-1.4-7-4.5-7-9V6l7-3z"/>
                              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"/>
                            </svg>
                            <span class="text-[12px] text-[#64748B]">{{ t('bar.signature.secure') }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- RIGHT: Privacy & Security -->
                      <aside aria-label="Privacy and Security" class="order-3 flex flex-col justify-center rounded-[20px] border border-[#F97316]/20 bg-[#FFF7ED] px-5 sm:px-6 py-5 sm:py-6">
                        <div class="flex items-center gap-3 mb-3">
                          <div class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                            <svg class="w-6 h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3l7 3v6c0 4.5-2.8 7.6-7 9-4.2-1.4-7-4.5-7-9V6l7-3z"/>
                              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"/>
                            </svg>
                          </div>
                          <h3 class="text-[clamp(1rem,1.4vw,1.1875rem)] font-bold text-[#0F172A] leading-tight">{{ t('bar.signature.tipsTitle') }}</h3>
                        </div>
                        <p class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#64748B] leading-relaxed">{{ t('bar.signature.tipsDesc') }}</p>
                      </aside>

                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer: same as the kiosk landing page (includes the language selector) -->
              <div class="relative z-10 border-t border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-2 lg:gap-y-3 items-center">

                  <!-- Section 1: Language (same as landing) -->
                  <div class="flex flex-col items-center gap-1.5 text-center min-w-0">
                    <div class="flex items-center gap-1.5 text-[#0F172A]">
                      <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
                      </svg>
                      <span class="text-[13px] font-semibold">{{ t('landing.footer.language') }}</span>
                    </div>
                    <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-sm min-w-0">
                      <button
                        (click)="setLanguage('en')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'en'"
                        [class.text-white]="language() === 'en'"
                        [class.bg-white]="language() !== 'en'"
                        [class.text-[#0F172A]]="language() !== 'en'">
                        English
                      </button>
                      <button
                        (click)="setLanguage('fil')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] border-l border-[#E5E7EB] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'fil'"
                        [class.text-white]="language() === 'fil'"
                        [class.bg-white]="language() !== 'fil'"
                        [class.text-[#0F172A]]="language() !== 'fil'">
                        Filipino
                      </button>
                    </div>
                  </div>

                  <!-- Section 2: Need Assistance -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                      <path d="M12 17h.01" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                    </div>
                  </div>

                  <!-- Section 3: Office Hours -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 7v5l3 2" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                    </div>
                  </div>

                  <!-- Section 4: Date & Time -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="16" rx="2"/>
                      <path d="M8 3v4M16 3v4M3 10h18"/>
                    </svg>
                    <div class="min-w-0">
                      <p class="text-[11px] lg:text-[12px] font-medium text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                      <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- BAR STEP 4: Review & Submit -->
          @if (barangayStep() === 'review') {
            <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

              <!-- Background image (same as the kiosk landing page) -->
              <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
              <!-- Subtle radial glow keeps the form legible without washing the orange -->
              <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                   style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
              <!-- Curved orange header accent (top-left, same as landing) -->
              <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
                </svg>
              </div>

              <!-- Top navigation: back (left) + logo (center) -->
              <div class="relative z-10 flex items-center justify-center px-6 pt-[18px] pb-2">
                <div class="absolute left-4 sm:left-6 top-[26px] z-40 flex items-center gap-2.5 sm:gap-3">
                  <button (click)="goBack()"
                          class="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                          [attr.aria-label]="t('common.back')">
                    <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <button (click)="goBack()"
                          class="flex items-center min-h-[44px] rounded-xl px-1 text-[#0F172A] font-semibold text-[15px] sm:text-base hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                    {{ t('common.back') }}
                  </button>
                </div>

                <div class="w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-full bg-white border-2 border-[#F97316]/30 shadow-sm overflow-hidden flex items-center justify-center">
                  <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                </div>
              </div>

              <!-- Progress indicator -->
              <div class="relative z-10 flex items-center justify-center px-4 pb-1">
                <ol class="flex items-center gap-1.5 sm:gap-2.5" aria-label="Kiosk progress">
                  <!-- Step 1: completed -->
                  <li class="flex items-center gap-1.5 sm:gap-2.5">
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-[#F97316] border-2 border-[#F97316] shadow-sm" aria-hidden="true">
                      <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </span>
                    <span class="hidden lg:block text-[14px] font-bold text-[#0F172A] whitespace-nowrap">{{ t('progress.yourInfo') }}</span>
                  </li>
                  <!-- Step 2: completed -->
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#F97316]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-[#F97316] border-2 border-[#F97316] shadow-sm" aria-hidden="true">
                      <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </span>
                    <span class="hidden lg:block text-[14px] font-bold text-[#0F172A] whitespace-nowrap">{{ t('progress.capturePhoto') }}</span>
                  </li>
                  <!-- Step 3: active -->
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#F97316]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-white bg-[#F97316] border-2 border-[#F97316] shadow-sm">3</span>
                    <span class="hidden lg:block text-[14px] font-bold text-[#0F172A] whitespace-nowrap">{{ t('progress.reviewSubmit') }}</span>
                  </li>
                  <!-- Step 4: upcoming -->
                  <li class="flex items-center gap-1.5 sm:gap-2.5" aria-hidden="true">
                    <span class="w-6 sm:w-10 h-[3px] rounded-full bg-[#E5E7EB]"></span>
                    <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-[#94A3B8] bg-white border-2 border-[#CBD5E1]">4</span>
                    <span class="hidden lg:block text-[14px] font-medium text-[#64748B] whitespace-nowrap">{{ t('progress.confirmReceipt') }}</span>
                  </li>
                </ol>
              </div>

              <!-- Main content -->
              <div class="relative flex-1 overflow-y-auto">
                <div class="min-h-full flex flex-col items-center justify-center px-5 sm:px-8 py-5 sm:py-6">

                  <!-- Page header -->
                  <div class="text-center mb-4 sm:mb-5">
                    <h1 class="text-[clamp(1.5rem,2.2vw,2.125rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('bar.review.title') }}</h1>
                    <p class="text-[clamp(0.925rem,1.1vw,1.075rem)] font-medium text-[#64748B] mt-1.5 sm:mt-2">{{ t('bar.review.subtitle') }}</p>
                  </div>

                  <div class="w-full max-w-[1240px]">
                    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,340px)] gap-4 sm:gap-5 items-start">

                      <!-- LEFT: Personal information review card -->
                      <div class="w-full">
                        <section aria-label="Personal Information Review" class="rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-7 py-5 sm:py-6">

                          <!-- Profile header -->
                          <div class="flex items-center gap-4 sm:gap-5">
                            @if (capturedPhoto()) {
                              <img [src]="capturedPhoto()" alt="{{ t('bar.review.photoTitle') }}"
                                   class="shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full object-cover border-2 border-[#F97316]/40 shadow-sm" />
                            } @else {
                              <div class="shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-[#FFF7ED] border-2 border-[#F97316]/40 flex items-center justify-center text-[#F97316] text-2xl font-bold" aria-hidden="true">
                                {{ (barangayForm.firstName || '?').charAt(0) }}{{ (barangayForm.lastName || '?').charAt(0) }}
                              </div>
                            }
                            <div class="min-w-0">
                              <h2 class="text-[clamp(1.125rem,1.5vw,1.375rem)] font-bold text-[#0F172A] leading-tight break-words">{{ residentFullName() }}</h2>
                              @if (barangayForm.contactNumber) {
                                <p class="flex items-center gap-2 text-[15px] text-[#64748B] mt-1.5">
                                  <svg class="w-[18px] h-[18px] text-[#F97316] shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.92z"/>
                                  </svg>
                                  {{ barangayForm.contactNumber }}
                                </p>
                              }
                              @if (barangayForm.email) {
                                <p class="flex items-center gap-2 text-[15px] text-[#64748B] mt-1">
                                  <svg class="w-[18px] h-[18px] text-[#F97316] shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                                    <rect x="2" y="4" width="20" height="16" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M22 6l-10 7L2 6"/>
                                  </svg>
                                  <span class="break-all">{{ barangayForm.email }}</span>
                                </p>
                              }
                            </div>
                          </div>

                          <!-- Information completeness status -->
                          <div class="mt-4 sm:mt-5 flex items-start gap-3 rounded-[16px] border px-4 py-3.5"
                               [class.bg-[#F0FDF4]]="isBarangayReady()"
                               [class.border-[#BBF7D0]]="isBarangayReady()"
                               [class.bg-[#FEF3C7]]="!isBarangayReady()"
                               [class.border-[#FCD34D]]="!isBarangayReady()"
                               role="status">
                            @if (isBarangayReady()) {
                              <svg class="w-6 h-6 text-[#16A34A] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M8.5 12.5l2.5 2.5L16 9.5"/>
                              </svg>
                              <div>
                                <p class="text-[15px] sm:text-base font-bold text-[#15803D]">{{ t('bar.review.infoComplete') }}</p>
                                <p class="text-[13px] sm:text-sm text-[#3F6212] mt-0.5">{{ t('bar.review.infoCompleteDesc') }}</p>
                              </div>
                            } @else {
                              <svg class="w-6 h-6 text-[#F59E0B] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M10.3 3.2L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.2a2 2 0 0 0-3.4 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4M12 17h.01"/>
                              </svg>
                              <div>
                                <p class="text-[15px] sm:text-base font-bold text-[#92400E]">{{ t('bar.review.actionRequired') }}</p>
                                <p class="text-[13px] sm:text-sm text-[#92400E]/80 mt-0.5">{{ t('bar.review.actionRequiredDesc') }}</p>
                              </div>
                            }
                          </div>

                          <!-- Personal information -->
                          <div class="mt-2">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 border-t border-[#F1F5F9] py-3.5">
                              <div class="flex items-start gap-3 pr-2 min-w-0">
                                <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                                  <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                    <circle cx="12" cy="8" r="3.5"/><path stroke-linecap="round" d="M5 20c0-3.8 3.1-6 7-6s7 2.2 7 6"/>
                                  </svg>
                                </span>
                                <div class="min-w-0">
                                  <p class="text-[13px] sm:text-sm font-medium text-[#64748B]">{{ t('bar.review.fullName') }}</p>
                                  <p class="text-[15px] sm:text-base font-semibold text-[#0F172A] break-words mt-0.5">{{ residentFullName() || '—' }}</p>
                                </div>
                              </div>
                              <div class="flex items-start gap-3 sm:border-l sm:border-[#F1F5F9] sm:pl-6 mt-3.5 sm:mt-0 pr-2 min-w-0">
                                <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                                  <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                    <rect x="3" y="5" width="18" height="16" rx="2"/><path stroke-linecap="round" d="M8 3v4M16 3v4M3 10h18"/>
                                  </svg>
                                </span>
                                <div class="min-w-0">
                                  <p class="text-[13px] sm:text-sm font-medium text-[#64748B]">{{ t('bar.review.birthDate') }}</p>
                                  <p class="text-[15px] sm:text-base font-semibold text-[#0F172A] break-words mt-0.5">{{ barangayForm.birthDate || '—' }}</p>
                                </div>
                              </div>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 border-t border-[#F1F5F9] py-3.5">
                              <div class="flex items-start gap-3 pr-2 min-w-0">
                                <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                                  <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="4"/><path stroke-linecap="round" d="M12 2v6M12 16v6"/>
                                  </svg>
                                </span>
                                <div class="min-w-0">
                                  <p class="text-[13px] sm:text-sm font-medium text-[#64748B]">{{ t('bar.review.sex') }}</p>
                                  <p class="text-[15px] sm:text-base font-semibold text-[#0F172A] break-words mt-0.5">{{ barangayForm.gender || '—' }}</p>
                                </div>
                              </div>
                              <div class="flex items-start gap-3 sm:border-l sm:border-[#F1F5F9] sm:pl-6 mt-3.5 sm:mt-0 pr-2 min-w-0">
                                <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                                  <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" d="M17 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path stroke-linecap="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                                  </svg>
                                </span>
                                <div class="min-w-0">
                                  <p class="text-[13px] sm:text-sm font-medium text-[#64748B]">{{ t('bar.review.civilStatus') }}</p>
                                  <p class="text-[15px] sm:text-base font-semibold text-[#0F172A] break-words mt-0.5">{{ barangayForm.civilStatus || '—' }}</p>
                                </div>
                              </div>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 border-t border-[#F1F5F9] py-3.5">
                              <div class="flex items-start gap-3 pr-2 min-w-0">
                                <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                                  <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 2.7S6.5 8.6 6.5 13a5.5 5.5 0 0 0 11 0C17.5 8.6 12 2.7 12 2.7z"/>
                                  </svg>
                                </span>
                                <div class="min-w-0">
                                  <p class="text-[13px] sm:text-sm font-medium text-[#64748B]">{{ t('bar.review.bloodType') }}</p>
                                  <p class="text-[15px] sm:text-base font-semibold text-[#0F172A] break-words mt-0.5">{{ barangayForm.bloodType || t('bar.form.bloodUnknown') }}</p>
                                </div>
                              </div>
                              <div class="flex items-start gap-3 sm:border-l sm:border-[#F1F5F9] sm:pl-6 mt-3.5 sm:mt-0 pr-2 min-w-0">
                                <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                                  <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                    <rect x="2" y="7" width="20" height="14" rx="2"/><path stroke-linecap="round" d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                                  </svg>
                                </span>
                                <div class="min-w-0">
                                  <p class="text-[13px] sm:text-sm font-medium text-[#64748B]">{{ t('bar.review.occupation') }}</p>
                                  <p class="text-[15px] sm:text-base font-semibold text-[#0F172A] break-words mt-0.5">{{ barangayForm.occupation || '—' }}</p>
                                </div>
                              </div>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 border-t border-[#F1F5F9] py-3.5">
                              <div class="flex items-start gap-3 pr-2 min-w-0">
                                <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                                  <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.92z"/>
                                  </svg>
                                </span>
                                <div class="min-w-0">
                                  <p class="text-[13px] sm:text-sm font-medium text-[#64748B]">{{ t('bar.review.contact') }}</p>
                                  <p class="text-[15px] sm:text-base font-semibold text-[#0F172A] break-words mt-0.5">{{ barangayForm.contactNumber || '—' }}</p>
                                </div>
                              </div>
                              <div class="flex items-start gap-3 sm:border-l sm:border-[#F1F5F9] sm:pl-6 mt-3.5 sm:mt-0 pr-2 min-w-0">
                                <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                                  <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                    <rect x="2" y="4" width="20" height="16" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M22 6l-10 7L2 6"/>
                                  </svg>
                                </span>
                                <div class="min-w-0">
                                  <p class="text-[13px] sm:text-sm font-medium text-[#64748B]">{{ t('bar.review.email') }}</p>
                                  <p class="text-[15px] sm:text-base font-semibold text-[#0F172A] break-all mt-0.5">{{ barangayForm.email || '—' }}</p>
                                </div>
                              </div>
                            </div>

                            <!-- Address (full width) -->
                            <div class="border-t border-[#F1F5F9] py-3.5">
                              <div class="flex items-start gap-3 min-w-0">
                                <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                                  <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                                  </svg>
                                </span>
                                <div class="min-w-0">
                                  <p class="text-[13px] sm:text-sm font-medium text-[#64748B]">{{ t('bar.review.address') }}</p>
                                  <p class="text-[15px] sm:text-base font-semibold text-[#0F172A] break-words mt-0.5">{{ barangayForm.addressLine || '—' }}</p>
                                </div>
                              </div>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 border-t border-[#F1F5F9] py-3.5">
                              <div class="flex items-start gap-3 pr-2 min-w-0">
                                <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                                  <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path stroke-linecap="round" stroke-linejoin="round" d="M16 11l2 2 4-4"/>
                                  </svg>
                                </span>
                                <div class="min-w-0">
                                  <p class="text-[13px] sm:text-sm font-medium text-[#64748B]">{{ t('bar.review.emergencyPerson') }}</p>
                                  <p class="text-[15px] sm:text-base font-semibold text-[#0F172A] break-words mt-0.5">{{ barangayForm.emergencyContactName || '—' }}</p>
                                </div>
                              </div>
                              <div class="flex items-start gap-3 sm:border-l sm:border-[#F1F5F9] sm:pl-6 mt-3.5 sm:mt-0 pr-2 min-w-0">
                                <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                                  <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.92z"/>
                                    <path stroke-linecap="round" d="M14.05 2a9 9 0 0 1 8 7.94M14.05 6a5 5 0 0 1 4 3.9"/>
                                  </svg>
                                </span>
                                <div class="min-w-0">
                                  <p class="text-[13px] sm:text-sm font-medium text-[#64748B]">{{ t('bar.review.emergencyNumber') }}</p>
                                  <p class="text-[15px] sm:text-base font-semibold text-[#0F172A] break-words mt-0.5">{{ barangayForm.emergencyContactNumber || '—' }}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>
                      </div>

                      <!-- RIGHT: Photo & signature previews -->
                      <div class="w-full max-w-[420px] xl:max-w-none mx-auto flex flex-col gap-4 sm:gap-5">
                        <!-- Photo preview card -->
                        <section aria-label="Photo Preview" class="rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_2px_14px_rgba(15,23,42,0.07)] p-4 sm:p-5">
                          <div class="flex items-center gap-3 mb-4">
                            <div class="shrink-0 w-10 h-10 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                              <svg class="w-[22px] h-[22px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                              </svg>
                            </div>
                            <h3 class="text-base sm:text-lg font-bold text-[#0F172A]">{{ t('bar.review.photoTitle') }}</h3>
                          </div>
                          <div class="mx-auto w-full max-w-[220px]">
                            @if (capturedPhoto()) {
                              <img [src]="capturedPhoto()" [alt]="t('bar.review.photoTitle')"
                                   class="w-full aspect-[3/4] object-cover rounded-[14px] border border-[#E5E7EB] bg-[#F8FAFC]" />
                            } @else {
                              <div class="w-full aspect-[3/4] rounded-[14px] border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] flex flex-col items-center justify-center gap-2 text-[#94A3B8]">
                                <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
                                  <circle cx="12" cy="8" r="3.5"/><path stroke-linecap="round" d="M5 20c0-3.8 3.1-6 7-6s7 2.2 7 6"/>
                                </svg>
                                <span class="text-[13px] font-medium">{{ t('bar.review.photoNotProvided') }}</span>
                              </div>
                            }
                          </div>
                          <div class="mt-4 flex items-center justify-center gap-2">
                            @if (capturedPhoto()) {
                              <svg class="w-5 h-5 text-[#16A34A]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                              </svg>
                              <span class="text-[15px] font-semibold text-[#16A34A]">{{ t('bar.review.photoCaptured') }}</span>
                            } @else {
                              <svg class="w-5 h-5 text-[#94A3B8]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 8v4M12 16h.01"/>
                              </svg>
                              <span class="text-[15px] font-semibold text-[#64748B]">{{ t('bar.review.photoNotProvided') }}</span>
                            }
                          </div>
                        </section>

                        <!-- Signature preview card -->
                        <section aria-label="Signature Preview" class="rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_2px_14px_rgba(15,23,42,0.07)] p-4 sm:p-5">
                          <div class="flex items-center gap-3 mb-4">
                            <div class="shrink-0 w-10 h-10 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                              <svg class="w-[22px] h-[22px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                              </svg>
                            </div>
                            <h3 class="text-base sm:text-lg font-bold text-[#0F172A]">{{ t('bar.review.signature') }}</h3>
                          </div>
                          <div class="h-32 rounded-[14px] border border-[#E5E7EB] bg-white flex items-center justify-center overflow-hidden px-4">
                            @if (capturedSignature()) {
                              <img [src]="capturedSignature()" [alt]="t('bar.review.signature')"
                                   class="max-h-full max-w-full object-contain" />
                            } @else {
                              <span class="text-[#94A3B8] text-sm font-medium">{{ t('bar.review.sigNotProvided') }}</span>
                            }
                          </div>
                          <div class="mt-4 flex items-center justify-center gap-2">
                            @if (capturedSignature()) {
                              <svg class="w-5 h-5 text-[#16A34A]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                              </svg>
                              <span class="text-[15px] font-semibold text-[#16A34A]">{{ t('bar.review.sigCaptured') }}</span>
                            } @else {
                              <svg class="w-5 h-5 text-[#94A3B8]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 8v4M12 16h.01"/>
                              </svg>
                              <span class="text-[15px] font-semibold text-[#64748B]">{{ t('bar.review.sigNotProvided') }}</span>
                            }
                          </div>
                        </section>
                      </div>
                    </div>

                    <!-- Bottom actions -->
                    <div class="mt-5 sm:mt-6 flex flex-col items-center gap-4">
                      <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                        <button type="button" (click)="previewBarangayId()" [disabled]="previewing()"
                                class="inline-flex items-center justify-center gap-2.5 min-h-[64px] min-w-[220px] px-7 rounded-xl bg-white border-2 border-[#16A34A]/30 text-[#15803D] hover:bg-[#F0FDF4] active:scale-[0.98] text-base sm:text-lg font-semibold shadow-sm transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#16A34A]/20 disabled:opacity-60 disabled:cursor-not-allowed">
                          @if (previewing()) {
                            <svg class="w-6 h-6 animate-spin text-[#16A34A]" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"/>
                            </svg>
                          } @else {
                            <svg class="w-6 h-6 text-[#16A34A]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                          }
                          {{ t('bar.review.preview') }}
                        </button>
                        <button type="button" (click)="submitBarangay()" [disabled]="submitting()"
                                class="inline-flex items-center justify-center gap-2.5 min-h-[64px] w-[250px] sm:w-[280px] px-7 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-base sm:text-lg font-semibold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40 disabled:opacity-60 disabled:cursor-not-allowed">
                          {{ t('bar.review.submit') }}
                          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/>
                          </svg>
                        </button>
                      </div>

                      @if (errorMessage()) {
                        <div class="w-full max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert">
                          <p class="flex items-center justify-center gap-2 text-[15px] font-semibold text-[#DC2626]">
                            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                              <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 8v4M12 16h.01"/>
                            </svg>
                            {{ errorMessage() }}
                          </p>
                        </div>
                      }

                      <!-- Submission notice -->
                      <div class="w-full max-w-xl flex items-start justify-center gap-2.5 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 px-5 py-3">
                        <svg class="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                          <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 8h.01M12 12v4"/>
                        </svg>
                        <p class="text-[13px] sm:text-sm leading-snug text-[#7C2D12]">{{ t('bar.review.notice') }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer: same as the kiosk landing page (includes the language selector) -->
              <div class="relative z-10 border-t border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-2 lg:gap-y-3 items-center">

                  <!-- Section 1: Language (same as landing) -->
                  <div class="flex flex-col items-center gap-1.5 text-center min-w-0">
                    <div class="flex items-center gap-1.5 text-[#0F172A]">
                      <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
                      </svg>
                      <span class="text-[13px] font-semibold">{{ t('landing.footer.language') }}</span>
                    </div>
                    <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-sm min-w-0">
                      <button
                        (click)="setLanguage('en')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'en'"
                        [class.text-white]="language() === 'en'"
                        [class.bg-white]="language() !== 'en'"
                        [class.text-[#0F172A]]="language() !== 'en'">
                        English
                      </button>
                      <button
                        (click)="setLanguage('fil')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] border-l border-[#E5E7EB] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'fil'"
                        [class.text-white]="language() === 'fil'"
                        [class.bg-white]="language() !== 'fil'"
                        [class.text-[#0F172A]]="language() !== 'fil'">
                        Filipino
                      </button>
                    </div>
                  </div>

                  <!-- Section 2: Need Assistance -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                      <path d="M12 17h.01" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                    </div>
                  </div>

                  <!-- Section 3: Office Hours -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 7v5l3 2" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                    </div>
                  </div>

                  <!-- Section 4: Date & Time -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="16" rx="2"/>
                      <path d="M8 3v4M16 3v4M3 10h18"/>
                    </svg>
                    <div class="min-w-0">
                      <p class="text-[11px] lg:text-[12px] font-medium text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                      <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- BAR STEP 5: Success -->
          @if (barangayStep() === 'success') {
            <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

              <!-- Background image (same as the kiosk landing page) -->
              <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
              <!-- Subtle radial glow keeps the content legible without washing the orange -->
              <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                   style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>
              <!-- Curved orange header accent (top-left, same as landing) -->
              <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
                </svg>
              </div>

              <!-- Top: barangay logo (centered, no back button on this final screen) -->
              <div class="relative z-10 flex items-center justify-center px-6 pt-[14px] pb-1">
                <div class="w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-full bg-white border-2 border-[#F97316]/30 shadow-sm overflow-hidden flex items-center justify-center">
                  <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                </div>
              </div>

              <!-- Main content -->
              <div class="relative flex-1 overflow-y-auto">
                <div class="min-h-full flex flex-col items-center px-5 sm:px-8 py-4 sm:py-5">

                  <!-- Success indicator -->
                  <div class="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-full bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center shadow-sm" aria-hidden="true">
                    <div class="w-14 h-14 sm:w-[64px] sm:h-[64px] rounded-full bg-[#16A34A] flex items-center justify-center">
                      <svg class="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  </div>

                  <!-- Success message -->
                  <h1 class="text-[clamp(1.6rem,2.3vw,2.375rem)] font-bold tracking-tight text-[#0F172A] text-center leading-tight mt-4">{{ t('bar.success.title') }}</h1>
                  <p class="text-[clamp(0.925rem,1.05vw,1.075rem)] font-medium text-[#64748B] text-center mt-1.5 max-w-2xl mx-auto">{{ t('bar.success.subtitle') }}</p>

                  <!-- Application number card -->
                  <section aria-label="Application Number" class="w-full max-w-[860px] bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-8 py-5 sm:py-6 text-center mt-5">

                    <div class="flex items-center justify-center gap-2">
                      <svg class="w-5 h-5 sm:w-6 sm:h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6M9 16h6M9 8h2"/>
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                      </svg>
                      <span class="text-[13px] sm:text-sm font-bold tracking-[0.14em] text-[#0F172A] uppercase">{{ t('bar.success.appNumberLabel') }}</span>
                    </div>

                    <div class="mt-3 mx-auto max-w-[720px] rounded-[16px] border-2 border-[#F97316]/40 bg-[#FFF7ED] px-5 py-3.5 sm:px-6 sm:py-4">
                      <p class="text-[clamp(1.625rem,2.4vw,2.625rem)] font-bold tracking-wide text-[#0F172A] break-all leading-tight">{{ requestNumber() }}</p>
                    </div>

                    <p class="text-[15px] sm:text-base font-semibold text-[#0F172A] mt-4">{{ t('bar.success.keep') }}</p>
                    <p class="text-[13px] sm:text-sm text-[#64748B] mt-1 max-w-[560px] mx-auto leading-snug">{{ t('bar.success.keepDesc') }}</p>

                    <button type="button" (click)="copyApplicationNumber()"
                            class="mt-5 inline-flex items-center justify-center gap-2.5 min-h-[56px] sm:min-h-[64px] min-w-[220px] px-7 rounded-xl bg-white border-2 border-[#F97316] text-[#F97316] hover:bg-[#FFF7ED] active:scale-[0.98] text-base sm:text-lg font-semibold shadow-sm transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30">
                      @if (copied()) {
                        <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        {{ t('bar.success.copied') }}
                      } @else {
                        <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="9" y="9" width="12" height="12" rx="2"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 15V5a2 2 0 0 1 2-2h10"/>
                        </svg>
                        {{ t('bar.success.copy') }}
                      }
                    </button>
                  </section>

                  <!-- Required documents / requirements -->
                  <section aria-label="Required Documents" class="w-full max-w-[860px] bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-8 py-5 sm:py-6 text-left mt-5">

                    <h2 class="text-[clamp(1rem,1.35vw,1.3125rem)] font-bold text-[#0F172A] text-center tracking-tight uppercase">{{ t('bar.success.reqsTitle') }}</h2>
                    <p class="text-[clamp(0.875rem,1vw,0.975rem)] text-[#64748B] mt-2 text-center leading-snug max-w-[640px] mx-auto">{{ t('bar.success.reqsDesc') }}</p>

                    <ul class="mt-4 sm:mt-5 space-y-3.5">
                      <li class="flex items-start gap-3.5">
                        <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                          <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                          </svg>
                        </span>
                        <div class="flex-1 min-w-0">
                          <h3 class="text-[15px] sm:text-base font-bold text-[#0F172A] leading-snug">{{ t('bar.requirements.req1.title') }}</h3>
                          <p class="text-[13px] sm:text-sm text-[#64748B] mt-0.5 leading-snug">{{ t('bar.requirements.req1.desc') }}</p>
                        </div>
                      </li>
                      <li class="flex items-start gap-3.5">
                        <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                          <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H18.375c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
                          </svg>
                        </span>
                        <div class="flex-1 min-w-0">
                          <h3 class="text-[15px] sm:text-base font-bold text-[#0F172A] leading-snug">{{ t('bar.requirements.req2.title') }}</h3>
                          <p class="text-[13px] sm:text-sm text-[#64748B] mt-0.5 leading-snug">{{ t('bar.requirements.req2.desc') }}</p>
                        </div>
                      </li>
                      <li class="flex items-start gap-3.5">
                        <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                          <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <rect x="3" y="5" width="18" height="14" rx="2" stroke-linejoin="round"/>
                            <path stroke-linecap="round" stroke-linejoin="round" d="m3.5 7 8.5 6 8.5-6"/>
                          </svg>
                        </span>
                        <div class="flex-1 min-w-0">
                          <h3 class="text-[15px] sm:text-base font-bold text-[#0F172A] leading-snug">{{ t('bar.requirements.req3.title') }}</h3>
                          <p class="text-[13px] sm:text-sm text-[#64748B] mt-0.5 leading-snug">{{ t('bar.requirements.req3.desc') }}</p>
                        </div>
                      </li>
                    </ul>

                    <!-- Important warning -->
                    <div class="flex items-start gap-3 rounded-xl bg-[#FFF7ED] border border-[#F97316]/30 px-4 sm:px-5 py-3.5 mt-5">
                      <svg class="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10.3 3.2L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.2a2 2 0 0 0-3.4 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4M12 17h.01"/>
                      </svg>
                      <div class="flex-1 min-w-0">
                        <p class="text-[13px] sm:text-sm font-bold tracking-wide text-[#9A3412]">{{ t('bar.success.important') }}</p>
                        <p class="text-[13px] sm:text-[14px] text-[#7C2D12] mt-0.5 leading-snug">{{ t('bar.success.importantDesc') }}</p>
                      </div>
                    </div>
                  </section>

                  <!-- What happens next + processing time -->
                  <div class="w-full max-w-[860px] grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mt-5">
                    <div class="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 py-4 sm:py-5 flex items-start gap-3.5">
                      <span class="shrink-0 w-10 h-10 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                        <svg class="w-[22px] h-[22px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                          <path stroke-linecap="round" d="M17 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path stroke-linecap="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </span>
                      <div class="flex-1 min-w-0">
                        <h3 class="text-[15px] sm:text-base font-bold text-[#0F172A] leading-tight">{{ t('bar.success.nextTitle') }}</h3>
                        <p class="text-[13px] sm:text-sm text-[#64748B] mt-1 leading-snug">{{ t('bar.success.nextDesc1') }}</p>
                        <p class="text-[13px] sm:text-sm text-[#64748B] mt-0.5 leading-snug">{{ t('bar.success.nextDesc2') }}</p>
                      </div>
                    </div>
                    <div class="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 py-4 sm:py-5 flex items-start gap-3.5">
                      <span class="shrink-0 w-10 h-10 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                        <svg class="w-[22px] h-[22px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 7v5l3 2"/>
                        </svg>
                      </span>
                      <div class="flex-1 min-w-0">
                        <h3 class="text-[15px] sm:text-base font-bold text-[#0F172A] leading-tight">{{ t('bar.success.processingTitle') }}</h3>
                        <p class="text-[13px] sm:text-sm text-[#64748B] mt-1 leading-snug">{{ t('bar.success.processingDesc') }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Done + thank you -->
                  <div class="flex flex-col items-center gap-1.5 mt-5 mb-1">
                    <button type="button" (click)="finish()"
                            class="flex items-center justify-center gap-2.5 min-h-[64px] w-[280px] sm:w-[360px] px-7 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-lg sm:text-xl font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40">
                      <svg class="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      {{ t('common.done') }}
                    </button>
                    <p class="text-[13px] sm:text-sm text-[#64748B] text-center mt-1">{{ t('bar.success.thankYou') }}</p>
                  </div>
                </div>
              </div>

              <!-- Footer: same as the kiosk landing page (includes the language selector) -->
              <div class="relative z-10 border-t border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-1.5 lg:py-2 grid grid-cols-2 md:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-2 lg:gap-y-3 items-center">

                  <!-- Section 1: Language (same as landing) -->
                  <div class="flex flex-col items-center gap-1.5 text-center min-w-0">
                    <div class="flex items-center gap-1.5 text-[#0F172A]">
                      <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
                      </svg>
                      <span class="text-[13px] font-semibold">{{ t('landing.footer.language') }}</span>
                    </div>
                    <div class="inline-flex rounded-lg overflow-hidden border border-[#E5E7EB] bg-white shadow-sm min-w-0">
                      <button
                        (click)="setLanguage('en')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'en'"
                        [class.text-white]="language() === 'en'"
                        [class.bg-white]="language() !== 'en'"
                        [class.text-[#0F172A]]="language() !== 'en'">
                        English
                      </button>
                      <button
                        (click)="setLanguage('fil')"
                        class="px-3 sm:px-5 py-1.5 text-[13px] border-l border-[#E5E7EB] font-semibold transition-colors min-h-[34px]"
                        [class.bg-[#F97316]]="language() === 'fil'"
                        [class.text-white]="language() === 'fil'"
                        [class.bg-white]="language() !== 'fil'"
                        [class.text-[#0F172A]]="language() !== 'fil'">
                        Filipino
                      </button>
                    </div>
                  </div>

                  <!-- Section 2: Need Assistance -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                      <path d="M12 17h.01" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.assistance') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.assistanceDesc') }}</p>
                    </div>
                  </div>

                  <!-- Section 3: Office Hours -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/>
                      <path d="M12 7v5l3 2" stroke-linecap="round"/>
                    </svg>
                    <div>
                      <p class="text-[13px] lg:text-[14px] font-semibold text-[#0F172A]">{{ t('landing.footer.hours') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.monFri') }}</p>
                      <p class="text-[11px] lg:text-[12px] text-[#64748B]">{{ t('landing.footer.hoursRange') }}</p>
                    </div>
                  </div>

                  <!-- Section 4: Date & Time -->
                  <div class="flex flex-col items-center gap-1 text-center min-w-0">
                    <svg class="w-5 h-5 mb-0.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="16" rx="2"/>
                      <path d="M8 3v4M16 3v4M3 10h18"/>
                    </svg>
                    <div class="min-w-0">
                      <p class="text-[11px] lg:text-[12px] font-medium text-[#64748B] leading-snug">{{ formatFooterDate() }}</p>
                      <p class="text-base lg:text-lg font-bold text-[#F97316] leading-tight">{{ formatFooterTime() }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        }

        <app-barangay-preview-modal [open]="showPreview()" [title]="t('bar.preview.title')" [blob]="previewBlob()" (onClose)="closePreview()" />
        <app-document-preview-modal
          [open]="showDocPreview()"
          [title]="t('doc.review.previewTitle')"
          [blob]="docPreviewBlob()"
          [submitting]="submitting()"
          (onClose)="closeDocPreview()"
          (onEdit)="editInformation()"
          (onSubmit)="submitRequest()" />
      </div>
    </div>
  `
})
export class KioskComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('inlineVideoEl') inlineVideoEl!: ElementRef<HTMLVideoElement>;

  mode = signal<KioskMode>('home');

  // RFID flow
  rfidStep = signal<RfidStep>('scan');
  rfidError = signal('');
  rfidConnected = signal(false);
  rfidDetected = signal(false);

  // Documents flow steps
  currentStep = signal<DocStep>('welcome');

  // Barangay ID flow steps
  barangayStep = signal<BarangayStep>('requirements');

  resident = signal<Resident | null>(null);
  rfidCard = signal<RfidCardInfo | null>(null);
  residentHistory = signal<HistoryEntry[]>([]);
  historyLoading = signal(false);
  services = signal<Service[]>([]);
  selectedService = signal<Service | null>(null);
  barangayService = signal<Service | null>(null);
  capturedPhoto = signal<string | null>(null);
  capturedSignature = signal<string | null>(null);
  requestNumber = signal('');
  errorMessage = signal('');
  cameraReady = signal(false);
  formError = signal('');
  guestSubmitted = signal(false);
  barangaySubmitted = signal(false);
  submitting = signal(false);
  previewing = signal(false);
  showPreview = signal(false);
  previewBlob = signal<Blob | null>(null);
  showDocPreview = signal(false);
  docPreviewBlob = signal<Blob | null>(null);
  docPreviewRendering = signal(false);
  docPreviewError = signal('');
  copied = signal(false);
  searchResults = signal<any[]>([]);
  searching = signal(false);
  searchQuery = '';

  // Language and date/time for welcome screen
  language = signal<KioskLanguage>('en');
  currentDateTime = signal<Date>(new Date());

  t(key: string, params?: Record<string, string | number>): string {
    return this.translations.translate(key, params);
  }

  setLanguage(lang: KioskLanguage) {
    this.language.set(lang);
    this.translations.setLanguage(lang);
    this.saveState();
  }

  formatFooterDate(): string {
    return this.currentDateTime().toLocaleDateString(this.language() === 'fil' ? 'fil-PH' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatServiceFee(fee: number | string): string {
    const value = Number(fee);
    return isNaN(value) ? '0.00' : value.toFixed(2);
  }

  formatFooterTime(): string {
    return this.currentDateTime().toLocaleTimeString(this.language() === 'fil' ? 'fil-PH' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // Dynamic form state
  formValues = signal<Record<string, unknown>>({});
  formErrors = signal<Record<string, string>>({});

  // Maps each document-flow step to its 1-based position in the 6-step
  // progress indicator (Information → Service → Requirements → Application
  // Form → Review → Submit). The photo capture is part of the Application
  // Form milestone.
  private readonly docStepIndexMap: Record<string, number> = {
    welcome: 1,
    'guest-info': 1,
    services: 2,
    requirements: 3,
    form: 4,
    photo: 4,
    review: 5,
    success: 6
  };



  // Stable idempotency key for ONE submission attempt. Reused across retries so a
  // network error + retry never creates a duplicate request; cleared after success
  // or when the flow resets, so a fresh submission gets a new key.
  submissionKey = '';

  // Inline per-field capture state
  inlinePhotos = signal<Record<string, string>>({});
  activePhotoField = signal<string | null>(null);

  // Guest (temporary session) state
  guestForm = {
    fullName: '',
    birthDate: '',
    address: '',
    contactNumber: '',
    email: ''
  };

  barangayForm = {
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    birthDate: '',
    gender: '',
    civilStatus: '',
    occupation: '',
    bloodType: '',
    addressLine: '',
    contactNumber: '',
    email: '',
    emergencyContactName: '',
    emergencyContactNumber: ''
  };

  private stream: MediaStream | null = null;
  private idleTimer: any;
  private searchDebounce: any;
  private rfidScanSub: any = null;
  private rfidConnectionSub: any = null;
  private stateSaveDebounce: any = null;
  private copyTimer: any = null;

  constructor(
    private kioskService: KioskService,
    private rfidScanService: RfidScanService,
    private kioskStateService: KioskStateService,
    private translations: TranslationService,
    private cdr: ChangeDetectorRef
  ) {}

  private dateTimeTimer: any;

  ngOnInit() {
    this.restoreState();
    this.resetIdleTimer();
    this.rfidScanSub = this.rfidScanService.scans().subscribe(event => this.handleRfidScan(event.uid));
    this.rfidConnectionSub = this.rfidScanService.connection().subscribe(connected => {
      this.rfidConnected.set(connected);
    });
    // Preload the Barangay ID service requirements for the application flow
    this.loadBarangayService();
    // Start date/time clock for welcome screen
    this.dateTimeTimer = setInterval(() => this.currentDateTime.set(new Date()), 1000);
  }

  private restoreState(): void {
    const savedState = this.kioskStateService.load();
    if (!savedState) return;

    this.mode.set(savedState.mode);
    this.rfidStep.set(savedState.rfidStep);
    this.currentStep.set(savedState.currentStep);
    this.barangayStep.set(savedState.barangayStep);
    this.resident.set(savedState.resident);
    this.rfidCard.set(savedState.rfidCard ?? null);
    this.selectedService.set(savedState.selectedService);
    this.barangayService.set(savedState.barangayService);
    this.capturedPhoto.set(savedState.capturedPhoto);
    this.capturedSignature.set(savedState.capturedSignature);
    this.requestNumber.set(savedState.requestNumber);
    this.formValues.set(savedState.formValues);
    this.inlinePhotos.set(savedState.inlinePhotos);
    this.activePhotoField.set(savedState.activePhotoField);
    this.guestForm = savedState.guestForm;
    this.barangayForm = savedState.barangayForm;
    this.submissionKey = savedState.submissionKey;


    // Restore language preference and sync the TranslationService
    if (savedState.language) {
      this.language.set(savedState.language);
      this.translations.setLanguage(savedState.language);
    }

    // Reconnect RFID if we were in RFID mode
    if (savedState.mode === 'rfid' && savedState.rfidStep === 'scan') {
      this.rfidScanService.connect();
    }

    // Reload the resident's service history when restoring the profile screen
    // (history is always fetched fresh; it is never persisted).
    if (savedState.mode === 'documents' && savedState.currentStep === 'welcome' && savedState.resident) {
      setTimeout(() => this.loadResidentHistory(), 0);
    }

    // Restart camera if we were in a photo step
    if ((savedState.mode === 'documents' && savedState.currentStep === 'photo') ||
        (savedState.mode === 'barangay' && savedState.barangayStep === 'photo')) {
      setTimeout(() => this.startCamera(), 100);
    }
  }

  private saveState(): void {
    if (this.stateSaveDebounce) clearTimeout(this.stateSaveDebounce);
    this.stateSaveDebounce = setTimeout(() => {
      const state: KioskState = {
        mode: this.mode(),
        rfidStep: this.rfidStep(),
        currentStep: this.currentStep(),
        barangayStep: this.barangayStep(),
        resident: this.resident(),
        rfidCard: this.rfidCard(),
        selectedService: this.selectedService(),
        barangayService: this.barangayService(),
        capturedPhoto: this.capturedPhoto(),
        capturedSignature: this.capturedSignature(),
        requestNumber: this.requestNumber(),
        formValues: this.formValues(),
        inlinePhotos: this.inlinePhotos(),
        activePhotoField: this.activePhotoField(),
        guestForm: this.guestForm,
        barangayForm: this.barangayForm,
        submissionKey: this.submissionKey,

        language: this.language(),
        timestamp: Date.now()
      };
      this.kioskStateService.save(state);
    }, 100);
  }

  ngOnDestroy() {
    this.stopCamera();
    this.rfidScanService.disconnect();
    if (this.rfidScanSub) this.rfidScanSub.unsubscribe();
    if (this.rfidConnectionSub) this.rfidConnectionSub.unsubscribe();
    clearTimeout(this.idleTimer);
    clearTimeout(this.searchDebounce);
    clearTimeout(this.stateSaveDebounce);
    clearTimeout(this.copyTimer);
    clearInterval(this.dateTimeTimer);
  }

  loadServices() {
    this.kioskService.getServices().subscribe({
      next: (result: any) => {
        this.services.set(result?.data || []);
        this.barangayService.set((result?.data || []).find((s: Service) => s.service_name === 'Barangay ID') || null);
      }
    });
  }

  private loadBarangayService() {
    this.kioskService.getServices().subscribe({
      next: (result: any) => {
        this.barangayService.set((result?.data || []).find((s: Service) => s.service_name === 'Barangay ID') || null);
      }
    });
  }

  // ============================================================
  // MODE TRANSITIONS
  // ============================================================

  startRfid() {
    this.stopCamera();
    this.errorMessage.set('');
    this.rfidError.set('');
    this.mode.set('rfid');
    this.rfidStep.set('scan');
    this.rfidScanService.connect();
    this.resetIdleTimer();
    this.saveState();
  }

  retryRfid() {
    this.rfidError.set('');
    this.rfidStep.set('scan');
    this.rfidScanService.connect();
    this.resetIdleTimer();
    this.saveState();
  }

  continueWithout() {
    this.stopCamera();
    this.errorMessage.set('');
    this.rfidScanService.disconnect();
    this.mode.set('guest');
    this.resetIdleTimer();
    this.saveState();
  }

  startGuestRequest() {
    this.stopCamera();
    this.errorMessage.set('');
    this.formError.set('');
    this.guestForm = { fullName: '', birthDate: '', address: '', contactNumber: '', email: '' };
    this.resident.set(null);
    this.rfidCard.set(null);
    this.mode.set('documents');
    this.currentStep.set('guest-info');
    this.resetIdleTimer();
    this.saveState();
  }

  startBarangay() {
    this.stopCamera();
    this.errorMessage.set('');
    this.formError.set('');
    this.capturedPhoto.set(null);
    this.capturedSignature.set(null);
    this.resetBarangayForm();
    this.mode.set('barangay');
    this.barangayStep.set('requirements');
    this.resetIdleTimer();
    this.saveState();
  }

  private resetBarangayForm() {
    this.barangaySubmitted.set(false);
    this.barangayForm = {
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      birthDate: '',
      gender: '',
      civilStatus: '',
      occupation: '',
      bloodType: '',
      addressLine: '',
      contactNumber: '',
      email: '',
      emergencyContactName: '',
      emergencyContactNumber: ''
    };
  }

  // ============================================================
  // RFID FLOW
  // ============================================================

  private handleRfidScan(uid: string) {
    if (this.mode() !== 'rfid' || this.rfidStep() !== 'scan') return;
    this.rfidDetected.set(true);
    this.rfidScanService.disconnect();
    this.kioskService.verifyRfid(uid).subscribe({
      next: (result: any) => {
        const data = result?.data;
        if (data?.recognized && data.resident) {
          this.rfidStep.set('search');
          this.resident.set(data.resident);
          this.rfidCard.set(data?.rfid || null);
          this.mode.set('documents');
          this.currentStep.set('welcome');
          this.loadResidentHistory();
          this.resetIdleTimer();
          this.cdr.detectChanges();
          this.saveState();
        } else {
          this.rfidDetected.set(false);
          this.rfidError.set(this.t('err.rfid.notRecognized'));
          this.rfidStep.set('error');
          this.resetIdleTimer();
          this.saveState();
        }
      },
      error: () => {
        this.rfidDetected.set(false);
        this.rfidError.set(this.t('err.rfid.readFailed'));
        this.rfidStep.set('error');
        this.resetIdleTimer();
        this.saveState();
      }
    });
  }

  // ============================================================
  // DOCUMENTS FLOW: MANUAL RESIDENT SEARCH
  // ============================================================

  onSearchChange(query: string) {
    clearTimeout(this.searchDebounce);
    if (!query || query.trim().length < 2) {
      this.searchResults.set([]);
      return;
    }
    this.searchDebounce = setTimeout(() => {
      this.searching.set(true);
      this.kioskService.searchResidents(query).subscribe({
        next: (result: any) => {
          this.searchResults.set(result?.data || []);
          this.searching.set(false);
        },
        error: () => {
          this.searchResults.set([]);
          this.searching.set(false);
        }
      });
    }, 300);
  }

  selectResident(r: any) {
    this.errorMessage.set('');
    this.rfidStep.set('search');

    this.kioskService.getResident(r.resident_id).subscribe({
      next: (result: any) => {
        this.resident.set(result.data);
        this.rfidCard.set(null);
        this.mode.set('documents');
        this.currentStep.set('welcome');
        this.loadResidentHistory();
        this.resetIdleTimer();
        this.saveState();
      },
      error: () => {
        this.errorMessage.set(this.t('err.loadResident'));
      }
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults.set([]);
  }

  // Loads the authenticated resident's service/application history for the profile
  // screen. Falls back silently so profile rendering never blocks on history.
  private loadResidentHistory() {
    const res = this.resident();
    const id = res?.resident_id ?? this.rfidCard()?.resident_id;
    if (!id) {
      this.residentHistory.set([]);
      this.historyLoading.set(false);
      return;
    }
    this.historyLoading.set(true);
    this.kioskService.getResidentHistory(id).subscribe({
      next: (result: any) => {
        this.residentHistory.set(result?.data || []);
        this.historyLoading.set(false);
      },
      error: () => {
        this.residentHistory.set([]);
        this.historyLoading.set(false);
      }
    });
  }



  // ============================================================
  // DOCUMENTS FLOW: WORKFLOW STEPS
  // ============================================================

  proceedToServices() {
    this.loadServices();
    this.currentStep.set('services');
    this.resetIdleTimer();
    this.saveState();
  }



  selectService(service: Service) {
    this.selectedService.set(service);
    this.formValues.set({});
    this.formErrors.set({});
    this.inlinePhotos.set({});
    this.activePhotoField.set(null);
    this.currentStep.set('requirements');
    this.resetIdleTimer();
    this.saveState();
  }

  proceedToForm() {
    const defaults: Record<string, unknown> = {};
    for (const field of this.selectedService()?.form_fields || []) {
      if (field.defaultValue) defaults[field.key] = field.defaultValue;
    }
    this.formValues.set(defaults);

    const resident = this.resident();
    if (resident) {
      const nameParts = [resident.first_name, resident.middle_name, resident.last_name, resident.suffix].filter(Boolean);
      const source: Record<string, any> = {
        full_name: nameParts.join(' '),
        address: resident.address_line,
        address_line: resident.address_line,
        birth_date: this.formatDate(resident.birth_date),
        gender: resident.gender,
        civil_status: resident.civil_status,
        blood_type: resident.blood_type,
        contact_number: resident.contact_number,
        email: resident.email,
        emergency_contact_name: resident.emergency_contact_name,
        emergency_contact_number: resident.emergency_contact_number
      };
      const prefilled: Record<string, any> = {};
      for (const key of Object.keys(source)) {
        const value = source[key];
        if (value !== null && value !== undefined) prefilled[key] = value;
      }
      this.formValues.update(v => ({ ...v, ...prefilled }));
    }
    this.currentStep.set('form');
    this.resetIdleTimer();
    this.saveState();
  }

  private formatDate(value: string | null): string {
    return value ? value.slice(0, 10) : '';
  }

  // ---- Application Form page helpers (presentation only) ----

  // 1-based step position for the 6-step progress indicator.
  docProgressState(step: number): 'done' | 'current' | 'upcoming' {
    const current = this.docStepIndexMap[this.currentStep()] ?? 1;
    if (current > step) return 'done';
    if (current === step) return 'current';
    return 'upcoming';
  }

  // Block/Lot are rendered side by side in the landscape layout and stack on
  // narrow screens. All other fields span the full card width.
  fieldIsHalf(field: FormField): boolean {
    const key = (field.key || '').toLowerCase();
    return key === 'block' || key === 'lot';
  }

  // CSS layout classes for a field slot, matching the requested rows.
  formGridClass(field: FormField): string {
    return this.fieldIsHalf(field) ? 'w-full sm:w-[calc(50%-10px)]' : 'w-full';
  }

  // Friendly, localized labels for the Certificate of Indigency fields; other
  // fields fall back to the administrator-configured label.
  fieldLabel(field: FormField): string {
    const map: Record<string, string> = {
      purpose: 'doc.form.purpose',
      relative_name: 'doc.form.relativeName',
      block: 'doc.form.block',
      lot: 'doc.form.lot',
      subdivision: 'doc.form.subdivision'
    };
    return map[(field.key || '').toLowerCase()] ? this.t(map[(field.key || '').toLowerCase()]) : field.label;
  }

  fieldPlaceholder(field: FormField): string {
    const map: Record<string, string> = {
      purpose: 'doc.form.purposePh',
      relative_name: 'doc.form.relativeNamePh',
      block: 'doc.form.blockPh',
      lot: 'doc.form.lotPh',
      subdivision: 'doc.form.subdivisionPh'
    };
    return map[(field.key || '').toLowerCase()] ? this.t(map[(field.key || '').toLowerCase()]) : (field.placeholder || '');
  }

  rfidDisplayNumber(): string {
    return this.rfidCard()?.card_uid ?? '';
  }

  updateFormValue(key: string, value: any) {
    this.formValues.update(v => ({ ...v, [key]: value }));
    if (this.formErrors()[key]) {
      this.formErrors.update(e => { const n = { ...e }; delete n[key]; return n; });
    }
  }

  clearFieldValue(key: string) {
    this.updateFormValue(key, null);
  }

  private isEmptyValue(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  // ---- Checkbox group ----
  isCheckboxChecked(field: FormField, opt: string): boolean {
    const arr = this.formValues()[field.key];
    return Array.isArray(arr) && (arr as string[]).includes(opt);
  }

  toggleCheckboxOption(field: FormField, opt: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.formValues()[field.key];
    const arr = Array.isArray(current) ? [...(current as string[])] : [];
    if (checked && !arr.includes(opt)) arr.push(opt);
    if (!checked) {
      const idx = arr.indexOf(opt);
      if (idx > -1) arr.splice(idx, 1);
    }
    this.updateFormValue(field.key, arr);
  }

  // ---- Signature field ----
  onFieldSignature(key: string, dataUrl: string) {
    this.updateFormValue(key, dataUrl);
  }

  // ---- Photo field (inline capture) ----
  startInlineCamera(key: string) {
    this.activePhotoField.set(key);
    this.resetIdleTimer();
    setTimeout(() => this.startCamera(), 100);
  }

  captureInlinePhoto(key: string) {
    if (!this.inlineVideoEl?.nativeElement) return;
    const dataUrl = this.drawFrame(this.inlineVideoEl.nativeElement);
    this.inlinePhotos.update(p => ({ ...p, [key]: dataUrl }));
    this.updateFormValue(key, dataUrl);
    this.activePhotoField.set(null);
    this.stopCamera();
  }

  cancelInlinePhoto(key: string) {
    this.activePhotoField.set(null);
    this.stopCamera();
  }

  retakeInlinePhoto(key: string) {
    this.startInlineCamera(key);
  }

  // ---- File upload field ----
  onFileSelected(field: FormField, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const maxBytes = field.maxSize || 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.formErrors.update(e => ({
        ...e,
        [field.key]: `${field.label} must be under ${Math.round(maxBytes / (1024 * 1024))} MB.`
      }));
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.updateFormValue(field.key, reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // ---- Review display ----
  displayFormValue(field: FormField, value: unknown): string {
    if (this.isEmptyValue(value)) return '—';
    if (Array.isArray(value)) return (value as string[]).join(', ');
    if (typeof value === 'string' && value.startsWith('data:')) return 'Captured';
    return String(value);
  }



  validateForm() {
    const fields = this.selectedService()?.form_fields || [];
    let hasErrors = false;
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      const value = this.formValues()[field.key];
      const message = this.validateField(field, value);
      if (message) {
        newErrors[field.key] = message;
        hasErrors = true;
      }
    }
    this.formErrors.set(newErrors);
    if (hasErrors) return;
    this.clearDocPreview();
    const service = this.selectedService();

    if (service?.requires_photo) {
      this.currentStep.set('photo');
      this.resetIdleTimer();
      setTimeout(() => this.startCamera(), 100);
    } else {
      this.currentStep.set('review');
      this.resetIdleTimer();
    }
    this.saveState();
  }

  private validateField(field: FormField, value: unknown): string | null {
    const empty = this.isEmptyValue(value);
    if (empty) {
      if (field.required) return this.t('err.required', { field: field.label });
      return null;
    }

    const v = field.validation;
    if (!v) return null;

    if (typeof value === 'string' && !value.startsWith('data:')) {
      const str = value.trim();
      if (v.minLength && str.length < v.minLength) {
        return this.t('err.minLength', { field: field.label, min: v.minLength });
      }
      if (v.maxLength && str.length > v.maxLength) {
        return this.t('err.maxLength', { field: field.label, max: v.maxLength });
      }
      if (v.pattern && !new RegExp(v.pattern).test(str)) {
        return v.patternMessage || this.t('err.invalidFormat', { field: field.label });
      }
    }

    if (field.type === 'number' && typeof value === 'number') {
      if (v.min !== undefined && value < v.min) return this.t('err.minValue', { field: field.label, min: v.min });
      if (v.max !== undefined && value > v.max) return this.t('err.maxValue', { field: field.label, max: v.max });
    }

    return null;
  }

  // Guest temporary session form validation
  validateGuestForm() {
    this.guestSubmitted.set(true);
    this.formError.set('');
    const g = this.guestForm;
    if (!g.fullName.trim()) {
      return;
    }
    if (!g.birthDate) {
      return;
    }
    if (!g.address.trim()) {
      return;
    }
    if (!g.contactNumber.trim()) {
      return;
    }
    this.errorMessage.set('');
    this.loadServices();
    this.currentStep.set('services');
    this.resetIdleTimer();
    this.saveState();
  }

  guestInvalid(key: string): boolean {
    if (!this.guestSubmitted()) return false;
    const g = this.guestForm;
    switch (key) {
      case 'fullName':
        return !g.fullName.trim();
      case 'birthDate':
        return !g.birthDate;
      case 'address':
        return !g.address.trim();
      case 'contactNumber':
        return !g.contactNumber.trim();
      default:
        return false;
    }
  }

  barangayInvalid(key: string): boolean {
    if (!this.barangaySubmitted()) return false;
    const f = this.barangayForm;
    switch (key) {
      case 'firstName':
        return !f.firstName.trim();
      case 'lastName':
        return !f.lastName.trim();
      case 'birthDate':
        return !f.birthDate;
      case 'gender':
        return !f.gender;
      case 'civilStatus':
        return !f.civilStatus;
      case 'addressLine':
        return !f.addressLine.trim();
      case 'contactNumber':
        return !f.contactNumber.trim();
      case 'emergencyContactName':
        return !f.emergencyContactName.trim();
      case 'emergencyContactNumber':
        return !f.emergencyContactNumber.trim();
      default:
        return false;
    }
  }

  // ============================================================
  // BARANGAY ID FLOW
  // ============================================================

  proceedToBarangayForm() {
    this.barangayStep.set('form');
    this.resetIdleTimer();
    this.saveState();
  }

  validateBarangayForm() {
    this.barangaySubmitted.set(true);
    this.formError.set('');
    const f = this.barangayForm;
    if (!f.firstName.trim()) {
      this.formError.set(this.t('err.bar.firstName'));
      return;
    }
    if (!f.lastName.trim()) {
      this.formError.set(this.t('err.bar.lastName'));
      return;
    }
    if (!f.birthDate) {
      this.formError.set(this.t('err.bar.birthDate'));
      return;
    }
    if (!f.gender) {
      this.formError.set(this.t('err.bar.sex'));
      return;
    }
    if (!f.civilStatus) {
      this.formError.set(this.t('err.bar.civilStatus'));
      return;
    }
    if (!f.addressLine.trim()) {
      this.formError.set(this.t('err.bar.address'));
      return;
    }
    if (!f.contactNumber.trim()) {
      this.formError.set(this.t('err.bar.contact'));
      return;
    }
    if (!f.emergencyContactName.trim()) {
      this.formError.set(this.t('err.bar.emergencyName'));
      return;
    }
    if (!f.emergencyContactNumber.trim()) {
      this.formError.set(this.t('err.bar.emergencyNumber'));
      return;
    }
    this.errorMessage.set('');
    this.barangayStep.set('photo');
    this.resetIdleTimer();
    setTimeout(() => this.startCamera(), 100);
    this.saveState();
  }

  confirmBarangayPhoto() {
    this.barangayStep.set('signature');
    this.resetIdleTimer();
    this.saveState();
  }

  onSignatureCaptured(dataUrl: string) {
    this.capturedSignature.set(dataUrl);
    this.barangayStep.set('review');
    this.resetIdleTimer();
    this.saveState();
  }

  residentFullName(): string {
    const f = this.barangayForm;
    const name = [f.firstName, f.middleName, f.lastName].filter(part => part.trim()).join(' ').trim();
    return f.suffix && f.suffix.trim() ? `${name} ${f.suffix.trim()}` : name;
  }

  isBarangayReady(): boolean {
    const f = this.barangayForm;
    return !!(
      f.firstName.trim() &&
      f.lastName.trim() &&
      f.birthDate &&
      f.gender &&
      f.civilStatus &&
      f.addressLine.trim() &&
      f.contactNumber.trim() &&
      f.emergencyContactName.trim() &&
      f.emergencyContactNumber.trim() &&
      this.capturedPhoto() &&
      this.capturedSignature()
    );
  }

  submitBarangay() {
    if (this.submitting()) return; // re-entry guard: never double-submit
    if (!this.capturedPhoto()) {
      this.errorMessage.set(this.t('err.photoRequired'));
      this.barangayStep.set('photo');
      return;
    }
    if (!this.capturedSignature()) {
      this.errorMessage.set(this.t('err.signatureRequired'));
      this.barangayStep.set('signature');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const formData = {
      first_name: this.barangayForm.firstName.trim(),
      middle_name: this.barangayForm.middleName.trim() || null,
      last_name: this.barangayForm.lastName.trim(),
      suffix: this.barangayForm.suffix || null,
      birth_date: this.barangayForm.birthDate || null,
      gender: this.barangayForm.gender || null,
      civil_status: this.barangayForm.civilStatus || null,
      occupation: this.barangayForm.occupation.trim() || null,
      blood_type: this.barangayForm.bloodType || null,
      address_line: this.barangayForm.addressLine.trim(),
      contact_number: this.barangayForm.contactNumber.trim() || null,
      email: this.barangayForm.email.trim() || null,
      emergency_contact_name: this.barangayForm.emergencyContactName.trim(),
      emergency_contact_number: this.barangayForm.emergencyContactNumber.trim()
    };

    this.kioskService.createBarangayId({
      firstName: this.barangayForm.firstName.trim(),
      middleName: this.barangayForm.middleName.trim() || undefined,
      lastName: this.barangayForm.lastName.trim(),
      suffix: this.barangayForm.suffix || undefined,
      birthDate: this.barangayForm.birthDate || undefined,
      gender: this.barangayForm.gender || undefined,
      civilStatus: this.barangayForm.civilStatus || undefined,
      occupation: this.barangayForm.occupation.trim() || undefined,
      bloodType: this.barangayForm.bloodType || undefined,
      addressLine: this.barangayForm.addressLine.trim(),
      contactNumber: this.barangayForm.contactNumber.trim() || undefined,
      email: this.barangayForm.email.trim() || undefined,
      emergencyContactName: this.barangayForm.emergencyContactName.trim(),
      emergencyContactNumber: this.barangayForm.emergencyContactNumber.trim(),
      photo: this.capturedPhoto() || undefined,
      signature: this.capturedSignature() || undefined,
      form_data: formData
    }).subscribe({
      next: (result: any) => {
        this.requestNumber.set(result?.data?.application_number || 'N/A');
        this.barangayStep.set('success');
        this.submitting.set(false);
        this.saveState();
      },
      error: (err) => {
        this.submitting.set(false);
        const firstErr = err?.error?.errors?.[0];
        const msg = firstErr?.msg || err?.error?.message || 'Failed to submit application. Please try again.';
        this.errorMessage.set(msg);
        console.error('Barangay ID submit error:', err);
        this.saveState();
      }
    });
  }

  // Live preview: render the barangay's official ID card template with the kiosk's
  // in-progress form data (no application is created) and show it in the modal.
  previewBarangayId() {
    if (this.previewing()) return;
    this.previewing.set(true);
    this.previewBlob.set(null);

    this.kioskService.previewBarangayId({
      firstName: this.barangayForm.firstName.trim(),
      middleName: this.barangayForm.middleName.trim() || undefined,
      lastName: this.barangayForm.lastName.trim(),
      suffix: this.barangayForm.suffix || undefined,
      birthDate: this.barangayForm.birthDate || undefined,
      gender: this.barangayForm.gender || undefined,
      civilStatus: this.barangayForm.civilStatus || undefined,
      occupation: this.barangayForm.occupation.trim() || undefined,
      bloodType: this.barangayForm.bloodType || undefined,
      addressLine: this.barangayForm.addressLine.trim(),
      contactNumber: this.barangayForm.contactNumber.trim() || undefined,
      email: this.barangayForm.email.trim() || undefined,
      emergencyContactName: this.barangayForm.emergencyContactName.trim(),
      emergencyContactNumber: this.barangayForm.emergencyContactNumber.trim(),
      photo: this.capturedPhoto() || undefined,
      signature: this.capturedSignature() || undefined
    }).subscribe({
      next: (blob) => {
        this.previewing.set(false);
        this.previewBlob.set(blob);
        this.showPreview.set(true);
      },
      error: (err: any) => {
        this.previewing.set(false);
        const fallback = this.t('bar.preview.error');
        if (err?.error instanceof Blob) {
          err.error.text().then((text: string) => {
            let msg = fallback;
            try {
              const parsed = JSON.parse(text);
              const firstErr = parsed?.errors?.[0];
              msg = firstErr?.msg || parsed?.message || fallback;
            } catch { /* ignore non-JSON error bodies */ }
            this.errorMessage.set(msg);
          });
        } else {
          this.errorMessage.set(err?.error?.message || fallback);
        }
        console.error('Barangay ID preview error:', err);
      }
    });
  }

  closePreview() {
    this.showPreview.set(false);
    this.previewBlob.set(null);
  }

  // ============================================================
  // PRE-SUBMISSION DOCUMENT PREVIEW (document request flow)
  // ============================================================
  // Renders the service's actual document template (same template + placeholder
  // mappings the admin will generate later) with the resident's in-progress form
  // data. Buffer only — no request row, no status change, no file on disk. The
  // resident can preview, restart preview (updated data), or go back and edit.
  previewRequestDocument() {
    if (this.docPreviewRendering()) return;
    const service = this.selectedService();
    if (!service || !service.has_template) return;

    const resident = this.resident();
    const data: {
      service_id: number;
      form_data: Record<string, unknown>;
      resident_id?: number;
      guest?: GuestInfo;
    } = {
      service_id: service.service_id,
      form_data: this.formValues()
    };
    if (resident) {
      data.resident_id = resident.resident_id;
    } else {
      data.guest = {
        full_name: this.guestForm.fullName.trim(),
        birth_date: this.guestForm.birthDate || undefined,
        address: this.guestForm.address.trim(),
        contact_number: this.guestForm.contactNumber.trim(),
        email: this.guestForm.email.trim() || undefined
      };
    }

    this.docPreviewRendering.set(true);
    this.docPreviewError.set('');
    this.cdr.detectChanges();

    this.kioskService.previewRequest(data).subscribe({
      next: (blob) => {
        this.docPreviewBlob.set(blob);
        this.docPreviewRendering.set(false);
        this.showDocPreview.set(true);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.docPreviewRendering.set(false);
        const fallback = this.t('doc.review.previewFailed');
        if (err?.error instanceof Blob) {
          err.error.text().then((text: string) => {
            let msg = fallback;
            try {
              const parsed = JSON.parse(text);
              const firstErr = parsed?.errors?.[0];
              msg = firstErr?.msg || parsed?.message || fallback;
            } catch { /* ignore non-JSON error bodies */ }
            this.docPreviewError.set(msg);
          });
        } else {
          this.docPreviewError.set(err?.error?.message || err?.message || fallback);
        }
        console.error('Document request preview error:', err);
      }
    });
  }

  // Open the document preview modal. The blob is fetched on demand and rendered
  // by the modal component (docx-preview), matching the admin panel's preview UX.
  openDocPreview() {
    if (this.docPreviewBlob()) {
      this.showDocPreview.set(true);
      return;
    }
    this.previewRequestDocument();
  }

  // Close the document preview modal. The blob is kept so the resident can
  // reopen the same preview without re-fetching until they edit information.
  closeDocPreview() {
    this.showDocPreview.set(false);
  }

  // Clear the preview. Called whenever the resident edits information (so the
  // next preview is regenerated from the updated form) and whenever the review
  // step is re-entered with a fresh form.
  private clearDocPreview() {
    this.docPreviewBlob.set(null);
    this.docPreviewRendering.set(false);
    this.docPreviewError.set('');
    this.showDocPreview.set(false);
  }

  // Edit Information: the application form is the single source of truth. All
  // edits happen there; the preview is always regenerated from the form values.
  editInformation() {
    this.clearDocPreview();
    this.currentStep.set('form');
    this.saveState();
  }

  // ============================================================
  // CAMERA
  // ============================================================

  startCamera(target?: HTMLVideoElement) {
    if (this.stream) return;
    this.cameraReady.set(false);
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      .then(stream => {
        this.stream = stream;
        const el = target || this.videoEl?.nativeElement;
        if (el) el.srcObject = stream;
        this.errorMessage.set('');
        this.cameraReady.set(true);
      })
      .catch((err) => {
        console.error('Camera error:', err);
        this.errorMessage.set(this.t('err.cameraDenied'));
        this.cameraReady.set(false);
      });
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.cameraReady.set(false);
  }

  retryPhotoCamera() {
    this.errorMessage.set('');
    this.cameraReady.set(false);
    setTimeout(() => this.startCamera(), 100);
  }

  private drawFrame(el: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    canvas.getContext('2d')?.drawImage(el, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  capturePhoto() {
    if (!this.videoEl?.nativeElement) return;
    this.capturedPhoto.set(this.drawFrame(this.videoEl.nativeElement));
    this.stopCamera();
    this.saveState();
  }

  skipPhoto() {
    this.stopCamera();
    this.capturedPhoto.set(null);
    this.clearDocPreview();
    this.currentStep.set('review');
    this.resetIdleTimer();
    this.saveState();
  }

  confirmPhoto() {
    this.clearDocPreview();
    this.currentStep.set('review');
    this.resetIdleTimer();
    this.saveState();
  }

  retakePhoto() {
    this.capturedPhoto.set(null);
    setTimeout(() => this.startCamera(), 100);
    this.saveState();
  }

  // ============================================================
  // DISPLAY HELPERS (resident or guest)
  // ============================================================

  isGuestSession(): boolean {
    return this.mode() === 'documents' && this.currentStep() !== 'welcome' && !this.resident();
  }

  displayName(): string {
    if (this.resident()) return `${this.resident()!.first_name} ${this.resident()!.last_name}`;
    return this.guestForm.fullName || this.t('placeholder.guest');
  }

  displayAddress(): string {
    if (this.resident()) return this.resident()!.address_line || '';
    return this.guestForm.address || '';
  }

  displayCode(): string {
    if (this.resident()) return this.resident()!.resident_code || '';
    return 'Temporary Session';
  }

  displayPhoto(): string | null {
    if (this.capturedPhoto()) return this.capturedPhoto();
    return this.resident()?.photo || null;
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  goBack() {
    if (this.mode() === 'rfid') {
      if (this.rfidStep() === 'search') {
        this.rfidStep.set('scan');
        this.saveState();
        return;
      }
      if (this.rfidStep() === 'error') {
        this.rfidStep.set('scan');
        this.saveState();
        return;
      }
      // From scan back to Home
      this.rfidScanService.disconnect();
      this.mode.set('home');
      this.saveState();
      return;
    }

    if (this.mode() === 'guest') {
      this.mode.set('home');
      this.saveState();
      return;
    }

    if (this.mode() === 'documents') {
      const step = this.currentStep();
      if (step === 'welcome') {
        this.resident.set(null);
        this.rfidCard.set(null);
        this.residentHistory.set([]);
        this.mode.set('rfid');
        this.rfidStep.set('scan');
        this.rfidScanService.connect();
        this.saveState();
        return;
      }
      if (step === 'guest-info') {
        this.mode.set('guest');
        this.saveState();
        return;
      }
      if (step === 'review') {
        if (this.selectedService()?.requires_photo) {
          this.currentStep.set('photo');
          setTimeout(() => this.startCamera(), 100);
        } else {
          this.currentStep.set('form');
        }
        this.saveState();
        return;
      }
      if (step === 'form') {
        this.stopCamera();
        this.currentStep.set('requirements');
        this.saveState();
        return;
      }
      if (step === 'requirements') {
        this.currentStep.set('services');
        this.saveState();
        return;
      }
      // 'services' is reachable from either entry path. Back must return to the
      // screen the resident actually came from: the profile/welcome screen for
      // RFID/manual-search residents, or the guest info form for temporary sessions.
      if (step === 'services') {
        if (this.resident()) {
          this.currentStep.set('welcome');
        } else {
          this.currentStep.set('guest-info');
        }
        this.saveState();
        return;
      }
      const steps: DocStep[] = ['welcome', 'guest-info', 'services', 'requirements', 'form', 'photo', 'review', 'success'];
      const idx = steps.indexOf(step);
      if (idx > 0) {
        if (step === 'photo') this.stopCamera();
        this.currentStep.set(steps[idx - 1]);
        this.saveState();
      }
      return;
    }

    if (this.mode() === 'barangay') {
      const step = this.barangayStep();
      if (step === 'requirements') {
        this.mode.set('guest');
        this.saveState();
        return;
      }
      if (step === 'review') {
        this.barangayStep.set('signature');
        this.saveState();
        return;
      }
      if (step === 'signature') {
        this.barangayStep.set('photo');
        this.capturedPhoto.set(null);
        setTimeout(() => this.startCamera(), 100);
        this.saveState();
        return;
      }
      const bSteps: BarangayStep[] = ['requirements', 'form', 'photo', 'signature', 'review', 'success'];
      const idx = bSteps.indexOf(step);
      if (idx > 0) {
        this.barangayStep.set(bSteps[idx - 1]);
        this.saveState();
      }
    }
  }

  submitRequest() {
    if (this.submitting()) return; // re-entry guard: never double-submit
    const service = this.selectedService();
    if (!service) {
      this.errorMessage.set(this.t('err.missingService'));
      return;
    }

    this.showDocPreview.set(false);
    this.submitting.set(true);
    this.errorMessage.set('');
    if (!this.submissionKey) this.submissionKey = this.newIdempotencyKey();



    const resident = this.resident();
    const data: any = {
      service_id: service.service_id,
      photo: this.capturedPhoto() || undefined,
      form_data: this.formValues(),
      idempotency_key: this.submissionKey
    };

    if (resident) {
      data.resident_id = resident.resident_id;
    } else {
      data.guest = {
        full_name: this.guestForm.fullName.trim(),
        birth_date: this.guestForm.birthDate || undefined,
        address: this.guestForm.address.trim(),
        contact_number: this.guestForm.contactNumber.trim(),
        email: this.guestForm.email.trim() || undefined
      };
    }

    this.kioskService.createRequest(data).subscribe({
      next: (result: any) => {
        // Same key means only one request row exists (server is idempotent).
        this.requestNumber.set(result?.data?.request_number || 'N/A');
        this.currentStep.set('success');
        this.submitting.set(false);
        this.submissionKey = ''; // done: next request is a fresh submission
        this.saveState();
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err?.error?.message || 'Failed to submit request. Please try again.';
        this.errorMessage.set(msg);
        console.error('Submit request error:', err);
        this.saveState();
      }
    });
  }

  private newIdempotencyKey(): string {
    const c = (globalThis as any).crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
    return 'k-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  copyApplicationNumber() {
    const num = this.requestNumber();
    if (!num || num === 'N/A') return;
    const done = () => {
      this.copied.set(true);
      clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => this.copied.set(false), 2000);
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

  private copyFallback(text: string) {
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

  finish() {
    this.kioskService.reset();
    this.stopCamera();
    this.rfidScanService.disconnect();
    this.mode.set('home');
    this.currentStep.set('welcome');
    this.barangayStep.set('requirements');
    this.rfidStep.set('scan');
    this.resident.set(null);
    this.rfidCard.set(null);
    this.residentHistory.set([]);
    this.historyLoading.set(false);
    this.selectedService.set(null);
    this.capturedPhoto.set(null);
    this.capturedSignature.set(null);
    this.requestNumber.set('');
    this.errorMessage.set('');
    this.formError.set('');
    this.searchQuery = '';
    this.searchResults.set([]);
    this.resetBarangayForm();
    this.guestForm = { fullName: '', birthDate: '', address: '', contactNumber: '', email: '' };
    this.formValues.set({});
    this.formErrors.set({});
    this.inlinePhotos.set({});
    this.activePhotoField.set(null);
    this.submissionKey = '';
    this.kioskStateService.clear();
    this.resetIdleTimer();
  }

  cancel() {
    this.stopCamera();
    this.finish();
  }

  resetIdleTimer() {
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.cancel(), 120000);
  }
}
