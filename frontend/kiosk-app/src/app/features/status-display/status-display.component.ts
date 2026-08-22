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
            <p class="text-xs font-bold uppercase tracking-widest text-orange-400">Barangay San Manuel, Tarlac City</p>
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
          IMS Document Request Services &bull; Barangay San Manuel, Tarlac City
        </footer>
      </div>
    } @else {
      <!-- ================= AUTHORIZED STATUS DISPLAY BOARD ================= -->
      <div class="min-h-screen w-full bg-slate-100 text-slate-900 flex flex-col justify-between font-sans selection:bg-orange-500 selection:text-white">
        
        <!-- ================= HEADER ================= -->
        <header class="bg-white border-b border-slate-200 shadow-xs px-6 lg:px-10 py-4 lg:py-5 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <!-- Logo & Titles -->
          <div class="flex items-center gap-4 sm:gap-5 min-w-0">
            <div class="w-14 h-14 sm:w-18 sm:h-18 rounded-full border-2 border-orange-500/20 p-1 bg-white shadow-xs shrink-0 flex items-center justify-center overflow-hidden">
              <img src="Barangay Logo.png" alt="Barangay San Manuel Seal" class="w-full h-full object-contain" />
            </div>
            <div class="leading-tight min-w-0">
              <p class="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-orange-600">Barangay San Manuel, Tarlac City</p>
              <h1 class="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
                Document Request Status Board
              </h1>
              <p class="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">IMS Real-Time Public Queue & Release Display</p>
            </div>
          </div>

          <!-- Live Clock & Date -->
          <div class="text-right shrink-0 pl-4 border-l border-slate-200 hidden sm:block">
            <p class="text-3xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-slate-900 tabular-nums leading-none">
              {{ now() | date: 'hh:mm:ss a' }}
            </p>
            <p class="text-xs sm:text-base lg:text-lg font-bold text-slate-600 mt-1.5">
              {{ now() | date: 'EEEE, MMMM d, yyyy' }}
            </p>
          </div>
        </header>

        <!-- ================= MAIN TWO-PANEL STATUS BOARD ================= -->
        <main class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 p-6 lg:p-8 min-h-0">
          
          <!-- PANEL 1: IN PROGRESS / UNDER REVIEW -->
          <section class="bg-white rounded-3xl border-2 border-orange-200 shadow-sm overflow-hidden flex flex-col min-h-[360px] lg:min-h-0">
            <!-- Panel Header -->
            <div class="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-4 lg:py-5 flex items-center justify-between shrink-0 shadow-xs">
              <div>
                <h2 class="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wider">In Progress / Under Review</h2>
                <p class="text-xs sm:text-sm font-medium text-orange-100 mt-0.5">Submitted, Being Reviewed or Processed</p>
              </div>
              <div class="bg-white/20 backdrop-blur-xs border border-white/30 text-white px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold shadow-2xs tabular-nums">
                {{ underReview().length }} {{ underReview().length === 1 ? 'Request' : 'Requests' }}
              </div>
            </div>

            <!-- Panel Content (List / Grid) -->
            <div class="flex-1 p-5 lg:p-6 overflow-y-auto bg-slate-50/60">
              @if (underReview().length === 0) {
                <div class="h-full min-h-[220px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <p class="text-base sm:text-lg font-bold text-slate-700">No requests currently in progress</p>
                  <p class="text-xs text-slate-400 mt-1">Submitted requests will appear here automatically while being processed.</p>
                </div>
              } @else {
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  @for (item of underReview(); track getRequestNumber(item)) {
                    <div class="bg-white border-2 border-orange-200/90 rounded-2xl p-4 shadow-xs hover:border-orange-400 transition text-left flex flex-col justify-between min-h-[110px]">
                      <div>
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Request No.</span>
                          <span [class]="'px-2 py-0.5 rounded-full text-[10px] font-bold border ' + getStatusBadgeClass(getStatusName(item, 'In Progress'))">
                            {{ getStatusName(item, 'In Progress') }}
                          </span>
                        </div>
                        <span class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 font-mono tracking-wider tabular-nums mt-1 block break-all">
                          {{ getRequestNumber(item) }}
                        </span>
                      </div>
                      @if (getDocumentName(item)) {
                        <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span class="text-slate-400 font-medium">Document:</span>
                          <span class="font-bold text-slate-800 truncate max-w-[170px]" [title]="getDocumentName(item)">{{ getDocumentName(item) }}</span>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </section>

          <!-- PANEL 2: READY FOR RELEASE -->
          <section class="bg-white rounded-3xl border-2 border-emerald-200 shadow-sm overflow-hidden flex flex-col min-h-[360px] lg:min-h-0">
            <!-- Panel Header -->
            <div class="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-4 lg:py-5 flex items-center justify-between shrink-0 shadow-xs">
              <div>
                <h2 class="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wider">Ready for Release</h2>
                <p class="text-xs sm:text-sm font-medium text-emerald-100 mt-0.5">Please Proceed to the Releasing Counter</p>
              </div>
              <div class="bg-white/20 backdrop-blur-xs border border-white/30 text-white px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold shadow-2xs tabular-nums">
                {{ readyForRelease().length }} {{ readyForRelease().length === 1 ? 'Request' : 'Requests' }}
              </div>
            </div>

            <!-- Panel Content (List / Grid) -->
            <div class="flex-1 p-5 lg:p-6 overflow-y-auto bg-slate-50/60">
              @if (readyForRelease().length === 0) {
                <div class="h-full min-h-[220px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <p class="text-base sm:text-lg font-bold text-slate-700">No requests ready for release</p>
                  <p class="text-xs text-slate-400 mt-1">Completed documents available for claiming will be listed here.</p>
                </div>
              } @else {
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  @for (item of readyForRelease(); track getRequestNumber(item)) {
                    <div class="bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl p-4 shadow-xs hover:border-emerald-500 transition text-left flex flex-col justify-between min-h-[110px]">
                      <div>
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Request No.</span>
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {{ getStatusName(item, 'Ready for Release') }}
                          </span>
                        </div>
                        <span class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-emerald-950 font-mono tracking-wider tabular-nums mt-1 block break-all">
                          {{ getRequestNumber(item) }}
                        </span>
                      </div>
                      @if (getDocumentName(item)) {
                        <div class="mt-2.5 pt-2 border-t border-emerald-200/70 flex items-center justify-between text-xs">
                          <span class="text-emerald-800 font-medium">Document:</span>
                          <span class="font-bold text-emerald-950 truncate max-w-[170px]" [title]="getDocumentName(item)">{{ getDocumentName(item) }}</span>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </section>

        </main>

        <!-- ================= REMINDER TO RESIDENTS ================= -->
        <div class="px-6 lg:px-8 pb-3 shrink-0">
          <div class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-start sm:items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-orange-600">Reminder to Residents</h3>
                <p class="text-xs sm:text-sm font-medium text-slate-700 mt-0.5">
                  Please prepare your valid ID or Claim Slip when claiming documents at the releasing counter. If your number is not listed, your request is in queue.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= FOOTER ================= -->
        <footer class="bg-white border-t border-slate-200 px-6 lg:px-10 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 text-xs sm:text-sm text-slate-500 font-medium">
          <p>For your privacy, only request numbers are displayed.</p>
          <div class="flex items-center gap-2">
            @if (loading()) {
              <span class="inline-flex items-center gap-1.5 text-amber-600 font-semibold">
                <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Connecting to live stream...
              </span>
            } @else {
              <span class="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live &bull; Last updated {{ lastUpdated() | date: 'hh:mm:ss a' }}
              </span>
            }
          </div>
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

  readonly lanStatusUrl = 'http://192.168.100.245:4201/status-display';

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

  getStatusBadgeClass(statusName: string): string {
    switch (statusName) {
      case 'Submitted':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Waiting for Requirements':
      case 'Requirements Received':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Under Review':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Document Processing':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Ready for Release':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
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
        // Handled silently; stream or next poll will retry
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
