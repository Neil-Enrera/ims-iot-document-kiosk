import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RfidService, ResidentService } from '../../shared/services';
import { NotificationService } from '../notifications/notification.service';
import { ToastService } from '../../shared/components/toast.service';
import { RfidCard, Resident } from '../../shared/interfaces/api.interfaces';
import { TableComponent, TableColumn } from '../../shared/components/table.component';
import { CardComponent } from '../../shared/components/card.component';
import { InputComponent } from '../../shared/components/input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-rfid',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableComponent,
    CardComponent, InputComponent, PaginationComponent, ModalComponent, DatePipe
  ],
  template: `
    <div>
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 tracking-tight">RFID ID Registration</h1>
          <p class="text-sm text-slate-500 mt-1">Review approved residents and register physical RFID Barangay ID cards.</p>
        </div>
      </div>

      <app-card>
        <!-- Search & Filter Controls -->
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <div class="flex-1 min-w-[240px]">
            <app-input placeholder="Search by resident name, code, or card UID..." [value]="search()" (valueChange)="onSearch($event)" />
          </div>
          <select
            [ngModel]="statusFilter()"
            (ngModelChange)="onStatusFilter($event)"
            class="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Residents</option>
            <option value="NOT_REGISTERED">Pending Registration (Not Registered)</option>
            <option value="REGISTERED">Registered Cards</option>
            <option value="Active">Active Cards</option>
            <option value="Suspended">Suspended Cards</option>
            <option value="Revoked">Revoked Cards</option>
          </select>
        </div>

        <!-- Table -->
        <app-table
          [columns]="columns"
          [data]="cards()"
          [loading]="loading()"
          [sortColumn]="sortColumn()"
          [sortDirection]="sortDirection()"
          trackBy="resident_id"
          emptyMessage="No resident or RFID records found"
          [selectedRow]="selectedResident()"
          [cellTemplates]="{ resident_name: residentCell, card_uid: uidCell, registration_status: regCell, status: statusCell, issued_date: dateCell }"
          (onSort)="onSort($event)"
          (onRowClick)="onRowClick($event)"
        >
          <!-- Resident Name Cell -->
          <ng-template #residentCell let-row="row">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-orange-100 border border-orange-200 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                @if (row.photo && !row._photoError) {
                  <img [src]="photoUrl(row.photo)" (error)="row._photoError = true" alt="Photo" class="w-full h-full object-cover">
                } @else {
                  {{ getInitials(row) }}
                }
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-slate-900 text-sm leading-tight truncate">{{ row.resident_name || '-' }}</p>
                <p class="text-[11px] text-slate-400 leading-tight mt-0.5 font-mono">{{ row.resident_code || 'Code: -' }}</p>
              </div>
            </div>
          </ng-template>

          <!-- Card UID Cell -->
          <ng-template #uidCell let-row="row">
            @if (row.card_uid && (row.status === 'Active' || row.status === 'ACTIVE')) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-orange-50 text-orange-800 border border-orange-200">
                <svg class="w-3.5 h-3.5 text-orange-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 9.5h8M7 12h8" stroke-linecap="round"/>
                </svg>
                {{ row.card_uid }}
              </span>
            } @else if (row.card_uid) {
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200">
                {{ row.card_uid }}
              </span>
            } @else {
              <span class="text-xs text-slate-400 font-medium italic">Not Assigned</span>
            }
          </ng-template>

          <!-- Registration Status Cell -->
          <ng-template #regCell let-row="row">
            @if (row.registration_status === 'Registered' || (row.card_uid && (row.status === 'Active' || row.status === 'ACTIVE'))) {
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <svg class="w-3 h-3 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Registered
              </span>
            } @else {
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <svg class="w-3 h-3 text-amber-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Pending Registration
              </span>
            }
          </ng-template>

          <!-- Card Status Cell -->
          <ng-template #statusCell let-row="row">
            @if (row.status) {
              <span [class]="'px-2.5 py-0.5 rounded-full text-xs font-bold border ' + (row.status === 'Active' || row.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : row.status === 'Suspended' || row.status === 'SUSPENDED' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-800 border-red-200')">
                {{ formatCardStatus(row.status) }}
              </span>
            } @else {
              <span class="text-xs text-slate-400">-</span>
            }
          </ng-template>

          <!-- Issued Date Cell -->
          <ng-template #dateCell let-row="row">
            @if (row.issued_date || row.created_at) {
              <span class="text-xs text-slate-600">
                {{ (row.issued_date || row.created_at) | date: 'mediumDate' }}
              </span>
            } @else {
              <span class="text-xs text-slate-400">-</span>
            }
          </ng-template>
        </app-table>

        @if (total() > 0) {
          <app-pagination
            [total]="total()"
            [currentPage]="page()"
            [limit]="limit"
            itemLabel="residents"
            (onPageChange)="onPageChange($event)"
            (onLimitChange)="onLimitChange($event)" />
        }
      </app-card>

      <!-- Registration Card Modal -->
      <app-modal [open]="showModal()" title="Registration Card" (onClose)="closeModal()" containerClass="max-w-3xl">
        @if (selectedResident(); as res) {
          <div class="space-y-4">
            <!-- Header Card -->
            <div class="bg-[#fff9f3] border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
              <div class="flex items-center gap-3.5 min-w-0">
                <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-50 border-2 border-orange-500 p-0.5 shadow-xs flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                  @if (res.photo && !res._modalPhotoError) {
                    <img [src]="photoUrl(res.photo)" (error)="res._modalPhotoError = true" alt="Photo" class="w-full h-full object-cover rounded-full">
                  } @else {
                    <svg class="w-8 h-8 sm:w-9 sm:h-9 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  }
                </div>
                <div class="min-w-0">
                  <h3 class="text-base font-bold text-slate-900 leading-snug">{{ formatResidentName(res) }}</h3>
                  <p class="font-bold text-slate-600 text-xs mt-0.5">{{ res.resident_code || 'No Code' }}</p>
                  <div class="mt-0.5">
                    @if (isRegistered(res)) {
                      <span class="text-emerald-700 font-bold text-xs">Card Registered</span>
                    } @else {
                      <span class="text-orange-600 font-bold text-xs">Pending Registration</span>
                    }
                  </div>
                </div>
              </div>

              <div class="text-right flex flex-col items-end gap-2 shrink-0 pl-4 border-l border-orange-200">
                <span class="px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100/70 text-emerald-700 border border-emerald-200">
                  {{ res.resident_status || 'ACTIVE' }}
                </span>
                <div class="flex items-center gap-1.5 text-xs text-slate-500">
                  <svg class="w-4 h-4 text-orange-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <div class="text-left">
                    <span class="text-[10px] text-slate-400 block leading-tight">Registered on</span>
                    <span class="font-bold text-slate-700 text-xs leading-tight">{{ (res.resident_created_at || res.created_at) | date:'MMM d, y' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- RFID Card Registration & Status Section -->
            <div class="space-y-2 pt-1">
              <p class="text-[11px] font-bold uppercase tracking-wide text-slate-400 px-1">Barangay ID / RFID Card Registration</p>
              
              @if (!isRegistered(res)) {
                <!-- Registration Form (When Resident Has No Active Card) -->
                <div class="bg-orange-50/50 border border-orange-200 rounded-xl p-4 space-y-3">
                  <div class="flex items-center gap-2 text-orange-900 font-bold text-sm">
                    <svg class="w-4 h-4 text-orange-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 9.5h8M7 12h8" stroke-linecap="round"/>
                    </svg>
                    <span>Register New RFID Card</span>
                  </div>
                  <p class="text-xs text-slate-600">
                    Scan the resident's physical RFID card on the reader or enter the card UID below to activate their Barangay ID.
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
                      (click)="registerCard(res)"
                      [disabled]="registering()"
                      class="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-2xs transition disabled:opacity-50 cursor-pointer"
                    >
                      @if (registering()) {
                        <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Registering...</span>
                      } @else {
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                        <span>Confirm & Register Card</span>
                      }
                    </button>
                  </div>
                </div>
              } @else {
                <!-- Registered Card Information (Active Card Details & Controls) -->
                <div class="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                      <span>Active RFID Card Assigned</span>
                    </div>
                    <span [class]="'px-2.5 py-0.5 rounded-full text-xs font-bold border ' + (res.status === 'Active' || res.status === 'ACTIVE' || res.card_status === 'Active' || res.card_status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300')">
                      {{ formatCardStatus(res.status || res.card_status) }}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white/80 p-3 rounded-lg border border-emerald-100">
                    <div>
                      <span class="text-slate-400 font-medium block">Card UID</span>
                      <span class="font-mono font-bold text-slate-900 text-sm">{{ res.card_uid }}</span>
                    </div>
                    <div>
                      <span class="text-slate-400 font-medium block">Issued Date</span>
                      <span class="font-bold text-slate-800">{{ (res.issued_date || res.created_at) ? ((res.issued_date || res.created_at) | date:'mediumDate') : '-' }}</span>
                    </div>
                    <div>
                      <span class="text-slate-400 font-medium block">Expiration Date</span>
                      <span class="font-bold text-slate-800">{{ res.expiration_date ? (res.expiration_date | date:'mediumDate') : 'Never (Permanent)' }}</span>
                    </div>
                  </div>

                  <p class="text-[11px] text-slate-500 italic">
                    This resident is already linked to an active RFID card. Duplicate registration for this resident is prevented.
                  </p>

                  @if (res.rfid_card_id) {
                    <div class="flex items-center justify-between pt-2 border-t border-emerald-100 text-xs">
                      <span class="text-slate-500 font-medium">Card Status Actions:</span>
                      <div class="flex gap-2">
                        <button
                          type="button"
                          [disabled]="res.status === 'Active' || res.status === 'ACTIVE' || updating()"
                          (click)="updateCardStatus(res.rfid_card_id!, 'Active')"
                          class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition cursor-pointer"
                        >
                          Activate
                        </button>
                        <button
                          type="button"
                          [disabled]="res.status === 'Suspended' || res.status === 'SUSPENDED' || updating()"
                          (click)="updateCardStatus(res.rfid_card_id!, 'Suspended')"
                          class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 transition cursor-pointer"
                        >
                          Suspend
                        </button>
                        <button
                          type="button"
                          [disabled]="res.status === 'Revoked' || res.status === 'REVOKED' || updating()"
                          (click)="updateCardStatus(res.rfid_card_id!, 'Revoked')"
                          class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40 transition cursor-pointer"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Personal Information Details (Identical to Resident Profile layout) -->
            <div class="space-y-1">
              <p class="text-[11px] font-bold uppercase tracking-wide text-slate-400 px-1">Personal Information</p>
              <div class="grid grid-cols-2 gap-y-3 gap-x-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div><span class="text-slate-400 font-medium block">Birth Date</span><span class="font-bold text-slate-800">{{ res.birth_date ? (res.birth_date | date:'MMMM d, y') : '-' }}</span></div>
                <div><span class="text-slate-400 font-medium block">Place of Birth</span><span class="font-bold text-slate-800">{{ res.birth_place || '-' }}</span></div>
                <div><span class="text-slate-400 font-medium block">Gender</span><span class="font-bold text-slate-800 capitalize">{{ res.gender || '-' }}</span></div>
                <div><span class="text-slate-400 font-medium block">Civil Status</span><span class="font-bold text-slate-800 capitalize">{{ res.civil_status || '-' }}</span></div>
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
                @if (res.emergency_contact_name || res.emergency_contact_number) {
                  <div class="col-span-2 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div class="flex items-center gap-1.5">
                      <span class="text-slate-400 font-medium">Emergency Contact:</span>
                      <strong class="text-slate-800">{{ res.emergency_contact_name || '-' }}</strong>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-slate-400 font-medium">Phone:</span>
                      <strong class="text-slate-800">{{ res.emergency_contact_number || '-' }}</strong>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </app-modal>
    </div>
  `
})
export class RfidComponent implements OnInit, OnDestroy {
  cards = signal<RfidCard[]>([]);
  loading = signal(true);
  search = signal('');
  statusFilter = signal('');
  page = signal(1);
  limit = 10;
  total = signal(0);
  sortColumn = signal('resident_name');
  sortDirection = signal<'ASC' | 'DESC'>('ASC');

  showModal = signal(false);
  selectedResident = signal<RfidCard | null>(null);
  regCardUid = signal('');
  regExpirationDate = signal(this.computeDefaultExpiry());
  regError = signal('');
  registering = signal(false);
  updating = signal(false);

  // USB RFID Reader scanner detection & duplicate validation state
  scanDetected = signal(false);
  uidChecking = signal(false);
  uidStatus = signal<{ type: 'available' | 'duplicate' | 'invalid' | 'self'; message: string } | null>(null);

  private uidCheckTimer: any = null;
  private scanDetectedTimer: any = null;
  private scanBuffer: string = '';
  private lastKeyTime: number = 0;
  private readonly MAX_KEY_INTERVAL_MS = 65;

  columns: TableColumn[] = [
    { key: 'resident_name', label: 'Resident Name', sortable: true },
    { key: 'card_uid', label: 'Card UID', sortable: true },
    { key: 'registration_status', label: 'Registration', sortable: true },
    { key: 'status', label: 'Card Status', sortable: true },
    { key: 'issued_date', label: 'Issued Date' }
  ];

  private sseSubscription: any = null;
  private readonly assetBase = environment.apiUrl.replace(/\/api\/v1$/, '');

  private computeDefaultExpiry(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  constructor(
    private rfidService: RfidService,
    private residentService: ResidentService,
    private notificationService: NotificationService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCards();
    this.connectToUpdates();

    this.route.queryParams.subscribe(params => {
      const resId = params['residentId'] ? parseInt(params['residentId'], 10) : undefined;
      if (resId) {
        this.openModalForResidentId(resId);
        this.router.navigate([], { queryParams: { new: null, residentId: null }, queryParamsHandling: 'merge' });
      }
    });
  }

  ngOnDestroy() {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
    }
  }

  private connectToUpdates() {
    this.sseSubscription = this.notificationService.sse$.subscribe(event => {
      if (
        event?.type?.startsWith('application-') ||
        event?.type?.startsWith('resident-') ||
        event?.type?.startsWith('rfid-')
      ) {
        this.loadCards();
      }
    });
  }

  loadCards() {
    this.loading.set(true);
    this.rfidService.getAll({
      search: this.search(),
      status: this.statusFilter() || undefined,
      page: this.page(),
      limit: this.limit,
      sortBy: this.sortColumn(),
      sortOrder: this.sortDirection()
    }).subscribe({
      next: (res) => {
        this.cards.set(res.data);
        this.total.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(value: string) {
    this.search.set(value);
    this.page.set(1);
    this.loadCards();
  }

  onStatusFilter(value: string) {
    this.statusFilter.set(value);
    this.page.set(1);
    this.loadCards();
  }

  onSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('ASC');
    }
    this.loadCards();
  }

  onPageChange(page: number) {
    this.page.set(page);
    this.loadCards();
  }

  onLimitChange(limit: number) {
    this.limit = limit;
    this.page.set(1);
    this.loadCards();
  }

  onRowClick(card: RfidCard) {
    this.openModalWithCard(card);
  }

  openModalWithCard(card: RfidCard) {
    this.selectedResident.set({ ...card });
    this.regCardUid.set('');
    this.regExpirationDate.set(this.computeDefaultExpiry());
    this.regError.set('');
    this.scanDetected.set(false);
    this.uidStatus.set(null);
    this.uidChecking.set(false);
    this.scanBuffer = '';
    this.lastKeyTime = 0;
    this.showModal.set(true);

    // If card has incomplete resident fields, enrich via residentService
    if (card.resident_id && !card.birth_date && !card.address_line) {
      this.residentService.getById(card.resident_id).subscribe({
        next: (res) => {
          if (res.data) {
            const current = this.selectedResident();
            if (current && current.resident_id === card.resident_id) {
              this.selectedResident.set({
                ...current,
                ...res.data,
                card_uid: current.card_uid,
                status: current.status,
                registration_status: current.registration_status,
                rfid_card_id: current.rfid_card_id
              });
            }
          }
        }
      });
    }
  }

  openModalForResidentId(residentId: number) {
    const existing = this.cards().find(c => c.resident_id === residentId);
    if (existing) {
      this.openModalWithCard(existing);
      return;
    }

    this.residentService.getById(residentId).subscribe({
      next: (res) => {
        if (res.data) {
          const r = res.data;
          const card: RfidCard = {
            ...r,
            resident_id: r.resident_id,
            resident_name: `${r.first_name} ${r.last_name}`,
            registration_status: 'Not Registered',
            resident_status: r.status
          };
          this.openModalWithCard(card);
        }
      }
    });
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedResident.set(null);
    this.regCardUid.set('');
    this.regExpirationDate.set(this.computeDefaultExpiry());
    this.regError.set('');
    this.scanDetected.set(false);
    this.uidStatus.set(null);
    this.uidChecking.set(false);
    this.scanBuffer = '';
    this.lastKeyTime = 0;
  }

  @HostListener('window:keydown', ['$event'])
  onWindowKeyDown(event: KeyboardEvent) {
    if (!this.showModal()) return;
    const res = this.selectedResident();
    if (!res || this.isRegistered(res)) return;

    const currentTime = Date.now();
    const key = event.key;

    // Enter key signals end of USB RFID scanner burst
    if (key === 'Enter') {
      const buffer = this.scanBuffer.trim();
      const timeSinceLastKey = currentTime - this.lastKeyTime;

      // Check if we accumulated a fast scanner burst
      // Most RFID cards have 4 to 32 hex/decimal chars and keys arrive < 65ms apart
      if (buffer.length >= 4 && buffer.length <= 32 && timeSinceLastKey <= 150) {
        event.preventDefault();
        event.stopPropagation();
        this.processScannedUid(buffer);
      }
      this.scanBuffer = '';
      this.lastKeyTime = 0;
      return;
    }

    // Ignore non-printable modifier/navigation keys
    if (key.length !== 1) {
      if (this.lastKeyTime > 0 && currentTime - this.lastKeyTime > this.MAX_KEY_INTERVAL_MS) {
        this.scanBuffer = '';
        this.lastKeyTime = 0;
      }
      return;
    }

    // Check interval from previous character
    if (this.lastKeyTime > 0 && (currentTime - this.lastKeyTime) > this.MAX_KEY_INTERVAL_MS) {
      // Human typing speed (> 65ms per key) -> reset buffer to start fresh with this key
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
    const clean = value.trim();
    this.regCardUid.set(clean);
    this.regError.set('');
    if (this.uidCheckTimer) clearTimeout(this.uidCheckTimer);

    if (!clean) {
      this.uidStatus.set(null);
      return;
    }

    this.uidCheckTimer = setTimeout(() => {
      this.validateCardUid(clean);
    }, 350);
  }

  validateCardUid(uid: string) {
    const cleanUid = uid.trim();
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
          const resName = this.formatResidentName(r);
          const resCode = r.resident_code || `RES-${r.resident_id}`;
          const currentRes = this.selectedResident();
          if (currentRes && currentRes.resident_id === r.resident_id) {
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

  isRegistered(res: RfidCard): boolean {
    return (
      res.registration_status === 'Registered' ||
      (!!res.card_uid && (res.status === 'Active' || res.status === 'ACTIVE' || res.card_status === 'Active' || res.card_status === 'ACTIVE'))
    );
  }

  photoUrl(photo: string | null | undefined): string {
    if (!photo) return '';
    if (photo.startsWith('data:') || photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('/')) {
      return photo;
    }
    return `${this.assetBase}/uploads/${photo}`;
  }

  formatResidentName(res: RfidCard): string {
    const parts = [res.first_name, res.middle_name, res.last_name, res.suffix].filter(Boolean);
    return parts.join(' ') || res.resident_name || '-';
  }

  formatFullAddress(res: RfidCard): string {
    if (res.address_line) return res.address_line;
    const parts = [
      res.house_number ? `#${res.house_number}` : '',
      res.lot ? `Lot ${res.lot}` : '',
      res.block ? `Blk ${res.block}` : '',
      res.street,
      res.subdivision,
      res.purok_zone ? `Purok ${res.purok_zone}` : '',
      res.sitio ? `Sitio ${res.sitio}` : ''
    ].filter(Boolean);
    return parts.join(', ') || '-';
  }

  getInitials(row: RfidCard): string {
    const first = (row.first_name || '')[0] || '';
    const last = (row.last_name || '')[0] || '';
    if (first || last) return (first + last).toUpperCase();
    const name = row.resident_name || '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return 'R';
  }

  formatCardStatus(status: string | null | undefined): string {
    if (!status) return '-';
    const s = status.toUpperCase();
    if (s === 'ACTIVE') return 'Active';
    if (s === 'SUSPENDED') return 'Suspended';
    if (s === 'CANCELLED') return 'Cancelled';
    if (s === 'REVOKED') return 'Revoked';
    return status;
  }

  registerCard(res: RfidCard) {
    const uid = this.regCardUid().trim();
    if (!uid) {
      this.regError.set('Please enter or scan a Card UID.');
      return;
    }

    if (this.uidStatus()?.type === 'duplicate') {
      this.regError.set(this.uidStatus()?.message || 'Cannot register: Card UID is already assigned to another resident.');
      return;
    }

    this.regError.set('');
    this.registering.set(true);

    this.rfidService.register({
      residentId: res.resident_id,
      cardUid: uid,
      expirationDate: this.regExpirationDate() || undefined
    } as any).subscribe({
      next: (result) => {
        this.registering.set(false);
        const cardData = result.data || {};
        this.toastService.success('RFID Registered', `Card UID ${uid} assigned to ${this.formatResidentName(res)}`);
        
        // Update the modal resident state to reflect newly registered card
        const updated: RfidCard = {
          ...res,
          card_uid: uid,
          rfid_card_id: cardData.rfid_card_id || res.rfid_card_id,
          status: 'Active',
          card_status: 'Active',
          registration_status: 'Registered',
          issued_date: cardData.issued_date || new Date().toISOString(),
          expiration_date: this.regExpirationDate() || null
        };
        this.selectedResident.set(updated);
        this.uidStatus.set(null);
        this.scanDetected.set(false);
        this.loadCards();
      },
      error: (err) => {
        this.registering.set(false);
        this.regError.set(err.error?.message || 'Failed to register RFID card. UID may already exist.');
      }
    });
  }

  updateCardStatus(id: number, status: string) {
    this.updating.set(true);
    this.rfidService.updateStatus(id, status).subscribe({
      next: () => {
        this.updating.set(false);
        this.toastService.info('Card Status Updated', `Status changed to ${status}`);
        const current = this.selectedResident();
        if (current) {
          this.selectedResident.set({
            ...current,
            status,
            card_status: status
          });
        }
        this.loadCards();
      },
      error: (err) => {
        this.updating.set(false);
        alert(err.error?.message || 'Failed to update RFID card status.');
      }
    });
  }
}

