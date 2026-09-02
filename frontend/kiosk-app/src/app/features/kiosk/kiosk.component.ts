import { Component, OnInit, OnDestroy, signal, computed, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KioskService, Resident, Service, GuestInfo, FormField, RfidCardInfo } from './kiosk.service';
import { RfidScanService } from './rfid-scan.service';
import { KioskStateService, KioskState } from './kiosk-state.service';
import { ButtonComponent } from './button.component';
import { SignaturePadComponent } from './signature-pad.component';
import { BarangayPreviewModalComponent } from './barangay-preview-modal.component';
import { DocumentPreviewModalComponent } from './document-preview-modal.component';
import { ResidentProfileComponent } from './resident-profile.component';
import { TranslationService, KioskLanguage } from '../../i18n/translation.service';
import { environment } from '../../../environments/environment';

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

          <!-- RFID STEP: error / not recognized (Barangay ID Not Found) -->
          @if (rfidStep() === 'error') {
            <div class="absolute inset-0 bg-[#F8FAFC] text-[#0F172A] select-none overflow-hidden [font-family:'Inter',sans-serif] flex flex-col">

              <!-- Background image (same as Welcome page) -->
              <div class="absolute inset-0 bg-cover bg-center pointer-events-none" style="background-image: url('Background.png')" aria-hidden="true"></div>
              <!-- Subtle radial glow -->
              <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
                   style="background: radial-gradient(ellipse 72% 58% at 50% 42%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.05) 100%);"></div>

              <!-- Curved orange header accent (top-left) -->
              <div class="absolute top-0 left-0 w-64 h-40 pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 256 160" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0 H256 V80 C256 124 220 160 176 160 H0 Z" fill="#F97316" opacity="0.12"/>
                </svg>
              </div>

              <!-- Main scrollable content area -->
              <div class="relative flex-1 overflow-y-auto flex flex-col justify-between">
                <div class="min-h-full flex flex-col items-center justify-center px-4 sm:px-8 py-4 sm:py-6">

                  <!-- Header: Seal, WELCOME, Barangay San Manuel, Document Request Kiosk -->
                  <div class="text-center mb-5 sm:mb-7">
                    <div class="mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                      <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-2 border-[#F97316]/40 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                        <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                      </div>
                    </div>
                    <p class="text-[11px] sm:text-[13px] font-semibold tracking-[0.35em] text-[#F97316] mb-1.5 uppercase">{{ t('landing.welcome') }}</p>
                    <h1 class="text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('landing.barangayName') }}</h1>
                    <p class="text-[clamp(0.95rem,1.6vw,1.2rem)] font-medium text-[#64748B] mt-1">{{ t('landing.subtitle') }}</p>
                  </div>

                  <!-- Main Error Card -->
                  <div class="w-full max-w-2xl bg-white/95 border border-[#E2E8F0] rounded-[24px] sm:rounded-[28px] shadow-[0_8px_30px_rgba(15,23,42,0.06)] px-6 sm:px-10 py-7 sm:py-9 text-center backdrop-blur-sm">

                    <!-- Orange Warning Icon -->
                    <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FFF7ED] flex items-center justify-center mx-auto mb-4 sm:mb-5">
                      <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#F97316] flex items-center justify-center text-white shadow-sm">
                        <svg class="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        </svg>
                      </div>
                    </div>

                    <!-- Title -->
                    <h2 class="text-[clamp(1.5rem,2.8vw,2rem)] font-bold text-[#0F172A] tracking-tight leading-snug">
                      {{ t('rfid.error.title') }}
                    </h2>

                    <!-- Orange divider accent -->
                    <div class="w-12 h-1 bg-[#F97316] rounded-full mx-auto my-3 sm:my-3.5"></div>

                    <!-- Message text -->
                    <p class="text-[clamp(0.95rem,1.4vw,1.1rem)] text-[#64748B] max-w-lg mx-auto leading-relaxed mb-6 sm:mb-8 font-normal">
                      {{ t('rfid.error.desc') }}
                    </p>

                    <!-- Two Action Buttons side-by-side -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full">
                      <!-- Scan Again: solid orange -->
                      <button (click)="retryRfid()"
                              class="flex items-center justify-center gap-3 min-h-[58px] sm:min-h-[64px] px-6 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-base sm:text-lg font-bold shadow-[0_4px_14px_rgba(249,115,22,0.3)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30">
                        <!-- Scan / viewfinder icon -->
                        <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.5A.75.75 0 014.5 3.75h3a.75.75 0 010 1.5H5.25v2.25a.75.75 0 01-1.5 0v-3zM16.5 3.75a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0V5.25H13.5a.75.75 0 010-1.5h3zM3.75 16.5a.75.75 0 011.5 0v2.25h2.25a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75v-3zM20.25 16.5a.75.75 0 010 1.5v3a.75.75 0 01-.75.75h-3a.75.75 0 010-1.5h2.25V16.5a.75.75 0 01.75-.75zM7.5 12h9"/>
                        </svg>
                        <span>{{ t('common.scanAgain') }}</span>
                      </button>

                      <!-- Continue Without Barangay ID: white with orange border -->
                      <button (click)="continueWithout()"
                              class="flex items-center justify-center gap-3 min-h-[58px] sm:min-h-[64px] px-6 rounded-2xl bg-white border-2 border-[#F97316] hover:bg-[#FFF7ED] active:scale-[0.98] text-[#0F172A] text-base sm:text-lg font-bold shadow-sm transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/20">
                        <!-- Person outline icon -->
                        <svg class="w-6 h-6 shrink-0 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                        </svg>
                        <span class="text-left leading-tight">{{ t('rfid.continueWithout') }}</span>
                      </button>
                    </div>

                  </div>
                </div>

                <!-- Footer: Same bottom information bar as Welcome page -->
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
               [language]="language()"
               (onBack)="goBack()"
               (onContinue)="proceedToServices()"
               (onUpdateResident)="onResidentUpdated($event)"
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

                  <div class="w-full max-w-[840px]">

                    <!-- Page header -->
                    <div class="text-center mb-5 sm:mb-7">
                      <h1 class="text-[clamp(1.375rem,2.2vw,2rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('doc.guestInfo.title') }}</h1>
                      <p class="text-[clamp(0.925rem,1.1vw,1.075rem)] font-medium text-[#64748B] mt-1.5 sm:mt-2">{{ t('doc.guestInfo.desc') }}</p>
                    </div>

                    <!-- Form card -->
                    <div class="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-8 py-5 sm:py-7">
                      
                      <!-- Personal Information Section (2 columns on tablet/desktop) -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        
                        <!-- First Name -->
                        <div>
                          <label for="guest-firstName" class="block text-[14px] sm:text-[15px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.firstName') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="guestInvalid('firstName')">
                            <input id="guest-firstName" type="text" name="firstName"
                                   [value]="guestForm.firstName || ''"
                                   (keydown)="filterNameKeyDown($event)"
                                   (input)="onGuestNameFieldInput('firstName', $event)"
                                   (paste)="onGuestNameFieldPaste('firstName', $event)"
                                   [placeholder]="t('doc.guestInfo.firstNamePh')" autocomplete="given-name" maxlength="50"
                                   class="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 sm:py-3 text-[15px] sm:text-[16px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                          </div>
                          @if (guestInvalid('firstName')) {
                            <p class="mt-1 text-xs sm:text-sm font-medium text-[#B91C1C]">{{ t('err.invalidName', { field: t('doc.guestInfo.firstName') }) }}</p>
                          }
                        </div>

                        <!-- Middle Name -->
                        <div>
                          <label for="guest-middleName" class="block text-[14px] sm:text-[15px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.middleName') }}
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="guestInvalid('middleName')">
                            <input id="guest-middleName" type="text" name="middleName"
                                   [value]="guestForm.middleName || ''"
                                   (keydown)="filterNameKeyDown($event)"
                                   (input)="onGuestNameFieldInput('middleName', $event)"
                                   (paste)="onGuestNameFieldPaste('middleName', $event)"
                                   [placeholder]="t('doc.guestInfo.middleNamePh')" autocomplete="additional-name" maxlength="50"
                                   class="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 sm:py-3 text-[15px] sm:text-[16px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                          </div>
                          @if (guestInvalid('middleName')) {
                            <p class="mt-1 text-xs sm:text-sm font-medium text-[#B91C1C]">{{ t('err.invalidName', { field: t('doc.guestInfo.middleName') }) }}</p>
                          }
                        </div>

                        <!-- Last Name -->
                        <div>
                          <label for="guest-lastName" class="block text-[14px] sm:text-[15px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.lastName') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="guestInvalid('lastName')">
                            <input id="guest-lastName" type="text" name="lastName"
                                   [value]="guestForm.lastName || ''"
                                   (keydown)="filterNameKeyDown($event)"
                                   (input)="onGuestNameFieldInput('lastName', $event)"
                                   (paste)="onGuestNameFieldPaste('lastName', $event)"
                                   [placeholder]="t('doc.guestInfo.lastNamePh')" autocomplete="family-name" maxlength="50"
                                   class="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 sm:py-3 text-[15px] sm:text-[16px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                          </div>
                          @if (guestInvalid('lastName')) {
                            <p class="mt-1 text-xs sm:text-sm font-medium text-[#B91C1C]">{{ t('err.invalidName', { field: t('doc.guestInfo.lastName') }) }}</p>
                          }
                        </div>

                        <!-- Suffix -->
                        <div>
                          <label for="guest-suffix" class="block text-[14px] sm:text-[15px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.suffix') }}
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden">
                            <input id="guest-suffix" type="text" name="suffix"
                                   [(ngModel)]="guestForm.suffix"
                                   [placeholder]="t('doc.guestInfo.suffixPh')" maxlength="20"
                                   class="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 sm:py-3 text-[15px] sm:text-[16px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                          </div>
                        </div>

                        <!-- Birth Date -->
                        <div>
                          <label for="guest-birthDate" class="block text-[14px] sm:text-[15px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.birthDate') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="guestInvalid('birthDate')">
                            <input id="guest-birthDate" type="date" name="birthDate" [(ngModel)]="guestForm.birthDate"
                                   (ngModelChange)="onDobChange($event)"
                                   (change)="onDobChange($event)"
                                   [placeholder]="t('doc.guestInfo.birthDatePh')" [max]="maxBirthDateString()"
                                   class="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 sm:py-3 text-[15px] sm:text-[16px] font-medium text-[#0F172A] bg-transparent outline-none border-none" />
                          </div>
                          @if (guestInvalid('birthDate')) {
                            <p class="mt-1 text-xs sm:text-sm font-medium text-[#B91C1C]">{{ getGuestDobErrorMessage() }}</p>
                          }
                        </div>

                        <!-- Birth Place -->
                        <div>
                          <label for="guest-birthPlace" class="block text-[14px] sm:text-[15px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.birthPlace') }}
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden">
                            <input id="guest-birthPlace" type="text" name="birthPlace" [(ngModel)]="guestForm.birthPlace"
                                   [placeholder]="t('doc.guestInfo.birthPlacePh')" maxlength="100"
                                   class="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 sm:py-3 text-[15px] sm:text-[16px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                          </div>
                        </div>

                        <!-- Gender -->
                        <div>
                          <label for="guest-gender" class="block text-[14px] sm:text-[15px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.gender') }}
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden px-3 sm:px-4 py-1.5 sm:py-2">
                            <select id="guest-gender" name="gender" [(ngModel)]="guestForm.gender"
                                    class="w-full text-[15px] sm:text-[16px] text-[#0F172A] bg-transparent outline-none border-none">
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <!-- Civil Status -->
                        <div>
                          <label for="guest-civilStatus" class="block text-[14px] sm:text-[15px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.civilStatus') }}
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden px-3 sm:px-4 py-1.5 sm:py-2">
                            <select id="guest-civilStatus" name="civilStatus" [(ngModel)]="guestForm.civilStatus"
                                    class="w-full text-[15px] sm:text-[16px] text-[#0F172A] bg-transparent outline-none border-none">
                              <option value="Single">Single</option>
                              <option value="Married">Married</option>
                              <option value="Widowed">Widowed</option>
                              <option value="Separated">Separated</option>
                              <option value="Divorced">Divorced</option>
                            </select>
                          </div>
                        </div>

                        <!-- Nationality -->
                        <div>
                          <label for="guest-nationality" class="block text-[14px] sm:text-[15px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.nationality') }}
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden">
                            <input id="guest-nationality" type="text" name="nationality" [(ngModel)]="guestForm.nationality"
                                   [placeholder]="t('doc.guestInfo.nationalityPh')" maxlength="50"
                                   class="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 sm:py-3 text-[15px] sm:text-[16px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                          </div>
                        </div>

                        <!-- Religion -->
                        <div>
                          <label for="guest-religion" class="block text-[14px] sm:text-[15px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.religion') }}
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden">
                            <input id="guest-religion" type="text" name="religion" [(ngModel)]="guestForm.religion"
                                   [placeholder]="t('doc.guestInfo.religionPh')" maxlength="50"
                                   class="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 sm:py-3 text-[15px] sm:text-[16px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                          </div>
                        </div>

                        <!-- Occupation -->
                        <div>
                          <label for="guest-occupation" class="block text-[14px] sm:text-[15px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.occupation') }}
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden">
                            <input id="guest-occupation" type="text" name="occupation" [(ngModel)]="guestForm.occupation"
                                   [placeholder]="t('doc.guestInfo.occupationPh')" maxlength="100"
                                   class="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 sm:py-3 text-[15px] sm:text-[16px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                          </div>
                        </div>

                        <!-- Contact Number -->
                        <div>
                          <label for="guest-contactNumber" class="block text-[14px] sm:text-[15px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.contact') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="guestInvalid('contactNumber')">
                            <input id="guest-contactNumber" type="tel" name="contactNumber"
                                   [value]="guestForm.contactNumber || ''"
                                   (keydown)="filterNumberKeyDown($event)"
                                   (input)="onGuestPhoneInput($event)"
                                   (paste)="onGuestPhonePaste($event)"
                                   [placeholder]="t('doc.guestInfo.contactPh')" autocomplete="tel" inputmode="numeric" maxlength="11"
                                   class="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 sm:py-3 text-[15px] sm:text-[16px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                          </div>
                          @if (guestInvalid('contactNumber')) {
                            <p class="mt-1 text-xs sm:text-sm font-medium text-[#B91C1C]">{{ t('err.invalidPhone', { field: t('doc.guestInfo.contact') }) }}</p>
                          }
                        </div>

                        <!-- Email -->
                        <div class="md:col-span-2">
                          <label for="guest-email" class="block text-[14px] sm:text-[15px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.email') }}
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="guestInvalid('email')">
                            <input id="guest-email" type="email" name="email" [(ngModel)]="guestForm.email"
                                   [placeholder]="t('doc.guestInfo.emailPh')" autocomplete="email" inputmode="email" maxlength="100"
                                   class="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 sm:py-3 text-[15px] sm:text-[16px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                          </div>
                          @if (guestInvalid('email')) {
                            <p class="mt-1 text-xs sm:text-sm font-medium text-[#B91C1C]">{{ t('err.invalidEmail', { field: 'Email' }) }}</p>
                          }
                        </div>
                      </div>

                      <!-- Divider -->
                      <div class="border-t border-slate-200 mt-6 pt-5">
                        
                        <!-- Address Header -->
                        <div class="mb-3.5">
                          <h3 class="text-[16px] sm:text-[17px] font-bold text-[#0F172A]">{{ t('doc.guestInfo.addressSection') }}</h3>
                        </div>

                        <!-- Address Inputs (3-column grid) -->
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
                          <div>
                            <label for="guest-subdivision" class="block text-[13px] sm:text-[14px] font-semibold text-[#0F172A] mb-1">{{ t('doc.guestInfo.subdivision') }}</label>
                            <div class="rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm focus-within:border-[#F97316] overflow-hidden">
                              <input id="guest-subdivision" type="text" [value]="guestForm.subdivision" (input)="updateGuestAddressField('subdivision', $any($event.target).value)" maxlength="100" [placeholder]="t('doc.guestInfo.subdivisionPh')" class="w-full px-3 py-2 text-[14px] sm:text-[15px] text-[#0F172A] bg-transparent outline-none" />
                            </div>
                          </div>
                          <div>
                            <label for="guest-street" class="block text-[13px] sm:text-[14px] font-semibold text-[#0F172A] mb-1">{{ t('doc.guestInfo.street') }}</label>
                            <div class="rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm focus-within:border-[#F97316] overflow-hidden">
                              <input id="guest-street" type="text" [value]="guestForm.street" (input)="updateGuestAddressField('street', $any($event.target).value)" maxlength="100" [placeholder]="t('doc.guestInfo.streetPh')" class="w-full px-3 py-2 text-[14px] sm:text-[15px] text-[#0F172A] bg-transparent outline-none" />
                            </div>
                          </div>
                          <div>
                            <label for="guest-block" class="block text-[13px] sm:text-[14px] font-semibold text-[#0F172A] mb-1">{{ t('doc.guestInfo.block') }}</label>
                            <div class="rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm focus-within:border-[#F97316] overflow-hidden">
                              <input id="guest-block" type="text" [value]="guestForm.block" (input)="updateGuestAddressField('block', $any($event.target).value)" maxlength="50" [placeholder]="t('doc.guestInfo.blockPh')" class="w-full px-3 py-2 text-[14px] sm:text-[15px] text-[#0F172A] bg-transparent outline-none" />
                            </div>
                          </div>
                          <div>
                            <label for="guest-lot" class="block text-[13px] sm:text-[14px] font-semibold text-[#0F172A] mb-1">{{ t('doc.guestInfo.lot') }}</label>
                            <div class="rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm focus-within:border-[#F97316] overflow-hidden">
                              <input id="guest-lot" type="text" [value]="guestForm.lot" (input)="updateGuestAddressField('lot', $any($event.target).value)" maxlength="50" [placeholder]="t('doc.guestInfo.lotPh')" class="w-full px-3 py-2 text-[14px] sm:text-[15px] text-[#0F172A] bg-transparent outline-none" />
                            </div>
                          </div>
                          <div>
                            <label for="guest-purokZone" class="block text-[13px] sm:text-[14px] font-semibold text-[#0F172A] mb-1">{{ t('doc.guestInfo.purokZone') }}</label>
                            <div class="rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm focus-within:border-[#F97316] overflow-hidden">
                              <input id="guest-purokZone" type="text" [value]="guestForm.purokZone" (input)="updateGuestAddressField('purokZone', $any($event.target).value)" maxlength="100" [placeholder]="t('doc.guestInfo.purokZonePh')" class="w-full px-3 py-2 text-[14px] sm:text-[15px] text-[#0F172A] bg-transparent outline-none" />
                            </div>
                          </div>
                          <div>
                            <label for="guest-sitio" class="block text-[13px] sm:text-[14px] font-semibold text-[#0F172A] mb-1">{{ t('doc.guestInfo.sitio') }}</label>
                            <div class="rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm focus-within:border-[#F97316] overflow-hidden">
                              <input id="guest-sitio" type="text" [value]="guestForm.sitio" (input)="updateGuestAddressField('sitio', $any($event.target).value)" maxlength="100" [placeholder]="t('doc.guestInfo.sitioPh')" class="w-full px-3 py-2 text-[14px] sm:text-[15px] text-[#0F172A] bg-transparent outline-none" />
                            </div>
                          </div>
                          <div>
                            <label for="guest-municipality" class="block text-[13px] sm:text-[14px] font-semibold text-[#0F172A] mb-1">{{ t('doc.guestInfo.municipality') }}</label>
                            <div class="rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm focus-within:border-[#F97316] overflow-hidden">
                              <input id="guest-municipality" type="text" [value]="guestForm.municipality" (input)="updateGuestAddressField('municipality', $any($event.target).value)" maxlength="100" [placeholder]="t('doc.guestInfo.municipalityPh')" class="w-full px-3 py-2 text-[14px] sm:text-[15px] text-[#0F172A] bg-transparent outline-none" />
                            </div>
                          </div>
                          <div>
                            <label for="guest-province" class="block text-[13px] sm:text-[14px] font-semibold text-[#0F172A] mb-1">{{ t('doc.guestInfo.province') }}</label>
                            <div class="rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm focus-within:border-[#F97316] overflow-hidden">
                              <input id="guest-province" type="text" [value]="guestForm.province" (input)="updateGuestAddressField('province', $any($event.target).value)" maxlength="100" [placeholder]="t('doc.guestInfo.provincePh')" class="w-full px-3 py-2 text-[14px] sm:text-[15px] text-[#0F172A] bg-transparent outline-none" />
                            </div>
                          </div>
                          <div>
                            <label for="guest-zipCode" class="block text-[13px] sm:text-[14px] font-semibold text-[#0F172A] mb-1">{{ t('doc.guestInfo.zipCode') }}</label>
                            <div class="rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm focus-within:border-[#F97316] overflow-hidden">
                              <input id="guest-zipCode" type="text" [value]="guestForm.zipCode" (keydown)="filterNumberKeyDown($event)" (input)="guestForm.zipCode = sanitizeDigits($any($event.target).value, 10)" maxlength="10" [placeholder]="t('doc.guestInfo.zipCodePh')" class="w-full px-3 py-2 text-[14px] sm:text-[15px] text-[#0F172A] bg-transparent outline-none" />
                            </div>
                          </div>
                        </div>

                        <!-- Full Address / Barangay Address Line -->
                        <div class="mt-4">
                          <label for="guest-address" class="block text-[14px] sm:text-[15px] font-semibold text-[#0F172A] mb-1.5">
                            {{ t('doc.guestInfo.address') }} <span class="text-[#F97316]">*</span>
                          </label>
                          <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                               [class.border-[#DC2626]]="guestInvalid('address')">
                            <input id="guest-address" type="text" name="address" [(ngModel)]="guestForm.address"
                                   [placeholder]="t('doc.guestInfo.addressPh')" autocomplete="street-address" maxlength="255"
                                   class="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 sm:py-3 text-[15px] sm:text-[16px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                          </div>
                          @if (guestInvalid('address')) {
                            <p class="mt-1 text-xs sm:text-sm font-medium text-[#B91C1C]">{{ t('err.guest.address') }}</p>
                          }
                        </div>
                      </div>

                      <!-- Validation error alert -->
                      @if (formError()) {
                        <div class="mt-5 sm:mt-6 flex items-start justify-between gap-3 rounded-xl border-2 border-[#DC2626] bg-[#FEF2F2] px-4 py-3.5" role="alert">
                          <div class="flex items-start gap-3 min-w-0">
                            <svg class="w-6 h-6 shrink-0 text-[#DC2626]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                              <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                            </svg>
                            <p class="text-[15px] sm:text-base font-semibold text-[#B91C1C]">{{ formError() }}</p>
                          </div>
                          <button (click)="formError.set('')" type="button" class="text-[#DC2626] hover:text-[#991B1B] p-1 rounded-lg transition-colors focus:outline-none" aria-label="Dismiss error">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      }

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
                            (click)="toggleService(service)"
                            [class.border-[#F97316]]="isServiceSelected(service)"
                            [class.bg-[#FFF7ED]]="isServiceSelected(service)"
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

                      <!-- Right: processing fee + selection state -->
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
                        @if (isServiceSelected(service)) {
                          <div class="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F97316] flex items-center justify-center" aria-hidden="true">
                            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                        } @else {
                          <svg class="w-7 h-7 sm:w-8 sm:h-8 text-[#F97316] shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                          </svg>
                        }
                      </div>
                    </button>
                  }
                </div>
              </main>

              <!-- Multi-select action bar -->
              <div class="relative z-10 shrink-0 px-4 sm:px-8 pb-1 pt-0.5">
                <div class="mx-auto w-full max-w-[980px] flex flex-wrap items-center gap-3 bg-white/90 backdrop-blur-sm border border-[#E5E7EB] rounded-2xl shadow-sm px-4 sm:px-5 py-2.5">
                  <p class="flex-1 min-w-[160px] text-[13px] sm:text-[14px] font-semibold text-[#0F172A]">
                    @if (selectedServiceCount() > 0) {
                      {{ selectedServiceCount() }} {{ selectedServiceCount() === 1 ? t('doc.services.selected') : t('doc.services.selectedPlural') }} ·
                      @if (selectedTotalFee() > 0) {
                        ₱{{ formatServiceFee(selectedTotalFee()) }}
                      } @else {
                        {{ t('doc.services.free') }}
                      }
                    } @else {
                      {{ t('doc.services.hint') }}
                    }
                  </p>
                  <button (click)="proceedFromServices()"
                          [disabled]="selectedServiceCount() === 0"
                          class="flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-base font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40 disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ t('common.continue') }}
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
                @if (serviceError()) {
                  <p class="mx-auto mt-1.5 w-full max-w-[980px] text-[13px] sm:text-sm font-medium text-[#B91C1C] text-center">{{ serviceError() }}</p>
                }
              </div>

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
                      <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <h2 class="text-[clamp(1.125rem,1.4vw,1.5rem)] font-bold text-[#0F172A] leading-tight uppercase break-words">{{ selectedService()?.service_name }}</h2>

                          <!-- Dynamic Applicant Age & Status Badge -->
                          @if (isApplicantUnderage()) {
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 shadow-2xs">
                              <span class="w-2 h-2 rounded-full bg-red-500"></span>
                              Underage (Age: {{ activeApplicantAge() }}) — Ineligible
                            </span>
                          } @else if (isApplicantMinor()) {
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                              Minor Applicant (Age: {{ activeApplicantAge() }})
                            </span>
                          } @else {
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs">
                              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                              Adult Applicant {{ activeApplicantAge() !== null ? '(Age: ' + activeApplicantAge() + ')' : '' }}
                            </span>
                          }
                        </div>
                        @if (selectedService()?.description) {
                          <p class="text-[clamp(0.875rem,1vw,0.9375rem)] font-medium text-[#64748B] leading-relaxed mt-1 max-w-[62ch]">{{ selectedService()?.description }}</p>
                        }
                      </div>
                    </div>

                    <!-- Date of Birth Quick Review & Dynamic Adjust Bar -->
                    <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] mt-3.5 text-xs sm:text-sm">
                      <div class="flex items-center gap-2 text-[#334155]">
                        <svg class="w-4 h-4 text-[#F97316] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke-linecap="round"/>
                        </svg>
                        <span>Applicant Birth Date: <strong class="text-[#0F172A]">{{ activeApplicantDob() || 'Not yet entered' }}</strong></span>
                        @if (activeApplicantAge() !== null) {
                          <span class="text-[#64748B] font-semibold">({{ activeApplicantAge() }} yrs old)</span>
                        }
                      </div>
                      <div class="flex items-center gap-2">
                        <label for="doc-req-dob-edit" class="text-xs font-medium text-[#64748B]">Change DOB:</label>
                        <input id="doc-req-dob-edit" type="date"
                               [value]="activeApplicantDob()"
                               (change)="onDobChange($event)"
                               (input)="onDobChange($event)"
                               [max]="maxBirthDateString()"
                               class="px-2 py-1 text-xs rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] font-semibold shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                               title="Change Date of Birth to re-evaluate requirements dynamically" />
                      </div>
                    </div>

                    <!-- Divider -->
                    <div class="border-t border-[#E5E7EB] my-4 sm:my-5"></div>

                    @if (isApplicantUnderage()) {
                      <!-- Ineligibility Alert Notice -->
                      <div class="rounded-2xl bg-red-50 border-2 border-red-300 p-4 sm:p-5 text-red-900 flex items-start gap-3.5 my-2">
                        <div class="shrink-0 w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="font-bold text-base text-red-900">Applicant is Ineligible (Below Minimum Age)</h4>
                          <p class="text-xs sm:text-sm text-red-700 mt-1 leading-relaxed">
                            The minimum eligible age to apply is <strong>{{ getBarangayIdMinAge() }} years old</strong> (Current calculated age: <strong>{{ activeApplicantAge() }}</strong>). Minor applicants below 15 years of age are not eligible to apply independently. Please coordinate with a parent or legal guardian at the Barangay Hall service desk.
                          </p>
                        </div>
                      </div>
                    } @else if (getApplicableRequirementsForService(selectedService()).length > 0) {
                      <!-- What to Bring heading -->
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                          <svg class="w-5 h-5 text-[#F97316] shrink-0" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="5" y="4" width="14" height="17" rx="2"/>
                            <path d="M9 4.5V3h6v1.5" stroke-linecap="round"/>
                            <path d="M8.5 12.5l2.3 2.3 4.7-4.7" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          <h3 class="text-[clamp(1rem,1.2vw,1.125rem)] font-bold text-[#0F172A]">{{ t('doc.requirements.whatToBring') }}</h3>
                        </div>
                        @if (isApplicantMinor()) {
                          <span class="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            Minor Requirements (Aged 15–17)
                          </span>
                        }
                      </div>

                      <!-- Requirement rows -->
                      <ul class="flex flex-col gap-2.5 sm:gap-3">
                        @for (req of getApplicableRequirementsForService(selectedService()); track req) {
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
                            [disabled]="isApplicantUnderage()"
                            class="flex items-center justify-center gap-2 min-h-[54px] min-w-[200px] sm:min-w-[220px] px-8 rounded-[14px] bg-[#F97316] text-white text-base sm:text-lg font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:bg-[#EA580C] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
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
                                    [attr.maxlength]="fieldMaxLength(field)"
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
                                      [type]="isFieldPhone(field) ? 'tel' : (isFieldNumber(field) ? 'text' : field.type)"
                                      [name]="field.key"
                                      [value]="formValues()[field.key] || ''"
                                      (keydown)="onDynamicFieldKeyDown(field, $event)"
                                      (input)="onDynamicFieldInput(field, $event)"
                                      (paste)="onDynamicFieldPaste(field, $event)"
                                      [placeholder]="fieldPlaceholder(field)"
                                      [attr.inputmode]="fieldInputMode(field)"
                                      [attr.maxlength]="fieldMaxLength(field)"
                                      [attr.min]="field.validation?.min !== undefined ? field.validation.min : null"
                                      [attr.max]="field.validation?.max !== undefined ? field.validation.max : (isBirthDateField(field) ? maxBirthDateString() : (field.type === 'date' ? todayDateString() : null))"
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
                  <div class="bg-black rounded-2xl overflow-hidden mb-6 relative aspect-video flex flex-col items-center justify-center text-white">
                    @if (cameraMode() === 'esp32') {
                      <img #inlineEsp32StreamEl
                           [src]="esp32StreamUrl()"
                           (load)="onEsp32StreamLoad()"
                           (error)="onEsp32StreamError()"
                           crossorigin="anonymous"
                           class="w-full aspect-video object-cover rotate-90 scale-[1.35]"
                           alt="ESP32-CAM Live Preview" />
                    } @else {
                      <video #videoEl autoplay playsinline class="w-full aspect-video object-cover"></video>
                    }
                    <button (click)="switchCameraMode(cameraMode() === 'esp32' ? 'webcam' : 'esp32')"
                            class="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 px-3 py-1.5 rounded-full text-xs font-semibold text-white">
                      {{ cameraMode() === 'esp32' ? 'Tablet Cam' : 'ESP32-CAM' }}
                    </button>
                  </div>
                  <div class="flex gap-4 justify-center">
                    <app-button variant="primary" size="lg" [disabled]="!cameraReady() || submitting()" (onClick)="capturePhoto()">
                      @if (submitting()) { Capturing... } @else { {{ t('doc.form.takePhoto') }} }
                    </app-button>
                    <app-button variant="secondary" size="lg" (onClick)="skipPhoto()">{{ t('common.skip') }}</app-button>
                  </div>
                } @else {
                  <div class="text-center">
                    <img [src]="capturedPhoto()" class="w-64 h-64 rounded-2xl mx-auto mb-4 object-cover border-4 border-white shadow-md" />
                    @if (enablePhotoValidation() && photoQualityError()) {
                      <div class="w-full max-w-sm mx-auto mb-4 p-3 rounded-xl bg-amber-50 border-2 border-amber-300 flex items-center gap-2.5 text-amber-900 shadow-sm text-left">
                        <svg class="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                        </svg>
                        <p class="text-xs font-semibold leading-snug">{{ photoQualityError() }}</p>
                      </div>
                    }
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
                <h1 class="text-[clamp(1.375rem,1.9vw,2rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('doc.review.title') }}</h1>
                <p class="text-[clamp(0.875rem,1.05vw,1.0625rem)] font-medium text-[#64748B] mt-1">{{ t('doc.review.subtitle') }}</p>
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

              <!-- Resident summary (compact horizontal card) -->
              <div class="relative z-10 px-4 sm:px-8 pb-1">
                <div class="mx-auto w-full max-w-[1000px] flex items-center justify-between gap-3 sm:gap-6 bg-white/90 backdrop-blur-sm border border-[#E5E7EB] rounded-2xl shadow-sm px-4 sm:px-6 py-2.5 sm:py-3">
                  <!-- Avatar + Name + ID/Contact info -->
                  <div class="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial max-w-[55%] sm:max-w-[40%]">
                    <div class="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-[#FFF7ED] border border-[#F97316]/25 flex items-center justify-center" aria-hidden="true">
                      @if (displayPhoto()) {
                        <img [src]="displayPhoto()" alt="" class="w-full h-full object-cover" />
                      } @else {
                        <span class="text-[#F97316] font-bold text-base">{{ displayName().charAt(0) }}</span>
                      }
                    </div>
                    <div class="min-w-0">
                      <p class="text-[14px] sm:text-[16px] font-bold text-[#0F172A] leading-tight truncate" [title]="displayName()">{{ displayName() }}</p>
                      @if (resident()) {
                        <p class="text-[11px] sm:text-[13px] font-medium text-[#64748B] leading-snug truncate">
                          {{ t('doc.review.residentId') }}: <span class="font-semibold text-[#0F172A]">{{ resident()!.resident_code }}</span>
                        </p>
                      } @else {
                        <p class="text-[11px] sm:text-[13px] font-medium text-[#64748B] leading-snug truncate">
                          {{ t('doc.guestInfo.contact') }}: <span class="font-semibold text-[#0F172A]">{{ guestForm.contactNumber || t('doc.review.guestRequester') }}</span>
                        </p>
                      }
                    </div>
                  </div>

                  <!-- Address (flexible middle column) -->
                  <div class="hidden sm:flex flex-col flex-1 min-w-0 max-w-[420px] px-2">
                    <p class="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">{{ t('profile.address') }}</p>
                    <p class="text-[12px] sm:text-[13px] font-bold text-[#0F172A] leading-snug truncate" [title]="displayAddress()">{{ displayAddress() }}</p>
                  </div>

                  @if (resident()) {
                    <div class="hidden lg:flex flex-col min-w-0 shrink-0">
                      <p class="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">{{ t('doc.form.rfidNo') }}</p>
                      <p class="text-[12px] sm:text-[13px] font-bold text-[#0F172A] leading-snug">{{ rfidDisplayNumber() }}</p>
                    </div>
                  }

                  <!-- Right Status Badge (never wraps to new line) -->
                  <div class="shrink-0 flex items-center">
                    @if (resident()) {
                      <span class="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] px-3 py-1 text-[11px] sm:text-[12px] font-bold text-[#166534] whitespace-nowrap">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        {{ t('doc.form.activeResident') }}
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] border border-[#FDBA74] px-3 py-1 text-[11px] sm:text-[12px] font-bold text-[#EA580C] whitespace-nowrap shadow-xs">
                        <span class="w-1.5 h-1.5 rounded-full bg-[#F97316]"></span>
                        {{ t('doc.review.temporarySession') }}
                      </span>
                    }
                  </div>
                </div>
              </div>

              <!-- Main content: two-column review layout -->
              <div class="relative z-10 flex-1 overflow-y-auto">
                <div class="min-h-full flex items-center justify-center px-4 sm:px-8 py-2.5 sm:py-3">
                  <div class="w-full max-w-[1000px]">

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

                      <!-- LEFT: Request Summary -->
                      <div class="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-6 py-4">
                        <div class="flex items-center gap-2.5 mb-3">
                          <div class="shrink-0 w-8 h-8 rounded-lg bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center text-[#F97316]" aria-hidden="true">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <rect x="4" y="4" width="16" height="16" rx="2"/>
                              <path d="M8 9h8M8 13h8M8 17h5" stroke-linecap="round"/>
                            </svg>
                          </div>
                          <h2 class="text-[14px] sm:text-[15px] font-bold tracking-[0.02em] text-[#0F172A] uppercase">{{ t('doc.review.requestSummary') }}</h2>
                        </div>

                        <div class="space-y-3">
                          @for (svc of selectedServices(); track svc.service_id) {
                            <div class="flex items-start gap-3">
                              <div class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                  <path d="M19 5H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z" stroke-linejoin="round"/>
                                  <path d="M2 9h20" stroke-linecap="round"/>
                                </svg>
                              </div>
                              <div class="min-w-0 flex-1">
                                <p class="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">{{ t('doc.review.serviceRequested') }}</p>
                                <p class="text-[clamp(1.0625rem,1.4vw,1.375rem)] font-extrabold text-[#0F172A] leading-tight uppercase break-words">{{ svc.service_name }}</p>
                              </div>
                              <div class="shrink-0 text-right pt-4">
                                @if (svc.processing_fee > 0) {
                                  <p class="text-[15px] sm:text-base font-bold text-[#F97316] leading-tight whitespace-nowrap">₱{{ formatServiceFee(svc.processing_fee) }}</p>
                                } @else {
                                  <p class="text-[14px] sm:text-[15px] font-bold text-[#16A34A] leading-tight whitespace-nowrap">{{ t('doc.services.free') }}</p>
                                }
                              </div>
                            </div>
                          }

                          @if (selectedTotalFee() > 0) {
                            <div class="flex items-start gap-3 border-t border-[#F1F5F9] pt-2.5">
                              <div class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="9"/>
                                  <path d="M12 6v12M9 9.5h4a1.5 1.5 0 010 3H11a1.5 1.5 0 000 3h4" stroke-linecap="round"/>
                                </svg>
                              </div>
                              <div class="min-w-0">
                                <p class="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">{{ t('doc.review.totalFee') }}</p>
                                <p class="text-[clamp(1.0625rem,1.4vw,1.375rem)] font-extrabold text-[#F97316] leading-tight">₱{{ formatServiceFee(selectedTotalFee()) }}</p>
                              </div>
                            </div>
                          }

                          <div class="flex items-start gap-3">
                            <div class="shrink-0 w-7 h-7 rounded-lg bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18" stroke-linecap="round"/>
                              </svg>
                            </div>
                            <div class="min-w-0">
                              <p class="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">{{ t('doc.review.requestedOn') }}</p>
                              <p class="text-[15px] sm:text-base font-bold text-[#0F172A] leading-snug">{{ formatRequestedOn() }}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- RIGHT: Application Details -->
                      <div class="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-6 py-4">
                        <div class="flex items-center gap-2.5 mb-2">
                          <div class="shrink-0 w-8 h-8 rounded-lg bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center text-[#F97316]" aria-hidden="true">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <rect x="5" y="4" width="14" height="17" rx="2"/>
                              <path d="M9 4.5V3h6v1.5" stroke-linecap="round"/>
                              <path d="M8.5 12.5l2.3 2.3 4.7-4.7" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          </div>
                          <h2 class="text-[14px] sm:text-[15px] font-bold tracking-[0.02em] text-[#0F172A] uppercase">{{ t('doc.review.details') }}</h2>
                        </div>

                        @for (svc of selectedServices(); track svc.service_id) {
                          <div class="mb-2 [&:not(:last-child)]:pb-2 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-[#F1F5F9]">
                            <div class="flex items-center justify-between gap-2">
                              <h3 class="text-[12px] sm:text-[13px] font-bold text-[#F97316] uppercase tracking-[0.02em] break-words">{{ svc.service_name }}</h3>
                              @if (svc.has_template) {
                                <button (click)="openDocPreview(svc)" [disabled]="docPreviewRendering()"
                                        class="shrink-0 flex items-center gap-1 text-[12px] font-semibold text-[#0284C7] hover:underline disabled:opacity-60 disabled:cursor-not-allowed">
                                  @if (docPreviewRendering()) {
                                    <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                    </svg>
                                    {{ t('doc.review.previewLoading') }}
                                  } @else {
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                    </svg>
                                    {{ t('doc.review.previewDocument') }}
                                  }
                                </button>
                              } @else {
                                <span class="shrink-0 text-[11px] font-semibold text-[#64748B]">{{ t('doc.review.previewUnavailable') }}</span>
                              }
                            </div>
                            @if (svc.form_fields && svc.form_fields.length > 0) {
                              <div class="divide-y divide-[#F1F5F9]">
                                @for (field of svc.form_fields!; track field.key) {
                                  <div class="flex items-center gap-3 py-2">
                                    <div class="shrink-0 w-6 h-6 rounded-md bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                        <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
                                      </svg>
                                    </div>
                                    <span class="flex-1 min-w-0 text-[13px] sm:text-[14px] font-semibold text-[#0F172A] leading-snug">{{ fieldLabel(field) }}</span>
                                    <span class="shrink-0 text-[13px] sm:text-[14px] font-bold text-[#334155] text-right leading-snug break-words max-w-[50%]">{{ displayFormValue(field, (serviceForms()[svc.service_id] || {})[field.key]) }}</span>
                                  </div>
                                }
                              </div>
                            } @else {
                              <p class="text-[13px] sm:text-[14px] text-[#64748B]">{{ t('doc.form.noFields') }}</p>
                            }
                          </div>
                        }
                      </div>
                    </div>

                    @if (docPreviewError()) {
                      <p class="mt-3 text-[12px] sm:text-[13px] font-medium text-[#B91C1C]">{{ docPreviewError() }}</p>
                    }

                    <!-- Error Message Alert -->
                    @if (errorMessage()) {
                      <div class="mt-3 flex items-center gap-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-4 py-3">
                        <svg class="w-5 h-5 shrink-0 text-[#DC2626]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                          <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                        </svg>
                        <p class="text-[13px] sm:text-[14px] font-medium text-[#B91C1C]">{{ errorMessage() }}</p>
                      </div>
                    }

                    <!-- Actions: Edit Information + Submit Request -->
                    <div class="flex flex-wrap items-center justify-center gap-4 mt-4 pb-1">
                      <button (click)="editInformation()"
                              class="flex items-center justify-center gap-2.5 min-h-[56px] px-7 rounded-xl border-2 border-[#F97316] bg-white text-[#F97316] text-[15px] sm:text-base font-bold shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/25">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12l3 3"/>
                        </svg>
                        {{ t('doc.review.edit') }}
                      </button>
                      <button (click)="submitRequest()" [disabled]="submitting()"
                              class="flex items-center justify-center gap-2.5 min-h-[56px] px-8 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-[15px] sm:text-base font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40 disabled:opacity-60 disabled:cursor-not-allowed">
                        @if (submitting()) {
                          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                        } @else {
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M22 2L11 13"/>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M22 2L15 22l-4-9-9-4 20-7z"/>
                          </svg>
                        }
                        {{ t('doc.review.submit') }}
                      </button>
                    </div>

                  </div>
                </div>
              </div>

              <!-- Footer: same as the kiosk landing page (includes the language selector) -->
              <footer class="relative z-10 shrink-0 border-t border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
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
              </footer>
            </div>
          }

          <!-- DOC STEP 6: Success -->
          @if (currentStep() === 'success') {
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

              <!-- Header: back (left) + logo (center) + RFID verified badge (right) -->
              <div class="relative z-10 flex items-center justify-center px-6 pt-[14px] pb-1">
                <div class="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2.5 sm:gap-3">
                  <button (click)="finish()"
                          class="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#F97316]/60 bg-white flex items-center justify-center shadow-sm hover:bg-[#FFF7ED] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/30"
                          [attr.aria-label]="t('common.back')">
                    <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <button (click)="finish()"
                          class="flex items-center min-h-[44px] rounded-xl px-1 text-[#0F172A] font-semibold text-[15px] sm:text-base hover:text-[#F97316] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/40">
                    {{ t('common.back') }}
                  </button>
                </div>

                <div class="w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-full bg-white border-2 border-[#F97316]/30 shadow-sm overflow-hidden flex items-center justify-center">
                  <img src="Barangay Logo.png" alt="Barangay San Manuel logo" class="w-full h-full object-cover">
                </div>

                @if (rfidCard()) {
                  <div class="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 rounded-xl border-[1.5px] border-[#86EFAC] bg-[#DCFCE7] px-2.5 sm:px-3 py-1.5 shadow-sm" role="status">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6 text-[#16A34A] shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 2.75 19 5.5v5.4c0 4.3-2.9 8.1-7 9.6-4.1-1.5-7-5.3-7-9.6V5.5l7-2.75z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 11.6l2.1 2.1L15 9.4"/>
                    </svg>
                    <div>
                      <p class="text-[12.5px] sm:text-[13.5px] font-bold text-[#15803D] leading-tight">{{ t('doc.success.rfidVerified') }}</p>
                      <p class="text-[11px] sm:text-[11.5px] font-medium text-[#166534] leading-tight">{{ t('doc.success.activeResident') }}</p>
                    </div>
                  </div>
                }
              </div>

              <!-- Main content -->
              <div class="relative flex-1 overflow-y-auto">
                <div class="min-h-full flex flex-col items-center px-5 sm:px-8 py-3 sm:py-4">

                  <!-- Success indicator -->
                  <div class="relative mt-1 sm:mt-2" aria-hidden="true">
                    <!-- Subtle celebratory accents around the checkmark -->
                    <svg class="absolute -top-2 -left-6 w-6 h-6 text-[#F97316]/50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z"/>
                    </svg>
                    <svg class="absolute top-0 -right-7 w-4 h-4 text-[#10B981]/40" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="12"/>
                    </svg>
                    <svg class="absolute -bottom-3 -left-4 w-4 h-4 text-[#10B981]/40" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="12"/>
                    </svg>
                    <svg class="absolute -bottom-1 -right-5 w-5 h-5 text-[#F97316]/40" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z"/>
                    </svg>

                    <div class="w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] rounded-full bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center shadow-sm">
                      <div class="w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] rounded-full bg-[#16A34A] flex items-center justify-center">
                        <svg class="w-8 h-8 sm:w-9 sm:h-9 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <!-- Success message -->
                  <h1 class="text-[clamp(1.75rem,2.4vw,2.5rem)] font-bold tracking-tight text-[#0F172A] text-center leading-tight mt-3">{{ t('doc.success.title') }}</h1>
                  <p class="text-[clamp(0.95rem,1.1vw,1.15rem)] font-medium text-[#64748B] text-center mt-1.5 max-w-xl mx-auto">{{ t('doc.success.subtitle') }}</p>

                  <!-- Request number card -->
                  <section aria-label="{{ t('doc.success.yourRequestNumber') }}" class="w-full max-w-[860px] bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-8 py-4 sm:py-5 text-center mt-4">

                    <div class="flex items-center justify-center gap-2">
                      <svg class="w-5 h-5 sm:w-6 sm:h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6M9 16h6M9 8h2"/>
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                      </svg>
                      <span class="text-[13px] sm:text-sm font-bold tracking-[0.14em] text-[#0F172A] uppercase">{{ t('doc.success.yourRequestNumber') }}</span>
                    </div>

                    <div class="mt-2.5 mx-auto max-w-[720px] rounded-[16px] border-2 border-[#F97316]/40 bg-[#FFF7ED] px-5 py-2.5 sm:py-3">
                      @if (requestNumbers().length > 1) {
                        <p class="text-[13px] sm:text-sm font-bold tracking-[0.14em] text-[#F97316] uppercase mb-1.5">{{ t('doc.success.yourRequestNumbers') }}</p>
                        <div class="flex flex-wrap items-center justify-center gap-2">
                          @for (num of requestNumbers(); track num) {
                            <span class="px-3 py-1 rounded-lg bg-white border border-[#F97316]/30 text-[clamp(1.125rem,1.6vw,1.75rem)] font-bold tracking-wide text-[#0F172A] leading-tight">{{ num }}</span>
                          }
                        </div>
                      } @else {
                        <p class="text-[clamp(1.75rem,2.6vw,2.75rem)] font-bold tracking-wide text-[#0F172A] break-all leading-tight">{{ requestNumber() }}</p>
                      }
                    </div>

                    <div class="flex items-center justify-center gap-2 mt-2.5">
                      <svg class="w-[18px] h-[18px] text-[#64748B] shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6M9 16h6M9 8h2"/>
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                      </svg>
                      <p class="text-[14px] sm:text-[15px] font-semibold text-[#64748B]">{{ t('doc.success.keepNumber') }}</p>
                    </div>
                  </section>

                  <!-- Request status card -->
                  <section aria-label="Request Status" class="w-full max-w-[860px] rounded-[20px] border-2 border-[#BBF7D0] bg-[#F0FDF4] px-5 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left mt-3.5">
                    <div class="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#16A34A] flex items-center justify-center" aria-hidden="true">
                      <svg class="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M12 6.75V8M12 12v2M12 17v0.5"/>
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[16px] sm:text-[17px] font-bold text-[#15803D] tracking-[0.04em] uppercase">{{ t('doc.success.statusReceived') }}</p>
                      <p class="text-[13.5px] sm:text-[14.5px] font-semibold text-[#166534] mt-0.5">{{ t('doc.success.statusWaiting') }}</p>
                    </div>
                    <div class="shrink-0 sm:max-w-[340px] flex items-start gap-2">
                      <svg class="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5 hidden sm:block" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="9"/>
                        <path d="M9.5 9a2.5 2.5 0 114.6 1.3c-.8 1-1.9 1.7-1.9 3.2" stroke-linecap="round"/>
                        <path d="M12 17h.01" stroke-linecap="round"/>
                      </svg>
                      <p class="text-[13.5px] sm:text-[14.5px] font-medium text-[#166534] leading-snug">{{ t('doc.success.statusHint') }}</p>
                    </div>
                  </section>

                  <!-- What happens next -->
                  <section aria-label="{{ t('doc.success.whatNext') }}" class="w-full max-w-[860px] bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-7 py-4 sm:py-5 mt-3.5">
                    <h2 class="text-[clamp(1rem,1.3vw,1.25rem)] font-bold text-[#0F172A] text-center tracking-tight uppercase">{{ t('doc.success.whatNext') }}</h2>

                    <div class="mt-3.5 sm:mt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 md:divide-x md:divide-[#E5E7EB]">
                      <!-- Step 1 -->
                      <div class="flex flex-col items-center text-center md:px-3">
                        <span class="shrink-0 w-9 h-9 rounded-full bg-[#F97316] text-white text-[16px] font-bold flex items-center justify-center shadow-sm" aria-hidden="true">1</span>
                        <div class="mt-2 w-11 h-11 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                          <svg class="w-6 h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M9 12h6M9 16h6M9 8h2"/>
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                          </svg>
                        </div>
                        <h3 class="mt-2 text-[15px] sm:text-base font-bold text-[#0F172A] leading-tight">{{ t('doc.success.step1.title') }}</h3>
                        <p class="text-[13px] sm:text-sm text-[#64748B] mt-1 leading-snug max-w-[230px]">{{ t('doc.success.step1.desc') }}</p>
                      </div>

                      <!-- Step 2 -->
                      <div class="flex flex-col items-center text-center md:px-3">
                        <span class="shrink-0 w-9 h-9 rounded-full bg-[#F97316] text-white text-[16px] font-bold flex items-center justify-center shadow-sm" aria-hidden="true">2</span>
                        <div class="mt-2 w-11 h-11 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                          <svg class="w-6 h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <circle cx="10" cy="8" r="3.5"/>
                            <path stroke-linecap="round" d="M4 19c0-3.3 2.7-5 6-5s6 1.7 6 5"/>
                            <path stroke-linecap="round" d="M17 6.5l1.2 1.2 2.3-2.4"/>
                          </svg>
                        </div>
                        <h3 class="mt-2 text-[15px] sm:text-base font-bold text-[#0F172A] leading-tight">{{ t('doc.success.step2.title') }}</h3>
                        <p class="text-[13px] sm:text-sm text-[#64748B] mt-1 leading-snug max-w-[230px]">{{ t('doc.success.step2.desc') }}</p>
                      </div>

                      <!-- Step 3 -->
                      <div class="flex flex-col items-center text-center md:px-3">
                        <span class="shrink-0 w-9 h-9 rounded-full bg-[#F97316] text-white text-[16px] font-bold flex items-center justify-center shadow-sm" aria-hidden="true">3</span>
                        <div class="mt-2 w-11 h-11 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                          <svg class="w-6 h-6 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="16" rx="2"/>
                            <path stroke-linecap="round" d="M3 9h18M8 9v11M12 9v11M16 9v11"/>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01"/>
                          </svg>
                        </div>
                        <h3 class="mt-2 text-[15px] sm:text-base font-bold text-[#0F172A] leading-tight">{{ t('doc.success.step3.title') }}</h3>
                        <p class="text-[13px] sm:text-sm text-[#64748B] mt-1 leading-snug max-w-[230px]">{{ t('doc.success.step3.desc') }}</p>
                      </div>
                    </div>
                  </section>

                  <!-- Done button -->
                  <button type="button" (click)="finish()"
                          class="flex items-center justify-center gap-2.5 min-h-[64px] w-[300px] sm:w-[380px] px-7 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-lg sm:text-xl font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40 mt-4 mb-1">
                    <svg class="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    {{ t('common.done') }}
                  </button>
                </div>
              </div>

              <!-- Footer: same as the kiosk landing page (includes the language selector) -->
              <footer class="relative z-10 shrink-0 border-t border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
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
              </footer>
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
                    <div class="text-center mb-3 sm:mb-4">
                      <div class="flex items-center justify-center gap-2 mb-2">
                        @if (isApplicantUnderage()) {
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 shadow-2xs">
                            <span class="w-2 h-2 rounded-full bg-red-500"></span>
                            Underage (Age: {{ activeApplicantAge() }}) — Ineligible
                          </span>
                        } @else if (isApplicantMinor()) {
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                            Minor Applicant (Age: {{ activeApplicantAge() }}) — Minor Requirements
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs">
                            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                            Adult Applicant {{ activeApplicantAge() !== null ? '(Age: ' + activeApplicantAge() + ')' : '' }} — Standard Requirements
                          </span>
                        }
                      </div>
                      <h1 class="text-[clamp(1.5rem,2.2vw,2.125rem)] font-bold tracking-tight text-[#0F172A] leading-tight">{{ t('bar.requirements.title') }}</h1>
                      <p class="text-[clamp(0.925rem,1.1vw,1.075rem)] font-medium text-[#64748B] mt-1.5 sm:mt-2 max-w-2xl mx-auto">{{ t('bar.requirements.desc') }}</p>
                    </div>

                    <!-- Date of Birth Quick Review & Dynamic Adjust Bar -->
                    <div class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs mb-4 text-xs sm:text-sm">
                      <div class="flex items-center gap-2 text-[#334155]">
                        <svg class="w-4.5 h-4.5 text-[#F97316] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke-linecap="round"/>
                        </svg>
                        <span>Applicant Birth Date: <strong class="text-[#0F172A]">{{ activeApplicantDob() || 'Not yet specified' }}</strong></span>
                        @if (activeApplicantAge() !== null) {
                          <span class="text-[#64748B] font-semibold">({{ activeApplicantAge() }} yrs old)</span>
                        }
                      </div>
                      <div class="flex items-center gap-2">
                        <label for="bar-req-dob-edit" class="text-xs font-medium text-[#64748B]">Change DOB:</label>
                        <input id="bar-req-dob-edit" type="date"
                               [value]="activeApplicantDob()"
                               (change)="onDobChange($event)"
                               (input)="onDobChange($event)"
                               [max]="maxBirthDateString()"
                               class="px-2 py-1 text-xs rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] font-semibold shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                               title="Change Date of Birth to re-evaluate requirements dynamically" />
                      </div>
                    </div>

                    <!-- Requirements card -->
                    <div class="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_2px_14px_rgba(15,23,42,0.07)] px-5 sm:px-7 py-5 sm:py-6">
                      @if (isApplicantUnderage()) {
                        <!-- Ineligibility Alert Notice -->
                        <div class="rounded-2xl bg-red-50 border-2 border-red-300 p-4 sm:p-5 text-red-900 flex items-start gap-3.5 my-2">
                          <div class="shrink-0 w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="9"/>
                              <line x1="12" y1="8" x2="12" y2="12"/>
                              <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                          </div>
                          <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-base text-red-900">Applicant is Ineligible (Below Minimum Age)</h4>
                            <p class="text-xs sm:text-sm text-red-700 mt-1 leading-relaxed">
                              The minimum eligible age to apply for a Barangay ID is <strong>{{ getBarangayIdMinAge() }} years old</strong> (Current calculated age: <strong>{{ activeApplicantAge() }}</strong>). Minor applicants below 15 years of age are not eligible under the configured Barangay policy. Please coordinate with a parent or legal guardian at the Barangay Hall service desk.
                            </p>
                          </div>
                        </div>
                      } @else {
                        @for (reqItem of getBarangayIdRequirementsList(); track $index; let last = $last) {
                          <div class="flex items-start gap-3.5 sm:gap-4">
                            <div class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                              <span class="text-[16px] font-bold text-[#F97316]">{{ $index + 1 }}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                              <h3 class="text-[clamp(1rem,1.4vw,1.1875rem)] font-bold text-[#0F172A] leading-tight">{{ reqItem }}</h3>
                              <p class="text-[clamp(0.875rem,1.05vw,0.975rem)] text-[#64748B] mt-0.5 leading-snug">
                                {{ isApplicantMinor() ? 'Required document for Minor Barangay ID verification' : 'Required document for Barangay ID verification' }}
                              </p>
                            </div>
                          </div>
                          @if (!last) {
                            <div class="h-px bg-[#E5E7EB] my-4 sm:my-5"></div>
                          }
                        }

                        <!-- Important notice -->
                        <div class="flex items-start gap-3 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 px-4 sm:px-5 py-3.5 mt-5 sm:mt-6">
                          <svg class="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="12" r="9"/>
                            <path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                          </svg>
                          <div class="flex-1 min-w-0">
                            <p class="text-[14px] sm:text-[15px] font-bold text-[#0F172A]">{{ t('bar.requirements.note') }}</p>
                            <p class="text-[13px] sm:text-[14px] text-[#64748B] mt-1 leading-snug">
                              {{ isApplicantMinor() ? 'Minor applicants must present a valid Purok certification or student ID during verification.' : t('bar.requirements.noteDesc') }}
                            </p>
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Continue button (single primary action, centered) -->
                    <div class="flex items-center justify-center mt-5 sm:mt-6">
                      <button (click)="proceedToBarangayForm()"
                              [disabled]="isApplicantUnderage()"
                              class="flex items-center justify-center gap-2 min-h-[56px] min-w-[220px] sm:min-w-[240px] px-7 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-base sm:text-lg font-bold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
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
                      @if (barangayService()?.form_fields && barangayService()!.form_fields!.length > 0) {
                        <div class="flex flex-wrap gap-x-5 gap-y-4 sm:gap-y-5">
                          @for (field of barangayService()!.form_fields!; track field.key) {
                            <div [class]="formGridClass(field)">
                              <label [attr.for]="'bar-form-' + field.key" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                                {{ fieldLabel(field) }} @if (field.required) { <span class="text-[#F97316]">*</span> }
                              </label>

                              @switch (field.type) {
                                @case ('select') {
                                  <div class="relative flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                                       [class.border-[#DC2626]]="formErrors()[field.key]">
                                    <select
                                      [id]="'bar-form-' + field.key"
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
                                    [id]="'bar-form-' + field.key"
                                    [name]="field.key"
                                    [(ngModel)]="formValues()[field.key]"
                                    (ngModelChange)="updateFormValue(field.key, $event)"
                                    [placeholder]="fieldPlaceholder(field)"
                                    [attr.maxlength]="fieldMaxLength(field)"
                                    rows="3"
                                    class="w-full rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm px-3.5 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/15 transition-all duration-150 resize-none"
                                    [class.border-[#DC2626]]="formErrors()[field.key]"></textarea>
                                }
                                @case ('radio') {
                                  <div class="flex flex-col gap-2">
                                    @for (opt of field.options || []; track opt) {
                                      <label class="flex items-center gap-3 rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-3 cursor-pointer transition-colors duration-150 hover:border-[#F97316]/40 mb-0"
                                             [class.border-[#F97316]]="formValues()[field.key] === opt"
                                             [class.bg-[#FFF7ED]]="formValues()[field.key] === opt">
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
                                             [class.bg-[#FFF7ED]]="isCheckboxChecked(field, opt)">
                                        <input type="checkbox" [value]="opt"
                                               [checked]="isCheckboxChecked(field, opt)"
                                               (change)="toggleCheckboxOption(field, opt, $event)"
                                               class="w-5 h-5 accent-[#F97316] shrink-0" />
                                        <span class="text-[15px] sm:text-base font-medium text-[#0F172A]">{{ opt }}</span>
                                      </label>
                                    }
                                  </div>
                                }
                                @default {
                                  <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden"
                                       [class.border-[#DC2626]]="formErrors()[field.key]">
                                    <input
                                      [id]="'bar-form-' + field.key"
                                      [type]="isFieldPhone(field) ? 'tel' : (isFieldNumber(field) ? 'text' : field.type)"
                                      [name]="field.key"
                                      [value]="formValues()[field.key] || ''"
                                      (keydown)="onDynamicFieldKeyDown(field, $event)"
                                      (input)="onDynamicFieldInput(field, $event)"
                                      (paste)="onDynamicFieldPaste(field, $event)"
                                      [placeholder]="fieldPlaceholder(field)"
                                      [attr.inputmode]="fieldInputMode(field)"
                                      [attr.maxlength]="fieldMaxLength(field)"
                                      [attr.min]="field.validation?.min !== undefined ? field.validation.min : null"
                                      [attr.max]="field.validation?.max !== undefined ? field.validation.max : (isBirthDateField(field) ? maxBirthDateString() : (field.type === 'date' ? todayDateString() : null))"
                                      class="flex-1 min-w-0 bg-transparent px-3.5 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] outline-none border-none" />
                                    @if (formValues()[field.key]) {
                                      <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                        </svg>
                                      </div>
                                    }
                                  </div>
                                }
                              }

                              @if (formErrors()[field.key]) {
                                <p class="mt-2 flex items-center gap-1.5 text-base font-medium text-[#B91C1C]">
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
                              <input id="barangay-firstName" type="text" name="firstName"
                                     [value]="barangayForm.firstName || ''"
                                     (keydown)="filterNameKeyDown($event)"
                                     (input)="onBarangayNameInput('firstName', $event)"
                                     (paste)="onBarangayNamePaste('firstName', $event)"
                                     [placeholder]="t('bar.form.firstNamePh')" autocomplete="given-name" maxlength="50"
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
                              <input id="barangay-middleName" type="text" name="middleName"
                                     [value]="barangayForm.middleName || ''"
                                     (keydown)="filterNameKeyDown($event)"
                                     (input)="onBarangayNameInput('middleName', $event)"
                                     (paste)="onBarangayNamePaste('middleName', $event)"
                                     [placeholder]="t('bar.form.middleNamePh')" autocomplete="additional-name" maxlength="50"
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
                              <input id="barangay-lastName" type="text" name="lastName"
                                     [value]="barangayForm.lastName || ''"
                                     (keydown)="filterNameKeyDown($event)"
                                     (input)="onBarangayNameInput('lastName', $event)"
                                     (paste)="onBarangayNamePaste('lastName', $event)"
                                     [placeholder]="t('bar.form.lastNamePh')" autocomplete="family-name" maxlength="50"
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
                              <select id="barangay-suffix" name="suffix" [(ngModel)]="barangayForm.suffix"
                                      class="appearance-none flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] bg-transparent outline-none border-none cursor-pointer"
                                      [class.text-[#94A3B8]]="!barangayForm.suffix">
                                <option value="">{{ t('bar.form.suffixNone') }}</option>
                                <option value="Jr.">Jr.</option>
                                <option value="Sr.">Sr.</option>
                                <option value="II">II</option>
                                <option value="III">III</option>
                                <option value="IV">IV</option>
                                <option value="V">V</option>
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
                                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke-linecap="round"/>
                                </svg>
                              </div>
                              <input id="barangay-birthDate" type="date" name="birthDate" [(ngModel)]="barangayForm.birthDate"
                                     (ngModelChange)="onDobChange($event)"
                                     (change)="onDobChange($event)"
                                     [max]="maxBirthDateString()"
                                     class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] bg-transparent outline-none border-none" />
                              @if (barangayForm.birthDate && !barangayInvalid('birthDate')) {
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
                                {{ getBarangayDobErrorMessage() }}
                              </p>
                            }
                          </div>

                          <!-- Place of Birth -->
                          <div>
                            <label for="barangay-birthPlace" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                              {{ t('bar.form.birthPlace') }}
                            </label>
                            <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden">
                              <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                                <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                              </div>
                              <input id="barangay-birthPlace" type="text" name="birthPlace" [(ngModel)]="barangayForm.birthPlace"
                                     [placeholder]="t('bar.form.birthPlacePh')" maxlength="150"
                                     class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                              @if (barangayForm.birthPlace) {
                                <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                  <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                  </svg>
                                </div>
                              }
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
                              <input id="barangay-contactNumber" type="tel" name="contactNumber"
                                     [value]="barangayForm.contactNumber || ''"
                                     (keydown)="filterNumberKeyDown($event)"
                                     (input)="onBarangayPhoneInput('contactNumber', $event)"
                                     (paste)="onBarangayPhonePaste('contactNumber', $event)"
                                     [placeholder]="t('bar.form.contactPh')" autocomplete="tel" inputmode="numeric" maxlength="11"
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
                                     [placeholder]="t('bar.form.addressPh')" autocomplete="street-address" maxlength="255"
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

                          <!-- Emergency Contact Person -->
                          <div class="xl:col-span-2">
                            <label for="barangay-emergencyContactName" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                              {{ t('bar.form.emergencyName') }}
                            </label>
                            <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden">
                              <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                                <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                  <circle cx="12" cy="8" r="4"/>
                                  <path d="M4 20c0-3.6 3.6-5 8-5s8 1.4 8 5" stroke-linecap="round"/>
                                  <path d="M17 3l1.5 1.5L21 3M17 6.5l1.5 1.5L21 6.5" stroke-linecap="round"/>
                                </svg>
                              </div>
                              <input id="barangay-emergencyContactName" type="text" name="emergencyContactName"
                                     [value]="barangayForm.emergencyContactName || ''"
                                     (keydown)="filterNameKeyDown($event)"
                                     (input)="onBarangayNameInput('emergencyContactName', $event)"
                                     (paste)="onBarangayNamePaste('emergencyContactName', $event)"
                                     [placeholder]="t('bar.form.emergencyNamePh')" autocomplete="name" maxlength="100"
                                     class="flex-1 min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-[17px] text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent outline-none border-none" />
                              @if (barangayForm.emergencyContactName) {
                                <div class="shrink-0 pr-4 text-[#10B981]" aria-hidden="true">
                                  <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                  </svg>
                                </div>
                              }
                            </div>
                          </div>

                          <!-- Emergency Contact Number -->
                          <div class="xl:col-span-2">
                            <label for="barangay-emergencyContactNumber" class="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-1.5">
                              {{ t('bar.form.emergencyNumber') }}
                            </label>
                            <div class="flex items-center rounded-xl border-2 border-[#E5E7EB] bg-white shadow-sm transition-all duration-150 focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-[#F97316]/15 overflow-hidden">
                              <div class="shrink-0 w-11 sm:w-12 min-h-[54px] sm:min-h-[58px] bg-[#FFF7ED] flex items-center justify-center text-[#F97316]" aria-hidden="true">
                                <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>
                                </svg>
                              </div>
                              <input id="barangay-emergencyContactNumber" type="tel" name="emergencyContactNumber"
                                     [value]="barangayForm.emergencyContactNumber || ''"
                                     (keydown)="filterNumberKeyDown($event)"
                                     (input)="onBarangayPhoneInput('emergencyContactNumber', $event)"
                                     (paste)="onBarangayPhonePaste('emergencyContactNumber', $event)"
                                     [placeholder]="t('bar.form.emergencyNumberPh')" autocomplete="tel" inputmode="numeric" maxlength="11"
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
                      }

                      @if (formError()) {
                        <div class="mt-5 sm:mt-6 flex items-start justify-between gap-3 rounded-xl border-2 border-[#DC2626] bg-[#FEF2F2] px-4 py-3.5" role="alert">
                          <div class="flex items-start gap-3 min-w-0">
                            <svg class="w-6 h-6 shrink-0 text-[#DC2626]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                              <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
                            </svg>
                            <p class="text-[15px] sm:text-base font-semibold text-[#B91C1C]">{{ formError() }}</p>
                          </div>
                          <button (click)="formError.set('')" type="button" class="text-[#DC2626] hover:text-[#991B1B] p-1 rounded-lg transition-colors focus:outline-none" aria-label="Dismiss error">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
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
                            } @else if ((errorMessage() || esp32Error()) && !cameraReady()) {
                              <!-- Camera unavailable warning (compact) -->
                              <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-[#0F172A]">
                                <svg class="w-9 h-9 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M2 2l20 20M8.5 4h7L17 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-1"/>
                                  <path stroke-linecap="round" d="M4 6h.5a2.5 2.5 0 0 0 2.5 2.5V9"/>
                                  <circle cx="12" cy="14" r="3"/>
                                </svg>
                                <p class="text-white text-base font-semibold">{{ t('bar.photo.unavailable') }}</p>
                                <p class="text-white/70 text-[13px] sm:text-sm max-w-xs">{{ esp32Error() ? 'ESP32-CAM is connecting or offline.' : (errorMessage() || t('bar.photo.unavailableDesc')) }}</p>
                                <div class="flex gap-2.5 flex-wrap justify-center mt-1">
                                  <button (click)="retryPhotoCamera()"
                                          class="flex items-center gap-2 min-h-[44px] px-5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0 1 14-4M20 14a8 8 0 0 1-14 4"/>
                                    </svg>
                                    {{ t('bar.photo.tryAgain') }}
                                  </button>
                                  <button (click)="switchCameraMode(cameraMode() === 'esp32' ? 'webcam' : 'esp32')"
                                          class="flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition-all duration-150">
                                    {{ cameraMode() === 'esp32' ? 'Use Tablet Camera' : 'Use ESP32-CAM' }}
                                  </button>
                                </div>
                              </div>
                            } @else {
                              <!-- Camera element: ESP32-CAM MJPEG Stream or Video -->
                              @if (cameraMode() === 'esp32') {
                                <img #esp32StreamEl
                                     [src]="esp32StreamUrl()"
                                     (load)="onEsp32StreamLoad()"
                                     (error)="onEsp32StreamError()"
                                     crossorigin="anonymous"
                                     class="absolute inset-0 w-full h-full object-cover select-none pointer-events-none rotate-90 scale-[1.35]"
                                     alt="ESP32-CAM Live Preview" />
                              } @else {
                                <video #videoEl autoplay playsinline class="absolute inset-0 w-full h-full object-cover"></video>
                              }

                              <!-- Face-positioning guide (fades out slightly when the camera is live) -->
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

                              <!-- Camera status chip & mode switch -->
                              <div class="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 z-20">
                                <span class="h-2.5 w-2.5 rounded-full shrink-0"
                                      [class.bg-[#10B981]]="cameraReady()"
                                      [class.bg-[#FBBF24]]="!cameraReady()"></span>
                                @if (cameraReady()) {
                                  <span class="text-white text-[12px] font-semibold">{{ cameraMode() === 'esp32' ? 'ESP32-CAM (Live)' : t('bar.photo.cameraReady') }}</span>
                                } @else {
                                  <span class="text-white/80 text-[12px] font-semibold">Connecting...</span>
                                }
                              </div>

                              <!-- Switch Camera Mode (top-right chip) -->
                              <button (click)="switchCameraMode(cameraMode() === 'esp32' ? 'webcam' : 'esp32')"
                                      class="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 px-3 py-1.5 text-white text-[11px] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#F97316]">
                                <svg class="w-3.5 h-3.5 text-[#F97316]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0 1 14-4M20 14a8 8 0 0 1-14 4"/>
                                </svg>
                                {{ cameraMode() === 'esp32' ? 'Tablet Cam' : 'ESP32-CAM' }}
                              </button>
                            }
                          </div>

                          <!-- Actions -->
                          <div class="flex flex-col items-center justify-center gap-2.5 pt-3 sm:pt-3.5 pb-0.5">
                            @if (!capturedPhoto()) {
                              <button (click)="capturePhoto()" [disabled]="!cameraReady() || submitting()"
                                      class="flex items-center justify-center gap-2.5 min-h-[56px] min-w-[300px] px-7 rounded-xl bg-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] text-white text-base sm:text-lg font-semibold shadow-[0_4px_14px_rgba(249,115,22,0.35)] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F97316]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                                <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/>
                                  <circle cx="12" cy="13" r="3.5"/>
                                </svg>
                                @if (submitting()) { Capturing... } @else { {{ t('bar.photo.take') }} }
                              </button>
                              @if (cameraReady()) {
                                <p class="text-[13px] sm:text-sm text-[#64748B]">{{ t('bar.photo.waiting') }}</p>
                              }
                            } @else {
                              @if (enablePhotoValidation() && photoQualityError()) {
                                <div class="w-full max-w-[440px] mx-auto mb-2 p-3 rounded-xl bg-amber-50 border-2 border-amber-300 flex items-center gap-2.5 text-amber-900 shadow-sm text-left animate-shake">
                                  <svg class="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                                  </svg>
                                  <p class="text-xs sm:text-sm font-semibold leading-snug">{{ photoQualityError() }}</p>
                                </div>
                              }
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

                          @if (barangayService()?.form_fields && barangayService()!.form_fields!.length > 0) {
                            <div class="mt-2">
                              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
                                @for (field of barangayService()!.form_fields!; track field.key; let idx = $index) {
                                  <div class="flex items-start gap-3 pr-2 min-w-0 border-t border-[#F1F5F9] py-3.5"
                                       [class.sm:border-l]="idx % 2 === 1"
                                       [class.sm:border-[#F1F5F9]]="idx % 2 === 1"
                                       [class.sm:pl-6]="idx % 2 === 1">
                                    <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                                      <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                      </svg>
                                    </span>
                                    <div class="min-w-0">
                                      <p class="text-[13px] sm:text-sm font-medium text-[#64748B]">{{ fieldLabel(field) }}</p>
                                      <p class="text-[15px] sm:text-base font-semibold text-[#0F172A] break-words mt-0.5">{{ displayFormValue(field, formValues()[field.key]) }}</p>
                                    </div>
                                  </div>
                                }
                              </div>
                            </div>
                          } @else {
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
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                  </span>
                                  <div class="min-w-0">
                                    <p class="text-[13px] sm:text-sm font-medium text-[#64748B]">{{ t('bar.review.birthPlace') }}</p>
                                    <p class="text-[15px] sm:text-base font-semibold text-[#0F172A] break-words mt-0.5">{{ barangayForm.birthPlace || '—' }}</p>
                                  </div>
                                </div>
                                <div class="flex items-start gap-3 sm:border-l sm:border-[#F1F5F9] sm:pl-6 mt-3.5 sm:mt-0 pr-2 min-w-0">
                                  <span class="shrink-0 w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F97316]/20 flex items-center justify-center" aria-hidden="true">
                                    <svg class="w-[18px] h-[18px] text-[#F97316]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                                    </svg>
                                  </span>
                                  <div class="min-w-0">
                                    <p class="text-[13px] sm:text-sm font-medium text-[#64748B]">{{ t('bar.form.address') }}</p>
                                    <p class="text-[15px] sm:text-base font-semibold text-[#0F172A] break-words mt-0.5">{{ barangayForm.addressLine || '—' }}</p>
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
                          }
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
  private _videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoEl') set videoEl(el: ElementRef<HTMLVideoElement> | undefined) {
    if (el) {
      this._videoEl = el;
      if (this.stream && el.nativeElement) {
        el.nativeElement.srcObject = this.stream;
        this.cameraReady.set(true);
      }
    }
  }
  get videoEl(): ElementRef<HTMLVideoElement> | undefined {
    return this._videoEl;
  }

  private _inlineVideoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('inlineVideoEl') set inlineVideoEl(el: ElementRef<HTMLVideoElement> | undefined) {
    if (el) {
      this._inlineVideoEl = el;
      if (this.stream && el.nativeElement) {
        el.nativeElement.srcObject = this.stream;
        this.cameraReady.set(true);
      }
    }
  }
  get inlineVideoEl(): ElementRef<HTMLVideoElement> | undefined {
    return this._inlineVideoEl;
  }

  @ViewChild('esp32StreamEl') esp32StreamEl?: ElementRef<HTMLImageElement>;
  @ViewChild('inlineEsp32StreamEl') inlineEsp32StreamEl?: ElementRef<HTMLImageElement>;

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
  services = signal<Service[]>([]);
  selectedServices = signal<Service[]>([]);
  serviceIndex = signal(0);
  selectedService = computed<Service | null>(() => this.selectedServices()[this.serviceIndex()] ?? null);
  serviceForms = signal<Record<number, Record<string, unknown>>>({});
  servicePhotos = signal<Record<number, string>>({});
  serviceError = signal('');
  requestNumbers = signal<string[]>([]);
  barangayService = signal<Service | null>(null);
  kioskSettings = signal<Record<string, string>>({});
  activeApplicantDob = signal<string>('');
  activeApplicantAge = computed<number | null>(() => this.calculateAge(this.activeApplicantDob()));
  isApplicantUnderage = computed<boolean>(() => {
    const age = this.activeApplicantAge();
    return age !== null && age < this.getBarangayIdMinAge();
  });
  isApplicantMinor = computed<boolean>(() => {
    const age = this.activeApplicantAge();
    return age !== null && age >= this.getBarangayIdMinAge() && age < this.getBarangayIdAdultAge();
  });
  isApplicantAdult = computed<boolean>(() => {
    const age = this.activeApplicantAge();
    return age === null || age >= this.getBarangayIdAdultAge();
  });
  showBarangayDobError = signal<boolean>(false);
  showGuestDobError = signal<boolean>(false);
  photoQualityError = signal<string>('');
  photoValid = signal<boolean>(false);
  enablePhotoValidation = signal<boolean>(environment.enablePhotoValidation ?? false);
  private photoQualityErrorTimer: any;
  private barangayDobErrorTimer: any;
  private guestDobErrorTimer: any;
  private formErrorTimer: any;
  private formErrorsTimer: any;
  capturedPhoto = signal<string | null>(null);
  capturedSignature = signal<string | null>(null);
  requestNumber = signal('');
  errorMessage = signal('');
  cameraReady = signal(false);
  availableCameras = signal<MediaDeviceInfo[]>([]);
  currentCameraIndex = signal<number>(0);
  useIpCamera = signal(false);
  ipCameraUrl = signal('http://localhost:4747/video');

  // ESP32-CAM signals
  cameraMode = signal<'esp32' | 'webcam'>('esp32');
  esp32StreamUrl = signal<string>(environment.esp32CamStreamUrl || 'http://192.168.254.111/stream');
  esp32CaptureUrl = signal<string>(environment.esp32CamCaptureUrl || 'http://192.168.254.111/capture');
  esp32Error = signal<boolean>(false);

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

  t(key: string, params?: Record<string, any>): string {
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
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    birthDate: '',
    birthPlace: '',
    gender: 'Male',
    civilStatus: 'Single',
    nationality: 'Filipino',
    religion: '',
    occupation: '',
    bloodType: '',
    contactNumber: '',
    email: '',
    subdivision: '',
    street: '',
    block: '',
    lot: '',
    houseNumber: '',
    purokZone: '',
    sitio: '',
    municipality: 'San Manuel',
    province: 'Tarlac',
    zipCode: '',
    address: ''
  };

  barangayForm = {
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    birthDate: '',
    birthPlace: '',
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
    this.rfidScanService.connect();
    this.rfidScanSub = this.rfidScanService.scans().subscribe(event => this.handleRfidScan(event.uid));
    this.rfidConnectionSub = this.rfidScanService.connection().subscribe(connected => {
      this.rfidConnected.set(connected);
    });
    // Preload the Barangay ID service requirements and kiosk settings
    this.loadBarangayService();
    this.loadKioskSettings();
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
    this.selectedServices.set(savedState.selectedServices ?? []);
    this.serviceIndex.set(savedState.serviceIndex ?? 0);
    this.serviceForms.set(savedState.serviceForms ?? {});
    this.servicePhotos.set(savedState.servicePhotos ?? {});
    this.barangayService.set(savedState.barangayService);
    this.capturedPhoto.set(savedState.capturedPhoto);
    this.capturedSignature.set(savedState.capturedSignature);
    this.requestNumber.set(savedState.requestNumber);
    this.formValues.set(savedState.formValues);
    this.inlinePhotos.set(savedState.inlinePhotos);
    this.activePhotoField.set(savedState.activePhotoField);
    this.guestForm = { ...this.guestForm, ...(savedState.guestForm || {}) };
    this.barangayForm = { ...this.barangayForm, ...savedState.barangayForm };
    this.submissionKey = savedState.submissionKey;
    const restoredDob = this.guestForm.birthDate || this.barangayForm.birthDate || (savedState.resident?.birth_date ? String(savedState.resident.birth_date).slice(0, 10) : '') || '';
    if (restoredDob) {
      this.activeApplicantDob.set(restoredDob);
    }


    // Restore language preference and sync the TranslationService
    if (savedState.language) {
      this.language.set(savedState.language);
      this.translations.setLanguage(savedState.language);
    }

    // Reconnect RFID if we were in RFID mode or Home mode
    this.rfidScanService.connect();

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
        selectedServices: this.selectedServices(),
        serviceIndex: this.serviceIndex(),
        serviceForms: this.serviceForms(),
        servicePhotos: this.servicePhotos(),
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
    this.kioskService.getBarangayIdConfig().subscribe({
      next: (result: any) => {
        if (result?.data) {
          this.barangayService.set(result.data);
        }
      },
      error: () => {
        // Fallback in case endpoint is not reached
        this.kioskService.getServices().subscribe({
          next: (result: any) => {
            this.barangayService.set((result?.data || []).find((s: Service) => s.service_name && s.service_name.trim().toLowerCase() === 'barangay id') || null);
          }
        });
      }
    });
  }

  loadKioskSettings() {
    this.kioskService.getSettings().subscribe({
      next: (result: any) => {
        if (result?.data) {
          this.kioskSettings.set(result.data);
        }
      },
      error: (err) => console.warn('Could not load kiosk settings:', err)
    });
  }

  triggerBarangayDobError(durationMs = 3000) {
    this.showBarangayDobError.set(true);
    clearTimeout(this.barangayDobErrorTimer);
    this.barangayDobErrorTimer = setTimeout(() => {
      this.showBarangayDobError.set(false);
      this.formErrors.update(e => {
        const next = { ...e };
        Object.keys(next).forEach(k => {
          if (k.toLowerCase().includes('birth') || k.toLowerCase().includes('dob')) delete next[k];
        });
        return next;
      });
    }, durationMs);
  }

  triggerGuestDobError(durationMs = 3000) {
    this.showGuestDobError.set(true);
    clearTimeout(this.guestDobErrorTimer);
    this.guestDobErrorTimer = setTimeout(() => {
      this.showGuestDobError.set(false);
    }, durationMs);
  }

  triggerFormError(msg: string, durationMs = 3000) {
    this.formError.set(msg);
    clearTimeout(this.formErrorTimer);
    this.formErrorTimer = setTimeout(() => {
      this.formError.set('');
    }, durationMs);
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
    this.mode.set('guest');
    this.resetIdleTimer();
    this.saveState();
  }

  resetGuestForm() {
    this.guestForm = {
      fullName: '',
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      birthDate: '',
      birthPlace: '',
      gender: 'Male',
      civilStatus: 'Single',
      nationality: 'Filipino',
      religion: '',
      occupation: '',
      bloodType: '',
      contactNumber: '',
      email: '',
      subdivision: '',
      street: '',
      block: '',
      lot: '',
      houseNumber: '',
      purokZone: '',
      sitio: '',
      municipality: 'San Manuel',
      province: 'Tarlac',
      zipCode: '',
      address: ''
    };
    this.guestSubmitted.set(false);
    this.activeApplicantDob.set('');
  }

  startGuestRequest() {
    this.stopCamera();
    this.errorMessage.set('');
    this.formError.set('');
    this.resetGuestForm();
    this.loadKioskSettings();
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
    this.loadKioskSettings();
    this.loadBarangayService();
    if (this.resident()) {
      this.populateBarangayFromResident(this.resident()!);
    } else {
      this.activeApplicantDob.set(this.barangayForm.birthDate || '');
    }
    this.mode.set('barangay');
    this.barangayStep.set('requirements');
    this.resetIdleTimer();
    this.saveState();
  }

  private populateBarangayFromResident(r: Resident) {
    const bDate = r.birth_date ? r.birth_date.split('T')[0] : '';
    this.barangayForm = {
      firstName: r.first_name || '',
      middleName: r.middle_name || '',
      lastName: r.last_name || '',
      suffix: r.suffix || '',
      birthDate: bDate,
      birthPlace: r.birth_place || '',
      gender: r.gender || '',
      civilStatus: r.civil_status || '',
      occupation: r.occupation || '',
      bloodType: r.blood_type || '',
      addressLine: r.address_line || '',
      contactNumber: r.contact_number || '',
      email: r.email || '',
      emergencyContactName: r.emergency_contact_name || '',
      emergencyContactNumber: r.emergency_contact_number || ''
    };

    // Pre-populate dynamic form fields matching resident keys
    const currentValues = { ...this.formValues() };
    const fields = this.barangayService()?.form_fields || [];
    for (const f of fields) {
      if (currentValues[f.key] !== undefined && currentValues[f.key] !== '') continue;
      const keyLower = f.key.toLowerCase().replace(/[\s_-]/g, '');
      if (keyLower === 'firstname' || keyLower === 'fname') currentValues[f.key] = r.first_name || '';
      else if (keyLower === 'middlename' || keyLower === 'mname') currentValues[f.key] = r.middle_name || '';
      else if (keyLower === 'lastname' || keyLower === 'lname' || keyLower === 'surname') currentValues[f.key] = r.last_name || '';
      else if (keyLower === 'suffix') currentValues[f.key] = r.suffix || '';
      else if (keyLower === 'birthdate' || keyLower === 'dob' || keyLower === 'dateofbirth') currentValues[f.key] = r.birth_date ? r.birth_date.split('T')[0] : '';
      else if (keyLower === 'age') currentValues[f.key] = this.calculateAge(r.birth_date) ?? '';
      else if (keyLower === 'birthplace' || keyLower === 'pob' || keyLower === 'placeofbirth') currentValues[f.key] = r.birth_place || '';
      else if (keyLower === 'gender' || keyLower === 'sex') currentValues[f.key] = r.gender || '';
      else if (keyLower === 'civilstatus') currentValues[f.key] = r.civil_status || '';
      else if (keyLower === 'address' || keyLower === 'addressline') currentValues[f.key] = r.address_line || '';
      else if (keyLower === 'contactnumber' || keyLower === 'contact' || keyLower === 'phone' || keyLower === 'mobilenumber') currentValues[f.key] = r.contact_number || '';
      else if (keyLower === 'email') currentValues[f.key] = r.email || '';
      else if (keyLower === 'emergencycontactname' || keyLower === 'emergencyname') currentValues[f.key] = r.emergency_contact_name || '';
      else if (keyLower === 'emergencycontactnumber' || keyLower === 'emergencynumber') currentValues[f.key] = r.emergency_contact_number || '';
    }
    this.formValues.set(currentValues);
    if (this.barangayForm.birthDate) {
      this.onDobChange(this.barangayForm.birthDate);
    }
  }

  private resetBarangayForm() {
    this.barangaySubmitted.set(false);
    this.activeApplicantDob.set('');
    this.barangayForm = {
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      birthDate: '',
      birthPlace: '',
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
    const currentMode = this.mode();
    console.log('[Kiosk Component] Processing RFID card tap with UID:', uid, 'in mode:', currentMode);
    this.errorMessage.set('');
    this.rfidError.set('');

    // If currently on Barangay ID flow, auto-fill resident info
    if (currentMode === 'barangay') {
      this.kioskService.verifyRfid(uid).subscribe({
        next: (result: any) => {
          const data = result?.data;
          if (data?.recognized && data.resident) {
            console.log('[Kiosk Component] Auto-filling Barangay ID form with resident details:', data.resident.first_name);
            this.resident.set(data.resident);
            this.rfidCard.set(data?.rfid || null);
            this.populateBarangayFromResident(data.resident);
            this.cdr.detectChanges();
            this.saveState();
          }
        }
      });
      return;
    }

    // Allow scan on home, rfid (scan/error), or resident profile screen
    if (currentMode !== 'home' && currentMode !== 'rfid' && !(currentMode === 'documents' && this.currentStep() === 'welcome')) {
      return;
    }

    console.log('[Kiosk Component] Processing RFID card tap with UID:', uid);
    this.mode.set('rfid');
    this.rfidStep.set('scan');
    this.rfidDetected.set(true);

    this.kioskService.verifyRfid(uid).subscribe({
      next: (result: any) => {
        const data = result?.data;
        if (data?.recognized && data.resident) {
          console.log('[Kiosk Component] Resident recognized successfully:', data.resident.first_name, data.resident.last_name);
          this.rfidDetected.set(false);
          this.rfidStep.set('search');
          this.resident.set(data.resident);
          this.rfidCard.set(data?.rfid || null);
          this.mode.set('documents');
          this.currentStep.set('welcome');
          this.resetIdleTimer();
          this.cdr.detectChanges();
          this.saveState();
        } else {
          console.warn('[Kiosk Component] RFID card not recognized:', result);
          this.rfidDetected.set(false);
          this.rfidError.set(data?.message || this.t('err.rfid.notRecognized'));
          this.mode.set('rfid');
          this.rfidStep.set('error');
          this.resetIdleTimer();
          this.cdr.detectChanges();
          this.saveState();
        }
      },
      error: (err: any) => {
        console.error('[Kiosk Component] RFID verification request failed:', err);
        this.rfidDetected.set(false);
        this.rfidError.set(err?.error?.message || this.t('err.rfid.serverError'));
        this.mode.set('rfid');
        this.rfidStep.set('error');
        this.resetIdleTimer();
        this.cdr.detectChanges();
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





  // ============================================================
  // DOCUMENTS FLOW: WORKFLOW STEPS
  // ============================================================

  proceedToServices() {
    this.loadServices();
    this.currentStep.set('services');
    this.resetIdleTimer();
    this.saveState();
  }



  toggleService(service: Service) {
    const current = this.selectedServices();
    const exists = current.some(s => s.service_id === service.service_id);
    this.selectedServices.set(exists ? current.filter(s => s.service_id !== service.service_id) : [...current, service]);
    if (this.serviceError()) this.serviceError.set('');
    this.saveState();
  }

  isServiceSelected(service: Service): boolean {
    return this.selectedServices().some(s => s.service_id === service.service_id);
  }

  selectedServiceCount(): number {
    return this.selectedServices().length;
  }

  selectedTotalFee(): number {
    return this.selectedServices().reduce((sum, s) => sum + (Number(s.processing_fee) || 0), 0);
  }

  proceedFromServices() {
    if (this.selectedServices().length === 0) {
      this.serviceError.set(this.t('doc.services.required'));
      return;
    }
    this.loadKioskSettings();
    const dob = this.resident()?.birth_date ? String(this.resident()!.birth_date).slice(0, 10) : (this.guestForm.birthDate || '');
    if (dob) {
      this.activeApplicantDob.set(dob);
    }
    this.serviceError.set('');
    this.serviceIndex.set(0);
    this.loadServiceForm();
    this.currentStep.set('requirements');
    this.resetIdleTimer();
    this.saveState();
  }

  onResidentUpdated(updated: Resident) {
    console.log('[Kiosk Component] Resident profile updated for session:', updated.first_name, updated.last_name);
    this.resident.set(updated);
    this.serviceForms.set({});
    this.formValues.set({});
    this.saveState();
  }

  // Load (or initialize) the form values for the currently active service.
  // Automatically populates all matching fields from the verified Resident Record.
  private loadServiceForm() {
    const svc = this.selectedService();
    if (!svc) return;
    const saved = this.serviceForms()[svc.service_id];
    if (saved) {
      this.formValues.set(saved);
      this.formErrors.set({});
      return;
    }
    const defaults: Record<string, unknown> = {};
    for (const field of svc.form_fields || []) {
      if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== '') {
        defaults[field.key] = field.defaultValue;
      }
    }

    const resident = this.resident();
    if (resident) {
      for (const field of svc.form_fields || []) {
        if (defaults[field.key] === undefined || defaults[field.key] === null || defaults[field.key] === '') {
          const autoVal = this.resolveResidentFieldValue(resident, field.key, field.label);
          if (autoVal !== null && autoVal !== undefined && autoVal !== '') {
            defaults[field.key] = autoVal;
          }
        }
      }
    } else if (this.guestForm.firstName || this.guestForm.lastName || this.guestForm.fullName || this.guestForm.birthDate) {
      const g = this.guestForm;
      const computedFullName = (g.firstName || g.lastName)
        ? [g.firstName, g.middleName, g.lastName, g.suffix].filter(Boolean).join(' ').trim()
        : (g.fullName || '').trim();
      const guestResident: Partial<Resident> = {
        first_name: g.firstName || computedFullName,
        middle_name: g.middleName,
        last_name: g.lastName,
        suffix: g.suffix,
        birth_date: g.birthDate,
        birth_place: g.birthPlace,
        gender: g.gender,
        civil_status: g.civilStatus,
        nationality: g.nationality,
        religion: g.religion,
        occupation: g.occupation,
        blood_type: g.bloodType,
        contact_number: g.contactNumber,
        email: g.email,
        subdivision: g.subdivision,
        street: g.street,
        block: g.block,
        lot: g.lot,
        house_number: g.houseNumber,
        purok_zone: g.purokZone,
        sitio: g.sitio,
        municipality: g.municipality,
        province: g.province,
        zip_code: g.zipCode,
        address_line: g.address
      };
      for (const field of svc.form_fields || []) {
        if (defaults[field.key] === undefined || defaults[field.key] === null || defaults[field.key] === '') {
          const autoVal = this.resolveResidentFieldValue(guestResident as Resident, field.key, field.label);
          if (autoVal !== null && autoVal !== undefined && autoVal !== '') {
            defaults[field.key] = autoVal;
          }
        }
      }
    }
    this.formValues.set(defaults);
    this.formErrors.set({});
  }

  // Intelligent resolution for resident demographic & address fields
  private resolveResidentFieldValue(r: Resident, key: string, label: string = ''): any {
    if (!r) return null;
    const normKey = (key || '').toLowerCase().replace(/[-_\s.]/g, '');
    const normLabel = (label || '').toLowerCase().replace(/[-_\s.]/g, '');

    const isMatch = (...aliases: string[]) => {
      return aliases.some(a => {
        const normA = a.toLowerCase().replace(/[-_\s.]/g, '');
        return normKey === normA || normLabel === normA || normKey.includes(normA) || normLabel.includes(normA);
      });
    };

    // Full Name
    if (isMatch('fullname', 'full_name', 'applicantname', 'residentname', 'completename', 'nameofresident') && !isMatch('emergency', 'relative', 'father', 'mother', 'spouse', 'guardian')) {
      const parts = [r.first_name, r.middle_name, r.last_name, r.suffix].filter(Boolean);
      return parts.join(' ');
    }
    // First Name
    if (isMatch('firstname', 'first_name', 'givenname') && !isMatch('emergency', 'relative', 'father', 'mother', 'spouse', 'guardian')) {
      return r.first_name || '';
    }
    // Middle Name
    if (isMatch('middlename', 'middle_name') && !isMatch('emergency', 'relative', 'father', 'mother', 'spouse', 'guardian')) {
      return r.middle_name || '';
    }
    // Last Name
    if (isMatch('lastname', 'last_name', 'surname', 'familyname') && !isMatch('emergency', 'relative', 'father', 'mother', 'spouse', 'guardian')) {
      return r.last_name || '';
    }
    // Suffix
    if (isMatch('suffix', 'namesuffix') && !isMatch('emergency', 'relative', 'father', 'mother', 'spouse', 'guardian')) {
      return r.suffix || '';
    }
    // Birth Date / DOB
    if (isMatch('birthdate', 'birth_date', 'dateofbirth', 'dob', 'bdate')) {
      return this.formatDate(r.birth_date);
    }
    // Place of Birth
    if (isMatch('birthplace', 'birth_place', 'placeofbirth', 'pob')) {
      return r.birth_place || '';
    }
    // Age
    if (isMatch('age', 'ageyears')) {
      const computedAge = this.calculateAge(r.birth_date);
      return computedAge !== null ? computedAge : '';
    }
    // Gender / Sex
    if (isMatch('gender', 'sex')) {
      return r.gender || '';
    }
    // Civil Status
    if (isMatch('civilstatus', 'civil_status', 'maritalstatus')) {
      return r.civil_status || '';
    }
    // Blood Type
    if (isMatch('bloodtype', 'blood_type')) {
      return r.blood_type || '';
    }
    // Occupation
    if (isMatch('occupation', 'profession', 'job')) {
      return r.occupation || '';
    }
    // Nationality / Citizenship
    if (isMatch('nationality', 'citizenship')) {
      return r.nationality || 'Filipino';
    }
    // Religion
    if (isMatch('religion')) {
      return r.religion || '';
    }
    // Contact Number
    if (isMatch('contactnumber', 'contact_number', 'contactno', 'contact_no', 'phone', 'phonenumber', 'mobile', 'mobilenumber', 'cellphone', 'tel') && !isMatch('emergency')) {
      return r.contact_number || '';
    }
    // Email
    if (isMatch('email', 'emailaddress', 'email_address')) {
      return r.email || '';
    }
    // Complete Address
    if (isMatch('completeaddress', 'complete_address', 'addressline', 'address_line', 'residentialaddress') || (isMatch('address') && !isMatch('email', 'block', 'lot', 'street', 'purok', 'zone', 'subdivision'))) {
      return r.address_line || '';
    }
    // Block
    if (isMatch('block', 'blockno', 'block_no', 'blocknumber', 'blk')) {
      return r.block || this.extractBlock(r.address_line) || '';
    }
    // Lot
    if (isMatch('lot', 'lotno', 'lot_no', 'lotnumber')) {
      return r.lot || this.extractLot(r.address_line) || '';
    }
    // House No
    if (isMatch('housenumber', 'house_number', 'houseno', 'house_no')) {
      return r.house_number || '';
    }
    // Street
    if (isMatch('street', 'streetname', 'street_name', 'st')) {
      return r.street || this.extractStreet(r.address_line) || '';
    }
    // Subdivision
    if (isMatch('subdivision', 'subd', 'village')) {
      return r.subdivision || this.extractSubdivision(r.address_line) || '';
    }
    // Purok / Zone / Sitio
    if (isMatch('purok', 'zone', 'purokzone', 'purok_zone', 'purokno', 'sitio')) {
      return r.purok_zone || r.sitio || this.extractPurok(r.address_line) || '';
    }
    // Emergency Contact Person
    if (isMatch('emergencycontactname', 'emergency_contact_name', 'emergencyname', 'emergency_name', 'emergencycontactperson', 'emergencycontact')) {
      return r.emergency_contact_name || '';
    }
    // Emergency Contact Number
    if (isMatch('emergencycontactnumber', 'emergency_contact_number', 'emergencycontactno', 'emergency_contact_no', 'emergencyphone', 'emergencymobile')) {
      return r.emergency_contact_number || '';
    }

    // Generic fallback: check if r has exact matching property
    if ((r as any)[key] !== undefined && (r as any)[key] !== null) {
      return (r as any)[key];
    }

    return null;
  }

  private extractBlock(addr: string | null | undefined): string | null {
    if (!addr) return null;
    const m = addr.match(/(?:blk|block)\.?\s*([0-9a-z-]+)/i);
    return m ? m[1] : null;
  }

  private extractLot(addr: string | null | undefined): string | null {
    if (!addr) return null;
    const m = addr.match(/(?:lot)\.?\s*([0-9a-z-]+)/i);
    return m ? m[1] : null;
  }

  private extractStreet(addr: string | null | undefined): string | null {
    if (!addr) return null;
    const m = addr.match(/(?:,\s*|\b)([0-9a-z\s]+?(?:street|st\.|st|ave|avenue|dr|drive|rd|road))\b/i);
    return m ? m[1].trim() : null;
  }

  private extractPurok(addr: string | null | undefined): string | null {
    if (!addr) return null;
    const m = addr.match(/(?:purok|zone|prk|zn)\.?\s*([0-9a-z-]+)/i);
    return m ? `Purok ${m[1]}` : null;
  }

  private extractSubdivision(addr: string | null | undefined): string | null {
    if (!addr) return null;
    const m = addr.match(/(?:,\s*|\b)([0-9a-z\s]+?(?:subd|subdivision|village|homes|estates))\b/i);
    return m ? m[1].trim() : null;
  }

  // Persist the current form values against the active service.
  private stashActiveForm() {
    const svc = this.selectedService();
    if (!svc) return;
    this.serviceForms.update(m => ({ ...m, [svc.service_id]: this.formValues() }));
  }

  // Persist the current captured photo against the active service.
  private stashActivePhoto() {
    const svc = this.selectedService();
    if (!svc) return;
    this.servicePhotos.update(m => ({ ...m, [svc.service_id]: this.capturedPhoto() ?? '' }));
  }

  // After a service's form (+ photo) is done, move to the next selected service
  // or land on the review step when all services are filled.
  private advanceOrReview() {
    const idx = this.serviceIndex();
    if (idx + 1 < this.selectedServices().length) {
      this.serviceIndex.set(idx + 1);
      this.loadServiceForm();
      this.currentStep.set('requirements');
    } else {
      this.currentStep.set('review');
    }
    this.resetIdleTimer();
    this.saveState();
  }

  proceedToForm() {
    if (this.isApplicantUnderage()) {
      return;
    }
    this.loadServiceForm();
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
    this.formValues.update(v => {
      const updated = { ...v, [key]: value };
      const keyLower = (key || '').toLowerCase();
      if (keyLower.includes('birth') || keyLower === 'dob' || keyLower === 'dateofbirth') {
        if (value && typeof value === 'string') {
          this.activeApplicantDob.set(value.trim());
        }
        const computedAge = this.calculateAge(value);
        if (computedAge !== null) {
          const fields = this.selectedService()?.form_fields || this.barangayService()?.form_fields || [];
          const ageField = fields.find(f => f.key.toLowerCase() === 'age' || (f.label && f.label.toLowerCase() === 'age'));
          if (ageField) {
            updated[ageField.key] = computedAge;
          }
        }
      }
      return updated;
    });
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

  // Look up a single submitted form value by field key (for the review summary).
  reviewFormValue(key: string): string {
    const field = this.selectedService()?.form_fields?.find((f) => f.key === key);
    return field ? this.displayFormValue(field, this.formValues()[key]) : '—';
  }

  // "May 12, 2026 • 11:20 AM" style timestamp for the request summary.
  formatRequestedOn(): string {
    const d = this.currentDateTime();
    const date = d.toLocaleDateString(this.language() === 'fil' ? 'fil-PH' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const time = d.toLocaleTimeString(this.language() === 'fil' ? 'fil-PH' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${date} • ${time}`;
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
    if (!service) return;

    // Persist this service's form values before advancing.
    this.serviceForms.update(m => ({ ...m, [service.service_id]: this.formValues() }));

    if (service.requires_photo) {
      this.capturedPhoto.set(this.servicePhotos()[service.service_id] ?? null);
      this.currentStep.set('photo');
      this.resetIdleTimer();
      setTimeout(() => this.startCamera(), 100);
    } else {
      this.advanceOrReview();
    }
    this.saveState();
  }

  todayDateString(): string {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  parseBirthDate(birthDate: string | Date | null | undefined): { year: number; month: number; day: number } | null {
    if (!birthDate) return null;
    if (birthDate instanceof Date) {
      if (isNaN(birthDate.getTime())) return null;
      return {
        year: birthDate.getFullYear(),
        month: birthDate.getMonth(),
        day: birthDate.getDate()
      };
    }
    const s = String(birthDate).trim();
    const match = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        return { year, month, day };
      }
    }
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }

  maxBirthDateString(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  calculateAge(birthDate: string | Date | null | undefined): number | null {
    const parsed = this.parseBirthDate(birthDate);
    if (!parsed) return null;
    const today = new Date();
    let age = today.getFullYear() - parsed.year;
    const m = today.getMonth() - parsed.month;
    if (m < 0 || (m === 0 && today.getDate() < parsed.day)) {
      age--;
    }
    return age;
  }

  getBarangayIdMinAge(): number {
    const val = this.kioskSettings()['barangay_id_min_age'];
    return val ? parseInt(val, 10) || 15 : 15;
  }

  getBarangayIdAdultAge(): number {
    const val = this.kioskSettings()['barangay_id_adult_age'];
    return val ? parseInt(val, 10) || 18 : 18;
  }

  onDobChange(val: string | Event | unknown) {
    let dateStr = '';
    if (typeof val === 'string') {
      dateStr = val.trim();
    } else if (val && typeof val === 'object' && 'target' in val) {
      dateStr = ((val as Event).target as HTMLInputElement)?.value?.trim() || '';
    } else {
      dateStr = String(val || '').trim();
    }

    this.activeApplicantDob.set(dateStr);

    if (this.mode() === 'barangay') {
      this.barangayForm.birthDate = dateStr;
    } else {
      this.guestForm.birthDate = dateStr;
    }

    // Sync formValues if dynamic form has a birth_date field
    const fields = this.selectedService()?.form_fields || this.barangayService()?.form_fields || [];
    const dobField = fields.find(f => this.isBirthDateField(f));
    if (dobField) {
      this.updateFormValue(dobField.key, dateStr);
    }

    const age = this.calculateAge(dateStr);
    if (age !== null && age >= this.getBarangayIdMinAge()) {
      this.showBarangayDobError.set(false);
      this.showGuestDobError.set(false);
    }
  }

  getAdultConfiguredRequirements(service?: Service | null): string[] {
    const svc = service || this.selectedService() || this.barangayService();
    if (svc?.requirements && svc.requirements.length > 0) {
      return svc.requirements;
    }
    const adultReqs = this.kioskSettings()['barangay_id_adult_reqs'];
    if (adultReqs && adultReqs.trim()) {
      return adultReqs.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    }
    return [
      'Proof of Residency',
      'Valid Government ID or Barangay Clearance',
      'Barangay ID Application Form'
    ];
  }

  getMinorConfiguredRequirements(): string[] {
    const minorReqs = this.kioskSettings()['barangay_id_minor_reqs'];
    if (minorReqs && minorReqs.trim()) {
      return minorReqs.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    }
    return [
      'Proof of Residency',
      'Purok/Zone Certification or Clearance',
      'Barangay ID Application Form'
    ];
  }

  getApplicableRequirementsForService(service?: Service | null): string[] {
    const age = this.activeApplicantAge();
    const minAge = this.getBarangayIdMinAge();
    const adultAge = this.getBarangayIdAdultAge();

    // 1. Below 15 (< minAge): Underage / Ineligible
    if (age !== null && age < minAge) {
      return [];
    }

    // 2. 15–17 (Minor: >= minAge && < adultAge)
    if (age !== null && age < adultAge) {
      return this.getMinorConfiguredRequirements();
    }

    // 3. 18+ (Adult: >= adultAge or unknown/not yet entered)
    return this.getAdultConfiguredRequirements(service);
  }

  getBarangayIdRequirementsList(): string[] {
    return this.getApplicableRequirementsForService(this.barangayService());
  }

  validateBirthDateValue(val: unknown, label: string, serviceName?: string): string | null {
    if (this.isEmptyValue(val)) return null;
    const age = this.calculateAge(val as string);
    if (age === null || isNaN(age)) {
      return this.t('err.invalidDate', { field: label });
    }
    if (age < 1) {
      return this.t('err.birthDateMinAge', { field: label });
    }
    if (age > 125) {
      return this.t('err.birthDateRange', { field: label });
    }
    const svcName = serviceName || this.selectedService()?.service_name || '';
    if (this.mode() === 'barangay' || /barangay[- ]?id/i.test(svcName)) {
      const minAge = this.getBarangayIdMinAge();
      if (age < minAge) {
        return this.t('err.barangayIdMinAge', { minAge });
      }
    }
    if (/senior/i.test(svcName) && age < 60) {
      return this.t('err.minServiceAge', { service: svcName, minAge: 60 });
    }
    if (/first[- ]?time job seeker/i.test(svcName) && age < 15) {
      return this.t('err.minServiceAge', { service: svcName, minAge: 15 });
    }
    if (/solo parent/i.test(svcName) && age < 18) {
      return this.t('err.minServiceAge', { service: svcName, minAge: 18 });
    }
    return null;
  }

  isBirthDateField(field: FormField): boolean {
    const key = (field.key || '').toLowerCase();
    const label = (field.label || '').toLowerCase();
    return field.type === 'date' && (key.includes('birth') || label.includes('birth') || key === 'dob' || key === 'dateofbirth');
  }

  getGuestAge(): number | null {
    return this.calculateAge(this.guestForm.birthDate);
  }

  getBarangayAge(): number | null {
    return this.calculateAge(this.barangayForm.birthDate);
  }

  getDynamicFieldAge(key: string): number | null {
    return this.calculateAge(this.formValues()[key] as string);
  }

  getGuestDobErrorMessage(): string {
    const g = this.guestForm;
    if (!g.birthDate) {
      return this.t('err.guest.birthDate') || this.t('err.bar.birthDate') || 'Please select a valid Date of Birth.';
    }
    const err = this.validateBirthDateValue(g.birthDate, this.t('doc.guestInfo.birthDate') || 'Date of Birth');
    return err || 'Please select a valid Date of Birth.';
  }

  getBarangayDobErrorMessage(): string {
    const f = this.barangayForm;
    if (!f.birthDate) {
      return this.t('err.bar.birthDate') || 'Please select a valid Date of Birth.';
    }
    const err = this.validateBirthDateValue(f.birthDate, this.t('bar.form.birthDate') || 'Birth Date');
    return err || 'Please select a valid Date of Birth.';
  }

  isBarangayFormDobInvalid(): boolean {
    const minAge = this.getBarangayIdMinAge();
    const fields = this.barangayService()?.form_fields;
    if (fields && fields.length > 0) {
      const dobField = fields.find(f => this.isBirthDateField(f));
      if (dobField) {
        const val = this.formValues()[dobField.key];
        if (val) {
          const age = this.calculateAge(val as string);
          if (age === null || age < minAge || age > 125) return true;
        }
      }
    } else {
      const f = this.barangayForm;
      if (f.birthDate) {
        const age = this.calculateAge(f.birthDate);
        if (age === null || age < minAge || age > 125) return true;
      }
    }
    return false;
  }

  isGuestDobInvalid(): boolean {
    const g = this.guestForm;
    if (g.birthDate) {
      const age = this.calculateAge(g.birthDate);
      if (age === null || age < 1 || age > 125) return true;
    }
    return false;
  }

  // ============================================================
  // INPUT SANITIZATION & FILTERING HELPERS (Physical & Touchscreen)
  // ============================================================

  filterNumberKeyDown(event: KeyboardEvent) {
    if (
      ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'].includes(event.key) ||
      event.ctrlKey || event.metaKey
    ) {
      return;
    }
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  filterNameKeyDown(event: KeyboardEvent) {
    if (
      ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'].includes(event.key) ||
      event.ctrlKey || event.metaKey
    ) {
      return;
    }
    if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizePhone(val: string): string {
    if (!val) return '';
    return val.replace(/\D/g, '').slice(0, 11);
  }

  sanitizeDigits(val: string, maxLen?: number): string {
    if (!val) return '';
    const digits = val.replace(/\D/g, '');
    return maxLen ? digits.slice(0, maxLen) : digits;
  }

  sanitizeName(val: string, maxLen = 100): string {
    if (!val) return '';
    return val.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']/g, '').slice(0, maxLen);
  }

  onGuestNameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const clean = this.sanitizeName(input.value, 100);
    input.value = clean;
    this.guestForm.fullName = clean;
  }

  onGuestNamePaste(event: ClipboardEvent) {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const clean = this.sanitizeName(text, 100);
    const input = event.target as HTMLInputElement;
    input.value = clean;
    this.guestForm.fullName = clean;
  }

  onGuestNameFieldInput(field: 'firstName' | 'middleName' | 'lastName', event: Event) {
    const input = event.target as HTMLInputElement;
    const clean = this.sanitizeName(input.value, 50);
    input.value = clean;
    this.guestForm[field] = clean;
    this.guestForm.fullName = [this.guestForm.firstName, this.guestForm.middleName, this.guestForm.lastName, this.guestForm.suffix].filter(Boolean).join(' ').trim();
  }

  onGuestNameFieldPaste(field: 'firstName' | 'middleName' | 'lastName', event: ClipboardEvent) {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const clean = this.sanitizeName(text, 50);
    const input = event.target as HTMLInputElement;
    input.value = clean;
    this.guestForm[field] = clean;
    this.guestForm.fullName = [this.guestForm.firstName, this.guestForm.middleName, this.guestForm.lastName, this.guestForm.suffix].filter(Boolean).join(' ').trim();
  }

  autoComposeGuestAddress(force = false) {
    const g = this.guestForm;
    const rawParts = [
      g.block ? (g.block.toLowerCase().startsWith('blk') ? g.block : `Blk ${g.block}`) : null,
      g.lot ? (g.lot.toLowerCase().startsWith('lot') ? g.lot : `Lot ${g.lot}`) : null,
      g.street,
      g.subdivision,
      g.purokZone,
      g.sitio,
      g.municipality,
      g.province
    ].filter(x => !!x && String(x).trim() !== '');

    const uniqueParts: string[] = [];
    for (const part of rawParts) {
      if (part && !uniqueParts.some(p => p.toLowerCase() === String(part).toLowerCase())) {
        uniqueParts.push(part);
      }
    }

    if (uniqueParts.length > 0) {
      g.address = uniqueParts.join(', ');
    }
  }

  updateGuestAddressField(field: string, val: string) {
    (this.guestForm as any)[field] = val;
    this.autoComposeGuestAddress();
  }

  onGuestPhoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const clean = this.sanitizePhone(input.value);
    input.value = clean;
    this.guestForm.contactNumber = clean;
  }

  onGuestPhonePaste(event: ClipboardEvent) {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const clean = this.sanitizePhone(text);
    const input = event.target as HTMLInputElement;
    input.value = clean;
    this.guestForm.contactNumber = clean;
  }

  onBarangayNameInput(key: 'firstName' | 'middleName' | 'lastName' | 'emergencyContactName', event: Event) {
    const input = event.target as HTMLInputElement;
    const maxLen = key === 'emergencyContactName' ? 100 : 50;
    const clean = this.sanitizeName(input.value, maxLen);
    input.value = clean;
    this.barangayForm[key] = clean;
  }

  onBarangayNamePaste(key: 'firstName' | 'middleName' | 'lastName' | 'emergencyContactName', event: ClipboardEvent) {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const maxLen = key === 'emergencyContactName' ? 100 : 50;
    const clean = this.sanitizeName(text, maxLen);
    const input = event.target as HTMLInputElement;
    input.value = clean;
    this.barangayForm[key] = clean;
  }

  onBarangayPhoneInput(key: 'contactNumber' | 'emergencyContactNumber', event: Event) {
    const input = event.target as HTMLInputElement;
    const clean = this.sanitizePhone(input.value);
    input.value = clean;
    this.barangayForm[key] = clean;
  }

  onBarangayPhonePaste(key: 'contactNumber' | 'emergencyContactNumber', event: ClipboardEvent) {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const clean = this.sanitizePhone(text);
    const input = event.target as HTMLInputElement;
    input.value = clean;
    this.barangayForm[key] = clean;
  }

  isFieldPhone(field: FormField): boolean {
    if (field.type === 'tel') return true;
    const key = (field.key || '').toLowerCase();
    const label = (field.label || '').toLowerCase();
    // If it's a person/name/relative field without "number/phone/mobile", it's a name, not a phone
    if ((key.includes('person') || label.includes('person') || key.includes('name') || label.includes('name')) &&
        !(key.includes('number') || label.includes('number') || key.includes('phone') || label.includes('phone') || key.includes('mobile') || label.includes('mobile') || key.includes('num') || label.includes('num'))) {
      return false;
    }
    return key.includes('phone') || key.includes('mobile') || label.includes('phone') || label.includes('mobile') ||
           key.includes('contact_number') || key.includes('contactnumber') || label.includes('contact number') ||
           key.includes('tel') || label.includes('tel');
  }

  isFieldNumber(field: FormField): boolean {
    return field.type === 'number';
  }

  isFieldName(field: FormField): boolean {
    const key = (field.key || '').toLowerCase();
    const label = (field.label || '').toLowerCase();
    if (key.includes('email') || key.includes('address') || key.includes('file') || key.includes('date') || key.includes('number') || label.includes('number') || key.includes('phone') || label.includes('phone') || key.includes('mobile') || label.includes('mobile')) return false;
    return key.includes('name') || label.includes('name') || key.includes('relative') || label.includes('relative') || key.includes('person') || label.includes('person');
  }

  fieldInputMode(field: FormField): string | null {
    if (this.isFieldPhone(field) || this.isFieldNumber(field)) return 'numeric';
    if (field.type === 'email' || field.key.toLowerCase().includes('email')) return 'email';
    return null;
  }

  fieldMaxLength(field: FormField): number {
    if (field.validation?.maxLength) return field.validation.maxLength;
    if (this.isFieldPhone(field)) return 11;
    if (this.isFieldNumber(field)) {
      return (field.key.toLowerCase().includes('age') || (field.label && field.label.toLowerCase().includes('age'))) ? 3 : 15;
    }
    if (this.isFieldName(field)) return 100;
    if (field.type === 'textarea') return 500;
    return 255;
  }

  onDynamicFieldKeyDown(field: FormField, event: KeyboardEvent) {
    if (this.isFieldPhone(field) || this.isFieldNumber(field)) {
      this.filterNumberKeyDown(event);
    } else if (this.isFieldName(field)) {
      this.filterNameKeyDown(event);
    }
  }

  onDynamicFieldInput(field: FormField, event: Event) {
    const input = event.target as HTMLInputElement;
    let val = input.value;
    if (this.isFieldPhone(field)) {
      val = this.sanitizePhone(val);
      input.value = val;
    } else if (this.isFieldNumber(field)) {
      const maxLen = this.fieldMaxLength(field);
      val = this.sanitizeDigits(val, maxLen);
      input.value = val;
    } else if (this.isFieldName(field)) {
      const maxLen = this.fieldMaxLength(field);
      val = this.sanitizeName(val, maxLen);
      input.value = val;
    }
    this.updateFormValue(field.key, val);
  }

  onDynamicFieldPaste(field: FormField, event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text') || '';
    if (this.isFieldPhone(field)) {
      event.preventDefault();
      const clean = this.sanitizePhone(text);
      const input = event.target as HTMLInputElement;
      input.value = clean;
      this.updateFormValue(field.key, clean);
    } else if (this.isFieldNumber(field)) {
      event.preventDefault();
      const maxLen = this.fieldMaxLength(field);
      const clean = this.sanitizeDigits(text, maxLen);
      const input = event.target as HTMLInputElement;
      input.value = clean;
      this.updateFormValue(field.key, clean);
    } else if (this.isFieldName(field)) {
      event.preventDefault();
      const maxLen = this.fieldMaxLength(field);
      const clean = this.sanitizeName(text, maxLen);
      const input = event.target as HTMLInputElement;
      input.value = clean;
      this.updateFormValue(field.key, clean);
    }
  }

  private validateField(field: FormField, value: unknown): string | null {
    const empty = this.isEmptyValue(value);
    const label = this.fieldLabel(field) || field.label || field.key;
    if (empty) {
      if (field.required) return this.t('err.required', { field: label });
      return null;
    }

    const v = field.validation || {};
    const valStr = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
    const valNum = Number(value);

    // 1. Number / Age validations
    const isNumberType = this.isFieldNumber(field);
    const isAgeField = field.key.toLowerCase().includes('age') || label.toLowerCase().includes('age');
    if (isNumberType || isAgeField) {
      if (!/^-?\d+(\.\d+)?$/.test(valStr)) {
        return this.t('err.numbersOnly', { field: label });
      }
      if (isNaN(valNum)) {
        return this.t('err.numbersOnly', { field: label });
      }
      if (v.min !== undefined && valNum < v.min) {
        return this.t('err.minValue', { field: label, min: v.min });
      }
      if (v.max !== undefined && valNum > v.max) {
        return this.t('err.maxValue', { field: label, max: v.max });
      }
      if (isAgeField) {
        if (valNum < 0 || valNum > 125) {
          return this.t('err.invalidAge', { field: label });
        }
      }
    }

    // 2. Phone / Mobile validations
    const isPhone = this.isFieldPhone(field);
    if (isPhone) {
      const cleanPhone = valStr.replace(/[\s\-()]/g, '');
      if (!/^(09\d{9}|\+639\d{9}|\d{7,11})$/.test(cleanPhone)) {
        return this.t('err.invalidPhone', { field: label });
      }
    }

    // 3. Name validations
    const isName = this.isFieldName(field);
    if (isName && !/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/.test(valStr)) {
      return this.t('err.invalidName', { field: label });
    }

    // 4. Email validations
    const isEmail = field.type === 'email' || field.key.toLowerCase().includes('email');
    if (isEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valStr)) {
        return this.t('err.invalidEmail', { field: label });
      }
    }

    // 5. Date / Birthday validations
    const isDateField = field.type === 'date';
    const isBirthDate = isDateField && (field.key.toLowerCase().includes('birth') || label.toLowerCase().includes('birth') || field.key.toLowerCase() === 'dob');
    if (isDateField) {
      if (isBirthDate) {
        const error = this.validateBirthDateValue(value, label);
        if (error) return error;
      } else {
        const parsedDate = new Date(valStr);
        if (isNaN(parsedDate.getTime())) {
          return this.t('err.invalidDate', { field: label });
        }
      }
    }

    // 6. String length & pattern validations
    if (typeof value === 'string' && !value.startsWith('data:')) {
      const defaultMax = field.type === 'textarea' ? 500 : 255;
      const effectiveMax = v.maxLength || (this.isFieldPhone(field) ? 11 : defaultMax);
      if (valStr.length > effectiveMax) {
        return this.t('err.maxLength', { field: label, max: effectiveMax });
      }
      if (v.minLength && valStr.length < v.minLength) {
        return this.t('err.minLength', { field: label, min: v.minLength });
      }
      if (v.pattern && !new RegExp(v.pattern).test(valStr)) {
        return v.patternMessage || this.t('err.invalidFormat', { field: label });
      }
    }

    return null;
  }

  // Guest temporary session form validation
  validateGuestForm() {
    this.guestSubmitted.set(true);
    this.formError.set('');
    const g = this.guestForm;
    const nameRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/;
    const cleanPhone = (g.contactNumber || '').trim().replace(/[\s\-()]/g, '');

    // If address is empty or short, attempt auto-composition first
    if (!g.address || g.address.trim().length < 5) {
      this.autoComposeGuestAddress();
    }

    // Sync computed full name
    g.fullName = [g.firstName, g.middleName, g.lastName, g.suffix].filter(Boolean).join(' ').trim();

    if (!g.firstName.trim() || g.firstName.trim().length < 2 || !nameRegex.test(g.firstName.trim())) {
      this.triggerFormError(this.t('err.invalidName', { field: this.t('doc.guestInfo.firstName') || 'First Name' }), 3000);
      return;
    }
    if (g.middleName && g.middleName.trim() && !nameRegex.test(g.middleName.trim())) {
      this.triggerFormError(this.t('err.invalidName', { field: this.t('doc.guestInfo.middleName') || 'Middle Name' }), 3000);
      return;
    }
    if (!g.lastName.trim() || g.lastName.trim().length < 2 || !nameRegex.test(g.lastName.trim())) {
      this.triggerFormError(this.t('err.invalidName', { field: this.t('doc.guestInfo.lastName') || 'Last Name' }), 3000);
      return;
    }
    if (!g.birthDate) {
      this.triggerFormError(this.t('err.guest.birthDate') || 'Please select a valid Date of Birth.', 3000);
      this.triggerGuestDobError(3000);
      return;
    }
    const dobError = this.validateBirthDateValue(g.birthDate, this.t('doc.guestInfo.birthDate') || 'Date of Birth');
    if (dobError) {
      this.triggerFormError(dobError, 3000);
      this.triggerGuestDobError(3000);
      return;
    }
    if (!cleanPhone || !/^(09\d{9}|\+639\d{9}|\d{7,11})$/.test(cleanPhone)) {
      this.triggerFormError(this.t('err.invalidPhone', { field: this.t('doc.guestInfo.contact') || 'Contact Number' }), 3000);
      return;
    }
    if (g.email && g.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email.trim())) {
      this.triggerFormError(this.t('err.invalidEmail', { field: 'Email' }), 3000);
      return;
    }
    if (!g.address.trim() || g.address.trim().length < 5) {
      this.triggerFormError(this.t('err.guest.address'), 3000);
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
    const nameRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/;
    switch (key) {
      case 'firstName':
        return !g.firstName.trim() || g.firstName.trim().length < 2 || g.firstName.length > 50 || !nameRegex.test(g.firstName.trim());
      case 'middleName':
        return !!(g.middleName && g.middleName.trim() && (g.middleName.length > 50 || !nameRegex.test(g.middleName.trim())));
      case 'lastName':
        return !g.lastName.trim() || g.lastName.trim().length < 2 || g.lastName.length > 50 || !nameRegex.test(g.lastName.trim());
      case 'fullName':
        return !g.fullName.trim() || g.fullName.trim().length < 2 || g.fullName.length > 100;
      case 'birthDate': {
        if (!this.showGuestDobError()) return false;
        if (!g.birthDate) return true;
        const age = this.calculateAge(g.birthDate);
        return age === null || age < 1 || age > 125;
      }
      case 'contactNumber': {
        const clean = (g.contactNumber || '').trim().replace(/[\s\-()]/g, '');
        return !clean || !/^(09\d{9}|\+639\d{9}|\d{7,11})$/.test(clean);
      }
      case 'email':
        return !!(g.email && g.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email.trim()));
      case 'address':
        return !g.address.trim() || g.address.trim().length < 5 || g.address.length > 255;
      default:
        return false;
    }
  }

  barangayInvalid(key: string): boolean {
    if (!this.barangaySubmitted()) return false;
    const f = this.barangayForm;
    const minAge = this.getBarangayIdMinAge();
    switch (key) {
      case 'birthDate': {
        if (!this.showBarangayDobError()) return false;
        if (!f.birthDate) return true;
        const age = this.calculateAge(f.birthDate);
        return age === null || age < minAge || age > 125;
      }
      case 'firstName':
        return !f.firstName.trim() || f.firstName.trim().length < 2 || f.firstName.length > 50 || !/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/.test(f.firstName.trim());
      case 'lastName':
        return !f.lastName.trim() || f.lastName.trim().length < 2 || f.lastName.length > 50 || !/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/.test(f.lastName.trim());
      case 'middleName':
        return f.middleName.length > 50 || !!(f.middleName.trim() && !/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/.test(f.middleName.trim()));
      case 'suffix':
        return f.suffix.length > 20;
      case 'gender':
        return !f.gender;
      case 'civilStatus':
        return !f.civilStatus;
      case 'addressLine':
        return !f.addressLine.trim() || f.addressLine.trim().length < 5 || f.addressLine.length > 255;
      case 'contactNumber': {
        const clean = f.contactNumber.trim().replace(/[\s\-()]/g, '');
        return !clean || !/^(09\d{9}|\+639\d{9}|\d{7,11})$/.test(clean);
      }
      case 'email':
        return !!(f.email && f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()));
      case 'emergencyContactName':
        return !f.emergencyContactName.trim() || f.emergencyContactName.length > 100 || !/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/.test(f.emergencyContactName.trim());
      case 'emergencyContactNumber': {
        const clean = f.emergencyContactNumber.trim().replace(/[\s\-()]/g, '');
        return !clean || !/^(09\d{9}|\+639\d{9}|\d{7,11})$/.test(clean);
      }
      default:
        return false;
    }
  }

  // ============================================================
  // BARANGAY ID FLOW
  // ============================================================

  proceedToBarangayForm() {
    if (this.isApplicantUnderage()) {
      return;
    }
    this.barangayStep.set('form');
    this.resetIdleTimer();
    this.saveState();
  }

  validateBarangayForm() {
    this.barangaySubmitted.set(true);
    this.formError.set('');

    const fields = this.barangayService()?.form_fields;
    if (fields && fields.length > 0) {
      let hasErrors = false;
      const newErrors: Record<string, string> = {};
      for (const field of fields) {
        const val = this.formValues()[field.key];
        const message = this.validateField(field, val);
        if (message) {
          newErrors[field.key] = message;
          hasErrors = true;
        }
      }
      this.formErrors.set(newErrors);
      if (hasErrors) {
        const firstKey = Object.keys(newErrors)[0];
        this.triggerFormError(newErrors[firstKey] || 'Please complete all required fields.', 3000);
        this.triggerBarangayDobError(3000);
        return;
      }
    } else {
      const f = this.barangayForm;
      const cleanPhone = f.contactNumber.trim().replace(/[\s\-()]/g, '');
      const cleanEmPhone = f.emergencyContactNumber.trim().replace(/[\s\-()]/g, '');

      if (!f.firstName.trim() || f.firstName.trim().length < 2 || !/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/.test(f.firstName.trim())) {
        this.triggerFormError(this.t('err.invalidName', { field: this.t('bar.form.firstName') || 'First Name' }), 3000);
        return;
      }
      if (f.middleName && f.middleName.trim() && !/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/.test(f.middleName.trim())) {
        this.triggerFormError(this.t('err.invalidName', { field: this.t('bar.form.middleName') || 'Middle Name' }), 3000);
        return;
      }
      if (!f.lastName.trim() || f.lastName.trim().length < 2 || !/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-\.\']+$/.test(f.lastName.trim())) {
        this.triggerFormError(this.t('err.invalidName', { field: this.t('bar.form.lastName') || 'Last Name' }), 3000);
        return;
      }
      if (!f.birthDate) {
        this.triggerFormError(this.t('err.bar.birthDate') || 'Please select a valid Date of Birth.', 3000);
        this.triggerBarangayDobError(3000);
        return;
      }
      const dobError = this.validateBirthDateValue(f.birthDate, this.t('bar.form.birthDate') || 'Birth Date');
      if (dobError) {
        this.triggerFormError(dobError, 3000);
        this.triggerBarangayDobError(3000);
        return;
      }
      if (!f.addressLine.trim() || f.addressLine.trim().length < 5) {
        this.triggerFormError(this.t('err.bar.address'), 3000);
        return;
      }
      if (!cleanPhone || !/^(09\d{9}|\+639\d{9}|\d{7,11})$/.test(cleanPhone)) {
        this.triggerFormError(this.t('err.invalidPhone', { field: this.t('bar.form.contact') || 'Contact Number' }), 3000);
        return;
      }
      if (f.email && f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
        this.triggerFormError(this.t('err.invalidEmail', { field: this.t('bar.form.email') || 'Email' }), 3000);
        return;
      }
    }

    this.errorMessage.set('');
    this.barangayStep.set('photo');
    this.resetIdleTimer();
    setTimeout(() => this.startCamera(), 100);
    this.saveState();
  }

  triggerPhotoQualityError(msg: string, durationMs: number = 4000) {
    if (this.photoQualityErrorTimer) {
      clearTimeout(this.photoQualityErrorTimer);
      this.photoQualityErrorTimer = null;
    }
    this.photoQualityError.set(msg);
    if (durationMs > 0) {
      this.photoQualityErrorTimer = setTimeout(() => {
        this.photoQualityError.set('');
        this.photoQualityErrorTimer = null;
      }, durationMs);
    }
  }

  private analyzeImageQuality(dataUrl: string): Promise<{ valid: boolean; reason?: 'blurry' | 'dark' | 'bright' | 'empty'; score?: number; luminance?: number }> {
    return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith('data:image')) {
        resolve({ valid: false, reason: 'empty' });
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const analysisWidth = 320;
          const analysisHeight = Math.max(1, Math.round((img.naturalHeight || img.height || 240) * (analysisWidth / (img.naturalWidth || img.width || 320))));
          const canvas = document.createElement('canvas');
          canvas.width = analysisWidth;
          canvas.height = analysisHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            resolve({ valid: true });
            return;
          }
          ctx.drawImage(img, 0, 0, analysisWidth, analysisHeight);
          const imgData = ctx.getImageData(0, 0, analysisWidth, analysisHeight);
          const data = imgData.data;
          const totalPixels = analysisWidth * analysisHeight;

          // 1. Grayscale & Mean Luminance (0.299R + 0.587G + 0.114B)
          let totalLuminance = 0;
          const gray = new Float32Array(totalPixels);
          for (let i = 0; i < totalPixels; i++) {
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            gray[i] = lum;
            totalLuminance += lum;
          }
          const avgLuminance = totalLuminance / totalPixels;

          // Check severe underexposure / pitch black (e.g. lens blocked)
          if (avgLuminance < 18) {
            resolve({ valid: false, reason: 'dark', luminance: avgLuminance });
            return;
          }

          // 2. 3x3 Discrete Laplacian Kernel edge variance on central 80% region
          let lapSum = 0;
          let count = 0;
          const minX = Math.floor(analysisWidth * 0.1);
          const maxX = Math.floor(analysisWidth * 0.9);
          const minY = Math.floor(analysisHeight * 0.1);
          const maxY = Math.floor(analysisHeight * 0.9);

          const lapValues = new Float32Array((maxX - minX) * (maxY - minY));
          for (let y = minY; y < maxY; y++) {
            const yOffset = y * analysisWidth;
            for (let x = minX; x < maxX; x++) {
              const lap = 
                gray[yOffset - analysisWidth + x] +
                gray[yOffset + analysisWidth + x] +
                gray[yOffset + x - 1] +
                gray[yOffset + x + 1] -
                4 * gray[yOffset + x];

              lapValues[count] = lap;
              lapSum += lap;
              count++;
            }
          }

          if (count === 0) {
            resolve({ valid: true });
            return;
          }

          const lapMean = lapSum / count;
          let varSum = 0;
          for (let i = 0; i < count; i++) {
            const diff = lapValues[i] - lapMean;
            varSum += diff * diff;
          }
          const variance = varSum / count;

          // Calibrated blur threshold (clear photo variance is typically > 50-100; blurry < 30)
          if (variance < 32) {
            resolve({ valid: false, reason: 'blurry', score: variance, luminance: avgLuminance });
          } else {
            resolve({ valid: true, score: variance, luminance: avgLuminance });
          }
        } catch (e) {
          console.warn('Image quality analysis fallback:', e);
          resolve({ valid: true });
        }
      };
      img.onerror = () => resolve({ valid: false, reason: 'empty' });
      img.src = dataUrl;
    });
  }

  async confirmBarangayPhoto() {
    const photo = this.capturedPhoto();
    if (!photo) {
      this.photoValid.set(false);
      this.triggerPhotoQualityError(this.t('bar.photo.unavailableDesc'), 3500);
      return;
    }

    if (this.enablePhotoValidation()) {
      const check = await this.analyzeImageQuality(photo);
      if (!check.valid || !this.photoValid()) {
        this.photoValid.set(false);
        if (check.reason === 'dark') {
          this.triggerPhotoQualityError(this.t('bar.photo.darkError'), 3500);
        } else {
          this.triggerPhotoQualityError(this.t('bar.photo.blurryError'), 3500);
        }
        return;
      }
    }

    this.photoQualityError.set('');
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
    const vals = this.formValues();
    const fName = String(vals['first_name'] || vals['firstName'] || this.barangayForm.firstName || '').trim();
    const mName = String(vals['middle_name'] || vals['middleName'] || this.barangayForm.middleName || '').trim();
    const lName = String(vals['last_name'] || vals['lastName'] || this.barangayForm.lastName || '').trim();
    const sffx = String(vals['suffix'] || this.barangayForm.suffix || '').trim();
    const name = [fName, mName, lName].filter(part => part).join(' ').trim();
    return sffx && sffx !== 'None' ? `${name} ${sffx}` : name;
  }

  isBarangayReady(): boolean {
    if (!this.capturedPhoto() || !this.capturedSignature()) return false;
    const fields = this.barangayService()?.form_fields;
    if (fields && fields.length > 0) {
      for (const f of fields) {
        if (f.required) {
          const val = this.formValues()[f.key];
          if (this.isEmptyValue(val)) return false;
        }
      }
      return true;
    }
    const f = this.barangayForm;
    return !!(f.firstName.trim() && f.lastName.trim() && f.addressLine.trim());
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

    const dynamicValues = { ...this.formValues() };
    let firstName = String(dynamicValues['first_name'] || dynamicValues['firstName'] || this.barangayForm.firstName || '').trim();
    let middleName = String(dynamicValues['middle_name'] || dynamicValues['middleName'] || this.barangayForm.middleName || '').trim() || null;
    let lastName = String(dynamicValues['last_name'] || dynamicValues['lastName'] || this.barangayForm.lastName || '').trim();

    // Fallback: if the form collected a single "full_name" field, parse it into first and last names
    if ((!firstName || !lastName) && dynamicValues['full_name']) {
      const parts = String(dynamicValues['full_name']).trim().split(/\s+/);
      if (parts.length === 1) {
        firstName = parts[0];
        lastName = parts[0];
      } else if (parts.length === 2) {
        firstName = parts[0];
        lastName = parts[1];
      } else {
        firstName = parts.slice(0, -1).join(' ');
        lastName = parts[parts.length - 1];
      }
    }
    const suffix = String(dynamicValues['suffix'] || this.barangayForm.suffix || '').trim() || null;
    const birthDate = String(dynamicValues['birth_date'] || dynamicValues['birthDate'] || this.barangayForm.birthDate || '').trim() || null;
    const birthPlace = String(dynamicValues['birth_place'] || dynamicValues['birthPlace'] || dynamicValues['place_of_birth'] || dynamicValues['placeOfBirth'] || this.barangayForm.birthPlace || '').trim() || null;
    const addressLine = String(dynamicValues['address_line'] || dynamicValues['addressLine'] || dynamicValues['address'] || this.barangayForm.addressLine || '').trim();
    const contactNumber = String(dynamicValues['contact_number'] || dynamicValues['contactNumber'] || this.barangayForm.contactNumber || '').trim() || null;
    const email = String(dynamicValues['email'] || this.barangayForm.email || '').trim() || null;
    const emergencyContactName = String(dynamicValues['emergency_contact_name'] || dynamicValues['emergencyContactName'] || this.barangayForm.emergencyContactName || '').trim() || null;
    const emergencyContactNumber = String(dynamicValues['emergency_contact_number'] || dynamicValues['emergencyContactNumber'] || this.barangayForm.emergencyContactNumber || '').trim() || null;

    const formData = {
      ...dynamicValues,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      suffix: suffix,
      birth_date: birthDate,
      birth_place: birthPlace,
      address_line: addressLine,
      contact_number: contactNumber,
      email: email,
      emergency_contact_name: emergencyContactName,
      emergency_contact_number: emergencyContactNumber
    };

    this.kioskService.createBarangayId({
      firstName,
      middleName: middleName || undefined,
      lastName,
      suffix: suffix || undefined,
      birthDate: birthDate || undefined,
      birthPlace: birthPlace || undefined,
      gender: String(dynamicValues['gender'] || dynamicValues['sex'] || this.barangayForm.gender || '').trim() || undefined,
      civilStatus: String(dynamicValues['civil_status'] || dynamicValues['civilStatus'] || this.barangayForm.civilStatus || '').trim() || undefined,
      occupation: String(dynamicValues['occupation'] || this.barangayForm.occupation || '').trim() || undefined,
      bloodType: String(dynamicValues['blood_type'] || dynamicValues['bloodType'] || this.barangayForm.bloodType || '').trim() || undefined,
      addressLine,
      contactNumber: contactNumber || undefined,
      email: email || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactNumber: emergencyContactNumber || undefined,
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

    const dynamicValues = { ...this.formValues() };
    let firstName = String(dynamicValues['first_name'] || dynamicValues['firstName'] || this.barangayForm.firstName || '').trim();
    let middleName = String(dynamicValues['middle_name'] || dynamicValues['middleName'] || this.barangayForm.middleName || '').trim() || undefined;
    let lastName = String(dynamicValues['last_name'] || dynamicValues['lastName'] || this.barangayForm.lastName || '').trim();

    // Fallback: if the form collected a single "full_name" field, parse it into first and last names
    if ((!firstName || !lastName) && dynamicValues['full_name']) {
      const parts = String(dynamicValues['full_name']).trim().split(/\s+/);
      if (parts.length === 1) {
        firstName = parts[0];
        lastName = parts[0];
      } else if (parts.length === 2) {
        firstName = parts[0];
        lastName = parts[1];
      } else {
        firstName = parts.slice(0, -1).join(' ');
        lastName = parts[parts.length - 1];
      }
    }
    const suffix = String(dynamicValues['suffix'] || this.barangayForm.suffix || '').trim() || undefined;
    const birthDate = String(dynamicValues['birth_date'] || dynamicValues['birthDate'] || this.barangayForm.birthDate || '').trim() || undefined;
    const birthPlace = String(dynamicValues['birth_place'] || dynamicValues['birthPlace'] || dynamicValues['place_of_birth'] || dynamicValues['placeOfBirth'] || this.barangayForm.birthPlace || '').trim() || undefined;
    const addressLine = String(dynamicValues['address_line'] || dynamicValues['addressLine'] || dynamicValues['address'] || this.barangayForm.addressLine || '').trim();
    const contactNumber = String(dynamicValues['contact_number'] || dynamicValues['contactNumber'] || this.barangayForm.contactNumber || '').trim() || undefined;
    const email = String(dynamicValues['email'] || this.barangayForm.email || '').trim() || undefined;
    const emergencyContactName = String(dynamicValues['emergency_contact_name'] || dynamicValues['emergencyContactName'] || this.barangayForm.emergencyContactName || '').trim() || undefined;
    const emergencyContactNumber = String(dynamicValues['emergency_contact_number'] || dynamicValues['emergencyContactNumber'] || this.barangayForm.emergencyContactNumber || '').trim() || undefined;

    const formData = {
      ...dynamicValues,
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName,
      suffix: suffix || null,
      birth_date: birthDate || null,
      birth_place: birthPlace || null,
      address_line: addressLine,
      contact_number: contactNumber || null,
      email: email || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_number: emergencyContactNumber || null
    };

    this.kioskService.previewBarangayId({
      firstName,
      middleName,
      lastName,
      suffix,
      birthDate,
      birthPlace,
      gender: String(dynamicValues['gender'] || dynamicValues['sex'] || this.barangayForm.gender || '').trim() || undefined,
      civilStatus: String(dynamicValues['civil_status'] || dynamicValues['civilStatus'] || this.barangayForm.civilStatus || '').trim() || undefined,
      occupation: String(dynamicValues['occupation'] || this.barangayForm.occupation || '').trim() || undefined,
      bloodType: String(dynamicValues['blood_type'] || dynamicValues['bloodType'] || this.barangayForm.bloodType || '').trim() || undefined,
      addressLine,
      contactNumber,
      email,
      emergencyContactName,
      emergencyContactNumber,
      photo: this.capturedPhoto() || undefined,
      signature: this.capturedSignature() || undefined,
      formData
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
  previewRequestDocument(service?: Service) {
    if (this.docPreviewRendering()) return;
    const svc = service || this.selectedService();
    if (!svc || !svc.has_template) return;

    const resident = this.resident();
    const data: {
      service_id: number;
      form_data: Record<string, unknown>;
      resident_id?: number;
      guest?: GuestInfo;
    } = {
      service_id: svc.service_id,
      form_data: service ? (this.serviceForms()[service.service_id] ?? {}) : this.formValues()
    };
    if (resident) {
      data.resident_id = resident.resident_id;
    } else {
      const g = this.guestForm;
      const computedFullName = (g.firstName || g.lastName)
        ? [g.firstName, g.middleName, g.lastName, g.suffix].filter(Boolean).join(' ').trim()
        : (g.fullName || '').trim();
      data.guest = {
        full_name: computedFullName,
        first_name: g.firstName?.trim() || undefined,
        middle_name: g.middleName?.trim() || undefined,
        last_name: g.lastName?.trim() || undefined,
        suffix: g.suffix?.trim() || undefined,
        birth_date: g.birthDate || undefined,
        birth_place: g.birthPlace?.trim() || undefined,
        gender: g.gender || undefined,
        civil_status: g.civilStatus || undefined,
        nationality: g.nationality?.trim() || undefined,
        religion: g.religion?.trim() || undefined,
        occupation: g.occupation?.trim() || undefined,
        blood_type: g.bloodType?.trim() || undefined,
        contact_number: g.contactNumber.trim(),
        email: g.email.trim() || undefined,
        subdivision: g.subdivision?.trim() || undefined,
        street: g.street?.trim() || undefined,
        block: g.block?.trim() || undefined,
        lot: g.lot?.trim() || undefined,
        house_number: g.houseNumber?.trim() || undefined,
        purok_zone: g.purokZone?.trim() || undefined,
        sitio: g.sitio?.trim() || undefined,
        municipality: g.municipality?.trim() || undefined,
        province: g.province?.trim() || undefined,
        zip_code: g.zipCode?.trim() || undefined,
        address: g.address.trim()
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
  openDocPreview(service?: Service) {
    if (this.docPreviewBlob()) {
      this.showDocPreview.set(true);
      return;
    }
    this.previewRequestDocument(service);
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
    if (this.selectedServices().length > 0) {
      this.serviceIndex.set(this.selectedServices().length - 1);
      this.loadServiceForm();
    }
    this.currentStep.set('form');
    this.saveState();
  }

  // ============================================================
  // CAMERA
  // ============================================================

  startCamera(target?: HTMLVideoElement) {
    if (this.cameraMode() === 'esp32') {
      const baseStreamUrl = environment.esp32CamStreamUrl || 'http://192.168.254.111/stream';
      this.esp32StreamUrl.set(`${baseStreamUrl}?t=${Date.now()}`);
      this.cameraReady.set(true);
      this.esp32Error.set(false);
      this.errorMessage.set('');
      return;
    }

    const el = target || this.videoEl?.nativeElement || this.inlineVideoEl?.nativeElement;
    if (this.stream) {
      if (el && el.srcObject !== this.stream) {
        el.srcObject = this.stream;
        this.cameraReady.set(true);
      }
      return;
    }
    this.cameraReady.set(false);

    // Helper to start stream with specific constraints
    const getStream = (constraints: MediaStreamConstraints) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const secureErr = 'Camera requires a secure HTTPS connection or localhost context.';
        console.error(secureErr);
        this.errorMessage.set(secureErr);
        this.cameraReady.set(false);
        return Promise.reject(new Error(secureErr));
      }
      return navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          this.stream = stream;
          const currentEl = target || this.videoEl?.nativeElement || this.inlineVideoEl?.nativeElement;
          if (currentEl) currentEl.srcObject = stream;
          this.errorMessage.set('');
          this.cameraReady.set(true);
          return stream;
        });
    };

    getStream({ video: { width: 640, height: 480, facingMode: 'user' } })
      .then(() => {
        return navigator.mediaDevices.enumerateDevices();
      })
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        this.availableCameras.set(videoDevices);
        const activeTrack = this.stream?.getVideoTracks()[0];
        const settings = activeTrack ? activeTrack.getSettings() : null;
        if (settings && settings.deviceId) {
          const idx = videoDevices.findIndex(d => d.deviceId === settings.deviceId);
          if (idx !== -1) this.currentCameraIndex.set(idx);
        }
      })
      .catch((err) => {
        console.error('Camera error:', err);
        this.errorMessage.set(this.t('err.cameraDenied'));
        this.cameraReady.set(false);
      });
  }

  onEsp32StreamLoad() {
    this.cameraReady.set(true);
    this.esp32Error.set(false);
    this.errorMessage.set('');
  }

  onEsp32StreamError() {
    if (!this.esp32StreamUrl() || this.submitting() || this.capturedPhoto()) {
      return;
    }
    console.warn('[ESP32-CAM] Stream error or camera offline');
    this.esp32Error.set(true);
    this.cameraReady.set(false);
  }

  switchCameraMode(mode: 'esp32' | 'webcam') {
    this.stopCamera();
    this.cameraMode.set(mode);
    this.errorMessage.set('');
    this.startCamera();
    this.saveState();
  }

  switchCamera(target?: HTMLVideoElement) {
    const devices = this.availableCameras();
    if (devices.length <= 1) return;

    const nextIndex = (this.currentCameraIndex() + 1) % devices.length;
    this.currentCameraIndex.set(nextIndex);
    const targetDevice = devices[nextIndex];

    console.log('[Camera] User manual switch to camera:', targetDevice.label || `Camera ${nextIndex}`);

    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.cameraReady.set(false);

    // Helper to start stream with specific constraints
    const getStream = (constraints: MediaStreamConstraints) => {
      return navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          this.stream = stream;
          const el = target || this.videoEl?.nativeElement || this.inlineVideoEl?.nativeElement;
          if (el) el.srcObject = stream;
          this.errorMessage.set('');
          this.cameraReady.set(true);
          return stream;
        });
    };

    getStream({
      video: {
        deviceId: { exact: targetDevice.deviceId }
      }
    }).catch(err => {
      console.error('[Camera] Failed to switch camera:', err);
      getStream({ video: true });
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
    this.esp32Error.set(false);
    setTimeout(() => this.startCamera(), 100);
  }

  private drawFrame(el: any, rotate90: boolean = false): string {
    const canvas = document.createElement('canvas');
    const width = el.videoWidth || el.naturalWidth || el.clientWidth || el.width || 640;
    const height = el.videoHeight || el.naturalHeight || el.clientHeight || el.height || 480;
    if (rotate90) {
      canvas.width = height > 0 ? height : 480;
      canvas.height = width > 0 ? width : 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((90 * Math.PI) / 180);
        ctx.drawImage(el, -width / 2, -height / 2, width, height);
        return canvas.toDataURL('image/jpeg', 0.92);
      }
    } else {
      canvas.width = width > 0 ? width : 640;
      canvas.height = height > 0 ? height : 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.9);
      }
    }
    return '';
  }

  private rotateBlob90Deg(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalHeight || img.height || 480;
        canvas.height = img.naturalWidth || img.width || 640;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          this.kioskService.blobToDataUrl(blob).then(resolve).catch(reject);
          return;
        }
        // Rotate 90 degrees clockwise around the canvas center (180° from prior orientation)
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((90 * Math.PI) / 180);
        ctx.drawImage(img, -(img.naturalWidth || img.width) / 2, -(img.naturalHeight || img.height) / 2);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  }

  toggleIpCamera() {
    this.useIpCamera.set(!this.useIpCamera());
    if (this.useIpCamera()) {
      this.stopCamera();
      this.cameraReady.set(true);
    } else {
      this.cameraReady.set(false);
      this.startCamera();
    }
    this.saveState();
  }

  private captureEsp32Image(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      let done = false;

      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        reject(new Error('ESP32-CAM capture timed out'));
      }, 6000);

      img.onload = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          const width = img.naturalWidth || img.width || 640;
          const height = img.naturalHeight || img.height || 480;
          // Rotate 90° clockwise from landscape to portrait (180° from prior orientation)
          canvas.width = height;
          canvas.height = width;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not create 2D canvas context'));
            return;
          }
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((90 * Math.PI) / 180);
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = (err) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(err);
      };

      img.src = url;
    });
  }

  private async handleCapturedPhoto(dataUrl: string) {
    this.capturedPhoto.set(dataUrl);
    this.errorMessage.set('');
    this.esp32StreamUrl.set(''); // Free socket while photo preview is shown
    this.submitting.set(false);
    this.saveState();

    // Immediately run image quality validation on the newly captured photo
    const check = await this.analyzeImageQuality(dataUrl);
    if (this.enablePhotoValidation()) {
      if (!check.valid) {
        this.photoValid.set(false);
        if (check.reason === 'dark') {
          this.triggerPhotoQualityError(this.t('bar.photo.darkError'), 3500);
        } else {
          this.triggerPhotoQualityError(this.t('bar.photo.blurryError'), 3500);
        }
      } else {
        this.photoValid.set(true);
        this.photoQualityError.set('');
      }
    } else {
      // When photo validation is hidden/disabled, allow photo immediately without error indicators
      this.photoValid.set(true);
      this.photoQualityError.set('');
    }
  }

  async capturePhoto() {
    this.photoQualityError.set('');
    this.photoValid.set(false);
    if (this.photoQualityErrorTimer) {
      clearTimeout(this.photoQualityErrorTimer);
      this.photoQualityErrorTimer = null;
    }

    if (this.cameraMode() === 'esp32') {
      this.submitting.set(true);
      console.log('[ESP32-CAM] Taking photo: releasing live stream socket to free camera frame buffer...');

      // 1. Immediately disconnect live stream image so ESP32-CAM stream_handler loop exits and releases the DMA buffer
      this.esp32StreamUrl.set('');
      await new Promise((resolve) => setTimeout(resolve, 120));

      const targetCaptureUrl = `${this.esp32CaptureUrl()}${this.esp32CaptureUrl().includes('?') ? '&' : '?'}t=${Date.now()}`;

      // 2. Fetch the fresh high-resolution captured JPEG from ESP32-CAM
      try {
        const response = await fetch(targetCaptureUrl, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const blob = await response.blob();
          if (blob && blob.size > 200) {
            const dataUrl = await this.rotateBlob90Deg(blob);
            console.log('[ESP32-CAM] Photo captured and rotated 90° clockwise successfully! Size:', blob.size);
            await this.handleCapturedPhoto(dataUrl);
            return;
          }
        }
      } catch (fetchErr) {
        console.warn('[ESP32-CAM] Direct capture fetch attempt 1 failed, retrying...', fetchErr);
      }

      // 3. Retry fetch once more with brief delay
      try {
        await new Promise((resolve) => setTimeout(resolve, 200));
        const response = await fetch(targetCaptureUrl, { signal: AbortSignal.timeout(4000) });
        if (response.ok) {
          const blob = await response.blob();
          if (blob && blob.size > 200) {
            const dataUrl = await this.rotateBlob90Deg(blob);
            console.log('[ESP32-CAM] Photo captured on retry! Size:', blob.size);
            await this.handleCapturedPhoto(dataUrl);
            return;
          }
        }
      } catch (retryErr) {
        console.warn('[ESP32-CAM] Capture retry failed, attempting image loader:', retryErr);
      }

      // 4. Secondary path: Image loader with 90° canvas rotation
      try {
        const dataUrl = await this.captureEsp32Image(targetCaptureUrl);
        console.log('[ESP32-CAM] Photo captured via image loader and rotated 90° clockwise');
        await this.handleCapturedPhoto(dataUrl);
        return;
      } catch (imgErr) {
        console.error('[ESP32-CAM] All capture methods failed:', imgErr);
      }

      this.submitting.set(false);
      this.errorMessage.set(this.t('err.cameraDenied') || 'Could not capture image from ESP32-CAM. Please try again.');
      return;
    }

    if (this.useIpCamera()) {
      this.submitting.set(true);
      console.log('[Webcam] Triggering capture on Mini-PC/Laptop...');
      this.kioskService.captureWebcam().subscribe({
        next: async (res) => {
          this.submitting.set(false);
          console.log('[Webcam] Capture response:', res);
          if (res && res.success && res.image) {
            await this.handleCapturedPhoto(res.image);
          } else {
            console.error('[Webcam] Capture error:', res.error);
            alert(res.error || 'Failed to capture photo from USB webcam.');
          }
        },
        error: (err) => {
          this.submitting.set(false);
          console.error('[Webcam] Connection failed:', err);
          alert('Could not connect to the webcam server. Error: ' + (err.message || 'Network Error'));
        }
      });
    } else {
      const el = this.videoEl?.nativeElement || this.inlineVideoEl?.nativeElement;
      if (!el) return;
      const dataUrl = this.drawFrame(el);
      this.stopCamera();
      await this.handleCapturedPhoto(dataUrl);
    }
  }

  private async fallbackCaptureFromStreamElement() {
    const el = this.esp32StreamEl?.nativeElement || this.inlineEsp32StreamEl?.nativeElement;
    if (el) {
      try {
        const frameData = this.drawFrame(el, true);
        if (frameData && frameData.length > 100) {
          console.log('[ESP32-CAM] Captured and rotated 90° photo from live stream canvas frame');
          await this.handleCapturedPhoto(frameData);
          return;
        }
      } catch (canvasErr) {
        console.error('[ESP32-CAM] Canvas fallback capture error:', canvasErr);
      }
    }
    this.errorMessage.set(this.t('err.cameraDenied') || 'Could not capture image from ESP32-CAM. Please try again.');
  }

  skipPhoto() {
    this.stopCamera();
    this.capturedPhoto.set(null);
    this.photoValid.set(false);
    this.stashActivePhoto();
    this.clearDocPreview();
    this.advanceOrReview();
  }

  async confirmPhoto() {
    const photo = this.capturedPhoto();
    if (!photo) {
      this.photoValid.set(false);
      this.triggerPhotoQualityError(this.t('bar.photo.unavailableDesc'), 3500);
      return;
    }

    if (this.enablePhotoValidation()) {
      const check = await this.analyzeImageQuality(photo);
      if (!check.valid || !this.photoValid()) {
        this.photoValid.set(false);
        if (check.reason === 'dark') {
          this.triggerPhotoQualityError(this.t('bar.photo.darkError'), 3500);
        } else {
          this.triggerPhotoQualityError(this.t('bar.photo.blurryError'), 3500);
        }
        return;
      }
    }

    this.photoQualityError.set('');
    this.stashActivePhoto();
    this.clearDocPreview();
    this.advanceOrReview();
  }

  retakePhoto() {
    this.capturedPhoto.set(null);
    this.photoValid.set(false);
    this.errorMessage.set('');
    this.photoQualityError.set('');
    if (this.photoQualityErrorTimer) {
      clearTimeout(this.photoQualityErrorTimer);
      this.photoQualityErrorTimer = null;
    }
    if (this.cameraMode() === 'esp32') {
      this.esp32StreamUrl.set(`${environment.esp32CamStreamUrl || 'http://192.168.254.111/stream'}?t=${Date.now()}`);
      this.cameraReady.set(true);
    } else {
      setTimeout(() => this.startCamera(), 100);
    }
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
    const g = this.guestForm;
    const computed = [g.firstName, g.middleName, g.lastName, g.suffix].filter(Boolean).join(' ').trim();
    return computed || g.fullName || this.t('placeholder.guest');
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
        const svc = this.selectedService();
        if (svc?.requires_photo) {
          this.capturedPhoto.set(this.servicePhotos()[svc.service_id] ?? null);
          this.currentStep.set('photo');
          setTimeout(() => this.startCamera(), 100);
        } else {
          this.loadServiceForm();
          this.currentStep.set('form');
        }
        this.saveState();
        return;
      }
      if (step === 'form') {
        this.stopCamera();
        this.stashActiveForm();
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
    const selected = this.selectedServices();
    if (selected.length === 0) {
      this.errorMessage.set(this.t('err.missingService'));
      return;
    }

    this.showDocPreview.set(false);
    this.submitting.set(true);
    this.errorMessage.set('');
    if (!this.submissionKey) this.submissionKey = this.newIdempotencyKey();

    // Capture the last active service's in-progress values before building the payload.
    this.stashActiveForm();

    const services = selected.map(svc => ({
      service_id: svc.service_id,
      form_data: this.serviceForms()[svc.service_id] ?? {},
      photo: this.servicePhotos()[svc.service_id] || undefined
    }));

    const resident = this.resident();
    const data: any = {
      services,
      idempotency_key: this.submissionKey
    };

    if (resident) {
      data.resident_id = resident.resident_id;
    } else {
      const g = this.guestForm;
      const computedFullName = (g.firstName || g.lastName)
        ? [g.firstName, g.middleName, g.lastName, g.suffix].filter(Boolean).join(' ').trim()
        : (g.fullName || '').trim();
      data.guest = {
        full_name: computedFullName,
        first_name: g.firstName?.trim() || undefined,
        middle_name: g.middleName?.trim() || undefined,
        last_name: g.lastName?.trim() || undefined,
        suffix: g.suffix?.trim() || undefined,
        birth_date: g.birthDate || undefined,
        birth_place: g.birthPlace?.trim() || undefined,
        gender: g.gender || undefined,
        civil_status: g.civilStatus || undefined,
        nationality: g.nationality?.trim() || undefined,
        religion: g.religion?.trim() || undefined,
        occupation: g.occupation?.trim() || undefined,
        blood_type: g.bloodType?.trim() || undefined,
        contact_number: g.contactNumber.trim(),
        email: g.email.trim() || undefined,
        subdivision: g.subdivision?.trim() || undefined,
        street: g.street?.trim() || undefined,
        block: g.block?.trim() || undefined,
        lot: g.lot?.trim() || undefined,
        house_number: g.houseNumber?.trim() || undefined,
        purok_zone: g.purokZone?.trim() || undefined,
        sitio: g.sitio?.trim() || undefined,
        municipality: g.municipality?.trim() || undefined,
        province: g.province?.trim() || undefined,
        zip_code: g.zipCode?.trim() || undefined,
        address: g.address.trim()
      };
    }

    this.kioskService.createRequest(data).subscribe({
      next: (result: any) => {
        // Same key means only one request row exists (server is idempotent).
        const requests = result?.data?.requests || [];
        this.requestNumbers.set(requests.map((r: any) => r.request_number).filter(Boolean));
        this.requestNumber.set(result?.data?.request_number || requests[0]?.request_number || 'N/A');
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
    this.mode.set('home');
    this.currentStep.set('welcome');
    this.barangayStep.set('requirements');
    this.rfidStep.set('scan');
    this.resident.set(null);
    this.rfidCard.set(null);
    this.selectedServices.set([]);
    this.serviceIndex.set(0);
    this.serviceForms.set({});
    this.servicePhotos.set({});
    this.serviceError.set('');
    this.requestNumbers.set([]);
    this.capturedPhoto.set(null);
    this.capturedSignature.set(null);
    this.requestNumber.set('');
    this.errorMessage.set('');
    this.formError.set('');
    this.searchQuery = '';
    this.searchResults.set([]);
    this.resetBarangayForm();
    this.resetGuestForm();
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
