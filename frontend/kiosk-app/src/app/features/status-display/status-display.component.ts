import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface StatusDisplayRequest {
  request_id?: number;
  request_number: string;
  document_name?: string;
  service_name?: string;
  status_name?: string;
  request_date?: string;
}

@Component({
  selector: 'app-status-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isRestrictedAccess()) {
      <!-- ================= RESTRICTED ACCESS SCREEN (FOR LOCALHOST) ================= -->
      <div class="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col justify-between font-sans selection:bg-orange-500 selection:text-white p-6 lg:p-12">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full border border-white/20 p-1 bg-white shadow-xs shrink-0 flex items-center justify-center overflow-hidden">
            <img src="Barangay Logo.png" alt="Barangay San Manuel Seal" class="w-full h-full object-contain" />
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-orange-400">BARANGAY SAN MANUEL, CITY OF SAN JOSE DEL MONTE BULACAN</p>
            <h1 class="text-lg font-bold text-white">Document Request Services</h1>
          </div>
        </div>

        <div class="max-w-xl mx-auto my-auto text-center space-y-6 bg-slate-800/80 border border-slate-700 p-8 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-md">
          <div class="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 mx-auto flex items-center justify-center">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>

          <div class="space-y-2">
            <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Authorized LAN Access Required</h2>
            <p class="text-sm text-slate-300 leading-relaxed">
              For public privacy and security, the Status Display Board is only accessible through the designated Barangay Kiosk LAN address.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 text-left space-y-1.5 font-mono text-xs">
            <p class="text-slate-400 font-sans font-medium text-[11px]">Authorized Kiosk LAN Address:</p>
            <a
              [href]="lanStatusUrl"
              class="text-orange-400 hover:text-orange-300 font-bold break-all underline flex items-center gap-1.5"
            >
              <span>{{ lanStatusUrl }}</span>
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          </div>

          <div>
            <a
              [href]="lanStatusUrl"
              class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg transition"
            >
              <span>Open on Barangay LAN</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </a>
          </div>
        </div>

        <footer class="text-center text-xs text-slate-500 font-medium">
          IMS Document Request Services &bull; Barangay San Manuel, City of San Jose del Monte Bulacan
        </footer>
      </div>
    } @else {
      <!-- ================= AUTHORIZED STATUS DISPLAY BOARD (LANDSCAPE-OPTIMIZED) ================= -->
      <div class="min-h-screen w-full bg-[#f4f6f9] text-slate-900 flex flex-col justify-between font-sans selection:bg-orange-500 selection:text-white p-3 sm:p-5 lg:p-6 gap-3 sm:gap-4">
        
        <!-- ================= TOP HEADER ================= -->
        <header class="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs px-5 sm:px-7 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <!-- Logo & Titles -->
          <div class="flex items-center gap-4 min-w-0 w-full sm:w-auto">
            <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-orange-500/30 p-1 bg-white shadow-xs shrink-0 flex items-center justify-center overflow-hidden">
              <img src="Barangay Logo.png" alt="Barangay San Manuel Seal" class="w-full h-full object-contain" />
            </div>
            <div class="leading-tight min-w-0">
              <p class="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#ea580c]">
                BARANGAY SAN MANUEL, CITY OF SAN JOSE DEL MONTE BULACAN
              </p>
              <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0f172a] tracking-tight mt-0.5">
                Document Request Status Board
              </h1>
              <p class="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                IMS Real-Time Public Queue &amp; Release Display
              </p>
            </div>
          </div>

          <!-- Digital Clock & Date Display -->
          <div class="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div class="flex items-center gap-2">
              <span class="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-[#0f172a] tabular-nums leading-none">
                {{ now() | date: 'hh:mm:ss' }}
              </span>
              <span class="px-2.5 py-1 bg-[#ea580c] text-white font-extrabold text-xs sm:text-sm rounded-lg tracking-wider uppercase shadow-xs">
                {{ now() | date: 'a' }}
              </span>
            </div>
            <div class="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 mt-1 sm:mt-1.5">
              <svg class="w-4 h-4 text-[#ea580c] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span>{{ now() | date: 'EEEE, MMMM d, yyyy' }}</span>
            </div>
          </div>
        </header>

        <!-- ================= MAIN TWO-PANEL STATUS BOARD (50/50 SPLIT) ================= -->
        <main class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 min-h-0">
          
          <!-- ================= PANEL 1: IN PROGRESS / UNDER REVIEW ================= -->
          <section class="bg-white rounded-2xl sm:rounded-3xl border border-orange-200/90 shadow-sm overflow-hidden flex flex-col min-h-0">
            <!-- Panel Header Banner -->
            <div class="bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0 shadow-xs">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    <circle cx="16.5" cy="16.5" r="2.5" stroke="currentColor" stroke-width="2"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18.5 18.5L21 21"/>
                  </svg>
                </div>
                <div class="min-w-0">
                  <h2 class="text-base sm:text-lg lg:text-xl font-black uppercase tracking-wider truncate">
                    IN PROGRESS / UNDER REVIEW
                  </h2>
                  <p class="text-[11px] sm:text-xs font-medium text-orange-100 truncate">
                    Submitted, Being Reviewed or Processed
                  </p>
                </div>
              </div>
              <div class="bg-white text-[#ea580c] px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-black shadow-xs tabular-nums shrink-0 ml-2">
                {{ underReview().length }} {{ underReview().length === 1 ? 'Request' : 'Requests' }}
              </div>
            </div>

            <!-- Panel Content: Landscape Request Rows -->
            <div class="flex-1 p-3.5 sm:p-5 overflow-y-auto bg-gradient-to-b from-[#fffaf7] to-[#ffffff] space-y-3">
              @if (underReview().length === 0) {
                <div class="h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center bg-white/80 rounded-2xl border border-dashed border-orange-200">
                  <div class="w-12 h-12 rounded-full bg-orange-50 text-orange-400 flex items-center justify-center mb-2">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                  <p class="text-base font-bold text-slate-700">No requests currently in progress</p>
                  <p class="text-xs text-slate-400 mt-1">Submitted requests will appear here automatically while being processed.</p>
                </div>
              } @else {
                @for (item of underReview(); track getRequestNumber(item)) {
                  <!-- Landscape Request Item Card -->
                  <div class="bg-white border border-slate-200/90 hover:border-orange-300 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-xs transition-all duration-150 flex items-center justify-between gap-3 sm:gap-4">
                    
                    <!-- Left: Icon + Request Number -->
                    <div class="flex items-center gap-3 sm:gap-3.5 min-w-0">
                      <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                      </div>
                      <div class="min-w-0">
                        <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">REQUEST NO.</p>
                        <p class="text-lg sm:text-2xl font-black text-slate-900 font-mono tracking-tight tabular-nums leading-none mt-0.5">
                          {{ getRequestNumber(item) }}
                        </p>
                      </div>
                    </div>

                    <!-- Middle Divider & Document Name -->
                    <div class="hidden sm:flex items-center gap-3 min-w-0 flex-1 pl-3 border-l border-slate-200">
                      <div class="min-w-0">
                        <p class="text-[10px] font-bold text-slate-400 uppercase">Document</p>
                        <p class="text-xs sm:text-sm font-black text-slate-800 uppercase truncate" [title]="getDocumentName(item) || 'Document Request'">
                          {{ getDocumentName(item) || 'DOCUMENT REQUEST' }}
                        </p>
                      </div>
                    </div>

                    <!-- Right: Status Badge & Time -->
                    <div class="text-right shrink-0 flex flex-col items-end gap-1">
                      <span [class]="'px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ' + getStatusBadgeClass(getStatusName(item, 'Submitted'))">
                        {{ getStatusName(item, 'Submitted') }}
                      </span>
                      <span class="text-[10px] sm:text-[11px] font-semibold text-slate-500">
                        {{ formatRequestTime(item) }}
                      </span>
                    </div>

                  </div>
                }
              }
            </div>

            <!-- Panel Bottom Info Note -->
            <div class="px-5 py-2.5 bg-orange-50/70 border-t border-orange-100 flex items-center gap-2 text-xs font-semibold text-orange-900 shrink-0">
              <svg class="w-4 h-4 text-orange-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 7v5l3 3"/>
              </svg>
              <span>These requests are currently being reviewed or processed.</span>
            </div>
          </section>

          <!-- ================= PANEL 2: READY FOR RELEASE ================= -->
          <section class="bg-white rounded-2xl sm:rounded-3xl border border-emerald-300 shadow-sm overflow-hidden flex flex-col min-h-0 relative">
            <!-- Panel Header Banner -->
            <div class="bg-gradient-to-r from-[#047857] to-[#059669] text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0 shadow-xs">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div class="min-w-0">
                  <h2 class="text-base sm:text-lg lg:text-xl font-black uppercase tracking-wider truncate">
                    READY FOR RELEASE
                  </h2>
                  <p class="text-[11px] sm:text-xs font-medium text-emerald-100 truncate">
                    Please Proceed to the Releasing Counter
                  </p>
                </div>
              </div>
              <div class="bg-white text-[#047857] px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-black shadow-xs tabular-nums shrink-0 ml-2">
                {{ readyForRelease().length }} {{ readyForRelease().length === 1 ? 'Request' : 'Requests' }}
              </div>
            </div>

            <!-- Panel Content: Landscape Ready Items & Instructions -->
            <div class="flex-1 p-3.5 sm:p-5 overflow-y-auto bg-gradient-to-b from-[#f0fdf4] to-[#ffffff] space-y-3 relative z-10">
              @if (readyForRelease().length === 0) {
                <div class="h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center bg-white/80 rounded-2xl border border-dashed border-emerald-200">
                  <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <p class="text-base font-bold text-slate-700">No requests ready for release</p>
                  <p class="text-xs text-slate-400 mt-1">Completed documents available for claiming will be listed here.</p>
                </div>
              } @else {
                @for (item of readyForRelease(); track getRequestNumber(item)) {
                  <!-- Landscape Ready Card -->
                  <div class="bg-white border-2 border-emerald-400/90 hover:border-emerald-600 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm transition-all duration-150 flex items-center justify-between gap-3 sm:gap-4">
                    
                    <!-- Left: Icon + Request Number -->
                    <div class="flex items-center gap-3 sm:gap-3.5 min-w-0">
                      <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                      <div class="min-w-0">
                        <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">REQUEST NO.</p>
                        <p class="text-lg sm:text-2xl font-black text-emerald-950 font-mono tracking-tight tabular-nums leading-none mt-0.5">
                          {{ getRequestNumber(item) }}
                        </p>
                      </div>
                    </div>

                    <!-- Middle Divider & Document Name -->
                    <div class="hidden sm:flex items-center gap-3 min-w-0 flex-1 pl-3 border-l border-emerald-200">
                      <div class="min-w-0">
                        <p class="text-[10px] font-bold text-slate-400 uppercase">Document</p>
                        <p class="text-xs sm:text-sm font-black text-slate-800 uppercase truncate" [title]="getDocumentName(item) || 'Document Request'">
                          {{ getDocumentName(item) || 'DOCUMENT REQUEST' }}
                        </p>
                      </div>
                    </div>

                    <!-- Right: Ready Badge & Time -->
                    <div class="text-right shrink-0 flex flex-col items-end gap-1">
                      <span class="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Ready for Release
                      </span>
                      <span class="text-[10px] sm:text-[11px] font-semibold text-emerald-800">
                        {{ formatRequestTime(item) }}
                      </span>
                    </div>

                  </div>
                }

                <!-- Action / Guidance Callout Box -->
                <div class="bg-white/90 border border-emerald-200/80 rounded-2xl p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <!-- Status Details -->
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 7v5l3 3"/>
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                      <p class="text-sm font-black text-emerald-700 uppercase">APPROVED</p>
                      <p class="text-[11px] font-semibold text-slate-500">{{ formatRequestTime(readyForRelease()[0]) }}</p>
                    </div>
                  </div>

                  <!-- Action Instruction -->
                  <div class="flex items-center gap-3 sm:border-l sm:border-slate-200 sm:pl-3">
                    <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </div>
                    <p class="text-xs font-bold text-slate-700 leading-snug">
                      Please proceed to the Releasing Counter and present your valid ID or Claim Slip.
                    </p>
                  </div>
                </div>
              }
            </div>

            <!-- Subtle Barangay Hall Outline Illustration in background -->
            <div class="absolute right-4 bottom-4 opacity-[0.08] pointer-events-none z-0">
              <svg class="w-48 h-48 text-orange-950" viewBox="0 0 200 200" fill="currentColor">
                <path d="M100 20 L20 65 L20 80 L30 80 L30 170 L170 170 L170 80 L180 80 L180 65 Z M100 40 L160 75 L40 75 Z M50 95 H75 V155 H50 Z M88 95 H112 V155 H88 Z M125 95 H150 V155 H125 Z"/>
              </svg>
            </div>
          </section>

        </main>

        <!-- ================= REMINDER TO RESIDENTS CARD ================= -->
        <div class="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-4 shrink-0">
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-10 h-10 rounded-full bg-[#ea580c] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-xs font-black uppercase tracking-wider text-[#ea580c]">
                REMINDER TO RESIDENTS:
              </p>
              <p class="text-xs sm:text-sm font-semibold text-slate-700 leading-snug">
                Please prepare your valid ID or Claim Slip when claiming documents at the releasing counter. If your number is not listed, your request is in queue.
              </p>
            </div>
          </div>
          <!-- Community Outline Icon -->
          <div class="hidden md:flex text-orange-300 shrink-0 pr-2">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
        </div>

        <!-- ================= BOTTOM INFO BAR ================= -->
        <footer class="bg-white border border-slate-200/90 rounded-2xl px-4 sm:px-6 py-3 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-600 shrink-0">
          
          <!-- 1. Privacy Notice -->
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-md bg-orange-50 text-[#ea580c] flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <span>For your privacy, only request numbers are displayed.</span>
          </div>

          <!-- 2. Need Assistance -->
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-orange-50 text-[#ea580c] flex items-center justify-center shrink-0">
              <span class="font-black text-xs">?</span>
            </div>
            <span><strong>Need Assistance?</strong> Please approach the Barangay Staff.</span>
          </div>

          <!-- 3. Office Hours -->
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-orange-50 text-[#ea580c] flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 7v5l3 3"/>
              </svg>
            </div>
            <div>
              <p class="font-bold text-slate-800">Office Hours</p>
              <p class="text-[11px] text-slate-500 font-medium">Monday &ndash; Friday 8:00 AM &ndash; 5:00 PM</p>
            </div>
          </div>

          <!-- 4. Live Date & Time -->
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-md bg-orange-50 text-[#ea580c] flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <p class="text-[11px] text-slate-500 font-medium">{{ now() | date: 'EEEE, MMMM d, yyyy' }}</p>
              <p class="font-black text-[#ea580c] text-sm tabular-nums">{{ now() | date: 'hh:mm:ss a' }}</p>
            </div>
          </div>

          <!-- 5. Manual Refresh Action -->
          <button
            type="button"
            (click)="refreshManual()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-orange-400 hover:text-orange-600 bg-slate-50 hover:bg-orange-50 text-slate-700 font-bold transition shadow-2xs active:scale-95 cursor-pointer"
          >
            <svg class="w-3.5 h-3.5 shrink-0" [class.animate-spin]="loading()" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span>Refresh</span>
          </button>

        </footer>

      </div>
    }
  `
})
export class StatusDisplayComponent implements OnInit, OnDestroy {
  underReview = signal<(string | StatusDisplayRequest)[]>([]);
  readyForRelease = signal<(string | StatusDisplayRequest)[]>([]);
  lastUpdated = signal<Date>(new Date());
  now = signal<Date>(new Date());
  loading = signal(true);
  isRestrictedAccess = signal<boolean>(false);

  readonly lanStatusUrl = 'http://192.168.100.102:4201/status-display';

  private eventSource: EventSource | null = null;
  private reconnectTimer: any;
  private reconnectAttempts = 0;
  private clockTimer: any;
  private pollTimer: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.checkAccessRestriction();
    this.clockTimer = setInterval(() => this.now.set(new Date()), 1000);

    if (!this.isRestrictedAccess()) {
      this.fetchSnapshot();
      this.connect();
      this.pollTimer = setInterval(() => this.fetchSnapshot(), 7000);
    }
  }

  private checkAccessRestriction() {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      // If accessed via localhost or loopback 127.0.0.1, restrict display
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        this.isRestrictedAccess.set(true);
        this.loading.set(false);
      } else {
        this.isRestrictedAccess.set(false);
      }
    }
  }

  ngOnDestroy() {
    this.closeStream();
    if (this.clockTimer) clearInterval(this.clockTimer);
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  getRequestNumber(item: any): string {
    if (!item) return '';
    return typeof item === 'string' ? item : (item.request_number || item.requestNumber || '');
  }

  getDocumentName(item: any): string {
    if (!item || typeof item === 'string') return '';
    return item.document_name || item.service_name || item.serviceName || '';
  }

  getStatusName(item: any, fallback: string): string {
    if (!item || typeof item === 'string') return fallback;
    return item.status_name || item.status || fallback;
  }

  formatRequestTime(item: any): string {
    if (!item || typeof item === 'string') {
      return 'Today | ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    const dateStr = item.request_date || item.created_at || item.updated_at;
    if (!dateStr) {
      return 'Today | ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return 'Today | ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    const isToday = new Date().toDateString() === d.toDateString();
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return (isToday ? 'Today | ' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' | ') + timeStr;
  }

  getStatusBadgeClass(statusName: string): string {
    switch (statusName) {
      case 'Submitted':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Waiting for Requirements':
      case 'Requirements Received':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Under Review':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Document Processing':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Ready for Release':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  refreshManual() {
    this.loading.set(true);
    this.fetchSnapshot();
  }

  private getApiBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://${hostname}:3000/api/v1`;
      }
    }
    return environment.apiUrl;
  }

  private fetchSnapshot() {
    const url = `${this.getApiBaseUrl()}/kiosk/status-display`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        const data = res?.data || res;
        if (data) {
          this.underReview.set(data.underReview || []);
          this.readyForRelease.set(data.readyForRelease || []);
          if (data.updatedAt) this.lastUpdated.set(new Date(data.updatedAt));
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private streamUrl(): string {
    return `${this.getApiBaseUrl()}/kiosk/status-display/stream`;
  }

  private connect() {
    try {
      this.eventSource = new EventSource(this.streamUrl());
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.underReview.set(data.underReview || []);
        this.readyForRelease.set(data.readyForRelease || []);
        if (data.updatedAt) this.lastUpdated.set(new Date(data.updatedAt));
        this.loading.set(false);
        this.reconnectAttempts = 0;
      } catch {
        // Ignore malformed packet
      }
    };

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      this.eventSource = null;
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private closeStream() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.eventSource?.close();
    this.eventSource = null;
  }
}

