import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { renderAsync } from 'docx-preview';
import { Observable, of } from 'rxjs';
import { NotificationService } from '../notifications/notification.service';
import { BarangayIdApplication, Service } from '../../shared/interfaces/api.interfaces';
import { ApplicationService, ServiceService } from '../../shared/services';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { SelectComponent } from '../../shared/components/select.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { DocumentPreviewModalComponent } from '../../shared/components/document-preview-modal.component';
import { ServiceFormComponent } from '../services/service-form.component';
import { environment } from '../../../environments/environment';

type ApplicationRow = BarangayIdApplication & { full_name: string };

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [
    TableComponent, CardComponent, InputComponent, PaginationComponent,
    ButtonComponent, ModalComponent, ConfirmDialogComponent, DocumentPreviewModalComponent,
    DatePipe, ServiceFormComponent, RouterLink
  ],
  template: `
    <div>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Barangay ID Applications</h1>
          <p class="text-sm text-slate-500 mt-1">Review and process Barangay ID applications submitted through the kiosk.</p>
        </div>
        <button
          type="button"
          (click)="showConfig.set(true)"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded-xl shadow-xs transition focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Configure Barangay ID
        </button>
      </div>

      <app-card>
        <div class="mb-4 flex flex-col gap-3">
          <!-- Search & Filter Controls Row -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Large Search Input -->
            <div class="flex-1 min-w-[240px]">
              <app-input
                placeholder="Search application number or applicant name..."
                [value]="search()"
                (valueChange)="onSearch($event)"
              />
            </div>

            <!-- All Statuses Dropdown -->
            <div class="w-44 sm:w-48">
              <select
                [value]="statusFilter()"
                (change)="onStatusChange($any($event.target).value)"
                class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer shadow-xs">
                @for (opt of statusOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            </div>

            <!-- All Dates Dropdown -->
            <div class="w-44 sm:w-48">
              <select
                [value]="datePreset()"
                (change)="onDatePresetChange($any($event.target).value)"
                class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer shadow-xs">
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="custom">Custom Date Range...</option>
              </select>
            </div>

            <!-- Orange outlined Filter button -->
            <button
              type="button"
              (click)="toggleCustomFilter()"
              [class]="hasActiveFilters()
                ? 'h-10 px-3.5 rounded-lg border border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer'
                : 'h-10 px-3.5 rounded-lg border border-orange-500/80 text-orange-600 hover:bg-orange-50 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer'">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
              Filter
              @if (activeFilterCount() > 0) {
                <span class="w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center font-bold">{{ activeFilterCount() }}</span>
              }
            </button>

            <!-- Reset Filters (when active) -->
            @if (hasActiveFilters()) {
              <button
                type="button"
                (click)="resetFilters()"
                class="h-10 px-3 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs font-medium flex items-center gap-1 transition cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Clear
              </button>
            }
          </div>

          <!-- Custom Date Range Sub-row -->
          @if (datePreset() === 'custom') {
            <div class="flex flex-wrap items-center gap-3 p-2.5 bg-orange-50/40 border border-orange-200 rounded-xl">
              <span class="text-xs font-bold text-orange-800 uppercase tracking-wide">Date Range:</span>
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

        <app-table
          [columns]="columns"
          [data]="applications()"
          [loading]="loading()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          trackBy="application_id"
          emptyMessage="No applications found"
          [cellTemplates]="{
            application_number: appNumCell,
            full_name: applicantCell,
            created_at: dateCell,
            status: statusCell
          }"
          (onSort)="onSort($event)"
          (onRowClick)="openDetail($event)"
        >
          <!-- APPLICATION # Template -->
          <ng-template #appNumCell let-row="row">
            <span class="text-sm font-semibold text-slate-900">
              {{ row.application_number }}
            </span>
          </ng-template>

          <!-- APPLICANT Template -->
          <ng-template #applicantCell let-row="row">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0 border border-orange-200 shadow-xs">
                {{ getInitials(row.full_name) }}
              </div>
              <div class="leading-tight min-w-0">
                <p class="font-semibold text-slate-900 text-sm truncate">{{ row.full_name }}</p>
                <p class="text-[11px] text-slate-400 capitalize">{{ row.gender ? row.gender.toLowerCase() : '' }}{{ row.civil_status ? ' · ' + row.civil_status.toLowerCase() : '' }}</p>
              </div>
            </div>
          </ng-template>

          <!-- DATE SUBMITTED Template (2 lines: Date on 1st line, Time underneath) -->
          <ng-template #dateCell let-row="row">
            <div class="leading-tight">
              <p class="text-sm font-medium text-slate-800">{{ formatSubmissionDate(row.created_at) }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ formatSubmissionTime(row.created_at) }}</p>
            </div>
          </ng-template>

          <!-- STATUS Template (Pill-shaped badges with subtle right chevron) -->
          <ng-template #statusCell let-row="row">
            <div class="flex items-center justify-between gap-3">
              <span [class]="'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ' + statusChipClass(row.status)">
                <span class="w-1.5 h-1.5 rounded-full" [class]="statusDotClass(row.status)"></span>
                {{ formatStatusLabel(row.status) }}
              </span>
              <svg class="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </ng-template>
        </app-table>

        @if (total() > 0) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            itemLabel="applications"
            (onPageChange)="onPageChange($event)"
            (onLimitChange)="onLimitChange($event)"
          />
        }
      </app-card>

      <!-- Application Detail Modal -->
      <app-modal [open]="showDetail()" [title]="selected()?.application_number || 'Application Details'" (onClose)="closeDetail()" [containerClass]="(cardPreviewBlob() || cardPreviewUrl()) ? 'max-w-6xl' : 'max-w-2xl'" [bodyClass]="(cardPreviewBlob() || cardPreviewUrl()) ? '!overflow-hidden flex flex-col h-[75vh]' : ''">
        @if (selected(); as app) {
          <div class="flex flex-col lg:flex-row gap-6 h-full min-h-0">

            <!-- Left Pane: Applicant Details & Status Actions -->
            <div [class]="(cardPreviewBlob() || cardPreviewUrl()) ? 'flex-1 space-y-5 max-h-[75vh] overflow-y-auto pr-2' : 'flex-1 space-y-5'">

              <!-- Header: Name + Status Badge -->
              <div class="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <p class="text-xl font-bold text-gray-900">{{ app.full_name }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">Submitted on {{ app.created_at }}</p>
                </div>
                <span [class]="'shrink-0 px-3 py-1 rounded-full text-xs font-bold ' + statusChipClass(app.status)">{{ app.status }}</span>
              </div>

              <!-- Photo and Signature -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <p class="text-[11px] font-bold uppercase tracking-wide text-gray-400">Applicant Photo</p>
                  @if (imageUrl(app.photo)) {
                    <img [src]="imageUrl(app.photo)" alt="Applicant photo"
                         class="w-full h-40 object-cover rounded-xl border border-gray-200 bg-gray-50"
                         (error)="$any($event.target).style.display='none'">
                  } @else {
                    <div class="w-full h-40 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1">
                      <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      <p class="text-xs text-gray-400">No photo submitted</p>
                    </div>
                  }
                </div>
                <div class="space-y-1.5">
                  <p class="text-[11px] font-bold uppercase tracking-wide text-gray-400">Signature Specimen</p>
                  @if (imageUrl(app.signature)) {
                    <img [src]="imageUrl(app.signature)" alt="Applicant signature"
                         class="w-full h-40 object-contain rounded-xl border border-gray-200 bg-white p-2"
                         (error)="$any($event.target).style.display='none'">
                  } @else {
                    <div class="w-full h-40 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1">
                      <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                      </svg>
                      <p class="text-xs text-gray-400">No signature submitted</p>
                    </div>
                  }
                </div>
              </div>

              <!-- Biodata Details -->
              <div class="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <p class="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-3">Personal Information</p>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                  <div><p class="text-[11px] text-gray-400 font-medium">Birth Date</p><p class="text-gray-800 font-semibold">{{ app.birth_date || '-' }}</p></div>
                  <div><p class="text-[11px] text-gray-400 font-medium">Gender</p><p class="text-gray-800 font-semibold">{{ app.gender || '-' }}</p></div>
                  <div><p class="text-[11px] text-gray-400 font-medium">Civil Status</p><p class="text-gray-800 font-semibold">{{ app.civil_status || '-' }}</p></div>
                  <div><p class="text-[11px] text-gray-400 font-medium">Occupation</p><p class="text-gray-800 font-semibold">{{ app.occupation || '-' }}</p></div>
                  <div><p class="text-[11px] text-gray-400 font-medium">Blood Type</p><p class="text-gray-800 font-semibold">{{ app.blood_type || '-' }}</p></div>
                  <div><p class="text-[11px] text-gray-400 font-medium">Contact #</p><p class="text-gray-800 font-semibold">{{ app.contact_number || '-' }}</p></div>
                  <div class="col-span-2 sm:col-span-3"><p class="text-[11px] text-gray-400 font-medium">Home Address</p><p class="text-gray-800 font-semibold">{{ app.address_line || '-' }}</p></div>
                  <div class="col-span-2"><p class="text-[11px] text-gray-400 font-medium">Email Address</p><p class="text-gray-800 font-semibold">{{ app.email || '-' }}</p></div>
                </div>
              </div>

              <!-- Emergency Contact -->
              <div class="bg-amber-50/60 rounded-xl border border-amber-100 p-4">
                <p class="text-[11px] font-bold uppercase tracking-wide text-amber-600 mb-3">Emergency Contact</p>
                <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><p class="text-[11px] text-gray-400 font-medium">Name</p><p class="text-gray-800 font-semibold">{{ app.emergency_contact_name || '-' }}</p></div>
                  <div><p class="text-[11px] text-gray-400 font-medium">Phone #</p><p class="text-gray-800 font-semibold">{{ app.emergency_contact_number || '-' }}</p></div>
                </div>
              </div>

              <!-- Review Info (if reviewed) -->
              @if (app.reviewed_by_name || app.review_remarks) {
                <div class="bg-blue-50/50 rounded-xl border border-blue-100 p-4 space-y-2 text-sm">
                  <p class="text-[11px] font-bold uppercase tracking-wide text-blue-600 mb-2">Review Details</p>
                  @if (app.reviewed_by_name) {
                    <div class="flex gap-6">
                      <div><p class="text-[11px] text-gray-400 font-medium">Reviewed By</p><p class="text-gray-800 font-semibold">{{ app.reviewed_by_name }}</p></div>
                      <div><p class="text-[11px] text-gray-400 font-medium">Reviewed At</p><p class="text-gray-800">{{ app.reviewed_at }}</p></div>
                    </div>
                  }
                  @if (app.review_remarks) {
                    <div><p class="text-[11px] text-gray-400 font-medium">Remarks</p><p class="text-gray-800">{{ app.review_remarks }}</p></div>
                  }
                </div>
              }

              <!-- Pending Review Action Controls -->
              @if (app.status === 'PENDING') {
                <div class="border border-blue-200 rounded-xl bg-blue-50/40 p-4 space-y-3">
                  <div class="flex items-center justify-between gap-4">
                    <p class="text-xs text-blue-700 font-medium">Verify the generated card design draft before processing</p>
                    <app-button variant="secondary" size="sm" (onClick)="previewDraft(app)" [loading]="previewing()">Preview Draft ID</app-button>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Remarks (optional)</label>
                    <textarea
                      [value]="remarks()"
                      (input)="remarks.set($any($event.target).value)"
                      rows="2"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter approval/rejection remarks..."></textarea>
                  </div>
                  <div class="flex justify-end gap-2 pt-1">
                    <app-button variant="danger" (onClick)="requestAction('reject')">Reject Application</app-button>
                    <app-button variant="success" (onClick)="requestAction('approve')">Approve Application</app-button>
                  </div>
                </div>
              }

              <!-- Approved Card Issued Details -->
              @if (app.status === 'APPROVED' && app.id_number) {
                <div class="border border-green-200 rounded-xl bg-green-50/40 p-4 space-y-3">
                  <p class="text-[11px] font-bold uppercase tracking-wide text-green-700 mb-2">Issued Barangay ID</p>
                  <div class="grid grid-cols-3 gap-3 text-sm">
                    <div><p class="text-[11px] text-gray-400 font-medium">ID Number</p><p class="text-gray-800 font-bold">{{ app.id_number }}</p></div>
                    <div><p class="text-[11px] text-gray-400 font-medium">Issued On</p><p class="text-gray-800 font-semibold">{{ app.id_issued_at ? (app.id_issued_at | date: 'mediumDate') : '-' }}</p></div>
                    <div><p class="text-[11px] text-gray-400 font-medium">Expires</p><p class="text-gray-800 font-semibold">{{ app.id_expiration_date ? (app.id_expiration_date | date: 'mediumDate') : '-' }}</p></div>
                  </div>
                  @if (app.id_card_path) {
                    <div class="flex items-center justify-between rounded-lg border border-green-200 bg-white px-3 py-2.5">
                      <div>
                        <p class="text-xs font-bold text-gray-700">Official Generated ID Card</p>
                        <p class="text-[10px] text-gray-400">Click to preview the live card template</p>
                      </div>
                      <div class="flex items-center gap-3">
                        <button type="button" (click)="previewIdCard(app)" class="text-blue-600 hover:text-blue-800 text-xs font-bold">Preview</button>
                        <a [href]="idCardUrl(app)" target="_blank" class="text-blue-600 hover:text-blue-800 text-xs font-bold">Download</a>
                      </div>
                    </div>
                  }
                  @if (app.resident_id) {
                    <div class="flex items-center justify-between pt-2 border-t border-green-200">
                      <p class="text-xs text-slate-600">Physical RFID card registration:</p>
                      <a [routerLink]="['/rfid']" [queryParams]="{ new: '1', residentId: app.resident_id }" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 9.5h8M7 12h8" stroke-linecap="round"/>
                        </svg>
                        Assign RFID Card
                      </a>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Right Pane: Live Document Preview -->
            @if (cardPreviewBlob() || cardPreviewUrl()) {
              <div class="flex-1 flex flex-col border border-gray-200 rounded-xl bg-gray-50 overflow-hidden max-h-[75vh]">
                <!-- Preview Toolbar -->
                <div class="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between shrink-0">
                  <span class="text-xs font-bold text-gray-700 truncate" [title]="cardPreviewTitle()">{{ cardPreviewTitle() }}</span>
                  <div class="flex items-center gap-1 shrink-0">
                    <button type="button" (click)="zoomOutPreview()" class="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold">-</button>
                    <span class="text-xs font-medium w-10 text-center tabular-nums">{{ zoomPercentPreview() }}</span>
                    <button type="button" (click)="zoomInPreview()" class="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold">+</button>
                    <button type="button" (click)="closePreviewPane()" class="text-gray-400 hover:text-gray-600 ml-2" title="Close Preview">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Document Rendering Box -->
                <div class="flex-1 overflow-auto p-4 flex flex-col items-center bg-gray-100/50">
                  <div #previewContainer class="docx-preview-container w-full bg-white shadow-md min-h-[400px] flex items-center justify-center" [style.zoom]="zoomPreview()"></div>
                </div>
              </div>
            }

          </div>
        }
      </app-modal>

      <!-- Action Confirmation -->
      <app-confirm-dialog
        [open]="showActionConfirm()"
        [title]="actionTitle()"
        [message]="actionMessage()"
        [confirmText]="actionConfirmText()"
        [variant]="pendingAction() === 'approve' ? 'primary' : 'danger'"
        (onCancel)="showActionConfirm.set(false)"
        (onConfirm)="confirmAction()"
      />

      <!-- Issued ID Card Preview -->
      <app-document-preview-modal
        [open]="showCardPreview()"
        [title]="cardPreviewTitle()"
        [blob]="cardPreviewBlob()"
        [blobUrl]="cardPreviewUrl()"
        (onClose)="closeCardPreview()"
      />

      <!-- Configure Barangay ID Modal -->
      <app-modal [open]="showConfig()" title="Configure Barangay ID" (onClose)="showConfig.set(false)">
        @if (barangayIdService(); as svc) {
          <app-service-form
            [service]="svc"
            [loading]="savingConfig()"
            (onSave)="onSaveConfig($event)"
            (onCancel)="showConfig.set(false)"
          />
        } @else {
          <div class="p-4 text-center text-gray-500">
            Could not load the 'Barangay ID' service configuration. Make sure it exists in the database.
          </div>
        }
      </app-modal>
    </div>
  `
})
export class ApplicationsComponent implements OnInit, OnDestroy, AfterViewChecked {
  applications = signal<ApplicationRow[]>([]);
  loading = signal(true);
  search = signal('');
  statusFilter = signal('');
  page = signal(1);
  limit = 10;
  total = signal(0);
  sortColumn = signal('application_id');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  selected = signal<ApplicationRow | null>(null);
  showDetail = signal(false);
  remarks = signal('');
  saving = signal(false);

  showActionConfirm = signal(false);
  pendingAction = signal<'approve' | 'reject' | null>(null);

  showCardPreview = signal(false);
  cardPreviewTitle = signal('Barangay ID Card');
  cardPreviewUrl = signal<string | null>(null);
  cardPreviewBlob = signal<Blob | null>(null);
  previewing = signal(false);

  @ViewChild('previewContainer', { static: false }) previewContainer!: ElementRef<HTMLDivElement>;
  zoomPreview = signal(1);
  private renderedBlobKey: Blob | null = null;
  private renderedUrlKey: string | null = null;

  barangayIdService = signal<Service | null>(null);
  showConfig = signal(false);
  savingConfig = signal(false);

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'RETURNED', label: 'Returned' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  datePreset = signal('');
  dateFrom = signal('');
  dateTo = signal('');

  columns: TableColumn[] = [
    { key: 'application_number', label: 'APPLICATION #', sortable: true },
    { key: 'full_name', label: 'APPLICANT', sortable: true },
    { key: 'created_at', label: 'DATE SUBMITTED', sortable: true },
    { key: 'status', label: 'STATUS', sortable: true }
  ];

  private sseSubscription: any = null;
  private readonly assetBase = environment.apiUrl.replace(/\/api\/v1$/, '');

  constructor(
    private applicationService: ApplicationService,
    private notificationService: NotificationService,
    private serviceService: ServiceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadApplications();
    this.connectToUpdates();
    this.loadBarangayIdService();
    this.route.queryParams.subscribe(params => {
      if (params['applicationId']) {
        const appId = parseInt(params['applicationId'], 10);
        if (appId) {
          this.applicationService.getById(appId).subscribe({
            next: (res) => {
              if (res.data) {
                const app = res.data as BarangayIdApplication;
                const row: ApplicationRow = {
                  ...app,
                  full_name: `${app.first_name} ${app.last_name}`
                };
                this.openDetail(row);
              }
            }
          });
        }
        this.router.navigate([], { queryParams: { applicationId: null }, queryParamsHandling: 'merge' });
      } else if (params['status']) {
        const status = params['status'];
        if (status) {
          this.statusFilter.set(status);
          this.page.set(1);
          this.loadApplications();
        }
        this.router.navigate([], { queryParams: { status: null }, queryParamsHandling: 'merge' });
      }
    });
  }

  ngOnDestroy() {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
    }
  }

  ngAfterViewChecked() {
    const blob = this.cardPreviewBlob();
    const url = this.cardPreviewUrl();
    if ((blob || url) && (this.renderedBlobKey !== blob || this.renderedUrlKey !== url)) {
      // Mark as scheduled immediately to avoid re-scheduling on every CD cycle.
      const blobToRender = blob;
      const urlToRender = url;
      this.renderedBlobKey = blobToRender;
      this.renderedUrlKey = urlToRender;

      // Defer one tick so Angular finishes rendering the @if(cardPreviewBlob || cardPreviewUrl)
      // block and #previewContainer is guaranteed to exist in the DOM.
      setTimeout(() => {
        if (!this.previewContainer?.nativeElement) return;
        const container = this.previewContainer.nativeElement;
        container.innerHTML = '';

        if (blobToRender) {
          if (blobToRender.type === 'application/pdf') {
            const blobUrl = URL.createObjectURL(blobToRender);
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '60vh';
            iframe.style.minHeight = '450px';
            iframe.style.border = '0';
            iframe.src = blobUrl;
            container.appendChild(iframe);
          } else {
            renderAsync(blobToRender, container).catch(err => {
              console.error('Error rendering ID draft preview:', err);
            });
          }
        } else if (urlToRender) {
          const isPdf = urlToRender.toLowerCase().endsWith('.pdf');
          if (isPdf) {
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '60vh';
            iframe.style.minHeight = '450px';
            iframe.style.border = '0';
            iframe.src = urlToRender;
            container.appendChild(iframe);
          } else {
            const img = document.createElement('img');
            img.src = urlToRender;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.border = '1px solid #e2e8f0';
            img.style.borderRadius = '8px';
            container.appendChild(img);
          }
        }
      }, 0);
    }
  }

  zoomPercentPreview(): string {
    return Math.round(this.zoomPreview() * 100) + '%';
  }

  zoomInPreview() {
    this.zoomPreview.set(Math.min(3, this.zoomPreview() * 1.25));
  }

  zoomOutPreview() {
    this.zoomPreview.set(Math.max(0.5, this.zoomPreview() / 1.25));
  }

  closePreviewPane() {
    this.cardPreviewBlob.set(null);
    this.cardPreviewUrl.set(null);
    this.renderedBlobKey = null;
    this.renderedUrlKey = null;
    this.zoomPreview.set(1);
  }

  private connectToUpdates() {
    this.sseSubscription = this.notificationService.sse$.subscribe(event => {
      if (event?.type?.startsWith('application-')) {
        this.loadApplications();
      }
    });
  }

  loadApplications() {
    this.loading.set(true);
    this.applicationService.getAll({
      search: this.search() || undefined,
      status: this.statusFilter() || undefined,
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
      page: this.page(),
      limit: this.limit,
      sortBy: this.sortColumn(),
      sortOrder: this.sortDirection()
    }).subscribe({
      next: (res) => {
        this.applications.set(res.data.map(a => ({ ...a, full_name: this.fullName(a) })));
        this.total.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private fullName(app: BarangayIdApplication): string {
    const parts = [app.first_name, app.middle_name, app.last_name, app.suffix].filter(Boolean);
    return parts.join(' ');
  }

  onSearch(value: string) {
    this.search.set(value);
    this.page.set(1);
    this.loadApplications();
  }

  onStatusChange(value: string) {
    this.statusFilter.set(value);
    this.page.set(1);
    this.loadApplications();
  }

  onSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('ASC');
    }
    this.loadApplications();
  }

  onPageChange(page: number) {
    this.page.set(page);
    this.loadApplications();
  }

  onLimitChange(limit: number) {
    this.limit = limit;
    this.page.set(1);
    this.loadApplications();
  }

  openDetail(row: ApplicationRow) {
    this.selected.set(row);
    this.remarks.set('');
    this.showDetail.set(true);
  }

  closeDetail() {
    this.showDetail.set(false);
    this.selected.set(null);
    this.closePreviewPane();
  }

  imageUrl(path: string | null): string {
    return path ? `${this.assetBase}/uploads/${path}` : '';
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
    this.loadApplications();
  }

  onCustomDateChange(type: 'from' | 'to', value: string) {
    if (type === 'from') this.dateFrom.set(value);
    if (type === 'to') this.dateTo.set(value);
    this.page.set(1);
    this.loadApplications();
  }

  private formatDateIso(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  hasActiveFilters(): boolean {
    return !!(this.search() || this.statusFilter() || this.datePreset() || this.dateFrom() || this.dateTo());
  }

  activeFilterCount(): number {
    let count = 0;
    if (this.statusFilter()) count++;
    if (this.datePreset() || this.dateFrom() || this.dateTo()) count++;
    return count;
  }

  toggleCustomFilter() {
    if (this.datePreset() === 'custom') {
      this.datePreset.set('');
      this.dateFrom.set('');
      this.dateTo.set('');
    } else {
      this.datePreset.set('custom');
      const now = new Date();
      if (!this.dateFrom()) this.dateFrom.set(this.formatDateIso(now));
      if (!this.dateTo()) this.dateTo.set(this.formatDateIso(now));
    }
    this.page.set(1);
    this.loadApplications();
  }

  resetFilters() {
    this.search.set('');
    this.statusFilter.set('');
    this.datePreset.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.page.set(1);
    this.loadApplications();
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

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  statusChipClass(status: string): string {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PENDING': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'APPROVED': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'RETURNED': return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'REJECTED': return 'bg-red-50 text-red-800 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  statusDotClass(status: string): string {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PENDING': return 'bg-amber-500';
      case 'APPROVED': return 'bg-emerald-500';
      case 'RETURNED': return 'bg-rose-500';
      case 'REJECTED': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  }

  formatStatusLabel(status: string): string {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PENDING': return 'Pending';
      case 'APPROVED': return 'Approved';
      case 'RETURNED': return 'Returned';
      case 'REJECTED': return 'Rejected';
      default: return status || 'Unknown';
    }
  }

  actionTitle(): string {
    const action = this.pendingAction();
    if (action === 'approve') return 'Approve Application';
    if (action === 'reject') return 'Reject Application';
    return '';
  }

  actionMessage(): string {
    const app = this.selected();
    const action = this.pendingAction();
    if (!app || !action) return '';
    if (action === 'approve') {
      return `Approve application ${app.application_number} for ${app.full_name}? A permanent resident record will be created, an official Barangay ID number assigned, and the ID card generated.`;
    }
    return `Reject application ${app.application_number} for ${app.full_name}?`;
  }

  actionConfirmText(): string {
    const action = this.pendingAction();
    if (action === 'approve') return 'Approve';
    if (action === 'reject') return 'Reject';
    return '';
  }

  idCardUrl(app: ApplicationRow): string {
    return app.id_card_path ? `${this.assetBase}/uploads/${app.id_card_path}` : '';
  }

  previewIdCard(app: ApplicationRow) {
    this.cardPreviewTitle.set(`${app.full_name} — Barangay ID (${app.id_number})`);
    this.cardPreviewBlob.set(null);
    this.cardPreviewUrl.set(this.idCardUrl(app));
    this.showCardPreview.set(true);
  }

  // Draft preview: render the ID card from the application's submitted data
  // WITHOUT approving it. The server returns a DOCX buffer (no resident record,
  // no ID number, nothing persisted), which we display inline for review.
  previewDraft(app: ApplicationRow) {
    if (this.previewing()) return;
    this.previewing.set(true);
    this.cardPreviewBlob.set(null);
    this.applicationService.previewBlob(app.application_id).subscribe({
      next: (blob) => {
        this.previewing.set(false);
        this.cardPreviewTitle.set(`${app.full_name} — Barangay ID (Draft Preview)`);
        this.cardPreviewBlob.set(blob);
        this.cardPreviewUrl.set(null);
        this.showCardPreview.set(true);
      },
      error: (err: any) => {
        this.previewing.set(false);
        let msg = 'Could not render the ID card preview.';
        if (err?.error instanceof Blob) {
          err.error.text().then((text: string) => {
            try {
              const parsed = JSON.parse(text);
              msg = parsed?.message || msg;
            } catch { /* ignore non-JSON error bodies */ }
            alert(msg);
          });
        } else {
          alert(err?.error?.message || msg);
        }
      }
    });
  }

  closeCardPreview() {
    this.showCardPreview.set(false);
    this.cardPreviewUrl.set(null);
    this.cardPreviewBlob.set(null);
  }

  requestAction(action: 'approve' | 'reject') {
    this.pendingAction.set(action);
    this.showActionConfirm.set(true);
  }

  confirmAction() {
    const app = this.selected();
    const action = this.pendingAction();
    if (!app || !action) return;
    this.saving.set(true);
    const remarks = this.remarks().trim() || undefined;
    const calls: Record<'approve' | 'reject', () => any> = {
      approve: () => this.applicationService.approve(app.application_id, remarks),
      reject: () => this.applicationService.reject(app.application_id, remarks)
    };
    calls[action]().subscribe({
      next: () => {
        this.saving.set(false);
        this.showActionConfirm.set(false);
        this.closeDetail();
        this.loadApplications();
      },
      error: (err: any) => {
        this.saving.set(false);
        this.showActionConfirm.set(false);
        alert(err.error?.message || 'Action failed.');
      }
    });
  }

  loadBarangayIdService() {
    this.serviceService.getAll().subscribe({
      next: (res) => {
        const found = (res.data || []).find((s: any) => s.service_name === 'Barangay ID');
        this.barangayIdService.set(found || null);
      }
    });
  }

  onSaveConfig(data: any) {
    const svc = this.barangayIdService();
    if (!svc) return;
    this.savingConfig.set(true);
    this.serviceService.update(svc.service_id, data).subscribe({
      next: (res) => {
        this.handleTemplate(svc.service_id, data).subscribe({
          next: () => {
            this.savingConfig.set(false);
            this.showConfig.set(false);
            this.loadBarangayIdService();
          },
          error: (err) => {
            this.savingConfig.set(false);
            alert(err.error?.message || 'Config saved, but the template could not be uploaded.');
          }
        });
      },
      error: (err) => {
        this.savingConfig.set(false);
        alert(err.error?.message || 'Failed to save configuration.');
      }
    });
  }

  private handleTemplate(serviceId: number, data: any): Observable<any> {
    if (data.templateFile) {
      return this.serviceService.uploadTemplate(serviceId, data.templateFile);
    }
    if (data.templateRemove) {
      return this.serviceService.removeTemplate(serviceId);
    }
    return of(null);
  }
}
