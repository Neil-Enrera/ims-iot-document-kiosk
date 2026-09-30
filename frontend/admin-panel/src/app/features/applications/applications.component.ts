import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { renderAsync } from 'docx-preview';
import { Observable, of } from 'rxjs';
import { NotificationService } from '../notifications/notification.service';
import { BarangayIdApplication, Service, DocumentRequest, RequestStatusHistory, RfidCard, Resident } from '../../shared/interfaces/api.interfaces';
import { ApplicationService, ServiceService, RequestService, DocumentService, RfidService, ResidentService } from '../../shared/services';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { DocumentPreviewModalComponent } from '../../shared/components/document-preview-modal.component';
import { ToastService } from '../../shared/components/toast.service';
import { ServiceFormComponent } from '../services/service-form.component';
import { environment } from '../../../environments/environment';

type ApplicationRow = BarangayIdApplication & { full_name: string; _photoError?: boolean };

interface UploadedRequirement {
  requirement_name: string;
  original_name: string;
  file_url: string;
  mime_type: string;
  file_size?: number;
}

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableComponent, CardComponent, InputComponent, PaginationComponent,
    ButtonComponent, ModalComponent, DocumentPreviewModalComponent,
    DatePipe, ServiceFormComponent
  ],
  template: `
    <div>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Barangay ID Application</h1>
          <p class="text-sm text-slate-500 mt-1">Review, approve, and register physical RFID Barangay ID cards for residents.</p>
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

      <!-- Navigation Tabs: New Applications vs Renewals & Replacements -->
      <div class="flex items-center gap-2 mb-4 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200/80">
        <button
          type="button"
          (click)="setTab('applications')"
          [class]="activeTab() === 'applications'
            ? 'px-4 py-2 rounded-xl text-xs font-bold bg-white text-orange-600 shadow-xs border border-slate-200 transition-all flex items-center gap-2 cursor-pointer'
            : 'px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all flex items-center gap-2 cursor-pointer'">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
          </svg>
          New ID Applications
          @if (applicationsTotal() > 0) {
            <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">{{ applicationsTotal() }}</span>
          }
        </button>

        <button
          type="button"
          (click)="setTab('renewals')"
          [class]="activeTab() === 'renewals'
            ? 'px-4 py-2 rounded-xl text-xs font-bold bg-white text-orange-600 shadow-xs border border-slate-200 transition-all flex items-center gap-2 cursor-pointer'
            : 'px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all flex items-center gap-2 cursor-pointer'">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          ID Renewals & Replacements
          @if (renewalsTotal() > 0) {
            <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">{{ renewalsTotal() }}</span>
          }
        </button>
      </div>

      <!-- ================= TAB 1: NEW APPLICATIONS ================= -->
      @if (activeTab() === 'applications') {
        <app-card>
          <div class="mb-4 flex flex-col gap-3">
            <!-- Search & Filter Controls Row -->
            <div class="flex flex-wrap items-center gap-3">
              <!-- Search Input -->
              <div class="flex-1 min-w-[240px]">
                <app-input
                  placeholder="Search application number, applicant name, or card UID..."
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

              <!-- Filter button -->
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

              <!-- Reset Filters -->
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
            emptyMessage="No Barangay ID applications found"
            [cellTemplates]="{
              application_number: appNumCell,
              full_name: applicantCell,
              contact_info: contactCell,
              created_at: dateCell,
              status: statusCell
            }"
            (onSort)="onSort($event)"
            (onRowClick)="openDetail($event)"
          >
            <!-- APPLICATION # Template -->
            <ng-template #appNumCell let-row="row">
              <span class="text-sm font-semibold text-slate-900 font-mono">
                {{ row.application_number }}
              </span>
            </ng-template>

            <!-- APPLICANT Template -->
            <ng-template #applicantCell let-row="row">
              <div class="flex items-center gap-3">
                @if (imageUrl(row.photo) && !row._photoError) {
                  <img
                    [src]="imageUrl(row.photo)"
                    (error)="row._photoError = true"
                    (click)="$event.stopPropagation(); openImagePreview(imageUrl(row.photo), row.full_name + ' — Photo')"
                    alt="Photo"
                    title="Click to view full photo"
                    class="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-orange-200 shadow-xs cursor-pointer hover:scale-110 hover:ring-2 hover:ring-orange-400 transition-all"
                  />
                } @else {
                  <div class="w-9 h-9 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0 border border-orange-200 shadow-xs">
                    {{ getInitials(row.full_name) }}
                  </div>
                }
                <div class="leading-tight min-w-0">
                  <p class="font-semibold text-slate-900 text-sm truncate">{{ row.full_name }}</p>
                  <p class="text-[11px] text-slate-400 capitalize">{{ row.gender ? row.gender.toLowerCase() : '' }}{{ row.civil_status ? ' · ' + row.civil_status.toLowerCase() : '' }}</p>
                </div>
              </div>
            </ng-template>

            <!-- CONTACT Template -->
            <ng-template #contactCell let-row="row">
              <div class="leading-tight text-xs">
                <p class="text-slate-800 font-medium">{{ row.contact_number || '-' }}</p>
                <p class="text-[11px] text-slate-400 truncate max-w-[160px]">{{ row.email || '-' }}</p>
              </div>
            </ng-template>

            <!-- DATE SUBMITTED Template -->
            <ng-template #dateCell let-row="row">
              <div class="leading-tight">
                <p class="text-sm font-medium text-slate-800">{{ formatSubmissionDate(row.created_at) }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ formatSubmissionTime(row.created_at) }}</p>
              </div>
            </ng-template>

            <!-- STATUS Template -->
            <ng-template #statusCell let-row="row">
              <span [class]="'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ' + statusChipClass(row.status)">
                <span class="w-1.5 h-1.5 rounded-full" [class]="statusDotClass(row.status)"></span>
                {{ formatStatusLabel(row.status) }}
              </span>
            </ng-template>
          </app-table>

          @if (applicationsTotal() > 0) {
            <app-pagination
              [total]="applicationsTotal()"
              [currentPage]="page()"
              [limit]="limit"
              itemLabel="applications"
              (onPageChange)="onPageChange($event)"
              (onLimitChange)="onLimitChange($event)"
            />
          }
        </app-card>
      }

      <!-- ================= TAB 2: RENEWALS & REPLACEMENTS ================= -->
      @if (activeTab() === 'renewals') {
        <app-card>
          <div class="mb-4 flex flex-col gap-3">
            <!-- Search & Filter Controls Row -->
            <div class="flex flex-wrap items-center gap-3">
              <!-- Search Input -->
              <div class="flex-1 min-w-[240px]">
                <app-input
                  placeholder="Search request #, resident name, or reason..."
                  [value]="renewalSearch()"
                  (valueChange)="onRenewalSearch($event)"
                />
              </div>

              <!-- Service Type Dropdown -->
              <div class="w-48 sm:w-52">
                <select
                  [value]="renewalServiceFilter()"
                  (change)="onRenewalServiceFilter($any($event.target).value)"
                  class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer shadow-xs">
                  <option value="">All ID Types</option>
                  <option value="Barangay ID Renewal">Barangay ID Renewal</option>
                  <option value="Barangay ID Replacement">Barangay ID Replacement</option>
                </select>
              </div>

              <!-- Status Dropdown -->
              <div class="w-44 sm:w-48">
                <select
                  [value]="renewalStatusFilter()"
                  (change)="onRenewalStatusFilter($any($event.target).value)"
                  class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer shadow-xs">
                  @for (opt of renewalStatusOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </div>

              <!-- Reset Filters -->
              @if (hasRenewalActiveFilters()) {
                <button
                  type="button"
                  (click)="resetRenewalFilters()"
                  class="h-10 px-3 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs font-medium flex items-center gap-1 transition cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  Clear
                </button>
              }
            </div>
          </div>

          <app-table
            [columns]="renewalColumns"
            [data]="renewals()"
            [loading]="renewalsLoading()"
            [sortColumn]="renewalSortColumn()"
            [sortDirection]="renewalSortDirection()"
            trackBy="request_id"
            emptyMessage="No Barangay ID renewal or replacement requests found"
            [cellTemplates]="{
              request_number: requestNumCell,
              resident_name: residentCell,
              service_name: serviceTypeCell,
              request_date: renewalDateCell,
              status_id: renewalStatusCell,
              actions: renewalActionsCell
            }"
            (onSort)="onRenewalSort($event)"
            (onRowClick)="openRenewalDetail($event)"
          >
            <!-- REQUEST # -->
            <ng-template #requestNumCell let-row="row">
              <span class="text-sm font-semibold text-slate-900 font-mono">
                {{ row.request_number }}
              </span>
            </ng-template>

            <!-- RESIDENT -->
            <ng-template #residentCell let-row="row">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200 shadow-xs">
                  {{ getInitials(row.resident_name) }}
                </div>
                <div class="leading-tight min-w-0">
                  <p class="font-semibold text-slate-900 text-sm truncate">{{ row.resident_name }}</p>
                  <p class="text-[11px] text-slate-400 font-mono">{{ row.resident_code || 'RESIDENT' }}</p>
                </div>
              </div>
            </ng-template>

            <!-- SERVICE TYPE -->
            <ng-template #serviceTypeCell let-row="row">
              @if (row.service_name?.includes('Renewal')) {
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  ID Renewal
                </span>
              } @else {
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  ID Replacement
                </span>
              }
            </ng-template>

            <!-- DATE SUBMITTED -->
            <ng-template #renewalDateCell let-row="row">
              <div class="leading-tight">
                <p class="text-sm font-medium text-slate-800">{{ formatSubmissionDate(row.request_date) }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ formatSubmissionTime(row.request_date) }}</p>
              </div>
            </ng-template>

            <!-- STATUS -->
            <ng-template #renewalStatusCell let-row="row">
              <span [class]="'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ' + getRenewalStatusClass(row.status_id)">
                <span class="w-1.5 h-1.5 rounded-full" [class]="getRenewalStatusDotClass(row.status_id)"></span>
                {{ row.status_name }}
              </span>
            </ng-template>

            <!-- ACTIONS -->
            <ng-template #renewalActionsCell let-row="row">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="$event.stopPropagation(); openRenewalDetail(row)"
                  class="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs border border-orange-200 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <svg class="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>Review & Verify</span>
                </button>
              </div>
            </ng-template>
          </app-table>

          @if (renewalsTotal() > 0) {
            <app-pagination
              [total]="renewalsTotal()"
              [currentPage]="renewalPage()"
              [limit]="renewalLimit"
              itemLabel="requests"
              (onPageChange)="onRenewalPageChange($event)"
              (onLimitChange)="onRenewalLimitChange($event)"
            />
          }
        </app-card>
      }

      <!-- ================= MODAL: APPLICATION DETAIL REVIEW (TAB 1) ================= -->
      <app-modal [open]="showDetail()" [title]="selected()?.application_number || 'Application Details'" (onClose)="closeDetail()" [containerClass]="(cardPreviewBlob() || cardPreviewUrl()) ? 'max-w-6xl' : 'max-w-2xl'" [bodyClass]="(cardPreviewBlob() || cardPreviewUrl()) ? '!overflow-hidden flex flex-col h-[75vh]' : ''">
        @if (selected(); as app) {
          <div class="flex flex-col lg:flex-row gap-6 h-full min-h-0">

            <!-- Left Pane: Applicant Details & Status Actions -->
            <div [class]="(cardPreviewBlob() || cardPreviewUrl()) ? 'flex-1 space-y-5 max-h-[75vh] overflow-y-auto pr-2' : 'flex-1 space-y-5'">

              <!-- Header: Name + Status Badge -->
              <div class="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <p class="text-xl font-bold text-gray-900">{{ app.full_name }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">Submitted on {{ formatSubmissionDate(app.created_at) }} at {{ formatSubmissionTime(app.created_at) }}</p>
                </div>
                <span [class]="'shrink-0 px-3 py-1 rounded-full text-xs font-bold border ' + statusChipClass(app.status)">{{ formatStatusLabel(app.status) }}</span>
              </div>

              <!-- Photo and Signature -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <p class="text-[11px] font-bold uppercase tracking-wide text-gray-400">Applicant Photo</p>
                    @if (imageUrl(app.photo)) {
                      <button
                        type="button"
                        (click)="openImagePreview(imageUrl(app.photo), app.full_name + ' — Applicant Photo')"
                        class="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                        </svg>
                        View Photo
                      </button>
                    }
                  </div>
                  @if (imageUrl(app.photo)) {
                    <div
                      class="relative group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-xs transition hover:border-orange-300"
                      (click)="openImagePreview(imageUrl(app.photo), app.full_name + ' — Applicant Photo')"
                      title="Click to view full photo">
                      <img [src]="imageUrl(app.photo)" alt="Applicant photo"
                           class="w-full h-40 object-cover group-hover:scale-105 transition duration-200"
                           (error)="$any($event.target).style.display='none'">
                      <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[1px]">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        Click to enlarge
                      </div>
                    </div>
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
                  <div class="flex items-center justify-between">
                    <p class="text-[11px] font-bold uppercase tracking-wide text-gray-400">Signature Specimen</p>
                    @if (imageUrl(app.signature)) {
                      <button
                        type="button"
                        (click)="openImagePreview(imageUrl(app.signature), app.full_name + ' — Signature Specimen')"
                        class="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                        </svg>
                        View Signature
                      </button>
                    }
                  </div>
                  @if (imageUrl(app.signature)) {
                    <div
                      class="relative group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs transition hover:border-orange-300 p-2"
                      (click)="openImagePreview(imageUrl(app.signature), app.full_name + ' — Signature Specimen')"
                      title="Click to view full signature">
                      <img [src]="imageUrl(app.signature)" alt="Signature"
                           class="w-full h-36 object-contain group-hover:scale-105 transition duration-200"
                           (error)="$any($event.target).style.display='none'">
                      <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[1px] rounded-xl">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        Click to enlarge
                      </div>
                    </div>
                  } @else {
                    <div class="w-full h-40 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1">
                      <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                      </svg>
                      <p class="text-xs text-gray-400">No signature provided</p>
                    </div>
                  }
                </div>
              </div>

              <!-- Personal Information -->
              <div class="bg-gray-50 rounded-xl p-4 space-y-3">
                <p class="text-[11px] font-bold uppercase tracking-wide text-gray-400">Personal Information</p>
                <div class="grid grid-cols-3 gap-3 text-sm">
                  <div><p class="text-[11px] text-gray-400 font-medium">Birth Date</p><p class="text-gray-800 font-semibold">{{ app.birth_date || '-' }}</p></div>
                  <div><p class="text-[11px] text-gray-400 font-medium">Gender</p><p class="text-gray-800 font-semibold capitalize">{{ app.gender || '-' }}</p></div>
                  <div><p class="text-[11px] text-gray-400 font-medium">Civil Status</p><p class="text-gray-800 font-semibold capitalize">{{ app.civil_status || '-' }}</p></div>
                  <div><p class="text-[11px] text-gray-400 font-medium">Occupation</p><p class="text-gray-800 font-semibold">{{ app.occupation || '-' }}</p></div>
                  <div><p class="text-[11px] text-gray-400 font-medium">Phone #</p><p class="text-gray-800 font-semibold">{{ app.contact_number || '-' }}</p></div>
                </div>
                <div class="pt-2 border-t border-gray-200">
                  <p class="text-[11px] text-gray-400 font-medium">Email Address</p>
                  <p class="text-gray-800 font-semibold text-sm">{{ app.email || '-' }}</p>
                </div>
                <div class="pt-2 border-t border-gray-200">
                  <p class="text-[11px] text-gray-400 font-medium">Address Line</p>
                  <p class="text-gray-800 font-semibold text-sm">{{ app.address_line || '-' }}</p>
                </div>
              </div>

              <!-- Emergency Contact -->
              <div class="bg-gray-50 rounded-xl p-4 space-y-2">
                <p class="text-[11px] font-bold uppercase tracking-wide text-gray-400">Emergency Contact</p>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div><p class="text-[11px] text-gray-400 font-medium">Contact Person</p><p class="text-gray-800 font-semibold">{{ app.emergency_contact_name || '-' }}</p></div>
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

              <!-- Approved or Released Card Issued Details & RFID Section -->
              @if (app.status === 'APPROVED' || app.status === 'RELEASED') {
                <div class="border border-green-200 rounded-xl bg-green-50/40 p-4 space-y-4">
                  @if (app.status === 'RELEASED') {
                    <div class="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        </div>
                        <div>
                          <p class="text-xs font-bold text-emerald-950">Barangay ID Released</p>
                          <p class="text-[11px] text-emerald-800">Physical ID card has been issued and claimed by the resident.</p>
                        </div>
                      </div>
                      @if (app.released_at) {
                        <span class="text-xs font-semibold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
                          Released: {{ app.released_at | date:'mediumDate' }}
                        </span>
                      }
                    </div>
                  }

                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-wide text-green-700 mb-2">Issued Barangay ID Details</p>
                    <div class="grid grid-cols-3 gap-3 text-sm">
                      <div><p class="text-[11px] text-gray-400 font-medium">ID Number</p><p class="text-gray-800 font-bold">{{ app.id_number || 'Generated' }}</p></div>
                      <div><p class="text-[11px] text-gray-400 font-medium">Issued On</p><p class="text-gray-800 font-semibold">{{ app.id_issued_at ? (app.id_issued_at | date: 'mediumDate') : '-' }}</p></div>
                      <div><p class="text-[11px] text-gray-400 font-medium">Expires</p><p class="text-gray-800 font-semibold">{{ app.id_expiration_date ? (app.id_expiration_date | date: 'mediumDate') : '-' }}</p></div>
                    </div>
                  </div>

                  @if (app.id_card_path) {
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-2xs">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                        </div>
                        <div class="min-w-0">
                          <p class="text-xs font-bold text-emerald-950 truncate">Official Generated ID Card Document</p>
                          <p class="text-[11px] text-emerald-700/80">Click Preview to inspect or Download the ready-to-print file</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          (click)="previewIdCard(app)"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold shadow-2xs transition cursor-pointer"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                          Preview
                        </button>
                        <a
                          [href]="idCardUrl(app)"
                          target="_blank"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  }

                  <!-- Physical RFID Card Registration Status in Application -->
                  <div class="pt-3 border-t border-emerald-200/60">
                    <div class="flex items-center justify-between mb-2.5">
                      <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 9.5h8M7 12h8" stroke-linecap="round"/>
                        </svg>
                        Physical RFID Card Assignment
                      </p>
                      @if (app.card_uid) {
                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {{ app.rfid_status || 'ACTIVE' }}
                        </span>
                      }
                    </div>
                    
                    @if (app.card_uid) {
                      <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3.5">
                        <!-- Top Row: Card Info & Actions -->
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <!-- Left: UID Chip & Title -->
                          <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <rect x="3" y="6" width="18" height="12" rx="2"/>
                                <path d="M7 10h4M7 14h6" stroke-linecap="round"/>
                              </svg>
                            </div>
                            <div class="min-w-0">
                              <p class="text-[11px] font-semibold text-slate-400">Card UID</p>
                              <div class="flex items-center gap-2 mt-0.5">
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-orange-50 text-orange-800 border border-orange-200/90 shadow-2xs tracking-wider">
                                  <svg class="w-3.5 h-3.5 text-orange-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 9.5h8M7 12h8" stroke-linecap="round"/>
                                  </svg>
                                  {{ app.card_uid }}
                                </span>
                              </div>
                            </div>
                          </div>

                          <!-- Right: Action Buttons -->
                          <div class="flex items-center flex-wrap gap-2 shrink-0">
                            <button
                              type="button"
                              (click)="openRfidModalForApplication(app)"
                              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
                              title="Re-assign or update registered RFID UID"
                            >
                              <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                              </svg>
                              <span>Re-issue Card</span>
                            </button>

                            @if (app.status === 'APPROVED') {
                              <button
                                type="button"
                                (click)="markAsReleased(app)"
                                [disabled]="releasing()"
                                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs hover:shadow transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
                              >
                                @if (releasing()) {
                                  <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Releasing...</span>
                                } @else {
                                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                  </svg>
                                  <span>Mark as Released</span>
                                }
                              </button>
                            }
                          </div>
                        </div>

                        <!-- Bottom Strip: Metadata -->
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
                          <div class="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Issued Date</span>
                            <span class="font-semibold text-slate-800">{{ (app.rfid_issued_date ? (app.rfid_issued_date | date:'mediumDate') : (app.id_issued_at ? (app.id_issued_at | date:'mediumDate') : 'Today')) }}</span>
                          </div>
                          <div class="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Expiration Date</span>
                            <span class="font-semibold text-slate-800">{{ (app.rfid_expiration_date ? (app.rfid_expiration_date | date:'mediumDate') : (app.id_expiration_date ? (app.id_expiration_date | date:'mediumDate') : '-')) }}</span>
                          </div>
                          <div class="col-span-2 sm:col-span-1 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between">
                            <div>
                              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Kiosk Access</span>
                              <span class="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                                Enabled
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    } @else {
                      <div class="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 9.5h8M7 12h8" stroke-linecap="round"/>
                            </svg>
                          </div>
                          <div>
                            <p class="text-xs font-bold text-orange-950">RFID Card Pending Registration</p>
                            <p class="text-[11px] text-orange-800">Scan or assign physical RFID Card UID to activate kiosk RFID access.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          (click)="openRfidModalForApplication(app)"
                          class="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition shrink-0 cursor-pointer"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                          </svg>
                          <span>Assign RFID Card</span>
                        </button>
                      </div>
                    }
                  </div>
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
                    <button type="button" (click)="zoomOutPreview()" class="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold cursor-pointer">-</button>
                    <span class="text-xs font-medium w-10 text-center tabular-nums">{{ zoomPercentPreview() }}</span>
                    <button type="button" (click)="zoomInPreview()" class="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold cursor-pointer">+</button>
                    <button type="button" (click)="closePreviewPane()" class="text-gray-400 hover:text-gray-600 ml-2 cursor-pointer" title="Close Preview">
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

      <!-- ================= MODAL: RENEWAL / REPLACEMENT DETAIL (TAB 2) ================= -->
      <app-modal
        [open]="showRenewalDetail()"
        [title]="selectedRenewal()?.request_number || 'Barangay ID Renewal Details'"
        (onClose)="closeRenewalDetail()"
        containerClass="max-w-4xl"
      >
        @if (selectedRenewal(); as req) {
          <div class="space-y-5">
            <!-- Header: Request Type & Status Banner -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-lg font-bold text-slate-900">{{ req.resident_name }}</span>
                  <span class="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold">{{ req.resident_code || 'RESIDENT' }}</span>
                </div>
                <p class="text-xs text-slate-500 mt-1 font-medium">{{ req.service_name }} · Submitted on {{ formatSubmissionDate(req.request_date) }} at {{ formatSubmissionTime(req.request_date) }}</p>
              </div>
              <span [class]="'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ' + getRenewalStatusClass(req.status_id)">
                <span class="w-2 h-2 rounded-full" [class]="getRenewalStatusDotClass(req.status_id)"></span>
                {{ req.status_name }}
              </span>
            </div>

            <!-- Uploaded Verification Documents & 2x2 ID Photo -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.373L8.552 18.32a1.5 1.5 0 01-2.121-2.121L13.879 8.75" />
                </svg>
                Uploaded Verification Documents & ID Photo
              </h4>

              <!-- Uploaded 2x2 Photo Highlight Card -->
              @if (getPhotoRequirement(req.form_data, req); as photo) {
                <div class="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-orange-50/80 to-amber-50/40 border border-orange-200 text-xs">
                  <div class="flex items-center gap-4 min-w-0 pr-3">
                    <img
                      [src]="photo.url"
                      alt="Uploaded 2x2 ID Photo"
                      class="w-16 h-16 rounded-xl object-cover border-2 border-orange-300 shadow-xs shrink-0 cursor-pointer hover:scale-105 transition"
                      (click)="openImagePreview(photo.url, '2×2 ID Photo (White Background)')"
                    />
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-900 block truncate">2×2 ID Photo (White Background)</span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">New Upload</span>
                      </div>
                      <span class="text-slate-500 text-[11px] block truncate mt-0.5">{{ photo.original_name }}</span>
                      <p class="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                        <svg class="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                        </svg>
                        Will be embedded into the Barangay ID renewal card
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    (click)="openImagePreview(photo.url, '2×2 ID Photo (White Background)')"
                    class="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shrink-0 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    </svg>
                    <span>View Photo</span>
                  </button>
                </div>
              }

              <!-- Other Uploaded Requirement Documents List -->
              @if (getUploadedRequirements(req.form_data, req).length > 0) {
                <div class="space-y-2">
                  @for (doc of getUploadedRequirements(req.form_data, req); track doc.requirement_name) {
                    @if (!doc.requirement_name?.toLowerCase()?.includes('2x2') && !doc.requirement_name?.toLowerCase()?.includes('photo')) {
                      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div class="flex items-center gap-3 min-w-0 pr-3">
                          @if (isImageFile(doc)) {
                            <img [src]="resolveFileUrl(doc.file_url)" alt="Requirement" class="w-12 h-12 rounded-lg object-cover border border-slate-300 shadow-2xs shrink-0 cursor-pointer" (click)="openImagePreview(resolveFileUrl(doc.file_url), doc.requirement_name)" />
                          } @else {
                            <div class="w-10 h-10 rounded-lg bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center shrink-0">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                            </div>
                          }
                          <div class="min-w-0">
                            <span class="font-bold text-slate-900 block truncate">{{ doc.requirement_name }}</span>
                            <span class="text-slate-500 text-[11px] block truncate">{{ doc.original_name }}</span>
                          </div>
                        </div>
                        <a [href]="resolveFileUrl(doc.file_url)" target="_blank" class="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shrink-0 transition flex items-center gap-1.5 cursor-pointer">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          <span>Open File</span>
                        </a>
                      </div>
                    }
                  }
                </div>
              }
            </div>

            <!-- Barangay ID Template Preview & Verification Section -->
            <div class="p-4 bg-orange-50/50 border border-orange-200 rounded-2xl space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-orange-950 uppercase tracking-wide flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 9.5h8M7 12h8" stroke-linecap="round"/>
                    </svg>
                    Barangay ID Template Preview
                  </h4>
                  <p class="text-[11px] text-slate-500 mt-0.5">Generate and inspect the official Barangay ID card template with newly uploaded photo before approval.</p>
                </div>
                <button
                  type="button"
                  (click)="previewRenewalTemplate(req)"
                  [disabled]="previewing()"
                  class="px-4 py-2 bg-white hover:bg-orange-50 text-orange-700 font-bold text-xs border border-orange-300 rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>{{ previewing() ? 'Loading Preview...' : 'Preview Card Template' }}</span>
                </button>
              </div>
            </div>

            <!-- Action Controls (Depending on status) -->
            <div class="space-y-3 pt-2">
              @if (req.status_id === 1 || req.status_id === 4) {
                <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    [disabled]="renewalActionLoading()"
                    (click)="rejectRenewal(req)"
                    class="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    <span>Reject Request</span>
                  </button>
                  <button
                    type="button"
                    [disabled]="renewalActionLoading()"
                    (click)="approveRenewal(req)"
                    class="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span>Approve & Proceed to RFID</span>
                  </button>
                </div>
              }

              <!-- If Approved / Ready for Release: Link to RFID Registration -->
              @if (req.status_id === 6) {
                <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div class="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>Renewal Approved — Ready for physical RFID Card Registration</span>
                  </div>
                  <p class="text-xs text-emerald-800">
                    The renewal has been approved. The Admin can now register the resident's new RFID card UID below.
                  </p>
                  <div class="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      (click)="openRfidModalForRenewal(req)"
                      class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 9.5h8M7 12h8" stroke-linecap="round"/>
                      </svg>
                      <span>Open RFID Card Registration</span>
                    </button>
                    <button
                      type="button"
                      [disabled]="renewalActionLoading()"
                      (click)="updateRenewalStatus(7, 'ID card successfully claimed and released')"
                      class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      Mark Released / Claimed
                    </button>
                  </div>
                </div>
              }

              <!-- If Rejected: Display rejection message -->
              @if (req.status_id === 8) {
                <div class="p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <p class="text-xs font-bold text-rose-800">Renewal Request Rejected</p>
                  @if (req.remarks) {
                    <p class="text-xs text-rose-700 mt-1">Reason: {{ req.remarks }}</p>
                  }
                </div>
              }

              <!-- If Released: Display completed banner -->
              @if (req.status_id === 7) {
                <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  ✓ ID card has been issued and claimed by the resident.
                </div>
              }
            </div>
          </div>
        }
      </app-modal>

      <!-- ================= MODAL: RFID CARD REGISTRATION & ASSIGNMENT ================= -->
      <app-modal [open]="showRfidModal()" title="Register Physical RFID Card" (onClose)="closeRfidModal()" containerClass="max-w-2xl">
        @if (rfidResident(); as res) {
          <div class="space-y-4">
            <!-- Resident Header Card -->
            <div class="bg-[#fff9f3] border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
              <div class="flex items-center gap-3.5 min-w-0">
                <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-50 border-2 border-orange-500 p-0.5 shadow-xs flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                  @if (res.photo) {
                    <img [src]="imageUrl(res.photo)" alt="Photo" class="w-full h-full object-cover rounded-full" (error)="$any($event.target).style.display='none'">
                  } @else {
                    <div class="w-full h-full rounded-full bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center">
                      {{ getInitials(res.full_name || res.resident_name) }}
                    </div>
                  }
                </div>
                <div class="min-w-0">
                  <h3 class="text-base font-bold text-slate-900 leading-snug">{{ res.full_name || res.resident_name || 'Resident' }}</h3>
                  <p class="font-bold text-slate-600 text-xs mt-0.5 font-mono">{{ res.resident_code || res.application_number || 'ID Applicant' }}</p>
                  <div class="mt-0.5">
                    @if (res.card_uid) {
                      <span class="text-emerald-700 font-bold text-xs">Active Card: {{ res.card_uid }}</span>
                    } @else {
                      <span class="text-orange-600 font-bold text-xs">Pending RFID Registration</span>
                    }
                  </div>
                </div>
              </div>

              <div class="text-right flex flex-col items-end gap-1.5 shrink-0 pl-4 border-l border-orange-200">
                <span class="px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100/70 text-emerald-700 border border-emerald-200">
                  APPROVED
                </span>
                @if (res.application_number) {
                  <span class="text-[11px] text-slate-500 font-mono font-bold">{{ res.application_number }}</span>
                }
              </div>
            </div>

            <!-- RFID Input & Scanner Box -->
            <div class="bg-orange-50/50 border border-orange-200 rounded-xl p-4 space-y-3">
              <div class="flex items-center gap-2 text-orange-900 font-bold text-sm">
                <svg class="w-4 h-4 text-orange-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 9.5h8M7 12h8" stroke-linecap="round"/>
                </svg>
                <span>{{ res.card_uid ? 'Re-issue / Update RFID Card' : 'Register New RFID Card' }}</span>
              </div>
              <p class="text-xs text-slate-600">
                Tap the physical RFID card on the USB reader or type the UID manually to activate the Barangay ID.
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-bold text-slate-700">
                      Card UID <span class="text-rose-500">*</span>
                    </label>
                    @if (scanDetected()) {
                      <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                        <svg class="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        Auto-detected via USB Reader
                      </span>
                    } @else {
                      <span class="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <svg class="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                        Tap card or type UID
                      </span>
                    }
                  </div>
                  <div class="relative">
                    <input
                      type="text"
                      [value]="regCardUid()"
                      (input)="onCardUidInput($any($event.target).value)"
                      placeholder="e.g. 04A1B2C3D4"
                      [class]="'w-full h-10 px-3 pr-9 border rounded-lg text-sm font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 shadow-2xs transition ' + (uidStatus()?.type === 'duplicate' ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20' : (uidStatus()?.type === 'available' ? 'border-emerald-400 focus:ring-emerald-500 bg-emerald-50/20' : 'border-slate-300 focus:ring-orange-500'))"
                    />
                    @if (uidChecking()) {
                      <div class="absolute right-3 top-3">
                        <div class="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    } @else if (uidStatus()?.type === 'available') {
                      <div class="absolute right-3 top-2.5 text-emerald-600" title="Card UID is available">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </div>
                    } @else if (uidStatus()?.type === 'duplicate') {
                      <div class="absolute right-3 top-2.5 text-rose-500" title="Card UID already registered">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      </div>
                    }
                  </div>

                  @if (uidStatus()?.type === 'available') {
                    <p class="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                      <svg class="w-3 h-3 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                      {{ uidStatus()?.message }}
                    </p>
                  } @else if (uidStatus()?.type === 'duplicate') {
                    <p class="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                      <svg class="w-3 h-3 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      {{ uidStatus()?.message }}
                    </p>
                  }
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Expiration Date <span class="text-slate-400 font-normal">(Default 3 Years, Editable)</span></label>
                  <input
                    type="date"
                    [value]="regExpirationDate()"
                    (input)="regExpirationDate.set($any($event.target).value)"
                    class="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
                  />
                </div>
              </div>

              @if (regError() && uidStatus()?.type !== 'duplicate') {
                <p class="text-xs text-rose-600 font-medium flex items-center gap-1">
                  <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {{ regError() }}
                </p>
              }

              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  (click)="closeRfidModal()"
                  class="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  Skip / Register Later
                </button>
                <button
                  type="button"
                  (click)="registerRfidCard()"
                  [disabled]="registeringRfid() || !regCardUid() || uidStatus()?.type === 'duplicate'"
                  class="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-2xs transition disabled:opacity-50 cursor-pointer"
                >
                  @if (registeringRfid()) {
                    <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Registering...</span>
                  } @else {
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    <span>Confirm & Register Card</span>
                  }
                </button>
              </div>
            </div>
          </div>
        }
      </app-modal>

      <!-- ================= MODAL: APPROVE APPLICATION ================= -->
      <app-modal
        [open]="showActionConfirm() && pendingAction() === 'approve'"
        title="Approve Barangay ID Application"
        (onClose)="showActionConfirm.set(false)"
        containerClass="max-w-md"
      >
        @if (selected(); as app) {
          <div class="space-y-4">
            <!-- Resident & Application Summary Card -->
            <div class="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-lg">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-mono font-bold text-orange-800">{{ app.application_number }}</p>
                <h4 class="text-sm font-bold text-slate-900 truncate">{{ app.full_name }}</h4>
                <p class="text-[11px] text-slate-500">{{ app.contact_number || app.email || 'Resident Applicant' }}</p>
              </div>
            </div>

            <!-- Workflow explanation -->
            <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <p class="text-xs font-bold text-slate-800">What happens after approval:</p>
              <ul class="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Creates / activates permanent resident record in the system.</li>
                <li>Generates official Barangay ID document and assigns ID number.</li>
                <li>Proceeds directly to physical RFID Card Registration.</li>
              </ul>
            </div>

            <!-- Optional Remarks -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Remarks (Optional)</label>
              <textarea
                [value]="remarks()"
                (input)="remarks.set($any($event.target).value)"
                rows="2"
                class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Add any internal approval remarks..."></textarea>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                (click)="showActionConfirm.set(false)"
                [disabled]="saving()"
                class="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmAction()"
                [disabled]="saving()"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition cursor-pointer disabled:opacity-50">
                @if (saving()) {
                  <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Approving...</span>
                } @else {
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                  <span>Approve Application</span>
                }
              </button>
            </div>
          </div>
        }
      </app-modal>

      <!-- ================= MODAL: REJECT APPLICATION ================= -->
      <app-modal
        [open]="showActionConfirm() && pendingAction() === 'reject'"
        title="Reject Barangay ID Application"
        (onClose)="showActionConfirm.set(false)"
        containerClass="max-w-md"
      >
        @if (selected(); as app) {
          <div class="space-y-4">
            <div class="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-mono font-bold text-rose-800">{{ app.application_number }}</p>
                <h4 class="text-sm font-bold text-slate-900 truncate">{{ app.full_name }}</h4>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Rejection Reason *</label>
              <textarea
                [value]="remarks()"
                (input)="remarks.set($any($event.target).value)"
                rows="3"
                class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="State the reason why this application is being rejected..."></textarea>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                (click)="showActionConfirm.set(false)"
                [disabled]="saving()"
                class="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmAction()"
                [disabled]="saving()"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-2xs transition cursor-pointer disabled:opacity-50">
                @if (saving()) {
                  <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Rejecting...</span>
                } @else {
                  <span>Reject Application</span>
                }
              </button>
            </div>
          </div>
        }
      </app-modal>

      <!-- ================= MODAL: MARK AS RELEASED ================= -->
      <app-modal
        [open]="showReleaseConfirm()"
        title="Mark Barangay ID as Released"
        (onClose)="cancelReleaseConfirm()"
        containerClass="max-w-md"
      >
        @if (releasingApp(); as app) {
          <div class="space-y-4">
            <div class="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-lg">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-mono font-bold text-emerald-800">{{ app.application_number }}</p>
                <h4 class="text-sm font-bold text-slate-900 truncate">{{ app.full_name }}</h4>
                <p class="text-xs font-mono text-slate-600 mt-0.5">Card UID: {{ app.card_uid || 'Registered' }}</p>
              </div>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              This confirms the physical Barangay ID card has been issued to the resident and removes their entry from the public Status Display.
            </p>

            <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                (click)="cancelReleaseConfirm()"
                [disabled]="releasing()"
                class="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmReleaseAction()"
                [disabled]="releasing()"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition cursor-pointer disabled:opacity-50">
                @if (releasing()) {
                  <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Releasing...</span>
                } @else {
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                  <span>Mark as Released</span>
                }
              </button>
            </div>
          </div>
        }
      </app-modal>

      <!-- ================= MODAL: APPROVE ID RENEWAL ================= -->
      <app-modal
        [open]="showRenewalApproveModal()"
        title="Approve ID Renewal Request"
        (onClose)="showRenewalApproveModal.set(false)"
        containerClass="max-w-md"
      >
        @if (targetRenewal(); as req) {
          <div class="space-y-4">
            <div class="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-mono font-bold text-orange-800">{{ req.request_number }}</p>
                <h4 class="text-sm font-bold text-slate-900 truncate">{{ req.resident_name }}</h4>
                <p class="text-[11px] text-slate-500">Barangay ID Renewal Request</p>
              </div>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              Once approved, you will proceed directly to physical RFID Card Registration to assign the new card.
            </p>

            <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                (click)="showRenewalApproveModal.set(false)"
                [disabled]="renewalActionLoading()"
                class="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmApproveRenewalAction()"
                [disabled]="renewalActionLoading()"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition cursor-pointer disabled:opacity-50">
                @if (renewalActionLoading()) {
                  <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Approving...</span>
                } @else {
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                  <span>Approve Renewal</span>
                }
              </button>
            </div>
          </div>
        }
      </app-modal>

      <!-- ================= MODAL: REJECT ID RENEWAL ================= -->
      <app-modal
        [open]="showRenewalRejectModal()"
        title="Reject ID Renewal Request"
        (onClose)="showRenewalRejectModal.set(false)"
        containerClass="max-w-md"
      >
        @if (targetRenewal(); as req) {
          <div class="space-y-4">
            <div class="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-mono font-bold text-rose-800">{{ req.request_number }}</p>
                <h4 class="text-sm font-bold text-slate-900 truncate">{{ req.resident_name }}</h4>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Rejection Reason *</label>
              <textarea
                [value]="renewalRejectionReason()"
                (input)="renewalRejectionReason.set($any($event.target).value)"
                rows="3"
                class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="State the reason for rejecting this renewal..."></textarea>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                (click)="showRenewalRejectModal.set(false)"
                [disabled]="renewalActionLoading()"
                class="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmRejectRenewalAction()"
                [disabled]="renewalActionLoading()"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-2xs transition cursor-pointer disabled:opacity-50">
                @if (renewalActionLoading()) {
                  <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Rejecting...</span>
                } @else {
                  <span>Reject Renewal</span>
                }
              </button>
            </div>
          </div>
        }
      </app-modal>

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

      <!-- Lightbox Image Preview Modal -->
      <app-modal [open]="previewImageModal()" [title]="previewImageTitle()" (onClose)="closeImagePreview()" containerClass="max-w-3xl">
        <div class="space-y-3">
          <!-- Zoom Controls Header -->
          <div class="flex items-center justify-between px-2 py-1 bg-slate-100 rounded-xl border border-slate-200">
            <span class="text-xs font-bold text-slate-700">Zoom: {{ imageZoomPercent() }}</span>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                (click)="zoomOutImage()"
                class="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer">
                -
              </button>
              <button
                type="button"
                (click)="resetImageZoom()"
                class="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer">
                Reset
              </button>
              <button
                type="button"
                (click)="zoomInImage()"
                class="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer">
                +
              </button>
            </div>
          </div>

          <!-- Image Container with Pan / Scrollable Zoom Box -->
          <div class="w-full h-[60vh] max-h-[550px] flex items-center justify-center bg-slate-950/5 rounded-2xl p-4 border border-slate-200/80 overflow-auto">
            <div class="min-w-full min-h-full flex items-center justify-center transition-transform duration-150 origin-center" [style.transform]="'scale(' + imageZoom() + ')'">
              <img
                [src]="previewImageUrl()"
                [alt]="previewImageTitle()"
                class="max-h-[50vh] max-w-full object-contain rounded-lg shadow-sm select-none"
              />
            </div>
          </div>

          <!-- Footer with Close button only -->
          <div class="flex items-center justify-end w-full pt-1">
            <button
              type="button"
              (click)="closeImagePreview()"
              class="px-5 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </app-modal>
    </div>
  `
})
export class ApplicationsComponent implements OnInit, OnDestroy, AfterViewChecked {
  activeTab = signal<'applications' | 'renewals'>('applications');

  // --- Tab 1: New ID Applications State ---
  applications = signal<ApplicationRow[]>([]);
  loading = signal(true);
  search = signal('');
  statusFilter = signal('');
  page = signal(1);
  limit = 10;
  applicationsTotal = signal(0);
  sortColumn = signal('application_id');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  selected = signal<ApplicationRow | null>(null);
  showDetail = signal(false);
  remarks = signal('');
  saving = signal(false);

  showActionConfirm = signal(false);
  pendingAction = signal<'approve' | 'reject' | null>(null);

  // --- Release Confirmation Modal State ---
  showReleaseConfirm = signal(false);
  releasingApp = signal<ApplicationRow | null>(null);

  // --- Renewal Confirmation States ---
  showRenewalApproveModal = signal(false);
  showRenewalRejectModal = signal(false);
  targetRenewal = signal<DocumentRequest | null>(null);
  renewalRejectionReason = signal('');

  // --- RFID Registration Modal & Scanner State ---
  showRfidModal = signal(false);
  rfidResident = signal<any | null>(null);
  rfidRequestId = signal<number | null>(null);
  regCardUid = signal('');
  regExpirationDate = signal(this.computeDefaultExpiry());
  scanDetected = signal(false);
  uidChecking = signal(false);
  uidStatus = signal<{ type: 'available' | 'duplicate' | 'invalid' | 'self'; message: string } | null>(null);
  regError = signal('');
  registeringRfid = signal(false);

  private uidCheckTimer: any = null;
  private scanDetectedTimer: any = null;
  private scanBuffer: string = '';
  private lastKeyTime: number = 0;
  private readonly MAX_KEY_INTERVAL_MS = 65;

  // --- Image Lightbox & Document Preview State ---
  previewImageModal = signal(false);
  previewImageUrl = signal<string>('');
  previewImageTitle = signal<string>('');

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
  releasing = signal(false);

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'RELEASED', label: 'Released' },
    { value: 'RETURNED', label: 'Returned' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  datePreset = signal('');
  dateFrom = signal('');
  dateTo = signal('');

  columns: TableColumn[] = [
    { key: 'application_number', label: 'APPLICATION #', sortable: true },
    { key: 'full_name', label: 'APPLICANT', sortable: true },
    { key: 'contact_info', label: 'CONTACT', sortable: false },
    { key: 'created_at', label: 'DATE SUBMITTED', sortable: true },
    { key: 'status', label: 'STATUS', sortable: true }
  ];

  // --- Tab 2: Renewals & Replacements State ---
  renewals = signal<DocumentRequest[]>([]);
  renewalsLoading = signal(false);
  renewalsTotal = signal(0);
  renewalSearch = signal('');
  renewalServiceFilter = signal('');
  renewalStatusFilter = signal('');
  renewalPage = signal(1);
  renewalLimit = 10;
  renewalSortColumn = signal('request_id');
  renewalSortDirection = signal<'ASC' | 'DESC'>('DESC');

  selectedRenewal = signal<DocumentRequest | null>(null);
  showRenewalDetail = signal(false);
  renewalActionLoading = signal(false);

  renewalColumns: TableColumn[] = [
    { key: 'request_number', label: 'REQUEST #', sortable: true },
    { key: 'resident_name', label: 'RESIDENT', sortable: true },
    { key: 'service_name', label: 'SERVICE TYPE', sortable: true },
    { key: 'request_date', label: 'DATE SUBMITTED', sortable: true },
    { key: 'status_id', label: 'STATUS', sortable: true },
    { key: 'actions', label: 'ACTIONS', sortable: false }
  ];

  renewalStatusOptions = [
    { value: '', label: 'All Statuses' },
    { value: '1', label: 'Submitted' },
    { value: '4', label: 'Under Review' },
    { value: '6', label: 'Approved (Ready for RFID)' },
    { value: '7', label: 'Released' },
    { value: '8', label: 'Rejected' }
  ];

  private sseSubscription: any = null;
  readonly assetBase = environment.apiUrl.replace(/\/api\/v1$/, '');

  computeDefaultExpiry(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  constructor(
    private applicationService: ApplicationService,
    private requestService: RequestService,
    private documentService: DocumentService,
    private notificationService: NotificationService,
    private serviceService: ServiceService,
    private rfidService: RfidService,
    private residentService: ResidentService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadApplications();
    this.loadRenewals();
    this.connectToUpdates();
    this.loadBarangayIdService();
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab.set(params['tab'] === 'renewals' ? 'renewals' : 'applications');
      }
      if (params['applicationId']) {
        const appId = parseInt(params['applicationId'], 10);
        if (appId) {
          this.activeTab.set('applications');
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
      } else if (params['requestId']) {
        const reqId = parseInt(params['requestId'], 10);
        if (reqId) {
          this.activeTab.set('renewals');
          this.requestService.getById(reqId).subscribe({
            next: (res) => {
              if (res.data) {
                this.openRenewalDetail(res.data);
              }
            }
          });
        }
        this.router.navigate([], { queryParams: { requestId: null }, queryParamsHandling: 'merge' });
      } else if (params['residentId']) {
        const resId = parseInt(params['residentId'], 10);
        if (resId) {
          this.residentService.getById(resId).subscribe({
            next: (res) => {
              if (res.data) {
                this.openRfidModalForApplication(res.data);
              }
            }
          });
        }
        this.router.navigate([], { queryParams: { residentId: null }, queryParamsHandling: 'merge' });
      }
    });
  }

  ngOnDestroy() {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
    }
  }

  setTab(tab: 'applications' | 'renewals') {
    this.activeTab.set(tab);
  }

  ngAfterViewChecked() {
    if (this.previewContainer && (this.cardPreviewBlob() || this.cardPreviewUrl())) {
      const container = this.previewContainer.nativeElement;
      const blob = this.cardPreviewBlob();
      const url = this.cardPreviewUrl();

      if (blob && this.renderedBlobKey === blob) return;
      if (url && this.renderedUrlKey === url) return;

      this.renderedBlobKey = blob;
      this.renderedUrlKey = url;
      container.innerHTML = '';

      setTimeout(() => {
        if (blob) {
          const isPdf = blob.type === 'application/pdf';
          if (isPdf) {
            const objectUrl = URL.createObjectURL(blob);
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '60vh';
            iframe.style.minHeight = '450px';
            iframe.style.border = '0';
            iframe.src = objectUrl;
            container.appendChild(iframe);
          } else {
            renderAsync(blob, container, undefined, { inWrapper: false, ignoreWidth: false }).catch(err => {
              console.error('docx preview render failed:', err);
              container.innerHTML = '<div class="p-6 text-center text-red-500 text-xs font-semibold">Failed to render live document preview.</div>';
            });
          }
        } else if (url) {
          const isPdf = url.toLowerCase().endsWith('.pdf');
          if (isPdf) {
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '60vh';
            iframe.style.minHeight = '450px';
            iframe.style.border = '0';
            iframe.src = url;
            container.appendChild(iframe);
          } else {
            const img = document.createElement('img');
            img.src = url;
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
      if (event?.type?.startsWith('application-') || event?.type?.startsWith('rfid-')) {
        this.loadApplications();
      }
      if (event?.type?.startsWith('request-')) {
        this.loadRenewals();
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
        this.applicationsTotal.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadRenewals() {
    this.renewalsLoading.set(true);
    this.requestService.getAll({
      search: this.renewalSearch() || undefined,
      serviceName: this.renewalServiceFilter() || undefined,
      statusId: this.renewalStatusFilter() ? parseInt(this.renewalStatusFilter()) : undefined,
      idServicesOnly: true,
      page: this.renewalPage(),
      limit: this.renewalLimit,
      sortBy: this.renewalSortColumn(),
      sortOrder: this.renewalSortDirection()
    }).subscribe({
      next: (res) => {
        this.renewals.set(res.data || []);
        this.renewalsTotal.set(res.pagination?.total || 0);
        this.renewalsLoading.set(false);
      },
      error: () => this.renewalsLoading.set(false)
    });
  }

  private fullName(app: any): string {
    if (!app) return '-';
    if (app.last_name && app.first_name) {
      const mid = app.middle_name ? ` ${app.middle_name}` : '';
      const sfx = app.suffix ? ` ${app.suffix}` : '';
      return `${app.last_name}, ${app.first_name}${mid}${sfx}`;
    }
    return app.full_name || app.resident_name || app.first_name || app.last_name || '-';
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

    // Fetch fresh record from backend by application_id so latest RFID card UID, status, etc. are loaded immediately
    this.applicationService.getById(row.application_id).subscribe({
      next: (res) => {
        if (res.data) {
          const fresh = res.data as BarangayIdApplication;
          this.selected.set({
            ...fresh,
            full_name: this.fullName(fresh)
          });
        }
      }
    });
  }

  closeDetail() {
    this.showDetail.set(false);
    this.selected.set(null);
    this.closePreviewPane();
  }

  // --- RFID Modal & Scanner Logic ---
  @HostListener('window:keydown', ['$event'])
  onWindowKeyDown(event: KeyboardEvent) {
    if (!this.showRfidModal()) return;

    const currentTime = Date.now();
    const key = event.key;

    if (key === 'Enter') {
      const buffer = this.scanBuffer.trim();
      const timeSinceLastKey = currentTime - this.lastKeyTime;

      if (buffer.length >= 4 && buffer.length <= 32 && timeSinceLastKey <= 150) {
        event.preventDefault();
        event.stopPropagation();
        this.processScannedUid(buffer);
      }
      this.scanBuffer = '';
      this.lastKeyTime = 0;
      return;
    }

    if (key.length !== 1) {
      if (this.lastKeyTime > 0 && currentTime - this.lastKeyTime > this.MAX_KEY_INTERVAL_MS) {
        this.scanBuffer = '';
        this.lastKeyTime = 0;
      }
      return;
    }

    if (this.lastKeyTime > 0 && (currentTime - this.lastKeyTime) > this.MAX_KEY_INTERVAL_MS) {
      this.scanBuffer = key;
    } else {
      this.scanBuffer += key;
    }
    this.lastKeyTime = currentTime;
  }

  processScannedUid(rawUid: string) {
    const cleanUid = rawUid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!cleanUid) return;

    this.regCardUid.set(cleanUid);
    this.scanDetected.set(true);
    if (this.scanDetectedTimer) clearTimeout(this.scanDetectedTimer);
    this.scanDetectedTimer = setTimeout(() => this.scanDetected.set(false), 4000);

    this.validateCardUid(cleanUid);
  }

  onCardUidInput(value: string) {
    const clean = value.trim().toUpperCase();
    this.regCardUid.set(clean);
    this.regError.set('');
    if (this.uidCheckTimer) clearTimeout(this.uidCheckTimer);

    if (!clean) {
      this.uidStatus.set(null);
      return;
    }

    this.uidCheckTimer = setTimeout(() => {
      this.validateCardUid(clean);
    }, 300);
  }

  validateCardUid(uid: string) {
    const cleanUid = uid.trim().toUpperCase();
    if (!cleanUid) {
      this.uidStatus.set(null);
      return;
    }
    if (cleanUid.length < 4) {
      this.uidStatus.set({ type: 'invalid', message: 'Card UID must be at least 4 characters.' });
      return;
    }

    this.uidChecking.set(true);
    this.rfidService.getByUid(cleanUid).subscribe({
      next: (res) => {
        this.uidChecking.set(false);
        if (res?.data?.resident) {
          const r = res.data.resident;
          const resName = `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.resident_name || 'Resident';
          const resCode = r.resident_code || `RES-${r.resident_id}`;
          const currentRes = this.rfidResident();
          if (currentRes && (currentRes.resident_id === r.resident_id || currentRes.id === r.resident_id)) {
            this.uidStatus.set({ type: 'self', message: 'This card is currently linked to this resident.' });
            this.regError.set('');
          } else {
            this.uidStatus.set({ type: 'duplicate', message: `Already assigned to ${resName} (${resCode})` });
            this.regError.set(`Card UID is already assigned to ${resName} (${resCode}). Please use a different card.`);
          }
        } else {
          this.uidStatus.set({ type: 'available', message: 'Card UID is available for registration.' });
          this.regError.set('');
        }
      },
      error: (err) => {
        this.uidChecking.set(false);
        if (err.status === 404) {
          this.uidStatus.set({ type: 'available', message: 'Card UID is available for registration.' });
          this.regError.set('');
        } else {
          this.uidStatus.set(null);
        }
      }
    });
  }

  openRfidModalForApplication(app: any) {
    this.rfidResident.set({
      resident_id: app.resident_id,
      full_name: app.full_name || `${app.first_name || ''} ${app.last_name || ''}`.trim() || app.resident_name,
      resident_code: app.resident_code,
      application_number: app.application_number,
      photo: app.photo,
      card_uid: app.card_uid,
      rfid_status: app.rfid_status,
      application_id: app.application_id
    });
    this.rfidRequestId.set(null);
    this.regCardUid.set(app.card_uid || '');
    this.regExpirationDate.set(app.rfid_expiration_date ? app.rfid_expiration_date.split('T')[0] : this.computeDefaultExpiry());
    this.regError.set('');
    this.scanDetected.set(false);
    this.uidStatus.set(null);
    this.uidChecking.set(false);
    this.scanBuffer = '';
    this.lastKeyTime = 0;
    this.showRfidModal.set(true);
  }

  openRfidModalForRenewal(req: DocumentRequest) {
    this.rfidResident.set({
      resident_id: req.resident_id,
      full_name: req.resident_name,
      resident_code: req.resident_code,
      application_number: req.request_number,
      photo: req.form_data ? (req.form_data as any).photo : null,
      isRenewal: true
    });
    this.rfidRequestId.set(req.request_id);
    this.regCardUid.set('');
    this.regExpirationDate.set(this.computeDefaultExpiry());
    this.regError.set('');
    this.scanDetected.set(false);
    this.uidStatus.set(null);
    this.uidChecking.set(false);
    this.scanBuffer = '';
    this.lastKeyTime = 0;
    this.showRfidModal.set(true);
  }

  closeRfidModal() {
    this.showRfidModal.set(false);
    this.rfidResident.set(null);
    this.rfidRequestId.set(null);
    this.regCardUid.set('');
    this.regExpirationDate.set(this.computeDefaultExpiry());
    this.regError.set('');
    this.scanDetected.set(false);
    this.uidStatus.set(null);
    this.uidChecking.set(false);
    this.scanBuffer = '';
    this.lastKeyTime = 0;
  }

  registerRfidCard() {
    const res = this.rfidResident();
    const cardUid = this.regCardUid().trim();
    if (!res || !cardUid) {
      this.regError.set('Card UID is required.');
      return;
    }
    if (this.uidStatus()?.type === 'duplicate') {
      this.regError.set('Please provide an available RFID card UID.');
      return;
    }

    const residentId = res.resident_id || res.id;
    if (!residentId) {
      this.regError.set('Missing resident identification.');
      return;
    }

    this.registeringRfid.set(true);
    this.regError.set('');

    this.rfidService.register({
      residentId,
      cardUid,
      expirationDate: this.regExpirationDate() || undefined,
      requestId: this.rfidRequestId() || undefined
    }).subscribe({
      next: (resp) => {
        this.registeringRfid.set(false);
        this.toast.success('RFID Card Registered', `Card UID ${cardUid} registered successfully to ${res.full_name}!`);
        this.closeRfidModal();

        // Update application in table signal immediately
        this.applications.update(apps =>
          apps.map(a => {
            if (a.resident_id === residentId || a.application_id === res.application_id) {
              return {
                ...a,
                card_uid: cardUid,
                rfid_status: 'ACTIVE',
                rfid_expiration_date: this.regExpirationDate(),
                rfid_issued_date: new Date().toISOString()
              };
            }
            return a;
          })
        );

        // Update currently opened application modal if same
        const curApp = this.selected();
        if (curApp && (curApp.resident_id === residentId || curApp.application_id === res.application_id)) {
          this.selected.set({
            ...curApp,
            card_uid: cardUid,
            rfid_status: 'ACTIVE',
            rfid_expiration_date: this.regExpirationDate(),
            rfid_issued_date: new Date().toISOString()
          });
        }

        this.loadApplications();
        this.loadRenewals();
      },
      error: (err) => {
        this.registeringRfid.set(false);
        const msg = err.error?.message || 'Failed to register RFID card.';
        this.regError.set(msg);
        this.toast.error('Registration Failed', msg);
      }
    });
  }

  // --- Renewal Handlers ---
  onRenewalSearch(value: string) {
    this.renewalSearch.set(value);
    this.renewalPage.set(1);
    this.loadRenewals();
  }

  onRenewalServiceFilter(value: string) {
    this.renewalServiceFilter.set(value);
    this.renewalPage.set(1);
    this.loadRenewals();
  }

  onRenewalStatusFilter(value: string) {
    this.renewalStatusFilter.set(value);
    this.renewalPage.set(1);
    this.loadRenewals();
  }

  onRenewalSort(column: string) {
    if (this.renewalSortColumn() === column) {
      this.renewalSortDirection.set(this.renewalSortDirection() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.renewalSortColumn.set(column);
      this.renewalSortDirection.set('ASC');
    }
    this.loadRenewals();
  }

  onRenewalPageChange(page: number) {
    this.renewalPage.set(page);
    this.loadRenewals();
  }

  onRenewalLimitChange(limit: number) {
    this.renewalLimit = limit;
    this.renewalPage.set(1);
    this.loadRenewals();
  }

  hasRenewalActiveFilters(): boolean {
    return !!(this.renewalSearch() || this.renewalServiceFilter() || this.renewalStatusFilter());
  }

  resetRenewalFilters() {
    this.renewalSearch.set('');
    this.renewalServiceFilter.set('');
    this.renewalStatusFilter.set('');
    this.renewalPage.set(1);
    this.loadRenewals();
  }

  openRenewalDetail(req: DocumentRequest) {
    this.selectedRenewal.set(req);
    this.showRenewalDetail.set(true);
  }

  closeRenewalDetail() {
    this.showRenewalDetail.set(false);
    this.selectedRenewal.set(null);
  }

  updateRenewalStatus(statusId: number, remarks: string) {
    const req = this.selectedRenewal();
    if (!req) return;
    this.renewalActionLoading.set(true);
    this.requestService.changeStatus(req.request_id, statusId, remarks).subscribe({
      next: () => {
        this.renewalActionLoading.set(false);
        this.toast.success('Status updated successfully.');
        this.loadRenewals();
        this.requestService.getById(req.request_id).subscribe({
          next: (res) => {
            if (res.data) this.selectedRenewal.set(res.data);
          }
        });
      },
      error: (err) => {
        this.renewalActionLoading.set(false);
        this.toast.error(err.error?.message || 'Failed to update status.');
      }
    });
  }

  approveRenewal(req: DocumentRequest) {
    if (this.renewalActionLoading()) return;
    this.targetRenewal.set(req);
    this.showRenewalApproveModal.set(true);
  }

  confirmApproveRenewalAction() {
    const req = this.targetRenewal();
    if (!req || this.renewalActionLoading()) return;

    this.renewalActionLoading.set(true);
    this.requestService.changeStatus(req.request_id, 6, 'Barangay ID Renewal approved and ready for RFID Card Registration.').subscribe({
      next: () => {
        this.renewalActionLoading.set(false);
        this.showRenewalApproveModal.set(false);
        this.toast.success('ID Renewal approved! Opening RFID Registration...');
        this.loadRenewals();
        this.closeRenewalDetail();
        this.openRfidModalForRenewal(req);
      },
      error: (err) => {
        this.renewalActionLoading.set(false);
        this.toast.error(err?.error?.message || 'Failed to approve ID renewal request.');
      }
    });
  }

  rejectRenewal(req: DocumentRequest) {
    if (this.renewalActionLoading()) return;
    this.targetRenewal.set(req);
    this.renewalRejectionReason.set('');
    this.showRenewalRejectModal.set(true);
  }

  confirmRejectRenewalAction() {
    const req = this.targetRenewal();
    const reason = this.renewalRejectionReason().trim();
    if (!req || this.renewalActionLoading()) return;

    if (!reason) {
      this.toast.warning('A rejection reason is required.');
      return;
    }

    this.renewalActionLoading.set(true);
    this.requestService.reject(req.request_id, reason).subscribe({
      next: () => {
        this.renewalActionLoading.set(false);
        this.showRenewalRejectModal.set(false);
        this.toast.success('ID Renewal request rejected.');
        this.loadRenewals();
        if (this.selectedRenewal()?.request_id === req.request_id) {
          this.requestService.getById(req.request_id).subscribe({
            next: (res) => { if (res.data) this.selectedRenewal.set(res.data); }
          });
        }
      },
      error: (err) => {
        this.renewalActionLoading.set(false);
        this.toast.error(err?.error?.message || 'Failed to reject ID renewal request.');
      }
    });
  }

  previewRenewalTemplate(req: DocumentRequest) {
    if (this.previewing()) return;
    this.previewing.set(true);
    this.cardPreviewBlob.set(null);
    this.requestService.previewBlob(req.request_id).subscribe({
      next: (blob) => {
        this.previewing.set(false);
        this.cardPreviewTitle.set(`${req.resident_name} — Barangay ID Renewal (Template Preview)`);
        this.cardPreviewBlob.set(blob);
        this.cardPreviewUrl.set(null);
        this.showCardPreview.set(true);
      },
      error: (err: any) => {
        this.previewing.set(false);
        let msg = 'Could not render the ID renewal template preview.';
        if (err?.error instanceof Blob) {
          err.error.text().then((text: string) => {
            try {
              const parsed = JSON.parse(text);
              msg = parsed?.message || msg;
            } catch { /* ignore */ }
            this.toast.error(msg);
          });
        } else {
          this.toast.error(err?.error?.message || msg);
        }
      }
    });
  }

  getRenewalStatusClass(statusId: number): string {
    switch (statusId) {
      case 1: return 'bg-blue-50 text-blue-700 border-blue-200';
      case 4: return 'bg-orange-50 text-orange-700 border-orange-200';
      case 5: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 6: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 7: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 8: return 'bg-rose-50 text-rose-700 border-rose-200';
      case 10: return 'bg-amber-50 text-amber-800 border-amber-200';
      case 11: return 'bg-purple-50 text-purple-800 border-purple-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  getRenewalStatusDotClass(statusId: number): string {
    switch (statusId) {
      case 1: return 'bg-blue-500';
      case 4: return 'bg-orange-500';
      case 5: return 'bg-indigo-500';
      case 6: return 'bg-emerald-500';
      case 7: return 'bg-emerald-500';
      case 8: return 'bg-rose-500';
      case 10: return 'bg-amber-500';
      case 11: return 'bg-purple-500';
      default: return 'bg-slate-400';
    }
  }

  getUploadedRequirements(formData: any, req?: any): UploadedRequirement[] {
    if (!formData && !req) return [];
    const files = formData?._requirements || formData?._uploaded_requirements || formData?._uploaded_files || formData?.requirements || req?.requirements || [];
    if (Array.isArray(files)) return files;
    return [];
  }

  getPhotoRequirement(formData: any, req?: any): { url: string; original_name?: string } | null {
    if (!formData && !req) return null;
    if (formData?._photo) return { url: this.resolveFileUrl(formData._photo), original_name: 'Uploaded 2×2 ID Photo' };
    if (formData?.photo) return { url: this.resolveFileUrl(formData.photo), original_name: 'Uploaded 2×2 ID Photo' };
    if (req?.photo_path) return { url: this.resolveFileUrl(req.photo_path), original_name: '2×2 ID Photo' };

    const reqs = this.getUploadedRequirements(formData, req);
    const match = reqs.find(r => {
      const name = (r.requirement_name || '').toLowerCase();
      return name.includes('2x2') || name.includes('photo') || name.includes('picture') || name.includes('portrait');
    });
    if (match) {
      return { url: this.resolveFileUrl(match.file_url), original_name: match.original_name || match.requirement_name };
    }
    const photoMatch = reqs.find(r => (r.file_url || '').toLowerCase().includes('resident-photos'));
    if (photoMatch) {
      return { url: this.resolveFileUrl(photoMatch.file_url), original_name: photoMatch.original_name || photoMatch.requirement_name };
    }
    return null;
  }

  isImageFile(doc: UploadedRequirement): boolean {
    if (!doc) return false;
    const mime = (doc.mime_type || '').toLowerCase();
    const url = (doc.file_url || '').toLowerCase();
    return mime.startsWith('image/') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.webp');
  }

  resolveFileUrl(fileUrl: string): string {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('data:')) {
      return fileUrl;
    }
    const clean = fileUrl.replace(/^\/+/, '');
    return `${this.assetBase}/${clean}`;
  }

  // --- Image Lightbox Helpers ---
  imageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const clean = path.replace(/^\/+/, '');
    if (clean.startsWith('uploads/')) {
      return `${this.assetBase}/${clean}`;
    }
    return `${this.assetBase}/uploads/${clean}`;
  }

  imageZoom = signal(1);

  imageZoomPercent(): string {
    return Math.round(this.imageZoom() * 100) + '%';
  }

  zoomInImage() {
    this.imageZoom.set(Math.min(4, Math.round((this.imageZoom() + 0.25) * 100) / 100));
  }

  zoomOutImage() {
    this.imageZoom.set(Math.max(0.5, Math.round((this.imageZoom() - 0.25) * 100) / 100));
  }

  resetImageZoom() {
    this.imageZoom.set(1);
  }

  openImagePreview(url: string, title: string) {
    if (!url) return;
    this.imageZoom.set(1);
    this.previewImageUrl.set(url);
    this.previewImageTitle.set(title);
    this.previewImageModal.set(true);
  }

  closeImagePreview() {
    this.previewImageModal.set(false);
    this.previewImageUrl.set('');
    this.previewImageTitle.set('');
    this.imageZoom.set(1);
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
      case 'APPROVED': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'RELEASED': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'RETURNED': return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'REJECTED': return 'bg-red-50 text-red-800 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  statusDotClass(status: string): string {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PENDING': return 'bg-amber-500';
      case 'APPROVED': return 'bg-blue-500';
      case 'RELEASED': return 'bg-emerald-500';
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
      case 'RELEASED': return 'Released';
      case 'RETURNED': return 'Returned';
      case 'REJECTED': return 'Rejected';
      default: return status || 'Unknown';
    }
  }

  promptMarkAsReleased(app: ApplicationRow) {
    if (!app || this.releasing()) return;
    this.releasingApp.set(app);
    this.showReleaseConfirm.set(true);
  }

  cancelReleaseConfirm() {
    this.showReleaseConfirm.set(false);
    this.releasingApp.set(null);
  }

  confirmReleaseAction() {
    const app = this.releasingApp();
    if (!app || this.releasing()) return;

    this.releasing.set(true);
    this.applicationService.release(app.application_id).subscribe({
      next: (res) => {
        this.releasing.set(false);
        this.showReleaseConfirm.set(false);
        this.releasingApp.set(null);
        this.toast.success('Application Released', `Application ${app.application_number} has been marked as Released!`);

        const updated = res?.data || {};
        if (this.selected()?.application_id === app.application_id) {
          this.selected.set({
            ...this.selected()!,
            ...updated,
            status: 'RELEASED',
            released_at: updated.released_at || new Date().toISOString()
          });
        }

        this.applications.update(apps =>
          apps.map(a => a.application_id === app.application_id ? { ...a, status: 'RELEASED', released_at: new Date().toISOString() } : a)
        );

        this.loadApplications();
      },
      error: (err) => {
        this.releasing.set(false);
        this.toast.error('Release Failed', err?.error?.message || 'Failed to mark application as released.');
      }
    });
  }

  markAsReleased(app: ApplicationRow) {
    this.promptMarkAsReleased(app);
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
      return `Approve application ${app.application_number} for ${app.full_name}? A permanent resident record will be created, an official Barangay ID number assigned, and you will proceed directly to physical RFID Card registration.`;
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
            this.toast.error('Preview Error', msg);
          });
        } else {
          this.toast.error('Preview Error', err?.error?.message || msg);
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
      next: (res: any) => {
        this.saving.set(false);
        this.showActionConfirm.set(false);

        if (action === 'approve') {
          this.toast.success('Application Approved', `Application ${app.application_number} approved! Opening RFID Card Registration...`);
          this.loadApplications();
          this.closeDetail();

          // Automatically open the RFID Card Registration modal for this resident!
          const approvedApp = res?.data?.application || app;
          const resObj = res?.data?.resident;
          const residentId = resObj?.resident_id || approvedApp?.resident_id || app.resident_id;

          this.openRfidModalForApplication({
            ...app,
            ...approvedApp,
            resident_id: residentId,
            resident_code: resObj?.resident_code || app.resident_code
          });
        } else {
          this.toast.success('Application Rejected', `Application ${app.application_number} has been rejected.`);
          this.closeDetail();
          this.loadApplications();
        }
      },
      error: (err: any) => {
        this.saving.set(false);
        this.showActionConfirm.set(false);
        this.toast.error('Action Failed', err.error?.message || 'Action failed.');
      }
    });
  }

  loadBarangayIdService() {
    this.serviceService.getAll().subscribe({
      next: (res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        const found = list.find((s: any) => s.service_name && s.service_name.trim().toLowerCase() === 'barangay id');
        this.barangayIdService.set(found || null);
      }
    });
  }

  onSaveConfig(data: any) {
    const svc = this.barangayIdService();
    this.savingConfig.set(true);

    const save$ = svc
      ? this.serviceService.update(svc.service_id, data)
      : this.serviceService.create({ ...data, serviceName: 'Barangay ID' });

    save$.subscribe({
      next: (res: any) => {
        const targetId = svc ? svc.service_id : res.data?.service_id;
        this.handleTemplate(targetId, data).subscribe({
          next: () => {
            this.savingConfig.set(false);
            this.showConfig.set(false);
            this.toast.success('Configuration Saved', 'Barangay ID service configuration updated.');
            this.loadBarangayIdService();
          },
          error: (err) => {
            this.savingConfig.set(false);
            this.toast.error('Template Error', err.error?.message || 'Config saved, but the template could not be uploaded.');
          }
        });
      },
      error: (err) => {
        this.savingConfig.set(false);
        this.toast.error('Save Failed', err.error?.message || 'Failed to save configuration.');
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
