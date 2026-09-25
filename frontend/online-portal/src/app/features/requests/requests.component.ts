import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import {
  PortalService,
  Service,
  PortalRequest,
  UploadedRequirement,
  FormField
} from '../../core/services/portal.service';
import { AuthService } from '../../core/services/auth.service';
import { IdPhotoValidatorService } from '../../core/services/id-photo-validator.service';

type ViewMode = 'list' | 'details' | 'correct';
type FilterTab = 'all' | 'active' | 'corrections' | 'completed';

@Component({
  selector: 'portal-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      <!-- ================= HEADER SECTION ================= -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
              Online Document Portal
            </span>
            <span class="text-slate-400 text-xs">&bull;</span>
            <span class="text-xs font-semibold text-slate-500">Account ID: {{ auth.currentUser()?.account_id }}</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-black text-[#0f172a] mt-1.5 tracking-tight">
            My Document Requests
          </h1>
          <p class="text-slate-500 text-sm sm:text-base mt-1 max-w-2xl leading-relaxed">
            Monitor the status of your submitted requests in real-time, view transaction history, and manage corrections.
          </p>
        </div>

        <div class="flex items-center gap-3">
          @if (viewMode() === 'list') {
            <a
              routerLink="/services"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm shadow-sm hover:shadow transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>New Request</span>
            </a>
          } @else {
            <button
              type="button"
              (click)="switchView('list')"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-sm transition cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Back to Requests</span>
            </button>
          }
        </div>
      </div>

      <!-- ================= ALERT BANNER (If Any Return For Correction Exists) ================= -->
      @if (viewMode() === 'list' && correctionCount() > 0) {
        <div class="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 sm:p-5 flex items-start gap-4 text-amber-900 shadow-xs">
          <div class="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 shrink-0 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="font-bold text-sm sm:text-base text-amber-950">
              Action Required: {{ correctionCount() }} request{{ correctionCount() === 1 ? '' : 's' }} returned for correction
            </h2>
            <p class="text-xs sm:text-sm text-amber-800 mt-0.5 leading-relaxed">
              Barangay staff requested updates on submitted requirements or information. Review the notes and resubmit without losing your queue number.
            </p>
          </div>
          <button
            type="button"
            (click)="activeTab.set('corrections')"
            class="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition cursor-pointer">
            View Items
          </button>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- VIEW: LIST OF REQUESTS (DEFAULT DASHBOARD) -->
      <!-- ========================================================================= -->
      @if (viewMode() === 'list') {

        <!-- Search & Filter Controls -->
        <div class="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <!-- Filter Tabs -->
          <div class="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              type="button"
              (click)="activeTab.set('all')"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer"
              [class.bg-white]="activeTab() === 'all'"
              [class.text-slate-900]="activeTab() === 'all'"
              [class.shadow-xs]="activeTab() === 'all'"
              [class.text-slate-600]="activeTab() !== 'all'">
              All ({{ requests().length }})
            </button>
            <button
              type="button"
              (click)="activeTab.set('active')"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer"
              [class.bg-white]="activeTab() === 'active'"
              [class.text-slate-900]="activeTab() === 'active'"
              [class.shadow-xs]="activeTab() === 'active'"
              [class.text-slate-600]="activeTab() !== 'active'">
              In Progress ({{ activeCount() }})
            </button>
            <button
              type="button"
              (click)="activeTab.set('corrections')"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer"
              [class.bg-amber-500]="activeTab() === 'corrections'"
              [class.text-white]="activeTab() === 'corrections'"
              [class.text-slate-600]="activeTab() !== 'corrections'">
              Corrections ({{ correctionCount() }})
            </button>
            <button
              type="button"
              (click)="activeTab.set('completed')"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer"
              [class.bg-white]="activeTab() === 'completed'"
              [class.text-slate-900]="activeTab() === 'completed'"
              [class.shadow-xs]="activeTab() === 'completed'"
              [class.text-slate-600]="activeTab() !== 'completed'">
              Completed
            </button>
          </div>

          <!-- Search Bar -->
          <div class="relative max-w-xs w-full">
            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search by request # or service"
              [value]="searchQuery()"
              (input)="searchQuery.set($any($event.target).value)"
              class="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
            />
          </div>
        </div>

        <!-- Requests Grid / List -->
        @if (loading()) {
          <div class="mt-6 space-y-4">
            @for (i of [1, 2, 3]; track i) {
              <div class="h-32 rounded-2xl bg-slate-100 animate-pulse"></div>
            }
          </div>
        } @else if (filteredRequests().length === 0) {
          <div class="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center">
            <div class="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 mx-auto flex items-center justify-center">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h2 class="mt-4 text-lg font-bold text-slate-900">No requests found</h2>
            <p class="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              @if (searchQuery()) {
                No requests match your search criteria. Try a different keyword or clear the search.
              } @else {
                You haven't submitted any document requests yet. Click "New Request" to get started online.
              }
            </p>
            <div class="mt-5">
              <a
                routerLink="/services"
                class="inline-flex items-center px-4 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs sm:text-sm transition">
                Browse Services
              </a>
            </div>
          </div>
        } @else {
          <div class="mt-6 space-y-4">
            @for (req of filteredRequests(); track req.request_id) {
              <div class="rounded-2xl border bg-white p-5 sm:p-6 shadow-xs transition hover:border-slate-300"
                   [class.border-amber-300]="req.status_id === 10"
                   [class.bg-amber-50/20]="req.status_id === 10"
                   [class.border-slate-200]="req.status_id !== 10">
                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-mono text-xs font-bold text-slate-500 uppercase tracking-wide">
                        {{ req.request_number }}
                      </span>
                      <span class="text-slate-300">&bull;</span>
                      <!-- Source Tag -->
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold"
                            [class.bg-blue-50]="req.source === 'Online'"
                            [class.text-blue-700]="req.source === 'Online'"
                            [class.bg-slate-100]="req.source !== 'Online'"
                            [class.text-slate-700]="req.source !== 'Online'">
                        {{ req.source || 'Kiosk' }}
                      </span>
                      <span class="text-slate-300">&bull;</span>
                      <!-- Status Badge -->
                      <span [class]="getStatusBadgeClass(req.status_id)">
                        {{ req.status_name }}
                      </span>
                    </div>

                    <h2 class="text-lg sm:text-xl font-black text-slate-900 mt-2">
                      {{ req.service_name }}
                    </h2>

                    @if (req.purpose) {
                      <p class="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-1">
                        <span class="font-semibold text-slate-700">Purpose:</span> {{ req.purpose }}
                      </p>
                    }

                    <div class="mt-3 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                      <span>Submitted: {{ req.request_date | date:'mediumDate' }}</span>
                      <span>&bull;</span>
                      <span>Fee: {{ req.processing_fee > 0 ? ('₱' + (req.processing_fee | number:'1.2-2')) : 'FREE' }}</span>
                      @if (req.requirements && req.requirements.length > 0) {
                        <span>&bull;</span>
                        <span class="text-slate-700 font-medium">{{ req.requirements.length }} requirement{{ req.requirements.length === 1 ? '' : 's' }} uploaded</span>
                      }
                    </div>

                    <!-- Returned for Correction Note -->
                    @if (req.status_id === 10) {
                      <div class="mt-3 rounded-xl bg-amber-100/70 border border-amber-200 p-3 text-xs text-amber-950">
                        <div class="font-bold flex items-center gap-1.5 text-amber-900">
                          <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                          Staff Note for Correction:
                        </div>
                        <p class="mt-1 leading-relaxed">{{ req.correction_remarks || req.remarks || 'Please update your uploaded documents or form information.' }}</p>
                      </div>
                    }

                    <!-- Ready for Release Alert -->
                    @if (req.status_id === 6) {
                      <div class="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900">
                        <span class="font-bold">Ready for Pickup:</span> Your document is prepared. Please present a valid ID at Barangay San Manuel to claim your official document.
                      </div>
                    }
                  </div>

                  <!-- Actions -->
                  <div class="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    @if (req.status_id === 10) {
                      <button
                        type="button"
                        (click)="openCorrection(req)"
                        class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer">
                        Fix & Resubmit
                      </button>
                    }
                    <button
                      type="button"
                      (click)="viewDetails(req)"
                      class="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs transition cursor-pointer">
                      View Details
                    </button>
                    <!-- Request Again for Released / Completed Requests -->
                    @if (req.status_id === 7 || req.status_id === 8 || req.status_id === 9) {
                      <button
                        type="button"
                        (click)="requestAgain(req)"
                        title="Reuse previous information to create a new request"
                        class="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-xs transition cursor-pointer">
                        Request Again
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- ========================================================================= -->
      <!-- VIEW: REQUEST DETAILS MODAL / DRAWER -->
      <!-- ========================================================================= -->
      @if (viewMode() === 'details' && selectedRequest(); as req) {
        <div class="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div class="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-sm font-bold text-slate-600 uppercase">{{ req.request_number }}</span>
                <span [class]="getStatusBadgeClass(req.status_id)">{{ req.status_name }}</span>
              </div>
              <h2 class="text-2xl font-black text-slate-900 mt-1">{{ req.service_name }}</h2>
              <p class="text-xs text-slate-500 mt-0.5">Submitted on {{ req.request_date | date:'medium' }} via {{ req.source || 'Online' }}</p>
            </div>
            <button
              type="button"
              (click)="switchView('list')"
              class="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs transition cursor-pointer">
              Close Details
            </button>
          </div>

          <div class="grid md:grid-cols-2 gap-8 mt-6">
            <!-- Left Column: Details & Uploaded Files -->
            <div class="space-y-5">
              <div>
                <h3 class="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Request Details</h3>
                <div class="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-xs sm:text-sm">
                  <div>
                    <span class="text-slate-400 font-bold uppercase text-[11px] block">Purpose</span>
                    <p class="text-slate-800 font-medium leading-relaxed">{{ req.purpose || 'Not specified' }}</p>
                  </div>
                  <div>
                    <span class="text-slate-400 font-bold uppercase text-[11px] block">Processing Fee</span>
                    <p class="text-slate-800 font-bold">{{ req.processing_fee > 0 ? ('₱' + (req.processing_fee | number:'1.2-2')) : 'FREE' }}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Attached Documents</h3>
                @if (!req.requirements || req.requirements.length === 0) {
                  <p class="text-xs text-slate-500 italic">No uploaded documents attached.</p>
                } @else {
                  <div class="space-y-2">
                    @for (doc of req.requirements; track doc.requirement_name) {
                      <div class="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                        <div class="min-w-0 pr-2">
                          <p class="text-xs font-bold text-slate-800 truncate">{{ doc.requirement_name }}</p>
                          <p class="text-[11px] text-slate-500 truncate">{{ doc.original_name }}</p>
                        </div>
                        <a
                          [href]="doc.file_url"
                          target="_blank"
                          class="px-3 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold shrink-0 transition">
                          View File
                        </a>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Right Column: Status Timeline -->
            <div>
              <h3 class="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Workflow Status Timeline</h3>
              @if (!req.history || req.history.length === 0) {
                <p class="text-xs text-slate-500 italic">No history records available yet.</p>
              } @else {
                <div class="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  @for (h of req.history; track h.history_id) {
                    <div class="relative">
                      <div class="absolute -left-6 top-1 w-4 h-4 rounded-full bg-orange-500 border-2 border-white ring-2 ring-orange-100"></div>
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-bold text-slate-900">{{ h.status_name }}</span>
                          <span class="text-[10px] text-slate-400">{{ h.changed_at | date:'short' }}</span>
                        </div>
                        @if (h.remarks) {
                          <p class="text-xs text-slate-600 mt-1 bg-slate-50 rounded-lg p-2.5 border border-slate-100 leading-relaxed">
                            {{ h.remarks }}
                          </p>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- VIEW: RETURNED FOR CORRECTION FIX & RESUBMIT -->
      <!-- ========================================================================= -->
      @if (viewMode() === 'correct' && correctingRequest(); as req) {
        <div class="mt-6 rounded-3xl border border-amber-300 bg-white p-6 sm:p-8 shadow-xs">
          <div class="border-b border-slate-200 pb-5">
            <span class="text-xs font-bold uppercase tracking-wide text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Returned For Correction
            </span>
            <h2 class="text-2xl font-black text-slate-900 mt-2">Update Request #{{ req.request_number }}</h2>
            <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
              Service: <strong class="text-slate-800">{{ req.service_name }}</strong>
            </p>
          </div>

          <!-- Staff Correction Instructions -->
          <div class="mt-5 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs sm:text-sm text-amber-950">
            <div class="flex items-center gap-2 font-bold text-amber-900">
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>Instruction from Barangay Staff:</span>
            </div>
            <p class="mt-1.5 leading-relaxed font-medium">
              {{ req.correction_remarks || req.remarks || 'Please replace invalid requirements or provide updated information.' }}
            </p>
          </div>

          <!-- Replace / Update Requirements -->
          <div class="mt-6">
            <h3 class="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              Replace or Re-upload Requirement Files
            </h3>
            <div class="space-y-3">
              @for (reqName of getServiceRequirementsList(req); track reqName; let idx = $index) {
                <div class="rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-[11px] font-bold text-slate-400 uppercase">Requirement #{{ idx + 1 }}</span>
                      @if (is2x2PhotoReq(reqName)) {
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                          2×2 ID Photo
                        </span>
                      }
                    </div>
                    <h4 class="font-bold text-slate-900 text-sm mt-0.5">{{ reqName }}</h4>
                    @if (is2x2PhotoReq(reqName)) {
                      <p class="text-[11px] text-slate-500 mt-0.5">JPG, JPEG, PNG only &bull; 1:1 Square &bull; Min 300×300 px &bull; White background</p>
                    }
                    @if (getUploadedReq(reqName); as up) {
                      <div class="flex items-center gap-2 mt-1">
                        @if (is2x2PhotoReq(reqName)) {
                          <img [src]="up.file_url" alt="Preview" class="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                        }
                        <p class="text-xs text-emerald-600 font-semibold">Current file: {{ up.original_name }}</p>
                      </div>
                    }
                  </div>

                  <div>
                    <label [for]="'reupload-file-' + idx"
                           class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-orange-500 text-slate-700 font-bold text-xs transition cursor-pointer">
                      <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span>{{ is2x2PhotoReq(reqName) ? 'Upload New 2×2 Photo' : 'Replace File' }}</span>
                    </label>
                    <input
                      [id]="'reupload-file-' + idx"
                      type="file"
                      [accept]="is2x2PhotoReq(reqName) ? 'image/jpeg,image/png' : '.pdf,image/jpeg,image/png'"
                      class="sr-only"
                      (change)="onFileSelected($event, reqName)"
                    />
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Updated Notes or Remarks -->
          <div class="mt-6">
            <label for="correct-remarks" class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Your note to staff explaining changes (optional)
            </label>
            <textarea
              id="correct-remarks"
              rows="3"
              [(ngModel)]="correctionRemarks"
              placeholder="e.g. Uploaded the updated government ID with complete address."
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition">
            </textarea>
          </div>

          <div class="mt-8 flex items-center justify-between">
            <button
              type="button"
              (click)="switchView('list')"
              class="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-sm transition cursor-pointer">
              Cancel
            </button>
            <button
              type="button"
              [disabled]="submitting()"
              (click)="submitCorrection(req)"
              class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-sm transition cursor-pointer">
              @if (submitting()) {
                <span>Resubmitting...</span>
              } @else {
                <span>Resubmit Corrected Request</span>
              }
            </button>
          </div>
        </div>
      }

    </div>
  `
})
export class RequestsComponent implements OnInit {
  private portalService = inject(PortalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public auth = inject(AuthService);
  private idPhotoValidator = inject(IdPhotoValidatorService);

  viewMode = signal<ViewMode>('list');
  activeTab = signal<FilterTab>('all');
  searchQuery = signal<string>('');

  requests = signal<PortalRequest[]>([]);
  loading = signal<boolean>(true);

  // Details & Correction state
  selectedRequest = signal<PortalRequest | null>(null);
  correctingRequest = signal<PortalRequest | null>(null);
  correctionRemarks: string = '';
  uploadedRequirements = signal<UploadedRequirement[]>([]);
  uploadingReq = signal<string | null>(null);
  submitting = signal<boolean>(false);

  // Computed values
  residentFullName = computed(() => {
    const u = this.auth.currentUser();
    if (!u) return 'Resident';
    return [u.first_name, u.middle_name, u.last_name, u.suffix].filter(Boolean).join(' ');
  });

  activeCount = computed(() => {
    return this.requests().filter(r => [1, 2, 3, 4, 5, 6].includes(r.status_id)).length;
  });

  correctionCount = computed(() => {
    return this.requests().filter(r => r.status_id === 10).length;
  });

  filteredRequests = computed(() => {
    let list = this.requests();
    const tab = this.activeTab();
    const q = this.searchQuery().trim().toLowerCase();

    if (tab === 'active') {
      list = list.filter(r => [1, 2, 3, 4, 5, 6].includes(r.status_id));
    } else if (tab === 'corrections') {
      list = list.filter(r => r.status_id === 10);
    } else if (tab === 'completed') {
      list = list.filter(r => [7, 8, 9].includes(r.status_id));
    }

    if (q) {
      list = list.filter(r =>
        (r.request_number || '').toLowerCase().includes(q) ||
        (r.service_name || '').toLowerCase().includes(q) ||
        (r.purpose || '').toLowerCase().includes(q)
      );
    }

    return list;
  });

  ngOnInit(): void {
    // If legacy link navigated with query parameter service_id, redirect cleanly to /apply
    const serviceId = this.route.snapshot.queryParams['service_id'];
    if (serviceId) {
      this.router.navigate(['/apply'], {
        queryParams: { service_id: serviceId }
      });
      return;
    }

    this.fetchRequests();
  }

  fetchRequests(): void {
    this.loading.set(true);
    this.portalService.getMyRequests({ limit: 50 }).subscribe({
      next: (res) => {
        this.requests.set(res.data?.requests || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  switchView(mode: ViewMode): void {
    this.viewMode.set(mode);
    if (mode === 'list') {
      this.fetchRequests();
    }
  }

  is2x2PhotoReq(reqName: string): boolean {
    const n = (reqName || '').toLowerCase();
    return n.includes('2x2') || n.includes('photo') || n.includes('picture') || n.includes('id picture') || n.includes('passport-size');
  }

  async onFileSelected(event: Event, reqName: string): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limit. Please upload a smaller file.');
      input.value = '';
      return;
    }

    // 2x2 Photo validation if applicable
    if (this.is2x2PhotoReq(reqName)) {
      this.uploadingReq.set(reqName);
      try {
        const validation = await this.idPhotoValidator.validateIdPhoto(file);
        if (!validation.isValid) {
          alert(validation.error || 'The uploaded file failed 2×2 ID photo validation.');
          this.uploadingReq.set(null);
          input.value = '';
          return;
        }
      } catch {
        alert('An unexpected error occurred during photo validation. Please try again.');
        this.uploadingReq.set(null);
        input.value = '';
        return;
      }
    }

    this.uploadingReq.set(reqName);
    this.portalService.uploadRequirement(file).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const uploaded: UploadedRequirement = {
            requirement_name: reqName,
            file_url: res.data.file_url,
            file_name: res.data.file_name,
            original_name: res.data.original_name,
            size: res.data.size,
            mime_type: res.data.mime_type
          };

          // Update in state
          const current = this.uploadedRequirements().filter(r => r.requirement_name !== reqName);
          this.uploadedRequirements.set([...current, uploaded]);
        }
        this.uploadingReq.set(null);
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to upload document. Please try again.');
        this.uploadingReq.set(null);
      }
    });
  }

  getUploadedReq(reqName: string): UploadedRequirement | undefined {
    return this.uploadedRequirements().find(r => r.requirement_name === reqName);
  }

  removeUploadedReq(reqName: string): void {
    this.uploadedRequirements.set(
      this.uploadedRequirements().filter(r => r.requirement_name !== reqName)
    );
  }

  formatSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  viewDetails(req: PortalRequest): void {
    this.selectedRequest.set(req);
    this.switchView('details');
    // Fetch full request details with history
    this.portalService.getRequestById(req.request_id).subscribe({
      next: (res) => {
        if (res.data) {
          this.selectedRequest.set(res.data);
        }
      }
    });
  }

  openCorrection(req: PortalRequest): void {
    this.correctingRequest.set(req);
    this.correctionRemarks = '';
    this.uploadedRequirements.set(req.requirements || []);
    this.switchView('correct');
  }

  getServiceRequirementsList(req: PortalRequest): string[] {
    const list = req.service_snapshot?.['requirements'];
    if (Array.isArray(list) && list.length > 0) return list;
    return ['Government ID / Barangay ID', 'Proof of Residency'];
  }

  submitCorrection(req: PortalRequest): void {
    this.submitting.set(true);
    this.portalService.resubmitRequest(req.request_id, {
      requirements: this.uploadedRequirements(),
      remarks: this.correctionRemarks
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        alert('Your corrected request has been resubmitted successfully.');
        this.switchView('list');
      },
      error: (err) => {
        this.submitting.set(false);
        alert(err?.error?.message || 'Failed to resubmit request. Please try again.');
      }
    });
  }

  requestAgain(req: PortalRequest): void {
    this.router.navigate(['/apply'], {
      queryParams: {
        service_id: req.service_id,
        reuse: '1'
      }
    });
  }

  getStatusBadgeClass(statusId: number): string {
    switch (statusId) {
      case 1: // Submitted
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800';
      case 2: // Waiting for Requirements
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800';
      case 3: // Requirements Received
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800';
      case 4: // Under Review
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800';
      case 5: // Document Processing
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800';
      case 6: // Ready for Release
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 animate-pulse';
      case 7: // Released
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800';
      case 8: // Rejected
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800';
      case 9: // Cancelled
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700';
      case 10: // Returned for Correction
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 ring-1 ring-red-300';
      case 11: // Resubmitted
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800';
      default:
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800';
    }
  }
}
