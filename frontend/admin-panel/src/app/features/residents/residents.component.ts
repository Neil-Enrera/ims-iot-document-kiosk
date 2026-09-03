import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ResidentService, RfidService, RequestService, ApplicationService, ResidentUpdateService } from '../../shared/services';
import { NotificationService } from '../notifications/notification.service';
import { Resident } from '../../shared/interfaces/api.interfaces';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { ResidentFormComponent } from './resident-form.component';

@Component({
  selector: 'app-residents',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent, ButtonComponent, CardComponent, InputComponent, PaginationComponent, ModalComponent, ConfirmDialogComponent, ResidentFormComponent, DatePipe],
  template: `
    <div>
      <div class="flex justify-between items-center mb-5">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Residents</h1>
          <p class="text-sm text-slate-500 mt-1">Manage and view all registered residents and profile update requests.</p>
        </div>
        @if (mainTab() === 'residents') {
          <app-button variant="primary" (onClick)="openCreateForm()">+ Add Resident</app-button>
        }
      </div>

      <!-- Main Navigation Tabs -->
      <div class="flex items-center gap-3 border-b border-gray-200 mb-6 bg-white px-2 rounded-t-xl pt-2">
        <button
          type="button"
          (click)="setMainTab('residents')"
          class="pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2"
          [class.border-[#F97316]]="mainTab() === 'residents'"
          [class.text-[#EA580C]]="mainTab() === 'residents'"
          [class.border-transparent]="mainTab() !== 'residents'"
          [class.text-slate-500]="mainTab() !== 'residents'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          <span>Registered Residents</span>
          <span class="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-bold">{{ total() }}</span>
        </button>

        <button
          type="button"
          (click)="setMainTab('updates')"
          class="pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2"
          [class.border-[#F97316]]="mainTab() === 'updates'"
          [class.text-[#EA580C]]="mainTab() === 'updates'"
          [class.border-transparent]="mainTab() !== 'updates'"
          [class.text-slate-500]="mainTab() !== 'updates'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          <span>Information Update Requests</span>
          @if (pendingUpdatesCount() > 0) {
            <span class="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 font-bold animate-pulse">{{ pendingUpdatesCount() }} Pending</span>
          }
        </button>
      </div>

      <!-- TAB 1: RESIDENTS LIST -->
      @if (mainTab() === 'residents') {
        <app-card>
          <div class="mb-4 flex flex-wrap items-center gap-3">
            <div class="flex-1 min-w-[220px]">
              <app-input placeholder="Search residents..." [value]="search()" (valueChange)="onSearch($event)" />
            </div>
            <select
              [ngModel]="statusFilter()"
              (ngModelChange)="onStatusFilter($event)"
              class="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Archived</option>
            </select>
          </div>

          <app-table
            [columns]="columns"
            [data]="residents()"
            [loading]="loading()"
            [sortColumn]="sortColumn()"
            [sortDirection]="sortDirection()"
            trackBy="resident_id"
            emptyMessage="No residents found"
            [selectedRow]="selectedRow()"
            [cellTemplates]="{ full_name: nameCell, rfid_card: rfidCell, status: statusCell }"
            (onSort)="onSort($event)"
            (onRowClick)="onRowClick($event)"
          />

          <ng-template #nameCell let-value let-row="row">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {{ getInitials(row) }}
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-slate-900 text-sm leading-tight truncate">{{ formatResidentName(row) }}</p>
                @if (row.gender || row.civil_status) {
                  <p class="text-[11px] text-slate-400 leading-tight mt-0.5 capitalize">{{ row.gender || '-' }} · {{ row.civil_status || '-' }}</p>
                }
              </div>
            </div>
          </ng-template>

          <ng-template #rfidCell let-value let-row="row">
            @if (row.card_uid) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                <svg class="w-3.5 h-3.5 text-orange-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 9.5h8M7 12h8" stroke-linecap="round"/>
                </svg>
                {{ row.card_uid }}
              </span>
            } @else {
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-400">
                No Card
              </span>
            }
          </ng-template>

          <ng-template #statusCell let-value let-row="row">
            <span [class]="'px-2.5 py-1 rounded-full text-xs font-bold border ' + (isActive(row) ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200')">
              {{ row.status }}
            </span>
          </ng-template>

          @if (total() > 0) {
            <app-pagination
              [total]="total()"
              [currentPage]="page()"
              [limit]="limit"
              itemLabel="residents"
              (onPageChange)="onPageChange($event)"
              (onLimitChange)="onLimitChange($event)"
            />
          }
        </app-card>
      }

      <!-- TAB 2: UPDATE REQUESTS LIST -->
      @if (mainTab() === 'updates') {
        <app-card>
          <div class="mb-4 flex flex-wrap items-center gap-3">
            <div class="flex-1 min-w-[220px]">
              <app-input placeholder="Search by request # or resident name..." [value]="updateSearch()" (valueChange)="onUpdateSearch($event)" />
            </div>
            <select
              [ngModel]="updateStatusFilter()"
              (ngModelChange)="onUpdateStatusFilter($event)"
              class="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <app-table
            [columns]="updateColumns"
            [data]="updateRequests()"
            [loading]="updateRequestsLoading()"
            trackBy="request_id"
            emptyMessage="No information update requests found"
            [cellTemplates]="{ request_number: reqNumCell, resident_name: reqResidentCell, changes: reqChangesCell, status: reqStatusCell, actions: reqActionsCell }"
          />

          <ng-template #reqNumCell let-value let-row="row">
            <div class="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md inline-block">
              {{ row.request_number }}
            </div>
          </ng-template>

          <ng-template #reqResidentCell let-value let-row="row">
            <div>
              <p class="font-semibold text-slate-900 text-sm leading-tight">{{ row.first_name }} {{ row.last_name }}</p>
              <p class="text-xs text-slate-500 font-mono">{{ row.resident_code }}</p>
            </div>
          </ng-template>

          <ng-template #reqChangesCell let-value let-row="row">
            <div class="max-w-xs truncate text-xs text-slate-700">
              <span class="font-semibold text-slate-900">{{ formatChangesSummary(row.requested_changes) }}</span>
            </div>
          </ng-template>

          <ng-template #reqStatusCell let-value let-row="row">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold border"
                  [class.bg-amber-50]="row.status === 'PENDING'"
                  [class.text-amber-800]="row.status === 'PENDING'"
                  [class.border-amber-200]="row.status === 'PENDING'"
                  [class.bg-emerald-50]="row.status === 'APPROVED'"
                  [class.text-emerald-800]="row.status === 'APPROVED'"
                  [class.border-emerald-200]="row.status === 'APPROVED'"
                  [class.bg-rose-50]="row.status === 'REJECTED'"
                  [class.text-rose-800]="row.status === 'REJECTED'"
                  [class.border-rose-200]="row.status === 'REJECTED'">
              {{ row.status }}
            </span>
          </ng-template>

          <ng-template #reqActionsCell let-value let-row="row">
            <button
              (click)="openUpdateRequestDetail(row)"
              class="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
            >
              Review Request
            </button>
          </ng-template>

          @if (updateRequestsTotal() > 0) {
            <app-pagination
              [total]="updateRequestsTotal()"
              [currentPage]="updatePage()"
              [limit]="updateLimit"
              itemLabel="update requests"
              (onPageChange)="onUpdatePageChange($event)"
              (onLimitChange)="onUpdateLimitChange($event)"
            />
          }
        </app-card>
      }

      <!-- Resident Details Modal -->
      <app-modal [open]="showDetails()" title="Resident Profile" (onClose)="closeDetails()" containerClass="max-w-2xl">
        @if (selectedResident(); as res) {
          <div class="space-y-4">
            <!-- Header Card -->
            <div class="bg-gradient-to-r from-orange-50 to-orange-100/60 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-full bg-white border-2 border-orange-300 shadow-sm flex items-center justify-center text-orange-600 font-extrabold text-lg shrink-0 overflow-hidden">
                  @if (res.photo) {
                    <img [src]="res.photo" alt="Photo" class="w-full h-full object-cover">
                  } @else {
                    {{ getInitials(res) }}
                  }
                </div>
                <div>
                  <h3 class="text-base font-bold text-slate-900 leading-snug">{{ formatResidentName(res) }}</h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-white border border-orange-200 text-orange-800">{{ res.resident_code }}</span>
                    <span [class]="'px-2 py-0.5 rounded-full text-[11px] font-bold border ' + (isActive(res) ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200')">
                      {{ res.status }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="text-right">
                <p class="text-[11px] text-slate-400 font-medium">Registered Since</p>
                <p class="text-xs font-semibold text-slate-700 mt-0.5">{{ res.created_at | date:'MMM d, y' }}</p>
              </div>
            </div>

            <!-- Modal Nav Tabs -->
            <div class="flex border-b border-gray-200 gap-4 text-xs font-bold">
              <button
                (click)="activeTab.set('bio')"
                class="pb-2.5 transition-colors border-b-2 flex items-center gap-1.5"
                [class.border-orange-500]="activeTab() === 'bio'"
                [class.text-orange-600]="activeTab() === 'bio'"
                [class.border-transparent]="activeTab() !== 'bio'"
                [class.text-slate-400]="activeTab() !== 'bio'"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                Personal Info
              </button>
              <button
                (click)="activeTab.set('rfid')"
                class="pb-2.5 transition-colors border-b-2 flex items-center gap-1.5"
                [class.border-orange-500]="activeTab() === 'rfid'"
                [class.text-orange-600]="activeTab() === 'rfid'"
                [class.border-transparent]="activeTab() !== 'rfid'"
                [class.text-slate-400]="activeTab() !== 'rfid'"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 9.5h8M7 12h8" stroke-linecap="round"/></svg>
                RFID Card
              </button>
              <button
                (click)="activeTab.set('history')"
                class="pb-2.5 transition-colors border-b-2 flex items-center gap-1.5"
                [class.border-orange-500]="activeTab() === 'history'"
                [class.text-orange-600]="activeTab() === 'history'"
                [class.border-transparent]="activeTab() !== 'history'"
                [class.text-slate-400]="activeTab() !== 'history'"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Requests & ID
              </button>
            </div>

            <!-- Tab Content -->
            @if (activeTab() === 'bio') {
              <div class="grid grid-cols-2 gap-y-3 gap-x-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div><span class="text-slate-400 font-medium block">Birth Date</span><span class="font-bold text-slate-800">{{ res.birth_date | date:'MMMM d, y' }}</span></div>
                <div><span class="text-slate-400 font-medium block">Place of Birth</span><span class="font-bold text-slate-800">{{ res.birth_place || '-' }}</span></div>
                <div><span class="text-slate-400 font-medium block">Gender</span><span class="font-bold text-slate-800 capitalize">{{ res.gender || '-' }}</span></div>
                <div><span class="text-slate-400 font-medium block">Civil Status</span><span class="font-bold text-slate-800">{{ res.civil_status || '-' }}</span></div>
                <div><span class="text-slate-400 font-medium block">Occupation</span><span class="font-bold text-slate-800">{{ res.occupation || '-' }}</span></div>
                <div><span class="text-slate-400 font-medium block">Contact Number</span><span class="font-bold text-slate-800">{{ res.contact_number || '-' }}</span></div>
                <div><span class="text-slate-400 font-medium block">Email</span><span class="font-bold text-slate-800">{{ res.email || '-' }}</span></div>
                <div class="col-span-2"><span class="text-slate-400 font-medium block">Complete Address</span><span class="font-bold text-slate-800">{{ formatFullAddress(res) }}</span></div>
                @if (res.subdivision || res.street || res.block || res.lot || res.purok_zone) {
                  <div class="col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5 border-t border-slate-200/60 text-[11px]">
                    <div><span class="text-slate-400 font-medium block text-[10px]">Subdivision</span><span class="font-bold text-slate-700">{{ res.subdivision || '-' }}</span></div>
                    <div><span class="text-slate-400 font-medium block text-[10px]">Street</span><span class="font-bold text-slate-700">{{ res.street || '-' }}</span></div>
                    <div><span class="text-slate-400 font-medium block text-[10px]">Block</span><span class="font-bold text-slate-700">{{ res.block || '-' }}</span></div>
                    <div><span class="text-slate-400 font-medium block text-[10px]">Lot</span><span class="font-bold text-slate-700">{{ res.lot || '-' }}</span></div>
                  </div>
                }
              </div>
            }

            @if (activeTab() === 'rfid') {
              <div class="space-y-3">
                @if (activeRfidCard(); as card) {
                  <div class="p-3 bg-white border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p class="text-xs font-mono font-bold text-emerald-800">UID: {{ card.card_uid }}</p>
                      <p class="text-[11px] text-slate-500">Status: {{ card.status }}</p>
                    </div>
                  </div>
                } @else {
                  <p class="text-xs text-slate-500 text-center py-4">No active RFID card linked.</p>
                }
              </div>
            }

            @if (activeTab() === 'history') {
              <div class="space-y-2">
                @if (residentRequests().length > 0) {
                  @for (req of residentRequests(); track req.request_id) {
                    <div class="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <p class="font-bold text-slate-800">{{ req.service_name }}</p>
                        <p class="text-slate-400 font-mono text-[11px]">{{ req.tracking_number }}</p>
                      </div>
                      <span class="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800">{{ req.status }}</span>
                    </div>
                  }
                } @else {
                  <p class="text-xs text-slate-500 text-center py-4">No past requests recorded.</p>
                }
              </div>
            }

            <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <app-button variant="secondary" (onClick)="openEditForm(res)">Edit Profile</app-button>
              <app-button variant="secondary" (onClick)="closeDetails()">Close</app-button>
            </div>
          </div>
        }
      </app-modal>

      <!-- INFORMATION UPDATE REQUEST REVIEW MODAL -->
      <app-modal [open]="showUpdateDetailModal()" title="Review Resident Information Update Request" (onClose)="closeUpdateRequestDetail()" containerClass="max-w-3xl">
        @if (selectedUpdateRequest(); as req) {
          <div class="space-y-5 text-left">
            <!-- Header Summary -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span class="font-mono text-xs font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-md">{{ req.request_number }}</span>
                <h3 class="text-base font-bold text-slate-900 mt-1.5">{{ req.first_name }} {{ req.last_name }}</h3>
                <p class="text-xs text-slate-500">Resident Code: <span class="font-mono font-semibold">{{ req.resident_code }}</span> · Submitted {{ req.created_at | date:'MMM d, y, h:mm a' }}</p>
              </div>
              <div>
                <span class="px-3 py-1 rounded-full text-xs font-extrabold border"
                      [class.bg-amber-50]="req.status === 'PENDING'"
                      [class.text-amber-800]="req.status === 'PENDING'"
                      [class.border-amber-200]="req.status === 'PENDING'"
                      [class.bg-emerald-50]="req.status === 'APPROVED'"
                      [class.text-emerald-800]="req.status === 'APPROVED'"
                      [class.border-emerald-200]="req.status === 'APPROVED'"
                      [class.bg-rose-50]="req.status === 'REJECTED'"
                      [class.text-rose-800]="req.status === 'REJECTED'"
                      [class.border-rose-200]="req.status === 'REJECTED'">
                  {{ req.status }}
                </span>
              </div>
            </div>

            <!-- Side-by-Side Value Comparison -->
            <div>
              <h4 class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Requested Field Changes</h4>
              <div class="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase">
                    <tr>
                      <th class="py-2.5 px-4">Field</th>
                      <th class="py-2.5 px-4">Current Permanent Value</th>
                      <th class="py-2.5 px-4 bg-amber-50/60 text-amber-900">Requested New Value</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (item of getChangeEntries(req); track item.field) {
                      <tr class="hover:bg-slate-50/50">
                        <td class="py-2.5 px-4 font-bold text-slate-800">{{ item.label }}</td>
                        <td class="py-2.5 px-4 text-slate-600 font-mono">{{ item.currentValue || '(blank)' }}</td>
                        <td class="py-2.5 px-4 bg-amber-50/40 text-amber-950 font-bold font-mono">{{ item.requestedValue }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Resident Reason -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span class="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Resident Stated Reason:</span>
              <p class="text-sm text-slate-800 font-medium italic">"{{ req.reason || 'No reason provided.' }}"</p>
            </div>

            @if (req.status === 'PENDING') {
              <!-- Staff Review Notes / Decision Box -->
              <div class="space-y-2 pt-2 border-t border-slate-200">
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Staff Review Remarks / Notes</label>
                <textarea
                  [(ngModel)]="reviewNotes"
                  rows="2"
                  placeholder="Enter any approval or rejection remarks (optional)..."
                  class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>

                <div class="flex items-center justify-end gap-3 pt-3">
                  <button
                    (click)="rejectUpdateRequest()"
                    [disabled]="isReviewing()"
                    class="px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition disabled:opacity-50"
                  >
                    Reject Request
                  </button>
                  <button
                    (click)="approveUpdateRequest()"
                    [disabled]="isReviewing()"
                    class="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                  >
                    @if (isReviewing()) {
                      <span class="inline-block animate-spin">&#8635;</span>
                    }
                    <span>Approve & Update Resident</span>
                  </button>
                </div>
              </div>
            } @else {
              <!-- Already Reviewed Info -->
              <div class="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600">
                <p><span class="font-bold">Reviewed By:</span> {{ req.reviewer_name || req.reviewer_username || 'Staff' }} on {{ req.reviewed_at | date:'MMM d, y, h:mm a' }}</p>
                @if (req.review_notes) {
                  <p class="mt-1"><span class="font-bold">Remarks:</span> {{ req.review_notes }}</p>
                }
              </div>
            }
          </div>
        }
      </app-modal>

      <!-- Resident Form Modal (Add / Edit Resident) -->
      <app-modal [open]="showForm()" [title]="editingResident() ? 'Edit Resident' : 'Add New Resident'" (onClose)="closeForm()" containerClass="max-w-2xl">
        <app-resident-form
          [resident]="editingResident()"
          [loading]="saving()"
          (onSave)="onFormSubmit($event)"
          (onCancel)="closeForm()"
        />
      </app-modal>

      <!-- Confirm Dialogs -->
      @if (showArchiveConfirm()) {
        <app-confirm-dialog
          [open]="true"
          title="Archive Resident"
          [message]="'Are you sure you want to archive ' + (targetResident()?.first_name || '') + ' ' + (targetResident()?.last_name || '') + '?'"
          confirmText="Archive"
          variant="danger"
          (onCancel)="showArchiveConfirm.set(false)"
          (onConfirm)="confirmArchive()"
        />
      }
      @if (showRestoreConfirm()) {
        <app-confirm-dialog
          [open]="true"
          title="Restore Resident"
          [message]="'Are you sure you want to restore ' + (targetResident()?.first_name || '') + ' ' + (targetResident()?.last_name || '') + '?'"
          confirmText="Restore"
          variant="primary"
          (onCancel)="showRestoreConfirm.set(false)"
          (onConfirm)="confirmRestore()"
        />
      }
    </div>
  `
})
export class ResidentsComponent implements OnInit, OnDestroy {
  mainTab = signal<'residents' | 'updates'>('residents');

  residents = signal<Resident[]>([]);
  loading = signal(true);
  search = signal('');
  page = signal(1);
  limit = 10;
  total = signal(0);
  sortColumn = signal('resident_id');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  showDetails = signal(false);
  selectedResident = signal<any | null>(null);
  selectedRow = signal<Resident | null>(null);

  activeTab = signal<'bio' | 'rfid' | 'history'>('bio');
  residentRfidCards = signal<any[]>([]);
  residentRequests = signal<any[]>([]);
  residentApplications = signal<any[]>([]);
  newCardUid = '';
  private ws: WebSocket | null = null;
  private sseSubscription: Subscription | null = null;

  // Information Update Requests state
  updateRequests = signal<any[]>([]);
  updateRequestsLoading = signal(false);
  updateSearch = signal('');
  updateStatusFilter = signal('');
  updatePage = signal(1);
  updateLimit = 10;
  updateRequestsTotal = signal(0);
  pendingUpdatesCount = signal(0);

  selectedUpdateRequest = signal<any | null>(null);
  showUpdateDetailModal = signal(false);
  reviewNotes = '';
  isReviewing = signal(false);

  updateColumns: TableColumn[] = [
    { key: 'request_number', label: 'Request #' },
    { key: 'resident_name', label: 'Resident' },
    { key: 'changes', label: 'Requested Changes' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Action' }
  ];

  formatFullAddress(res: any): string {
    if (!res) return '-';
    if (res.address_line && res.address_line.trim()) {
      return res.address_line;
    }
    const rawParts = [
      res.block ? (String(res.block).toLowerCase().startsWith('blk') ? res.block : `Blk ${res.block}`) : null,
      res.lot ? (String(res.lot).toLowerCase().startsWith('lot') ? res.lot : `Lot ${res.lot}`) : null,
      res.house_number,
      res.street,
      res.subdivision,
      res.purok_zone,
      res.sitio,
      res.municipality,
      res.province
    ].filter(x => !!x && String(x).trim() !== '');

    const uniqueParts: string[] = [];
    for (const part of rawParts) {
      if (part && !uniqueParts.some(p => p.toLowerCase() === String(part).toLowerCase())) {
        uniqueParts.push(part);
      }
    }

    return uniqueParts.length > 0 ? uniqueParts.join(', ') : '-';
  }

  showForm = signal(false);
  editingResident = signal<Resident | null>(null);
  saving = signal(false);

  showArchiveConfirm = signal(false);
  showRestoreConfirm = signal(false);
  targetResident = signal<Resident | null>(null);
  statusFilter = signal('');

  isActive(res: any): boolean {
    return res?.status === 'ACTIVE' || res?.status === 'Active';
  }

  formatResidentName(res: any): string {
    if (!res) return '';
    const parts = [
      res.last_name ? `${res.last_name},` : '',
      res.first_name,
      res.middle_name ? `${res.middle_name.charAt(0)}.` : '',
      res.suffix
    ].filter(Boolean);
    return parts.join(' ') || '-';
  }

  getInitials(res: any): string {
    if (!res) return 'R';
    const first = (res.first_name || '')[0] || '';
    const last = (res.last_name || '')[0] || '';
    return (first + last).toUpperCase() || 'R';
  }

  columns: TableColumn[] = [
    { key: 'resident_code', label: 'Code', sortable: true },
    { key: 'full_name', label: 'Full Name', sortable: true },
    { key: 'contact_number', label: 'Contact' },
    { key: 'rfid_card', label: 'RFID Card' },
    { key: 'status', label: 'Status', sortable: true }
  ];

  constructor(
    private residentService: ResidentService,
    private rfidService: RfidService,
    private requestService: RequestService,
    private applicationService: ApplicationService,
    private residentUpdateService: ResidentUpdateService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['new'] === '1') {
        this.openCreateForm();
        this.router.navigate([], { queryParams: { new: null }, queryParamsHandling: 'merge' });
      }
      if (params['tab'] === 'updates' || params['updateId']) {
        this.mainTab.set('updates');
        this.loadUpdateRequests();
        if (params['updateId']) {
          const updateId = Number(params['updateId']);
          this.residentUpdateService.getById(updateId).subscribe({
            next: (res: any) => {
              if (res.data) {
                this.openUpdateRequestDetail(res.data);
              }
            }
          });
          this.router.navigate([], { queryParams: { updateId: null }, queryParamsHandling: 'merge' });
        }
      }
    });
    this.loadResidents();
    this.loadPendingCount();

    // Listen to real-time SSE updates for resident and application events
    this.sseSubscription = this.notificationService.sse$.subscribe(event => {
      if (event?.type?.startsWith('resident-') || event?.type?.startsWith('application-')) {
        this.loadResidents();
        this.loadPendingCount();
        if (this.mainTab() === 'updates') {
          this.loadUpdateRequests();
        }
        const openResId = this.selectedResident()?.resident_id;
        if (openResId) {
          this.fetchFreshResident(openResId);
        }
      }
    });
  }

  ngOnDestroy() {
    this.disconnectRfidScanner();
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
    }
  }

  setMainTab(tab: 'residents' | 'updates') {
    this.mainTab.set(tab);
    if (tab === 'updates') {
      this.loadUpdateRequests();
    } else {
      this.loadResidents();
    }
  }

  loadPendingCount() {
    this.residentUpdateService.getAll({ status: 'PENDING', limit: 1 }).subscribe({
      next: (res: any) => {
        this.pendingUpdatesCount.set(res.pagination?.total || (res.data ? res.data.length : 0));
      },
      error: () => {}
    });
  }

  loadResidents() {
    this.loading.set(true);
    this.residentService.getAll({
      search: this.search(),
      page: this.page(),
      limit: this.limit,
      sortBy: this.sortColumn(),
      sortOrder: this.sortDirection(),
      status: this.statusFilter() || undefined
    }).subscribe({
      next: (res) => {
        this.residents.set(res.data);
        this.total.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadUpdateRequests() {
    this.updateRequestsLoading.set(true);
    this.residentUpdateService.getAll({
      search: this.updateSearch(),
      status: this.updateStatusFilter() || undefined,
      page: this.updatePage(),
      limit: this.updateLimit
    }).subscribe({
      next: (res: any) => {
        this.updateRequests.set(res.data || []);
        this.updateRequestsTotal.set(res.pagination?.total || (res.data ? res.data.length : 0));
        this.updateRequestsLoading.set(false);
        this.loadPendingCount();
      },
      error: () => this.updateRequestsLoading.set(false)
    });
  }

  onUpdateSearch(val: string) {
    this.updateSearch.set(val);
    this.updatePage.set(1);
    this.loadUpdateRequests();
  }

  onUpdateStatusFilter(val: string) {
    this.updateStatusFilter.set(val);
    this.updatePage.set(1);
    this.loadUpdateRequests();
  }

  onUpdatePageChange(p: number) {
    this.updatePage.set(p);
    this.loadUpdateRequests();
  }

  onUpdateLimitChange(l: number) {
    this.updateLimit = l;
    this.updatePage.set(1);
    this.loadUpdateRequests();
  }

  formatChangesSummary(changes: any): string {
    if (!changes || typeof changes !== 'object') return 'None';
    const keys = Object.keys(changes).filter(k => changes[k] !== null && changes[k] !== undefined && changes[k] !== '');
    if (keys.length === 0) return 'None';
    return keys.map(k => k.replace(/_/g, ' ')).join(', ');
  }

  getChangeEntries(req: any): { field: string; label: string; currentValue: any; requestedValue: any }[] {
    if (!req || !req.requested_changes) return [];
    const labels: Record<string, string> = {
      contact_number: 'Contact Number',
      email: 'Email Address',
      civil_status: 'Civil Status',
      occupation: 'Occupation',
      subdivision: 'Subdivision',
      street: 'Street',
      block: 'Block',
      lot: 'Lot',
      purok_zone: 'Purok / Zone',
      house_number: 'House Number',
      address_line: 'Complete Address'
    };
    const currentKeys: Record<string, string> = {
      contact_number: 'current_contact_number',
      email: 'current_email',
      civil_status: 'current_civil_status',
      occupation: 'current_occupation',
      subdivision: 'current_subdivision',
      street: 'current_street',
      block: 'current_block',
      lot: 'current_lot',
      purok_zone: 'current_purok_zone',
      house_number: 'current_house_number',
      address_line: 'current_address_line'
    };

    const entries = [];
    for (const [key, val] of Object.entries(req.requested_changes)) {
      if (val !== undefined && val !== null && val !== '') {
        const curKey = currentKeys[key] || key;
        entries.push({
          field: key,
          label: labels[key] || key.replace(/_/g, ' '),
          currentValue: req[curKey] ?? req[key] ?? '',
          requestedValue: val
        });
      }
    }
    return entries;
  }

  openUpdateRequestDetail(row: any) {
    this.selectedUpdateRequest.set(row);
    this.reviewNotes = '';
    this.showUpdateDetailModal.set(true);
  }

  closeUpdateRequestDetail() {
    this.showUpdateDetailModal.set(false);
    this.selectedUpdateRequest.set(null);
  }

  fetchFreshResident(residentId: number) {
    if (!residentId) return;
    this.residentService.getById(residentId).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.selectedResident.set(res.data);
          this.residents.update(list => list.map(r => r.resident_id === residentId ? { ...r, ...res.data } : r));
        }
      },
      error: (err) => console.error('Error fetching fresh resident record:', err)
    });
  }

  approveUpdateRequest() {
    const req = this.selectedUpdateRequest();
    if (!req) return;
    this.isReviewing.set(true);
    this.residentUpdateService.approve(req.request_id, this.reviewNotes).subscribe({
      next: (res: any) => {
        this.isReviewing.set(false);
        this.closeUpdateRequestDetail();
        this.loadUpdateRequests();
        this.loadResidents();
        if (req.resident_id) {
          this.fetchFreshResident(req.resident_id);
        }
        alert('Information update request has been approved. Resident record updated successfully!');
      },
      error: (err: any) => {
        this.isReviewing.set(false);
        alert(err.error?.message || 'Failed to approve update request.');
      }
    });
  }

  rejectUpdateRequest() {
    const req = this.selectedUpdateRequest();
    if (!req) return;
    this.isReviewing.set(true);
    this.residentUpdateService.reject(req.request_id, this.reviewNotes).subscribe({
      next: () => {
        this.isReviewing.set(false);
        this.closeUpdateRequestDetail();
        this.loadUpdateRequests();
        alert('Information update request has been rejected.');
      },
      error: (err: any) => {
        this.isReviewing.set(false);
        alert(err.error?.message || 'Failed to reject update request.');
      }
    });
  }

  onSearch(value: string) {
    this.search.set(value);
    this.page.set(1);
    this.loadResidents();
  }

  onStatusFilter(value: string) {
    this.statusFilter.set(value);
    this.page.set(1);
    this.loadResidents();
  }

  onSort(column: string) {
    const backendColumn = column === 'full_name' ? 'last_name' : column;
    if (this.sortColumn() === backendColumn) {
      this.sortDirection.set(this.sortDirection() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.sortColumn.set(backendColumn);
      this.sortDirection.set('ASC');
    }
    this.loadResidents();
  }

  onPageChange(page: number) {
    this.page.set(page);
    this.loadResidents();
  }

  onLimitChange(limit: number) {
    this.limit = limit;
    this.page.set(1);
    this.loadResidents();
  }

  onRowClick(resident: Resident) {
    this.selectedResident.set(resident);
    this.selectedRow.set(resident);
    this.showDetails.set(true);
    this.activeTab.set('bio');
    this.fetchFreshResident(resident.resident_id);
    this.loadResidentRfid(resident);
    this.loadResidentHistory(resident);
  }

  closeDetails() {
    this.showDetails.set(false);
    this.selectedResident.set(null);
    this.selectedRow.set(null);
    this.disconnectRfidScanner();
  }

  openCreateForm() {
    this.editingResident.set(null);
    this.showForm.set(true);
  }

  openEditForm(resident: Resident) {
    this.editingResident.set(resident);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingResident.set(null);
  }

  onFormSubmit(formData: any) {
    this.saving.set(true);
    if (this.editingResident()) {
      const resId = this.editingResident()!.resident_id;
      this.residentService.update(resId, formData).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeForm();
          this.loadResidents();
          this.fetchFreshResident(resId);
        },
        error: () => this.saving.set(false)
      });
    } else {
      this.residentService.create(formData).subscribe({
        next: (createdRes: any) => {
          this.saving.set(false);
          this.closeForm();
          this.loadResidents();
          if (createdRes?.data?.resident_id) {
            this.fetchFreshResident(createdRes.data.resident_id);
          }
        },
        error: () => this.saving.set(false)
      });
    }
  }

  openArchiveConfirm(resident: Resident) {
    this.targetResident.set(resident);
    this.showArchiveConfirm.set(true);
  }

  confirmArchive() {
    if (!this.targetResident()) return;
    this.residentService.archive(this.targetResident()!.resident_id).subscribe({
      next: () => {
        this.showArchiveConfirm.set(false);
        this.targetResident.set(null);
        this.loadResidents();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to archive resident.');
      }
    });
  }

  openRestoreConfirm(resident: Resident) {
    this.targetResident.set(resident);
    this.showRestoreConfirm.set(true);
  }

  confirmRestore() {
    if (!this.targetResident()) return;
    this.residentService.restore(this.targetResident()!.resident_id).subscribe({
      next: () => {
        this.showRestoreConfirm.set(false);
        this.targetResident.set(null);
        this.loadResidents();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to restore resident.');
      }
    });
  }

  activeRfidCard(): any {
    const cards = this.residentRfidCards();
    const active = cards.find(c => (c.status || '').toUpperCase() === 'ACTIVE');
    if (active) return active;
    if (cards.length > 0) return cards[0];
    const res = this.selectedResident();
    if (res?.card_uid) {
      return {
        card_uid: res.card_uid,
        status: res.rfid_card_status || 'Active',
        issued_date: res.rfid_issued_date || res.created_at,
        expiration_date: res.rfid_expiration_date
      };
    }
    return null;
  }

  loadResidentRfid(res: Resident) {
    this.rfidService.getAll({ residentId: res.resident_id, limit: 50 }).subscribe({
      next: (resData) => {
        this.residentRfidCards.set(resData.data || []);
      },
      error: () => {
        this.rfidService.getAll({ search: res.resident_code }).subscribe({
          next: (fallbackData) => {
            this.residentRfidCards.set(fallbackData.data || []);
          }
        });
      }
    });
  }

  loadResidentHistory(res: Resident) {
    this.requestService.getAll({ residentId: res.resident_id }).subscribe({
      next: (reqRes) => {
        this.residentRequests.set(reqRes.data || []);
      }
    });
    this.applicationService.getAll({ search: res.last_name }).subscribe({
      next: (appRes) => {
        const apps = (appRes.data || []).filter((a: any) => a.resident_id === res.resident_id);
        this.residentApplications.set(apps);
      }
    });
  }

  connectRfidScanner() {
    if (this.ws) return;
    this.ws = new WebSocket('ws://localhost:3001/ws?type=kiosk');
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'rfid_scan' && msg.data?.uid) {
          this.newCardUid = msg.data.uid;
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };
    this.ws.onclose = () => {
      this.ws = null;
    };
  }

  disconnectRfidScanner() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  registerRfid(res: Resident) {
    if (!this.newCardUid.trim()) return;
    this.rfidService.register({
      residentId: res.resident_id,
      cardUid: this.newCardUid.trim()
    }).subscribe({
      next: () => {
        this.newCardUid = '';
        this.loadResidentRfid(res);
        alert('RFID Card registered successfully!');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to register card.');
      }
    });
  }

  activateRfid(cardId: number, res: Resident) {
    this.rfidService.updateStatus(cardId, 'Active').subscribe({
      next: () => this.loadResidentRfid(res),
      error: (err) => alert(err.error?.message || 'Failed to activate card.')
    });
  }

  deactivateRfid(cardId: number, res: Resident) {
    this.rfidService.updateStatus(cardId, 'Revoked').subscribe({
      next: () => this.loadResidentRfid(res),
      error: (err) => alert(err.error?.message || 'Failed to deactivate card.')
    });
  }
}
