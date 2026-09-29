import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { renderAsync } from 'docx-preview';
import { RequestService, DocumentService, ServiceService, DocumentPdfExportService } from '../../shared/services';
import { ToastService } from '../../shared/components/toast.service';
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
import { environment } from '../../../environments/environment';

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
            source: sourceCell,
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

          <!-- Source (Kiosk vs Online) -->
          <ng-template #sourceCell let-row="row">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold"
                  [class.bg-blue-50]="row.source === 'Online'"
                  [class.text-blue-700]="row.source === 'Online'"
                  [class.bg-slate-100]="row.source !== 'Online'"
                  [class.text-slate-700]="row.source !== 'Online'">
              {{ row.source || 'Kiosk' }}
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
                            <div [class]="(field.key === 'address' || field.key === 'business_address' || field.key === 'office_address') ? 'sm:col-span-2 flex flex-col sm:flex-row sm:justify-between py-1 border-b border-slate-100 last:border-0' : 'flex flex-col sm:flex-row sm:justify-between py-1 border-b border-slate-100 last:border-0'">
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

            <!-- ================= GCASH PAYMENT VERIFICATION CARD ================= -->
            @if (getUploadedReceipt(request.form_data); as receipt) {
              <div class="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 shadow-2xs">
                <div class="flex items-center justify-between pb-3 border-b border-blue-200/60 mb-4">
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs shadow-2xs">
                      G
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-blue-950 uppercase tracking-wide">
                        GCash Payment Verification
                      </h4>
                      <p class="text-[10px] text-blue-700 font-semibold">Online Resident Payment</p>
                    </div>
                  </div>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                    GCash Transfer
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <!-- Payment Info Summary -->
                  <div class="sm:col-span-7 space-y-2.5 text-xs">
                    <div class="flex justify-between py-1 border-b border-blue-100">
                      <span class="font-medium text-slate-500">Service Fee:</span>
                      <span class="font-bold text-slate-900">₱{{ getReceiptAmount(request) | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between py-1 border-b border-blue-100">
                      <span class="font-medium text-slate-500">GCash Ref #:</span>
                      <span class="font-mono font-bold text-blue-800 text-xs">{{ receipt.reference_number || getReceiptRefNumber(request) || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between py-1 border-b border-blue-100">
                      <span class="font-medium text-slate-500">Receipt File:</span>
                      <span class="font-semibold text-slate-800 truncate max-w-[170px]">{{ receipt.original_name || receipt.file_name || 'receipt.jpg' }}</span>
                    </div>
                    <div class="flex justify-between py-1">
                      <span class="font-medium text-slate-500">Evidence Status:</span>
                      <span class="font-bold text-emerald-700 flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                        Attached for Staff Review
                      </span>
                    </div>
                  </div>

                  <!-- Receipt Image Preview & Modal Action -->
                  <div class="sm:col-span-5 flex flex-col items-center sm:items-end justify-center">
                    <div class="p-2 bg-white border border-blue-200 rounded-xl shadow-xs text-center">
                      <button
                        type="button"
                        (click)="openReceiptInspection(request, receipt)"
                        class="relative group cursor-pointer block">
                        <img
                          [src]="resolveFileUrl(receipt.file_url)"
                          alt="GCash Receipt"
                          class="w-28 h-28 object-cover rounded-lg border border-slate-200 group-hover:border-blue-500 shadow-2xs transition"
                        />
                        <div class="absolute inset-0 bg-blue-950/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                          </svg>
                        </div>
                      </button>
                      <button
                        type="button"
                        (click)="openReceiptInspection(request, receipt)"
                        class="text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline mt-1.5 cursor-pointer inline-flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Inspect Receipt</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Uploaded Digital Requirements (Online Portal Submissions) -->
            @if (getUploadedRequirements(request.form_data).length > 0) {
              <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.373L8.552 18.32a1.5 1.5 0 01-2.121-2.121L13.879 8.75" />
                    </svg>
                    Uploaded Digital Requirements ({{ getUploadedRequirements(request.form_data).length }})
                  </h4>
                </div>
                <div class="space-y-2">
                  @for (reqDoc of getUploadedRequirements(request.form_data); track reqDoc.requirement_name) {
                    <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div class="flex items-center gap-3 min-w-0 pr-3">
                        @if (isImageFile(reqDoc)) {
                          <button
                            type="button"
                            (click)="openImageModal(resolveFileUrl(reqDoc.file_url), reqDoc.requirement_name, reqDoc.original_name)"
                            title="Click to inspect requirement image in full size"
                            class="shrink-0 relative group cursor-pointer">
                            <img [src]="resolveFileUrl(reqDoc.file_url)" alt="Requirement Preview" class="w-12 h-12 rounded-lg object-cover border border-slate-300 shadow-2xs group-hover:border-orange-500 transition" />
                            <div class="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                              </svg>
                            </div>
                          </button>
                        } @else {
                          <div class="w-10 h-10 rounded-lg bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center shrink-0">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                          </div>
                        }
                        <div class="min-w-0">
                          <span class="font-bold text-slate-900 block truncate">{{ reqDoc.requirement_name }}</span>
                          <span class="text-slate-500 text-[11px] block truncate">{{ reqDoc.original_name }}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                        @if (isImageFile(reqDoc)) {
                          <button
                            type="button"
                            (click)="openImageModal(resolveFileUrl(reqDoc.file_url), reqDoc.requirement_name, reqDoc.original_name)"
                            class="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Inspect Photo</span>
                          </button>
                        } @else {
                          <a [href]="resolveFileUrl(reqDoc.file_url)" target="_blank"
                             class="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                            <span>View File</span>
                          </a>
                        }
                      </div>
                    </div>
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

                      <div class="flex items-center flex-wrap gap-2 sm:gap-3 border-t border-slate-200 pt-2 text-xs">
                        <button type="button" (click)="previewDocument(doc)" class="text-orange-600 font-bold hover:underline cursor-pointer">Preview</button>
                        <span class="text-slate-300">|</span>
                        <button type="button" (click)="downloadDocument(doc)" [disabled]="doc.approval_status !== 'approved' || downloadingDocId() === doc.document_id" title="Download as PDF" class="text-slate-700 font-semibold hover:text-rose-600 hover:underline disabled:opacity-40 cursor-pointer flex items-center gap-1">
                          @if (downloadingDocId() === doc.document_id) {
                            <div class="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Downloading...</span>
                          } @else {
                            <svg class="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            <span>Download</span>
                          }
                        </button>
                        
                        @if (doc.approval_status === 'pending') {
                          <span class="text-slate-300">|</span>
                          <button type="button" (click)="openReviewDocDialog(doc, 'approved')" class="text-emerald-700 font-bold hover:underline cursor-pointer">Approve</button>
                          <button type="button" (click)="openReviewDocDialog(doc, 'rejected')" class="text-rose-700 font-bold hover:underline cursor-pointer">Reject</button>
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
        (onDownload)="downloadPreviewDocument()"
      />

      <!-- ================= DOCUMENT REVIEW MODAL ================= -->
      <app-modal
        [open]="showReviewDocModal()"
        [title]="reviewDocStatus() === 'approved' ? 'Approve Generated Document' : 'Reject Generated Document'"
        (onClose)="closeReviewDocDialog()"
        containerClass="max-w-md"
      >
        <div class="space-y-4">
          <div class="p-3.5 rounded-2xl border" [class]="reviewDocStatus() === 'approved' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-rose-50/70 border-rose-200 text-rose-900'">
            <p class="text-xs font-bold font-mono">{{ reviewingDoc()?.file_name }}</p>
            <p class="text-xs mt-1" [class]="reviewDocStatus() === 'approved' ? 'text-emerald-800' : 'text-rose-800'">
              @if (reviewDocStatus() === 'approved') {
                Approving this document marks it as officially vetted and ready for release.
              } @else {
                Please provide a rejection note explaining why this generated document cannot be approved.
              }
            </p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              {{ reviewDocStatus() === 'approved' ? 'Remarks (Optional)' : 'Rejection Reason *' }}
            </label>
            <textarea
              [value]="reviewDocRemarks()"
              (input)="reviewDocRemarks.set($any($event.target).value)"
              rows="3"
              class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              [placeholder]="reviewDocStatus() === 'approved' ? 'Add any optional notes...' : 'State the reason for rejection...'"></textarea>
          </div>

          @if (reviewDocError()) {
            <p class="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">{{ reviewDocError() }}</p>
          }

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              (click)="closeReviewDocDialog()"
              [disabled]="submittingReview()"
              class="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer">
              Cancel
            </button>
            <button
              type="button"
              (click)="confirmReviewDoc()"
              [disabled]="submittingReview()"
              [class]="'px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition cursor-pointer ' + (reviewDocStatus() === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700')">
              @if (submittingReview()) {
                <span>Processing...</span>
              } @else {
                <span>{{ reviewDocStatus() === 'approved' ? 'Approve Document' : 'Reject Document' }}</span>
              }
            </button>
          </div>
        </div>
      </app-modal>

      <!-- ================= IMAGE INSPECTION MODAL (2x2 Photo & Receipt) ================= -->
      <app-modal
        [open]="showImageModal()"
        [title]="imageModalData()?.title || 'Inspect Image'"
        (onClose)="closeImageModal()"
        containerClass="max-w-xl"
      >
        <div class="text-center">
          @if (imageModalData()?.subtitle) {
            <p class="text-xs font-bold text-slate-500 mb-3">{{ imageModalData()?.subtitle }}</p>
          }
          <div class="p-2 bg-slate-50 rounded-2xl border border-slate-200 inline-block max-w-full">
            <img
              [src]="imageModalData()?.url"
              [alt]="imageModalData()?.title"
              class="max-h-[30rem] w-auto max-w-full object-contain rounded-xl border border-slate-300 shadow-md mx-auto"
            />
          </div>
          <div class="mt-4 flex items-center justify-between pt-3 border-t border-slate-200">
            <a
              [href]="imageModalData()?.url"
              target="_blank"
              class="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              <span>Open Original File</span>
            </a>
            <button
              type="button"
              (click)="closeImageModal()"
              class="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </app-modal>

    </div>
  `
})
export class RequestsComponent implements OnInit, OnDestroy {
  requests = signal<DocumentRequest[]>([]);
  services = signal<Service[]>([]);
  loading = signal(true);
  private readonly assetBase = environment.apiUrl.replace(/\/api\/v1\/?$/, '');

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
  downloadingDocId = signal<number | null>(null);

  // Workflow Dropdown & Confirmation Dialog Signals
  selectedNextStatus = signal<number | null>(null);
  showStatusConfirmModal = signal(false);
  showRejectModal = signal(false);
  showCancelModal = signal(false);
  showJsonModal = signal(false);
  showImageModal = signal(false);
  imageModalData = signal<{ url: string; title: string; subtitle?: string } | null>(null);
  rejectionReason = signal('');
  cancelReason = signal('');
  activeRequestForAction = signal<DocumentRequest | null>(null);
  actionLoading = signal(false);
  actionError = signal('');

  // Document Review Modal State
  showReviewDocModal = signal(false);
  reviewingDoc = signal<GeneratedDocument | null>(null);
  reviewDocStatus = signal<'approved' | 'rejected' | 'returned'>('approved');
  reviewDocRemarks = signal('');
  reviewDocError = signal('');
  submittingReview = signal(false);

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
    { key: 'source', label: 'Source' },
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
    { value: 9, label: 'Cancelled' },
    { value: 10, label: 'Returned for Correction' },
    { value: 11, label: 'Resubmitted' }
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
    private pdfExportService: DocumentPdfExportService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
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
      case 10: // Returned for Correction
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 11: // Resubmitted
        return 'bg-purple-50 text-purple-800 border-purple-200';
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
      case 10: return 'bg-amber-500';
      case 11: return 'bg-purple-500';
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
          { value: 2, label: 'Waiting for Requirements (Request Requirements)' },
          { value: 10, label: 'Return for Correction (Request Resident Fix)' }
        ];
      case 2: // Waiting for Requirements
        return [
          { value: 3, label: 'Requirements Received (Mark Requirements Received)' },
          { value: 10, label: 'Return for Correction (Request Resident Fix)' }
        ];
      case 3: // Requirements Received
        return [
          { value: 4, label: 'Under Review (Start Review)' },
          { value: 10, label: 'Return for Correction (Request Resident Fix)' }
        ];
      case 4: // Under Review
        return [
          { value: 5, label: 'Document Processing (Start Processing)' },
          { value: 10, label: 'Return for Correction (Request Resident Fix)' }
        ];
      case 5: // Document Processing
        return [
          { value: 6, label: 'Ready for Release (Mark Ready for Release)' }
        ];
      case 6: // Ready for Release
        return [
          { value: 7, label: 'Released (Release Document)' }
        ];
      case 10: // Returned for Correction
        return [
          { value: 11, label: 'Resubmitted (Mark Resubmitted)' }
        ];
      case 11: // Resubmitted
        return [
          { value: 4, label: 'Under Review (Review Resubmitted Info)' },
          { value: 10, label: 'Return for Correction (Request Further Fixes)' }
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
        const docServices = (res.data || []).filter((s: Service) => !s.service_name.toLowerCase().startsWith('barangay id'));
        this.services.set(docServices);
      }
    });
  }

  loadRequests() {
    this.loading.set(true);
    this.requestService.getAll({
      search: this.search() || undefined,
      statusId: this.statusFilter() ? parseInt(this.statusFilter()) : undefined,
      serviceId: this.serviceFilter() ? parseInt(this.serviceFilter()) : undefined,
      excludeIdServices: true,
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
        this.toast.success('Request Created', 'Document request created successfully.');
        this.loadRequests();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error('Creation Failed', err.error?.message || 'Failed to create request.');
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
    this.downloadingDocId.set(doc.document_id);
    const url = this.documentService.downloadUrl(request.request_id, doc.document_id);
    const token = localStorage.getItem('token');
    fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      .then(res => {
        if (!res.ok) return res.json().then(data => { throw new Error(data.message || 'Download failed'); });
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('pdf')) return res.blob();
        throw new Error('NO_SERVER_PDF');
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        const baseName = (doc.file_name || 'document').replace(/\.[^/.]+$/, '');
        a.download = `${baseName}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
      })
      .catch(err => {
        if (err.message === 'NO_SERVER_PDF') {
          return this.downloadDocumentClientSide(doc);
        }
        this.docError.set(err.message || 'Could not download the document.');
      })
      .finally(() => {
        this.downloadingDocId.set(null);
      });
  }

  private downloadDocumentClientSide(doc: GeneratedDocument) {
    const request = this.selectedRequest();
    if (!request) return;
    this.documentService.fetchBlob(request.request_id, doc.document_id).subscribe({
      next: async (blob) => {
        try {
          await this.pdfExportService.convertDocxToPdf(blob, doc.file_name || 'document');
        } catch (e) {
          console.error('Client-side PDF export error:', e);
          this.docError.set('Could not generate PDF. The document may be too complex for browser conversion.');
        }
      },
      error: () => {
        this.docError.set('Could not load the document for PDF conversion.');
      }
    });
  }

  downloadPreviewDocument() {
    const request = this.selectedRequest();
    if (!request) return;
    const docs = this.documents();
    const lastDoc = docs[docs.length - 1];
    if (!lastDoc) return;
    this.downloadDocument(lastDoc);
  }

  printDocument(doc: GeneratedDocument) {
    const request = this.selectedRequest();
    if (!request) return;
    this.documentService.fetchBlob(request.request_id, doc.document_id).subscribe({
      next: (blob) => {
        this.printBlob(blob, doc.file_name);
      },
      error: () => {
        this.docError.set('Could not load the document for printing.');
      }
    });
  }

  private printBlob(blob: Blob, title: string) {
    if (blob.type === 'application/pdf') {
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-99999px';
      iframe.style.left = '-99999px';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = url;
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => { URL.revokeObjectURL(url); iframe.remove(); }, 1000);
      };
      document.body.appendChild(iframe);
      return;
    }

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-99999px';
    container.style.left = '-99999px';
    container.style.width = '794px';
    container.style.background = '#ffffff';
    document.body.appendChild(container);

    renderAsync(blob, container).then(() => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) { container.remove(); return; }

      const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map(node => node.outerHTML).join('\n');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            ${styleTags}
            <style>
              @media print { @page { margin: 10mm; size: auto; } body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .docx-preview-container { box-shadow: none !important; margin: 0 auto; width: 100% !important; } }
              body { margin: 0; padding: 10mm; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .docx-preview-container { box-shadow: none !important; margin: 0 auto; width: 100% !important; }
            </style>
          </head>
          <body>
            <div class="docx-preview-container">${container.innerHTML}</div>
            <script>window.onload = function() { window.focus(); window.print(); setTimeout(function() { window.close(); }, 500); };</script>
          </body>
        </html>
      `);
      printWindow.document.close();
      container.remove();
    }).catch(err => {
      console.error('Print render error:', err);
      container.remove();
      this.docError.set('Could not render the document for printing.');
    });
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
    this.docError.set('');
    this.documentService.fetchBlob(request.request_id, doc.document_id).subscribe({
      next: (blob) => {
        this.previewBlob = blob;
        this.showPreview.set(true);
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

  openReviewDocDialog(doc: GeneratedDocument, status: 'approved' | 'rejected' | 'returned') {
    this.reviewingDoc.set(doc);
    this.reviewDocStatus.set(status);
    this.reviewDocRemarks.set('');
    this.reviewDocError.set('');
    this.showReviewDocModal.set(true);
  }

  closeReviewDocDialog() {
    this.showReviewDocModal.set(false);
    this.reviewingDoc.set(null);
    this.reviewDocRemarks.set('');
    this.reviewDocError.set('');
    this.submittingReview.set(false);
  }

  confirmReviewDoc() {
    const doc = this.reviewingDoc();
    const status = this.reviewDocStatus();
    const request = this.selectedRequest();
    if (!doc || !request) return;

    const remarks = this.reviewDocRemarks().trim();
    if (status !== 'approved' && !remarks) {
      this.reviewDocError.set('A rejection note or remarks is required.');
      return;
    }

    this.submittingReview.set(true);
    this.reviewDocError.set('');

    this.documentService.review(request.request_id, doc.document_id, status, remarks).subscribe({
      next: () => {
        this.submittingReview.set(false);
        this.closeReviewDocDialog();
        this.toast.success(
          status === 'approved' ? 'Document Approved' : (status === 'rejected' ? 'Document Rejected' : 'Document Returned'),
          `Review for ${doc.file_name} saved.`
        );
        this.loadDocuments(request.request_id);
      },
      error: (err) => {
        this.submittingReview.set(false);
        this.reviewDocError.set(err.error?.message || 'Failed to review document.');
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

  openImageModal(url: string, title: string, subtitle?: string) {
    this.imageModalData.set({ url, title, subtitle });
    this.showImageModal.set(true);
  }

  closeImageModal() {
    this.showImageModal.set(false);
    this.imageModalData.set(null);
  }

  getUploadedReceipt(formData: unknown): { file_url: string; original_name?: string; file_name?: string; size?: number; reference_number?: string } | null {
    if (!formData || typeof formData !== 'object') return null;
    const data = formData as Record<string, any>;
    if (data['_receipt'] && typeof data['_receipt'] === 'object' && data['_receipt'].file_url) {
      return data['_receipt'];
    }
    if (data['_payment'] && typeof data['_payment'] === 'object' && data['_payment'].receipt_url) {
      return {
        file_url: data['_payment'].receipt_url,
        reference_number: data['_payment'].reference_number,
        original_name: 'GCash Payment Receipt'
      };
    }
    return null;
  }

  openReceiptInspection(request: DocumentRequest, receipt: any) {
    const ref = receipt.reference_number || this.getReceiptRefNumber(request) || 'N/A';
    const amt = this.getReceiptAmount(request).toFixed(2);
    this.openImageModal(
      this.resolveFileUrl(receipt.file_url),
      'GCash Payment Confirmation Receipt',
      `GCash Reference #: ${ref} • Amount: ₱${amt}`
    );
  }

  getReceiptAmount(request: DocumentRequest): number {
    const data = (request.form_data || {}) as Record<string, any>;
    if (data['_payment']?.amount) return Number(data['_payment'].amount);
    return Number(request.processing_fee) || 0;
  }

  getReceiptRefNumber(request: DocumentRequest): string {
    const data = (request.form_data || {}) as Record<string, any>;
    return data['_payment']?.reference_number || data['_receipt']?.reference_number || data['gcash_reference_number'] || '';
  }

  resolveFileUrl(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const clean = url.replace(/^\/+/, '');
    if (clean.startsWith('uploads/')) {
      return `${this.assetBase}/${clean}`;
    }
    return `${this.assetBase}/uploads/${clean}`;
  }

  isImageFile(reqDoc: { requirement_name?: string; original_name?: string; file_url?: string }): boolean {
    if (!reqDoc) return false;
    const name = (reqDoc.original_name || reqDoc.file_url || '').toLowerCase();
    const reqName = (reqDoc.requirement_name || '').toLowerCase();
    return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp') ||
           reqName.includes('2x2') || reqName.includes('photo') || reqName.includes('picture');
  }

  hasFormData(formData: Record<string, unknown>): boolean {
    if (!formData || typeof formData !== 'object') return false;
    return Object.keys(formData).some(k => !k.startsWith('_') && formData[k] !== undefined && formData[k] !== null && formData[k] !== '');
  }

  getUploadedRequirements(formData: unknown): Array<{ requirement_name: string; original_name: string; file_url: string; size?: number }> {
    if (!formData || typeof formData !== 'object') return [];
    const data = formData as Record<string, unknown>;
    const list = data['_requirements'];
    if (Array.isArray(list)) {
      return list as Array<{ requirement_name: string; original_name: string; file_url: string; size?: number }>;
    }
    return [];
  }

  getGroupedFormData(formData: Record<string, unknown>): FormGroupSection[] {
    if (!formData) return [];

    const addressAliasKeys = ['complete_address', 'full_address', 'residential_address', 'address_line', 'address'];

    const personalKeys = [
      'first_name', 'middle_name', 'last_name', 'suffix',
      'birth_date', 'birthdate', 'birth_place', 'gender', 'sex', 'civil_status',
      'contact_number', 'contact', 'email',
      ...addressAliasKeys,
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

    // Extract single consolidated address
    let resolvedAddress: string | null = null;
    for (const addrKey of addressAliasKeys) {
      const val = formData[addrKey];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        resolvedAddress = String(val).trim();
        break;
      }
    }

    const seenLabels = new Set<string>();

    for (const [key, rawVal] of Object.entries(formData)) {
      if (key.startsWith('_') || rawVal === undefined || rawVal === null || rawVal === '') continue;
      const lowerKey = key.toLowerCase();

      // Skip address alias keys since address will be placed at the bottom of Personal Information
      if (addressAliasKeys.includes(lowerKey)) continue;

      // Skip Full Name since First Name, Middle Name, and Last Name are present
      if (lowerKey === 'full_name' || lowerKey === 'fullname') continue;

      const label = this.formatFieldLabel(key);

      // Skip duplicates of the same label in the section
      if (seenLabels.has(label.toLowerCase())) continue;
      seenLabels.add(label.toLowerCase());

      const formattedEntry: FormFieldEntry = {
        key,
        label,
        value: typeof rawVal === 'object' ? JSON.stringify(rawVal) : String(rawVal)
      };

      if (personalKeys.includes(lowerKey)) {
        personalFields.push(formattedEntry);
      } else if (applicationKeys.includes(lowerKey)) {
        applicationFields.push(formattedEntry);
      } else {
        otherFields.push(formattedEntry);
      }
    }

    // Place single consolidated address at the bottom of Personal Information
    if (resolvedAddress) {
      personalFields.push({
        key: 'address',
        label: 'Address',
        value: resolvedAddress
      });
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
      complete_address: 'Address',
      full_address: 'Address',
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
