import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RequestService, DocumentService, ServiceService } from '../../shared/services';
import { NotificationService } from '../notifications/notification.service';
import { DocumentRequest, RequestStatusHistory, GeneratedDocument, Service } from '../../shared/interfaces/api.interfaces';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { DocumentPreviewModalComponent } from '../../shared/components/document-preview-modal.component';
import { RequestFormComponent } from './request-form.component';

interface RequestDetail extends DocumentRequest {
  history?: RequestStatusHistory[];
}

interface FormFieldEntry {
  key: string;
  label: string;
  value: string;
}

interface FormGroupSection {
  title: string;
  fields: FormFieldEntry[];
}

interface StatusOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableComponent,
    CardComponent,
    InputComponent,
    PaginationComponent,
    ButtonComponent,
    ModalComponent,
    RequestFormComponent,
    DocumentPreviewModalComponent
  ],
  template: `
    <div>
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Document Requests</h1>
          <p class="text-sm text-slate-500 mt-1">Monitor, review, and process resident document service requests through the official workflow.</p>
        </div>
        <app-button variant="primary" (onClick)="showForm.set(true)">+ New Request</app-button>
      </div>

      <app-card>
        <!-- Filter Bar -->
        <div class="mb-4 flex flex-col gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <!-- Search Input -->
            <div class="flex-1 min-w-[220px]">
              <app-input placeholder="Search requests (e.g. #, name, service)..." [value]="search()" (valueChange)="onSearch($event)" />
            </div>

            <!-- All Services Filter -->
            <div class="w-48 sm:w-52">
              <select
                [value]="serviceFilter()"
                (change)="onServiceFilter($any($event.target).value)"
                class="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer shadow-xs">
                <option value="">All Services</option>
                @for (svc of services(); track svc.service_id) {
                  <option [value]="svc.service_id">{{ svc.service_name }}</option>
                }
              </select>
            </div>

            <!-- All Dates Filter -->
            <div class="w-44 sm:w-48">
              <select
                [value]="datePreset()"
                (change)="onDatePresetChange($any($event.target).value)"
                class="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer shadow-xs">
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="custom">Custom Date Range...</option>
              </select>
            </div>

            <!-- All Statuses Filter -->
            <div class="w-48 sm:w-52">
              <select
                [value]="statusFilter()"
                (change)="onStatusFilter($any($event.target).value)"
                class="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer shadow-xs">
                @for (opt of filterOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            </div>

            <!-- Reset Filters Button -->
            @if (hasActiveFilters()) {
              <button
                type="button"
                (click)="resetFilters()"
                class="h-10 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Reset
              </button>
            }
          </div>

          <!-- Custom Date Range Sub-row -->
          @if (datePreset() === 'custom') {
            <div class="flex flex-wrap items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span class="text-xs font-bold text-slate-700 uppercase tracking-wide">Custom Range:</span>
              <div class="flex items-center gap-2">
                <label class="text-xs text-slate-500">From:</label>
                <input
                  type="date"
                  [value]="dateFrom()"
                  (change)="onCustomDateChange('from', $any($event.target).value)"
                  class="h-8 px-2.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs"
                />
              </div>
              <div class="flex items-center gap-2">
                <label class="text-xs text-slate-500">To:</label>
                <input
                  type="date"
                  [value]="dateTo()"
                  (change)="onCustomDateChange('to', $any($event.target).value)"
                  class="h-8 px-2.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs"
                />
              </div>
            </div>
          }
        </div>

        <!-- Read-only Table with Clickable Rows -->
        <app-table
          [columns]="columns"
          [data]="requests()"
          [loading]="loading()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          trackBy="request_id"
          emptyMessage="No document requests found"
          [cellTemplates]="{
            request_number: reqNumCell,
            resident_name: residentCell,
            service_name: serviceCell,
            request_date: dateCell,
            status_name: statusCell,
            expires_at: expiryCell,
            remarks: notesCell
          }"
          [selectedRow]="selectedRow()"
          (onSort)="onSort($event)"
          (onRowClick)="onRowClick($event)"
        >
          <!-- Request # -->
          <ng-template #reqNumCell let-row="row">
            <span class="text-sm font-semibold text-slate-900 font-mono">
              {{ row.request_number }}
            </span>
          </ng-template>

          <!-- Resident -->
          <ng-template #residentCell let-row="row">
            <div class="leading-tight">
              <span class="text-sm font-semibold text-slate-900">{{ row.resident_name }}</span>
              <p class="text-[11px] text-slate-400 font-mono mt-0.5">{{ row.resident_code || 'Guest' }}</p>
            </div>
          </ng-template>

          <!-- Service -->
          <ng-template #serviceCell let-row="row">
            <span class="text-sm font-semibold text-slate-800">{{ row.service_name }}</span>
          </ng-template>

          <!-- Date Submitted -->
          <ng-template #dateCell let-row="row">
            <div class="leading-tight">
              <p class="text-sm font-medium text-slate-800">{{ formatSubmissionDate(row.request_date) }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ formatSubmissionTime(row.request_date) }}</p>
            </div>
          </ng-template>

          <!-- Status (Read-Only Badge) -->
          <ng-template #statusCell let-row="row">
            <span [class]="'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ' + getStatusBadgeClass(row.status_id)">
              <span class="w-1.5 h-1.5 rounded-full" [class]="getStatusDotClass(row.status_id)"></span>
              {{ row.status_name }}
            </span>
          </ng-template>

          <!-- Claim Expiry -->
          <ng-template #expiryCell let-row="row">
            @if (row.is_expired) {
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-red-800 bg-red-50 border border-red-200">Expired</span>
            } @else if (row.expires_at) {
              <span [class]="expiryBadgeClass(row.expires_at)">
                {{ daysRemaining(row.expires_at) }}d left
              </span>
            } @else {
              <span class="text-slate-400 font-medium">-</span>
            }
          </ng-template>

          <!-- Notes -->
          <ng-template #notesCell let-row="row">
            <span class="text-xs text-slate-600 truncate max-w-[180px] block" [title]="row.remarks || '-'">
              {{ row.remarks || '-' }}
            </span>
          </ng-template>
        </app-table>

        <!-- Pagination -->
        @if (total() > 0) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            itemLabel="requests"
            (onPageChange)="onPageChange($event)"
            (onLimitChange)="onLimitChange($event)" />
        }
      </app-card>

      <!-- New Request Modal -->
      <app-modal [open]="showForm()" title="New Document Request" (onClose)="showForm.set(false)">
        <app-request-form
          [loading]="saving()"
          (onSave)="onSave($event)"
          (onCancel)="showForm.set(false)"
        />
      </app-modal>

      <!-- ================= REQUEST DETAILS & WORKFLOW CONTROL CENTER MODAL ================= -->
      <app-modal
        [open]="showDetails()"
        [title]="selectedRequest()?.request_number || 'Request Details'"
        (onClose)="closeDetails()"
        containerClass="max-w-3xl"
      >
        @if (selectedRequest(); as request) {
          <div class="space-y-6">

            <!-- Terminal State Alert Banner (If Rejected or Cancelled) -->
            @if (request.status_id === 8) {
              <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <h4 class="text-sm font-bold text-rose-900">Request Rejected</h4>
                  <p class="text-xs text-rose-700 mt-0.5">
                    This request was rejected. {{ request.remarks ? 'Reason: ' + request.remarks : '' }}
                  </p>
                </div>
              </div>
            } @else if (request.status_id === 9) {
              <div class="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <h4 class="text-sm font-bold text-slate-900">Request Cancelled</h4>
                  <p class="text-xs text-slate-600 mt-0.5">
                    This request was cancelled. {{ request.remarks ? 'Reason: ' + request.remarks : '' }}
                  </p>
                </div>
              </div>
            }

            <!-- Complete 7-Step Workflow Progress Indicator -->
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
              <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Workflow Progress</p>
              <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                @for (step of stepperSteps; track step.id) {
                  <div
                    [class]="'p-2.5 rounded-xl border flex flex-col items-center text-center transition ' + getStepperItemClass(request.status_id, step.id)">
                    <div class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mb-1" [class]="getStepperBadgeClass(request.status_id, step.id)">
                      @if (isStepPassed(request.status_id, step.id)) {
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      } @else {
                        {{ step.id }}
                      }
                    </div>
                    <span class="text-[11px] font-bold leading-tight line-clamp-2">
                      {{ step.label }}
                    </span>
                  </div>
                }
              </div>
            </div>

            <!-- Organized 2-Column Request Information -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Request Information
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p class="text-xs font-semibold text-slate-500">Request #</p>
                  <p class="text-sm font-bold text-slate-900 font-mono mt-0.5">{{ request.request_number }}</p>
                </div>

                <div>
                  <p class="text-xs font-semibold text-slate-500">Service Requested</p>
                  <p class="text-sm font-bold text-slate-900 mt-0.5">{{ request.service_name }}</p>
                </div>

                <div>
                  <p class="text-xs font-semibold text-slate-500">Resident Name</p>
                  <p class="text-sm font-bold text-slate-900 mt-0.5">
                    {{ request.resident_name }}
                    <span class="text-xs font-normal text-slate-500">({{ request.resident_code || 'Guest' }})</span>
                  </p>
                </div>

                <div>
                  <p class="text-xs font-semibold text-slate-500">Resident ID</p>
                  <p class="text-sm font-bold text-slate-900 font-mono mt-0.5">{{ request.resident_code || 'GUEST-UNREGISTERED' }}</p>
                </div>

                <div>
                  <p class="text-xs font-semibold text-slate-500">Date Submitted</p>
                  <p class="text-sm font-semibold text-slate-800 mt-0.5">{{ formatDate(request.request_date) }}</p>
                </div>

                <div>
                  <p class="text-xs font-semibold text-slate-500">Current Status</p>
                  <div class="mt-1">
                    <span [class]="'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ' + getStatusBadgeClass(request.status_id)">
                      <span class="w-1.5 h-1.5 rounded-full" [class]="getStatusDotClass(request.status_id)"></span>
                      {{ request.status_name }}
                    </span>
                  </div>
                </div>

                <div>
                  <p class="text-xs font-semibold text-slate-500">Purpose</p>
                  <p class="text-sm font-semibold text-slate-800 mt-0.5">{{ request.purpose || '-' }}</p>
                </div>

                <div>
                  <p class="text-xs font-semibold text-slate-500">Notes / Remarks</p>
                  <p class="text-sm font-medium text-slate-700 mt-0.5">{{ request.remarks || '-' }}</p>
                </div>

                @if (request.expires_at) {
                  <div>
                    <p class="text-xs font-semibold text-slate-500">Claim Expiry</p>
                    <p class="text-sm font-semibold text-slate-800 mt-0.5">
                      {{ formatDate(request.expires_at) }}
                      <span class="text-xs font-normal text-amber-700">({{ daysRemaining(request.expires_at) }}d left)</span>
                    </p>
                  </div>
                }
              </div>
            </div>

            <!-- ================= WORKFLOW QUICK ACTIONS (DROPDOWN + CONFIRMATION) ================= -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                Workflow Quick Actions
              </h4>

              <!-- Display Current Status Separately -->
              <div class="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
                <span class="text-slate-600 font-semibold">Current Status:</span>
                <span [class]="'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ' + getStatusBadgeClass(request.status_id)">
                  <span class="w-1.5 h-1.5 rounded-full" [class]="getStatusDotClass(request.status_id)"></span>
                  {{ request.status_name }}
                </span>
              </div>

              <!-- Available forward transitions -->
              @if (request.status_id < 7 && request.status_id !== 8 && request.status_id !== 9) {
                <div class="space-y-4">
                  <div>
                    <label for="next-status-select" class="block text-xs font-bold text-slate-700 mb-1.5">
                      Next Action / Status:
                    </label>
                    <select
                      id="next-status-select"
                      [value]="selectedNextStatus() || ''"
                      (change)="onNextStatusChange($any($event.target).value)"
                      class="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer shadow-xs"
                    >
                      @for (opt of getNextStatusOptions(request.status_id); track opt.value) {
                        <option [value]="opt.value">{{ opt.label }}</option>
                      }
                    </select>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      [disabled]="!selectedNextStatus() || actionLoading()"
                      (click)="openStatusConfirmDialog(request)"
                      class="py-2.5 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      Update Status
                    </button>

                    <!-- Separate Destructive Actions -->
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        (click)="openRejectDialog(request)"
                        class="py-2.5 px-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition cursor-pointer"
                      >
                        Reject Request
                      </button>
                      <button
                        type="button"
                        (click)="openCancelDialog(request)"
                        class="py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    </div>
                  </div>
                </div>
              } @else if (request.status_id === 7) {
                <!-- Completed State -->
                <div class="w-full py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Request completed and document officially released to resident. No further workflow action needed.</span>
                </div>
              } @else {
                <!-- Terminal State -->
                <p class="text-xs text-slate-500 italic">This request is closed and cannot be moved to another status.</p>
              }
            </div>

            <!-- Grouped Submitted Form Data -->
            @if (request.form_data && hasFormData(request.form_data)) {
              <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Submitted Form Data
                  </h4>
                  <button
                    type="button"
                    (click)="showJsonModal.set(true)"
                    class="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                    </svg>
                    Preview JSON
                  </button>
                </div>

                <div class="space-y-4">
                  @for (section of getGroupedFormData(request.form_data); track section.title) {
                    @if (section.fields.length > 0) {
                      <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <p class="text-xs font-bold text-slate-800 mb-2.5 pb-1 border-b border-slate-200">
                          {{ section.title }}
                        </p>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          @for (field of section.fields; track field.key) {
                            <div class="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-slate-100 last:border-0">
                              <span class="font-medium text-slate-500">{{ field.label }}:</span>
                              <span class="font-bold text-slate-900 sm:text-right">{{ field.value }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  }
                </div>
              </div>
            }

            <!-- Document Artifacts (Templates & Generation) -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  Document Artifacts
                </h4>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    [disabled]="previewBusy()"
                    (click)="previewRequestDocument()"
                    class="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline disabled:opacity-50 cursor-pointer">
                    {{ previewBusy() ? 'Loading...' : 'Preview Live' }}
                  </button>
                  <span class="text-slate-300">|</span>
                  <button
                    type="button"
                    [disabled]="editDocLoading()"
                    (click)="openEditDocumentModal()"
                    class="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    <span>Edit Document</span>
                  </button>
                </div>
              </div>

              @if (docError()) {
                <div class="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {{ docError() }}
                </div>
              }

              @if (documents().length > 0) {
                <div class="space-y-2">
                  @for (doc of documents(); track doc.document_id) {
                    <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50 hover:bg-white transition">
                      <div class="flex items-center justify-between mb-2">
                        <div class="min-w-0 flex-1">
                          <p class="font-bold text-slate-900 truncate text-xs" [title]="doc.file_name">{{ doc.file_name }}</p>
                          <p class="text-[11px] text-slate-400 mt-0.5">{{ formatDate(doc.generated_at) }} · {{ formatBytes(doc.file_size) }}</p>
                        </div>
                        @if (approvalBadge(doc.approval_status); as badge) {
                          <span [class]="'px-2.5 py-0.5 text-[10px] font-bold rounded-full border ' + badge.class">{{ badge.label }}</span>
                        }
                      </div>

                      <div class="flex items-center gap-3 border-t border-slate-200 pt-2 text-xs">
                        <button type="button" (click)="previewDocument(doc)" class="text-orange-600 font-bold hover:underline cursor-pointer">Preview</button>
                        <button type="button" (click)="downloadDocument(doc)" [disabled]="doc.approval_status !== 'approved'" class="text-slate-700 font-semibold hover:underline disabled:opacity-40 cursor-pointer">Download</button>
                        <button type="button" (click)="printDocument(doc)" [disabled]="doc.approval_status !== 'approved'" class="text-slate-700 font-semibold hover:underline disabled:opacity-40 cursor-pointer">Print</button>
                        
                        @if (doc.approval_status === 'pending') {
                          <span class="text-slate-300">|</span>
                          <button type="button" (click)="reviewDocument(doc, 'approved')" class="text-emerald-700 font-bold hover:underline cursor-pointer">Approve</button>
                          <button type="button" (click)="reviewDocument(doc, 'rejected')" class="text-rose-700 font-bold hover:underline cursor-pointer">Reject</button>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center">
                  No documents generated yet. Click "Preview Live" to generate one.
                </p>
              }
            </div>

            <!-- Status History Logs -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Status History Logs
              </h4>
              @if (request.history && request.history.length > 0) {
                <ol class="border-l-2 border-orange-200 space-y-3.5 pl-4 ml-2">
                  @for (entry of request.history; track entry.history_id) {
                    <li class="text-xs relative">
                      <span class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-orange-600 ring-4 ring-white"></span>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-900">{{ entry.status_name }}</span>
                        <span class="text-[11px] text-slate-400 font-medium">{{ formatDate(entry.changed_at) }}</span>
                      </div>
                      <p class="text-xs text-slate-600 mt-0.5">
                        {{ entry.changed_by_name ? entry.changed_by_name : 'System' }}
                        @if (entry.remarks) {
                          <span class="text-slate-500 font-normal"> — {{ entry.remarks }}</span>
                        }
                      </p>
                    </li>
                  }
                </ol>
              } @else {
                <p class="text-xs text-slate-400">No status history recorded yet.</p>
              }
            </div>

          </div>
        }
      </app-modal>

      <!-- ================= CONFIRM STATUS UPDATE MODAL ================= -->
      <app-modal
        [open]="showStatusConfirmModal()"
        title="Confirm Status Update"
        (onClose)="closeStatusConfirmDialog()"
        containerClass="max-w-md"
      >
        <div class="text-center">
          <div class="w-14 h-14 rounded-full bg-orange-50 text-orange-600 border border-orange-200 mx-auto mb-4 flex items-center justify-center">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900">Confirm Status Update</h3>
          <p class="text-xs text-slate-600 mt-1">
            Are you sure you want to update the workflow status for this request?
          </p>

          <div class="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Request Number:</span>
              <span class="font-mono font-bold text-slate-900">{{ activeRequestForAction()?.request_number }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-medium">Current Status:</span>
              <span class="font-semibold text-slate-700">{{ activeRequestForAction()?.status_name }}</span>
            </div>
            <div class="flex justify-between border-t border-slate-200 pt-2">
              <span class="text-slate-500 font-medium">Next Status:</span>
              <span class="font-bold text-orange-600">{{ getStatusLabel(selectedNextStatus()) }}</span>
            </div>
          </div>
        </div>

        @if (actionError()) {
          <div class="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {{ actionError() }}
          </div>
        }

        <div class="mt-6 flex items-center gap-3">
          <button
            type="button"
            (click)="closeStatusConfirmDialog()"
            class="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            [disabled]="actionLoading()"
            (click)="confirmStatusUpdate()"
            class="flex-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition cursor-pointer"
          >
            {{ actionLoading() ? 'Updating...' : 'Confirm Update' }}
          </button>
        </div>
      </app-modal>

      <!-- ================= REJECT REQUEST CONFIRMATION MODAL ================= -->
      <app-modal
        [open]="showRejectModal()"
        title="Reject Request"
        (onClose)="closeRejectDialog()"
        containerClass="max-w-md"
      >
        <div class="text-center">
          <div class="w-14 h-14 rounded-full bg-rose-50 text-rose-600 border border-rose-200 mx-auto mb-4 flex items-center justify-center">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900">Reject Request</h3>
          <p class="text-xs text-slate-600 mt-1">
            Are you sure you want to reject this request?
          </p>
          <div class="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-800">
            {{ activeRequestForAction()?.request_number }}
          </div>
        </div>

        <div class="mt-4 text-left">
          <label class="block text-xs font-bold text-slate-800 mb-1.5">
            Reason for Rejection <span class="text-rose-600">*</span>
          </label>
          <textarea
            rows="3"
            required
            placeholder="Enter the reason for rejecting this document request (e.g. incomplete requirements, invalid resident record)..."
            [value]="rejectionReason()"
            (input)="rejectionReason.set($any($event.target).value)"
            class="w-full p-3 rounded-xl border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 placeholder:text-slate-400 transition"
          ></textarea>
        </div>

        @if (actionError()) {
          <div class="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {{ actionError() }}
          </div>
        }

        <div class="mt-6 flex items-center gap-3">
          <button
            type="button"
            (click)="closeRejectDialog()"
            class="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            [disabled]="!rejectionReason().trim() || actionLoading()"
            (click)="confirmRejection()"
            class="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition cursor-pointer"
          >
            {{ actionLoading() ? 'Rejecting...' : 'Reject Request' }}
          </button>
        </div>
      </app-modal>

      <!-- ================= CANCEL REQUEST CONFIRMATION MODAL ================= -->
      <app-modal
        [open]="showCancelModal()"
        title="Cancel Request"
        (onClose)="closeCancelDialog()"
        containerClass="max-w-md"
      >
        <div class="text-center">
          <div class="w-14 h-14 rounded-full bg-slate-100 text-slate-600 border border-slate-200 mx-auto mb-4 flex items-center justify-center">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900">Cancel Request</h3>
          <p class="text-xs text-slate-600 mt-1">
            Are you sure you want to cancel this request?
          </p>
          <div class="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-800">
            {{ activeRequestForAction()?.request_number }}
          </div>
        </div>

        <div class="mt-4 text-left">
          <label class="block text-xs font-bold text-slate-800 mb-1.5">
            Cancellation Note (Optional)
          </label>
          <textarea
            rows="2"
            placeholder="Enter any notes regarding the cancellation..."
            [value]="cancelReason()"
            (input)="cancelReason.set($any($event.target).value)"
            class="w-full p-3 rounded-xl border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400 transition"
          ></textarea>
        </div>

        <div class="mt-6 flex items-center gap-3">
          <button
            type="button"
            (click)="closeCancelDialog()"
            class="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
          >
            No, Keep Request
          </button>
          <button
            type="button"
            [disabled]="actionLoading()"
            (click)="confirmCancellation()"
            class="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition cursor-pointer"
          >
            {{ actionLoading() ? 'Cancelling...' : 'Yes, Cancel Request' }}
          </button>
        </div>
      </app-modal>

      <!-- ================= JSON PREVIEW MODAL ================= -->
      <app-modal
        [open]="showJsonModal()"
        title="Raw Form JSON Data"
        (onClose)="showJsonModal.set(false)"
        containerClass="max-w-lg"
      >
        <div class="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto max-h-96">
          <pre>{{ selectedRequest()?.form_data | json }}</pre>
        </div>
        <div class="mt-4 flex justify-end">
          <button
            type="button"
            (click)="showJsonModal.set(false)"
            class="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </app-modal>

      <!-- ================= EDIT DOCUMENT MODAL ================= -->
      <app-modal
        [open]="showEditDocModal()"
        title="Edit Document Information"
        (onClose)="closeEditDocumentModal()"
        containerClass="max-w-2xl"
      >
        <div class="space-y-4">
          <!-- Header Banner / Info -->
          <div class="p-3.5 bg-orange-50/80 border border-orange-200/80 rounded-2xl flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </div>
            <div class="text-xs text-slate-700 leading-relaxed">
              <p class="font-bold text-slate-900 mb-0.5">
                {{ selectedRequest()?.request_number }} — {{ selectedRequest()?.service_name }}
              </p>
              <p class="text-slate-600">
                Correct any resident typos or application details below. When you save, the changes are persisted to the request and the document artifact will immediately regenerate for preview.
              </p>
            </div>
          </div>

          @if (editDocError()) {
            <div class="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ editDocError() }}</span>
            </div>
          }

          <!-- Editable Fields Grid -->
          <div class="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            <!-- Purpose of Request -->
            <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <label class="block text-xs font-bold text-slate-800 mb-1">Purpose of Request</label>
              <input
                type="text"
                [value]="editPurpose()"
                (input)="editPurpose.set($any($event.target).value)"
                placeholder="e.g. Employment Application, Scholarship, Bank Requirement..."
                class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              />
            </div>

            <!-- Dynamic Application / Resident Form Fields -->
            @if (editFormFieldEntries().length > 0) {
              <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <p class="text-xs font-bold text-slate-800 pb-1 border-b border-slate-200 flex items-center justify-between">
                  <span>Application Form Fields</span>
                  <span class="text-[11px] font-normal text-slate-500">{{ editFormFieldEntries().length }} field(s)</span>
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  @for (entry of editFormFieldEntries(); track entry.key) {
                    <div>
                      <label class="block text-[11px] font-semibold text-slate-700 mb-1 truncate" [title]="entry.label">
                        {{ entry.label }}
                      </label>
                      <input
                        type="text"
                        [value]="entry.value"
                        (input)="updateEditFormField(entry.key, $any($event.target).value)"
                        [placeholder]="entry.label"
                        class="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                      />
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Staff Remarks / Notes -->
            <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <label class="block text-xs font-bold text-slate-800 mb-1">Staff Notes / Remarks</label>
              <textarea
                rows="2"
                [value]="editRemarks()"
                (input)="editRemarks.set($any($event.target).value)"
                placeholder="Optional internal remarks or corrections log..."
                class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              ></textarea>
            </div>
          </div>

          <!-- Modal Footer Actions -->
          <div class="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              (click)="closeEditDocumentModal()"
              class="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              [disabled]="editDocLoading()"
              (click)="saveEditDocument()"
              class="py-2 px-4.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              @if (editDocLoading()) {
                <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>Saving & Regenerating...</span>
              } @else {
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Save & Update Document</span>
              }
            </button>
          </div>
        </div>
      </app-modal>

      <!-- Document Preview Modal -->
      <app-document-preview-modal
        [open]="showPreview()"
        [title]="previewTitle"
        [blob]="previewBlob"
        (onClose)="closePreview()"
      />

    </div>
  `
})
export class RequestsComponent implements OnInit, OnDestroy {
  requests = signal<DocumentRequest[]>([]);
  services = signal<Service[]>([]);
  loading = signal(true);
  search = signal('');
  page = signal(1);
  limit = 10;
  total = signal(0);
  sortColumn = signal('request_id');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');
  statusFilter = signal('');
  serviceFilter = signal('');
  datePreset = signal('');
  dateFrom = signal('');
  dateTo = signal('');

  showForm = signal(false);
  saving = signal(false);
  showDetails = signal(false);
  selectedRequest = signal<RequestDetail | null>(null);
  selectedRow = signal<DocumentRequest | null>(null);
  documents = signal<GeneratedDocument[]>([]);
  generatingDoc = signal(false);
  previewBusy = signal(false);
  docError = signal('');
  docNotice = signal('');

  // Edit Document Modal Signals
  showEditDocModal = signal(false);
  editDocLoading = signal(false);
  editDocError = signal('');
  editPurpose = signal('');
  editRemarks = signal('');
  editFormFieldEntries = signal<FormFieldEntry[]>([]);

  // Workflow Dropdown & Confirmation Dialog Signals
  selectedNextStatus = signal<number | null>(null);
  showStatusConfirmModal = signal(false);
  showRejectModal = signal(false);
  showCancelModal = signal(false);
  showJsonModal = signal(false);
  rejectionReason = signal('');
  cancelReason = signal('');
  activeRequestForAction = signal<DocumentRequest | null>(null);
  actionLoading = signal(false);
  actionError = signal('');

  // Complete 7-Step Workflow Order
  stepperSteps = [
    { id: 1, label: 'Submitted' },
    { id: 2, label: 'Waiting for Requirements' },
    { id: 3, label: 'Requirements Received' },
    { id: 4, label: 'Under Review' },
    { id: 5, label: 'Document Processing' },
    { id: 6, label: 'Ready for Release' },
    { id: 7, label: 'Released' }
  ];

  private sseSubscription: any = null;
  private pendingRequestId: number | null = null;

  columns: TableColumn[] = [
    { key: 'request_number', label: 'Request #', sortable: true },
    { key: 'resident_name', label: 'Resident' },
    { key: 'service_name', label: 'Service' },
    { key: 'request_date', label: 'Date Submitted', sortable: true },
    { key: 'status_name', label: 'Status' },
    { key: 'expires_at', label: 'Claim Expiry' },
    { key: 'remarks', label: 'Notes' }
  ];

  statusOptions = [
    { value: 1, label: 'Submitted' },
    { value: 2, label: 'Waiting for Requirements' },
    { value: 3, label: 'Requirements Received' },
    { value: 4, label: 'Under Review' },
    { value: 5, label: 'Document Processing' },
    { value: 6, label: 'Ready for Release' },
    { value: 7, label: 'Released' },
    { value: 8, label: 'Rejected' },
    { value: 9, label: 'Cancelled' }
  ];

  filterOptions = [
    { value: '', label: 'All Statuses' },
    ...this.statusOptions
  ];

  constructor(
    private requestService: RequestService,
    private serviceService: ServiceService,
    private documentService: DocumentService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadServices();
    this.route.queryParams.subscribe(params => {
      if (params['requestId']) {
        this.pendingRequestId = parseInt(params['requestId']);
        const request = this.requests().find(r => r.request_id === this.pendingRequestId);
        if (request) {
          this.viewDetails(request);
        }
        this.router.navigate([], { queryParams: { requestId: null }, queryParamsHandling: 'merge' });
      }
      if (params['new'] === '1') {
        this.showForm.set(true);
        this.router.navigate([], { queryParams: { new: null }, queryParamsHandling: 'merge' });
      }
    });
    this.loadRequests();
    this.connectToRequestUpdates();
  }

  ngOnDestroy() {
    this.disconnectFromRequestUpdates();
  }

  // --- Stepper Styling Helpers ---
  isStepPassed(currentStatusId: number, stepId: number): boolean {
    if (currentStatusId === 8 || currentStatusId === 9) return false;
    return currentStatusId > stepId;
  }

  getStepperItemClass(currentStatusId: number, stepId: number): string {
    if (currentStatusId === stepId) {
      return 'bg-orange-50 border-orange-400 text-orange-700 shadow-2xs font-bold ring-2 ring-orange-500/20';
    }
    if (currentStatusId > stepId && currentStatusId !== 8 && currentStatusId !== 9) {
      return 'bg-emerald-50/60 border-emerald-300 text-emerald-800';
    }
    return 'bg-white border-slate-200 text-slate-400 opacity-60';
  }

  getStepperBadgeClass(currentStatusId: number, stepId: number): string {
    if (currentStatusId === stepId) {
      return 'bg-orange-600 text-white';
    }
    if (currentStatusId > stepId && currentStatusId !== 8 && currentStatusId !== 9) {
      return 'bg-emerald-600 text-white';
    }
    return 'bg-slate-200 text-slate-600';
  }

  // --- Status Badge Color Styling ---
  getStatusBadgeClass(statusId: number): string {
    switch (statusId) {
      case 1: // Submitted
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 2: // Waiting for Requirements
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 3: // Requirements Received
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 4: // Under Review
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 5: // Document Processing
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 6: // Ready for Release
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 7: // Released
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 8: // Rejected
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 9: // Cancelled
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  getStatusDotClass(statusId: number): string {
    switch (statusId) {
      case 1: return 'bg-blue-500';
      case 2: return 'bg-amber-500';
      case 3: return 'bg-sky-500';
      case 4: return 'bg-orange-500';
      case 5: return 'bg-indigo-500';
      case 6: return 'bg-purple-500';
      case 7: return 'bg-emerald-500';
      case 8: return 'bg-rose-500';
      case 9: return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  }

  getStatusLabel(statusId: number | null): string {
    if (!statusId) return '-';
    const opt = this.statusOptions.find(o => o.value === statusId);
    return opt ? opt.label : `Status ${statusId}`;
  }

  // --- Strict Forward Workflow Options ---
  // Workflow order: 1 Submitted -> 2 Waiting for Requirements -> 3 Requirements Received -> 4 Under Review -> 5 Document Processing -> 6 Ready for Release -> 7 Released
  getNextStatusOptions(currentStatusId: number): StatusOption[] {
    switch (currentStatusId) {
      case 1: // Submitted
        return [
          { value: 4, label: 'Under Review (Start Review)' },
          { value: 2, label: 'Waiting for Requirements (Request Requirements)' }
        ];
      case 2: // Waiting for Requirements
        return [
          { value: 3, label: 'Requirements Received (Mark Requirements Received)' }
        ];
      case 3: // Requirements Received
        return [
          { value: 4, label: 'Under Review (Start Review)' }
        ];
      case 4: // Under Review
        return [
          { value: 5, label: 'Document Processing (Start Processing)' }
        ];
      case 5: // Document Processing
        return [
          { value: 6, label: 'Ready for Release (Mark Ready for Release)' }
        ];
      case 6: // Ready for Release
        return [
          { value: 7, label: 'Released (Release Document)' }
        ];
      default:
        return [];
    }
  }

  onNextStatusChange(val: string) {
    const num = parseInt(val, 10);
    this.selectedNextStatus.set(num || null);
  }

  private connectToRequestUpdates() {
    this.sseSubscription = this.notificationService.sse$.subscribe(event => {
      if (event?.type?.startsWith('request-')) {
        this.loadRequests();
        const current = this.selectedRequest();
        if (current && (event.data?.requestId === current.request_id || event.data?.request_id === current.request_id)) {
          this.requestService.getById(current.request_id).subscribe({
            next: (res) => {
              const updated = res.data as RequestDetail;
              this.selectedRequest.set(updated);
              this.syncNextStatusDropdown(updated.status_id);
              this.loadDocuments(current.request_id);
            }
          });
        }
      }
    });
  }

  private disconnectFromRequestUpdates() {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
    }
  }

  loadServices() {
    this.serviceService.getAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.services.set(res.data || []);
      }
    });
  }

  loadRequests() {
    this.loading.set(true);
    this.requestService.getAll({
      search: this.search() || undefined,
      statusId: this.statusFilter() ? parseInt(this.statusFilter()) : undefined,
      serviceId: this.serviceFilter() ? parseInt(this.serviceFilter()) : undefined,
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
      page: this.page(),
      limit: this.limit,
      sortBy: this.sortColumn(),
      sortOrder: this.sortDirection()
    }).subscribe({
      next: (res) => {
        this.requests.set(res.data);
        this.total.set(res.pagination.total);
        this.loading.set(false);
        if (this.pendingRequestId !== null) {
          const pending = this.pendingRequestId;
          this.pendingRequestId = null;
          const request = res.data.find(r => r.request_id === pending);
          if (request) {
            this.viewDetails(request);
          }
        }
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(value: string) {
    this.search.set(value);
    this.page.set(1);
    this.loadRequests();
  }

  onStatusFilter(value: string) {
    this.statusFilter.set(value);
    this.page.set(1);
    this.loadRequests();
  }

  onServiceFilter(serviceId: string) {
    this.serviceFilter.set(serviceId);
    this.page.set(1);
    this.loadRequests();
  }

  onDatePresetChange(preset: string) {
    this.datePreset.set(preset);
    this.page.set(1);
    const now = new Date();

    if (preset === 'today') {
      const d = this.formatDateIso(now);
      this.dateFrom.set(d);
      this.dateTo.set(d);
    } else if (preset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const d = this.formatDateIso(yest);
      this.dateFrom.set(d);
      this.dateTo.set(d);
    } else if (preset === 'last7days') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 6);
      this.dateFrom.set(this.formatDateIso(past7));
      this.dateTo.set(this.formatDateIso(now));
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      this.dateFrom.set(this.formatDateIso(firstDay));
      this.dateTo.set(this.formatDateIso(now));
    } else if (preset === 'custom') {
      if (!this.dateFrom()) this.dateFrom.set(this.formatDateIso(now));
      if (!this.dateTo()) this.dateTo.set(this.formatDateIso(now));
    } else {
      this.dateFrom.set('');
      this.dateTo.set('');
    }
    this.loadRequests();
  }

  onCustomDateChange(type: 'from' | 'to', value: string) {
    if (type === 'from') this.dateFrom.set(value);
    if (type === 'to') this.dateTo.set(value);
    this.page.set(1);
    this.loadRequests();
  }

  private formatDateIso(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatSubmissionDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatSubmissionTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  hasActiveFilters(): boolean {
    return !!(this.search() || this.statusFilter() || this.serviceFilter() || this.datePreset() || this.dateFrom() || this.dateTo());
  }

  resetFilters() {
    this.search.set('');
    this.statusFilter.set('');
    this.serviceFilter.set('');
    this.datePreset.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.page.set(1);
    this.loadRequests();
  }

  onSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('ASC');
    }
    this.loadRequests();
  }

  onPageChange(page: number) {
    this.page.set(page);
    this.loadRequests();
  }

  onLimitChange(limit: number) {
    this.limit = limit;
    this.page.set(1);
    this.loadRequests();
  }

  onSave(data: any) {
    this.saving.set(true);
    this.requestService.create(data).subscribe({
      next: () => {
        this.showForm.set(false);
        this.saving.set(false);
        this.loadRequests();
      },
      error: (err) => {
        this.saving.set(false);
        alert(err.error?.message || 'Failed to create request.');
      }
    });
  }

  private syncNextStatusDropdown(statusId: number) {
    const opts = this.getNextStatusOptions(statusId);
    if (opts.length > 0) {
      this.selectedNextStatus.set(opts[0].value);
    } else {
      this.selectedNextStatus.set(null);
    }
  }

  // --- Status Update Confirmation Handling ---
  openStatusConfirmDialog(request: DocumentRequest) {
    if (!this.selectedNextStatus()) return;
    this.activeRequestForAction.set(request);
    this.actionError.set('');
    this.actionLoading.set(false);
    this.showStatusConfirmModal.set(true);
  }

  closeStatusConfirmDialog() {
    this.showStatusConfirmModal.set(false);
    this.activeRequestForAction.set(null);
    this.actionError.set('');
  }

  confirmStatusUpdate() {
    const req = this.activeRequestForAction();
    const nextStatus = this.selectedNextStatus();
    if (!req || !nextStatus) return;

    this.actionLoading.set(true);
    this.actionError.set('');

    const targetLabel = this.getStatusLabel(nextStatus);
    this.requestService.changeStatus(req.request_id, nextStatus, `Updated to ${targetLabel}`).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.closeStatusConfirmDialog();
        this.requestService.getById(req.request_id).subscribe({
          next: (res) => {
            const updated = res.data as RequestDetail;
            this.selectedRequest.set(updated);
            this.syncNextStatusDropdown(updated.status_id);
            this.loadRequests();
            this.loadDocuments(req.request_id);
          }
        });
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.actionError.set(err.error?.message || 'Failed to update request status.');
      }
    });
  }

  // --- Rejection Dialog Handling ---
  openRejectDialog(request: DocumentRequest) {
    this.activeRequestForAction.set(request);
    this.rejectionReason.set('');
    this.actionError.set('');
    this.actionLoading.set(false);
    this.showRejectModal.set(true);
  }

  closeRejectDialog() {
    this.showRejectModal.set(false);
    this.activeRequestForAction.set(null);
    this.rejectionReason.set('');
    this.actionError.set('');
  }

  confirmRejection() {
    const req = this.activeRequestForAction();
    const reason = this.rejectionReason().trim();
    if (!req || !reason) return;

    this.actionLoading.set(true);
    this.actionError.set('');

    this.requestService.changeStatus(req.request_id, 8, `Rejection reason: ${reason}`).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.closeRejectDialog();
        this.requestService.getById(req.request_id).subscribe({
          next: (res) => {
            const updated = res.data as RequestDetail;
            this.selectedRequest.set(updated);
            this.syncNextStatusDropdown(updated.status_id);
            this.loadRequests();
            this.loadDocuments(req.request_id);
          }
        });
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.actionError.set(err.error?.message || 'Failed to reject request.');
      }
    });
  }

  // --- Cancellation Dialog Handling ---
  openCancelDialog(request: DocumentRequest) {
    this.activeRequestForAction.set(request);
    this.cancelReason.set('');
    this.actionError.set('');
    this.actionLoading.set(false);
    this.showCancelModal.set(true);
  }

  closeCancelDialog() {
    this.showCancelModal.set(false);
    this.activeRequestForAction.set(null);
    this.cancelReason.set('');
    this.actionError.set('');
  }

  confirmCancellation() {
    const req = this.activeRequestForAction();
    if (!req) return;

    this.actionLoading.set(true);
    this.actionError.set('');
    const remarks = this.cancelReason().trim() ? `Cancelled: ${this.cancelReason().trim()}` : 'Cancelled by staff';

    this.requestService.changeStatus(req.request_id, 9, remarks).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.closeCancelDialog();
        this.requestService.getById(req.request_id).subscribe({
          next: (res) => {
            const updated = res.data as RequestDetail;
            this.selectedRequest.set(updated);
            this.syncNextStatusDropdown(updated.status_id);
            this.loadRequests();
            this.loadDocuments(req.request_id);
          }
        });
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.actionError.set(err.error?.message || 'Failed to cancel request.');
      }
    });
  }

  viewDetails(request: DocumentRequest) {
    this.selectedRow.set(request);
    this.requestService.getById(request.request_id).subscribe({
      next: (res) => {
        const detail = res.data as RequestDetail;
        this.selectedRequest.set(detail);
        this.syncNextStatusDropdown(detail.status_id);
        this.showDetails.set(true);
        this.loadDocuments(request.request_id);
      },
      error: () => {
        const detail = request as RequestDetail;
        this.selectedRequest.set(detail);
        this.syncNextStatusDropdown(detail.status_id);
        this.showDetails.set(true);
        this.loadDocuments(request.request_id);
      }
    });
  }

  onRowClick(request: DocumentRequest) {
    this.viewDetails(request);
  }

  closeDetails() {
    this.showDetails.set(false);
    this.selectedRequest.set(null);
    this.selectedRow.set(null);
    this.selectedNextStatus.set(null);
    this.documents.set([]);
    this.docError.set('');
    this.docNotice.set('');
  }

  loadDocuments(requestId: number) {
    this.docError.set('');
    this.docNotice.set('');
    this.documents.set([]);
    this.documentService.list(requestId).subscribe({
      next: (res) => {
        this.documents.set(res.data || []);
        if (this.documents().length === 0 && !this.canGenerateDocument()) {
          this.docNotice.set('No document generated yet. It becomes available once the request is Under Review.');
        }
      },
      error: () => {
        this.docError.set('Could not load generated documents.');
      }
    });
  }

  canGenerateDocument(): boolean {
    const statusId = this.selectedRequest()?.status_id;
    return statusId === 4 || statusId === 5 || statusId === 6 || statusId === 7;
  }

  openEditDocumentModal() {
    const request = this.selectedRequest();
    if (!request) return;
    this.editDocError.set('');
    this.editDocLoading.set(false);
    this.editPurpose.set(request.purpose || '');
    this.editRemarks.set(request.remarks || '');

    const formData = (request.form_data || {}) as Record<string, any>;
    const entries: FormFieldEntry[] = [];

    // Extract all dynamic keys from formData (excluding internal objects)
    for (const [key, val] of Object.entries(formData)) {
      if (key === '_guest' || key === 'purpose') continue;
      entries.push({
        key,
        label: this.formatFieldLabel(key),
        value: val === null || val === undefined ? '' : String(val)
      });
    }

    // If this is a guest request and guest fields are in _guest, expose them
    if (request.resident_id === null && formData['_guest'] && typeof formData['_guest'] === 'object') {
      const guestObj = formData['_guest'] as Record<string, any>;
      const guestKeys = ['full_name', 'birth_date', 'address', 'contact_number', 'email'];
      for (const gk of guestKeys) {
        if (!entries.some(e => e.key === gk) && guestObj[gk] !== undefined) {
          entries.push({
            key: gk,
            label: this.formatFieldLabel(gk),
            value: guestObj[gk] ? String(guestObj[gk]) : ''
          });
        }
      }
    }

    this.editFormFieldEntries.set(entries);
    this.showEditDocModal.set(true);
  }

  closeEditDocumentModal() {
    this.showEditDocModal.set(false);
    this.editDocError.set('');
    this.editDocLoading.set(false);
  }

  updateEditFormField(key: string, value: string) {
    this.editFormFieldEntries.update(entries =>
      entries.map(e => e.key === key ? { ...e, value } : e)
    );
  }

  saveEditDocument() {
    const request = this.selectedRequest();
    if (!request) return;

    this.editDocLoading.set(true);
    this.editDocError.set('');

    const updatedFormData: Record<string, any> = { ...(request.form_data || {}) };
    for (const entry of this.editFormFieldEntries()) {
      updatedFormData[entry.key] = entry.value;
    }
    const purposeVal = this.editPurpose().trim();
    if (purposeVal) {
      updatedFormData['purpose'] = purposeVal;
    }

    this.requestService.update(request.request_id, {
      serviceId: request.service_id,
      purpose: purposeVal,
      remarks: this.editRemarks().trim(),
      formData: updatedFormData
    }).subscribe({
      next: () => {
        // Trigger document generation to update the document artifact
        this.documentService.generate(request.request_id).subscribe({
          next: () => {
            this.editDocLoading.set(false);
            this.showEditDocModal.set(false);
            this.docNotice.set('Document information updated and regenerated successfully.');
            // Refresh request detail and document list
            this.requestService.getById(request.request_id).subscribe({
              next: (detailRes) => {
                const updated = detailRes.data as RequestDetail;
                this.selectedRequest.set(updated);
                this.syncNextStatusDropdown(updated.status_id);
                this.loadDocuments(request.request_id);
                this.loadRequests();
              }
            });
          },
          error: () => {
            this.editDocLoading.set(false);
            this.showEditDocModal.set(false);
            this.docNotice.set('Document information updated successfully.');
            this.loadDocuments(request.request_id);
          }
        });
      },
      error: (err) => {
        this.editDocLoading.set(false);
        this.editDocError.set(err.error?.message || 'Failed to save document changes.');
      }
    });
  }

  generateDocument() {
    const request = this.selectedRequest();
    if (!request) return;
    if (!this.canGenerateDocument()) {
      this.docError.set('Only approved requests (Under Review and onwards) can generate official documents.');
      return;
    }
    this.generatingDoc.set(true);
    this.docError.set('');
    this.documentService.generate(request.request_id).subscribe({
      next: () => {
        this.generatingDoc.set(false);
        this.loadDocuments(request.request_id);
      },
      error: (err) => {
        this.generatingDoc.set(false);
        this.docError.set(err.error?.message || 'Failed to generate document.');
        this.loadDocuments(request.request_id);
      }
    });
  }

  openDocument(doc: GeneratedDocument) {
    const request = this.selectedRequest();
    if (!request) return;
    this.documentService.fetchBlob(request.request_id, doc.document_id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => {
        this.docError.set('Could not open the document.');
      }
    });
  }

  downloadDocument(doc: GeneratedDocument) {
    const request = this.selectedRequest();
    if (!request) return;
    this.documentService.fetchBlob(request.request_id, doc.document_id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.docError.set('Could not download the document.');
      }
    });
  }

  printDocument(doc: GeneratedDocument) {
    this.openDocument(doc);
  }

  // --- Document Preview Modal State ---
  showPreview = signal(false);
  previewBlob: Blob | null = null;
  previewTitle = '';

  // --- Document Review / Approval ---
  reviewing = signal(false);

  previewDocument(doc: GeneratedDocument) {
    const request = this.selectedRequest();
    if (!request) return;
    this.previewTitle = doc.file_name;
    this.previewBlob = null;
    this.showPreview.set(true);
    this.documentService.fetchBlob(request.request_id, doc.document_id).subscribe({
      next: (blob) => {
        this.previewBlob = blob;
      },
      error: () => {
        this.docError.set('Could not load the document for preview.');
      }
    });
  }

  closePreview() {
    this.showPreview.set(false);
    this.previewBlob = null;
    this.previewTitle = '';
  }

  previewRequestDocument() {
    const request = this.selectedRequest();
    if (!request) return;
    if (this.previewBusy()) return;
    this.previewBusy.set(true);
    this.docError.set('');
    const docs = this.documents();
    if (docs.length > 0) {
      this.previewBusy.set(false);
      this.previewDocument(docs[docs.length - 1]);
      return;
    }
    if (!this.canGenerateDocument()) {
      this.previewBusy.set(false);
      this.docError.set('A document can only be generated once the request is Under Review.');
      return;
    }
    this.documentService.generate(request.request_id).subscribe({
      next: () => {
        this.documentService.list(request.request_id).subscribe({
          next: (res) => {
            this.documents.set(res.data || []);
            this.previewBusy.set(false);
            const latest = this.documents();
            if (latest.length > 0) this.previewDocument(latest[latest.length - 1]);
            else this.docError.set('No document was produced to preview.');
          },
          error: () => {
            this.previewBusy.set(false);
            this.docError.set('Could not load the generated document.');
          }
        });
      },
      error: (err) => {
        this.previewBusy.set(false);
        this.docError.set(err.error?.message || 'Failed to generate the document for preview.');
      }
    });
  }

  approvalBadge(status: string): { class: string; label: string } | null {
    switch (status) {
      case 'approved':
        return { class: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Approved' };
      case 'rejected':
        return { class: 'text-rose-700 bg-rose-50 border-rose-200', label: 'Rejected' };
      case 'returned':
        return { class: 'text-amber-700 bg-amber-50 border-amber-200', label: 'Returned' };
      case 'pending':
        return { class: 'text-slate-700 bg-slate-100 border-slate-200', label: 'Pending Review' };
      default:
        return null;
    }
  }

  reviewDocument(doc: GeneratedDocument, status: 'approved' | 'rejected' | 'returned') {
    const request = this.selectedRequest();
    if (!request) return;

    const remarks = status === 'approved' ? '' : prompt(`Enter remarks for ${status}:`);
    if (status !== 'approved' && remarks === null) return;

    this.reviewing.set(true);
    this.documentService.review(request.request_id, doc.document_id, status, remarks || '').subscribe({
      next: () => {
        this.reviewing.set(false);
        this.loadDocuments(request.request_id);
      },
      error: (err) => {
        this.reviewing.set(false);
        this.docError.set(err.error?.message || 'Failed to review document.');
      }
    });
  }

  formatBytes(bytes: number | null | undefined): string {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    return isNaN(date.getTime())
      ? value
      : date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  daysRemaining(value: string): number {
    const expires = new Date(value).getTime();
    if (isNaN(expires)) return 0;
    return Math.max(0, Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000)));
  }

  expiryBadgeClass(value: string): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border';
    return this.daysRemaining(value) <= 2
      ? `${base} text-rose-800 bg-rose-50 border-rose-200`
      : `${base} text-amber-800 bg-amber-50 border-amber-200`;
  }

  // --- Grouped Form Data Helpers ---
  hasFormData(formData: Record<string, unknown>): boolean {
    return !!formData && Object.keys(formData).length > 0;
  }

  getGroupedFormData(formData: Record<string, unknown>): FormGroupSection[] {
    if (!formData) return [];

    const personalKeys = [
      'full_name', 'first_name', 'middle_name', 'last_name', 'suffix',
      'birth_date', 'birthdate', 'birth_place', 'gender', 'sex', 'civil_status',
      'contact_number', 'contact', 'email', 'address_line', 'address',
      'house_number', 'street', 'purok_zone', 'sitio', 'barangay',
      'years_of_residency', 'blood_type', 'nationality', 'religion',
      'emergency_contact_name', 'emergency_contact_number'
    ];

    const applicationKeys = [
      'purpose', 'purpose_of_request', 'request_purpose',
      'name_of_relative', 'beneficiary_name', 'relation_to_resident', 'relationship',
      'business_name', 'business_type', 'business_address', 'nature_of_business',
      'monthly_income', 'annual_income', 'occupation', 'owner_name',
      'ctc_number', 'ctc_date_issued', 'ctc_place_issued', 'or_number',
      'block', 'lot', 'subdivision', 'pole_type', 'office_address', 'requestor_name',
      'household_members'
    ];

    const personalFields: FormFieldEntry[] = [];
    const applicationFields: FormFieldEntry[] = [];
    const otherFields: FormFieldEntry[] = [];

    for (const [key, rawVal] of Object.entries(formData)) {
      if (key === '_guest' || rawVal === undefined || rawVal === null || rawVal === '') continue;
      const formattedEntry: FormFieldEntry = {
        key,
        label: this.formatFieldLabel(key),
        value: typeof rawVal === 'object' ? JSON.stringify(rawVal) : String(rawVal)
      };

      const lowerKey = key.toLowerCase();
      if (personalKeys.includes(lowerKey)) {
        personalFields.push(formattedEntry);
      } else if (applicationKeys.includes(lowerKey)) {
        applicationFields.push(formattedEntry);
      } else {
        otherFields.push(formattedEntry);
      }
    }

    const sections: FormGroupSection[] = [];
    if (personalFields.length > 0) {
      sections.push({ title: 'Personal Information', fields: personalFields });
    }
    if (applicationFields.length > 0) {
      sections.push({ title: 'Application Information', fields: applicationFields });
    }
    if (otherFields.length > 0) {
      sections.push({ title: 'Additional Information', fields: otherFields });
    }

    return sections;
  }

  formatFieldLabel(key: string): string {
    const labelMap: Record<string, string> = {
      full_name: 'Full Name',
      first_name: 'First Name',
      middle_name: 'Middle Name',
      last_name: 'Last Name',
      suffix: 'Suffix',
      birth_date: 'Birth Date',
      birthdate: 'Birth Date',
      birth_place: 'Birth Place',
      gender: 'Gender',
      sex: 'Gender',
      civil_status: 'Civil Status',
      address_line: 'Address',
      address: 'Address',
      house_number: 'House #',
      street: 'Street',
      purok_zone: 'Purok / Zone',
      sitio: 'Sitio',
      barangay: 'Barangay',
      contact_number: 'Contact Number',
      contact: 'Contact Number',
      email: 'Email',
      resident_code: 'Resident Code',
      blood_type: 'Blood Type',
      nationality: 'Nationality',
      religion: 'Religion',
      emergency_contact_name: 'Emergency Contact Name',
      emergency_contact_number: 'Emergency Contact #',
      purpose: 'Purpose of Request',
      purpose_of_request: 'Purpose of Request',
      request_purpose: 'Purpose of Request',
      occupation: 'Occupation',
      business_name: 'Business Name',
      owner_name: 'Owner Name',
      business_address: 'Business Address',
      nature_of_business: 'Nature of Business',
      business_type: 'Business Type',
      pole_type: 'Pole Type',
      office_address: 'Office Address',
      requestor_name: 'Requestor Name',
      years_of_residency: 'Years of Residency',
      monthly_income: 'Monthly Income',
      annual_income: 'Annual Income',
      household_members: 'Household Members',
      beneficiary_name: 'Beneficiary / Relative Name',
      name_of_relative: 'Name of Relative',
      relation_to_resident: 'Relationship to Resident',
      relationship: 'Relationship',
      block: 'Block',
      lot: 'Lot',
      subdivision: 'Subdivision',
      ctc_number: 'CTC #',
      ctc_date_issued: 'CTC Date Issued',
      ctc_place_issued: 'CTC Place Issued',
      or_number: 'OR #'
    };
    return labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
