import { Component, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, PortalAccount } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'portal-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <!-- Breadcrumb Navigation -->
      <nav class="flex items-center gap-2 text-xs font-medium text-slate-500 mb-4" aria-label="Breadcrumb">
        <a routerLink="/" class="hover:text-orange-600 transition flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          Home
        </a>
        <span>/</span>
        <span class="text-slate-800 font-semibold">My Profile</span>
      </nav>

      <!-- Section Title -->
      <div>
        <p class="text-xs font-black uppercase tracking-wider text-orange-600">Resident Profile</p>
        <h1 class="text-3xl sm:text-4xl font-black text-[#0f172a] mt-1 tracking-tight">Personal Information</h1>
        <p class="text-slate-500 mt-2 leading-relaxed max-w-3xl text-sm sm:text-base">
          Your account is linked to your verified Barangay ID and resident record.
        </p>
      </div>

      <!-- Success Notification Banner -->
      @if (saveSuccess()) {
        <div class="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <p class="font-bold">Profile Updated Successfully</p>
              <p class="text-xs text-emerald-700 mt-0.5">Your updated details have been saved to your resident record.</p>
            </div>
          </div>
          <button (click)="saveSuccess.set(false)" class="text-emerald-600 hover:text-emerald-800 p-1 rounded-lg cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      }

      <div class="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <!-- ============ LEFT MAIN COLUMN: UNIFIED RESIDENT INFORMATION CARD ============ -->
        <div class="lg:col-span-2 space-y-6">
          <div class="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            @if (auth.currentUser(); as user) {
              <!-- Resident Identity Header -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div class="flex items-center gap-4">
                  <!-- Profile Photo / Initials -->
                  <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-50 border-2 border-orange-200 text-orange-600 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    @if (user.photo) {
                      <img [src]="photoUrl(user.photo)" alt="Profile photo" class="w-full h-full object-cover" />
                    } @else {
                      <span class="text-xl sm:text-2xl font-black">{{ initials(user) }}</span>
                    }
                  </div>

                  <!-- Name, Email, Status (Email placed under Name, Status placed under Email) -->
                  <div class="min-w-0">
                    <h2 class="text-xl sm:text-2xl font-black text-slate-900 leading-tight truncate">{{ fullName(user) }}</h2>
                    <p class="text-xs sm:text-sm text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                      {{ isEditing() ? (form.email || user.email) : user.email }}
                    </p>
                    <div class="mt-1.5">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active Resident
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Resident ID Badge -->
                <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-700 font-bold text-sm shrink-0 self-start sm:self-center shadow-2xs">
                  <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/></svg>
                  <span>{{ user.resident_code || user.account_id || '—' }}</span>
                </div>
              </div>

              <!-- Error Alert in Edit Mode -->
              @if (isEditing() && saveError()) {
                <div class="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-2.5 animate-in fade-in duration-150">
                  <svg class="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <span>{{ saveError() }}</span>
                </div>
              }

              <!-- ============ UNIFIED INFORMATION CARD SECTIONS ============ -->
              <div class="mt-6 divide-y divide-slate-100">

                <!-- 1. PERSONAL & DEMOGRAPHIC DETAILS -->
                <div class="pb-6">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                      Personal & Demographic Details
                    </h3>
                    @if (isEditing()) {
                      <span class="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                        Editing Mode
                      </span>
                    }
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                    <!-- Birth Date (Permanent) -->
                    <div>
                      <span class="text-slate-400 font-medium block">Birth Date</span>
                      <span class="font-semibold text-slate-800 text-sm mt-0.5 block">
                        {{ (user.birth_date | date:'MMMM d, y') || '—' }}
                      </span>
                    </div>

                    <!-- Place of Birth (Editable) -->
                    <div>
                      <span class="text-slate-400 font-medium block">Place of Birth</span>
                      @if (isEditing()) {
                        <input type="text" [(ngModel)]="form.birth_place" placeholder="City / Province"
                               class="w-full mt-1 h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition" />
                      } @else {
                        <span class="font-semibold text-slate-800 text-sm mt-0.5 block">{{ user.birth_place || '—' }}</span>
                      }
                    </div>

                    <!-- Gender (Permanent) -->
                    <div>
                      <span class="text-slate-400 font-medium block">Gender</span>
                      <span class="font-semibold text-slate-800 text-sm mt-0.5 block capitalize">
                        {{ user.gender || '—' }}
                      </span>
                    </div>

                    <!-- Civil Status (Editable) -->
                    <div>
                      <span class="text-slate-400 font-medium block">Civil Status</span>
                      @if (isEditing()) {
                        <select [(ngModel)]="form.civil_status"
                                class="w-full mt-1 h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition cursor-pointer">
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Widowed">Widowed</option>
                          <option value="Separated">Separated</option>
                          <option value="Divorced">Divorced</option>
                        </select>
                      } @else {
                        <span class="font-semibold text-slate-800 text-sm mt-0.5 block">{{ user.civil_status || '—' }}</span>
                      }
                    </div>

                    <!-- Religion (Editable) -->
                    <div>
                      <span class="text-slate-400 font-medium block">Religion</span>
                      @if (isEditing()) {
                        <input type="text" [(ngModel)]="form.religion" placeholder="e.g. Roman Catholic"
                               class="w-full mt-1 h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition" />
                      } @else {
                        <span class="font-semibold text-slate-800 text-sm mt-0.5 block">{{ user.religion || '—' }}</span>
                      }
                    </div>

                    <!-- Occupation (Editable) -->
                    <div>
                      <span class="text-slate-400 font-medium block">Occupation</span>
                      @if (isEditing()) {
                        <input type="text" [(ngModel)]="form.occupation" placeholder="e.g. Employee, Business Owner"
                               class="w-full mt-1 h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition" />
                      } @else {
                        <span class="font-semibold text-slate-800 text-sm mt-0.5 block">{{ user.occupation || '—' }}</span>
                      }
                    </div>
                  </div>
                </div>

                <!-- 2. CONTACT & RESIDENTIAL ADDRESS -->
                <div class="py-6">
                  <h3 class="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-4">
                    <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                    Contact & Residential Address
                  </h3>

                  <!-- Contact Number & Email -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
                    <div>
                      <span class="text-slate-400 font-medium block">Contact Number <span *ngIf="isEditing()" class="text-red-500">*</span></span>
                      @if (isEditing()) {
                        <input type="tel" [(ngModel)]="form.contact_number" placeholder="09123456789"
                               class="w-full mt-1 h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition" />
                        <p class="text-[10px] text-slate-400 mt-0.5">11-digit mobile number</p>
                      } @else {
                        <span class="font-semibold text-slate-800 text-sm mt-0.5 block">{{ user.contact_number || '—' }}</span>
                      }
                    </div>

                    <div>
                      <span class="text-slate-400 font-medium block">Email Address <span *ngIf="isEditing()" class="text-red-500">*</span></span>
                      @if (isEditing()) {
                        <input type="email" [(ngModel)]="form.email" placeholder="you@example.com"
                               class="w-full mt-1 h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition" />
                        <p class="text-[10px] text-slate-400 mt-0.5">Used for portal login notifications</p>
                      } @else {
                        <span class="font-semibold text-slate-800 text-sm mt-0.5 block truncate">{{ user.email }}</span>
                      }
                    </div>
                  </div>

                  <!-- Complete Address -->
                  <div class="text-xs pt-3 border-t border-slate-100">
                    <span class="text-slate-400 font-medium block">Complete Address</span>
                    @if (isEditing()) {
                      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                        <div>
                          <label class="text-[10px] font-bold text-slate-500 block mb-0.5">House No.</label>
                          <input type="text" [(ngModel)]="form.house_number" placeholder="e.g. 12"
                                 class="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-orange-500 outline-none" />
                        </div>
                        <div>
                          <label class="text-[10px] font-bold text-slate-500 block mb-0.5">Block No.</label>
                          <input type="text" [(ngModel)]="form.block" placeholder="e.g. 15"
                                 class="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-orange-500 outline-none" />
                        </div>
                        <div>
                          <label class="text-[10px] font-bold text-slate-500 block mb-0.5">Lot No.</label>
                          <input type="text" [(ngModel)]="form.lot" placeholder="e.g. 20 B"
                                 class="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-orange-500 outline-none" />
                        </div>
                        <div>
                          <label class="text-[10px] font-bold text-slate-500 block mb-0.5">Street</label>
                          <input type="text" [(ngModel)]="form.street" placeholder="e.g. Samaria"
                                 class="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-orange-500 outline-none" />
                        </div>
                        <div>
                          <label class="text-[10px] font-bold text-slate-500 block mb-0.5">Subdivision</label>
                          <input type="text" [(ngModel)]="form.subdivision" placeholder="e.g. Pleasant Hills"
                                 class="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-orange-500 outline-none" />
                        </div>
                        <div>
                          <label class="text-[10px] font-bold text-slate-500 block mb-0.5">Purok / Zone</label>
                          <input type="text" [(ngModel)]="form.purok_zone" placeholder="e.g. Zone 4"
                                 class="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-orange-500 outline-none" />
                        </div>
                      </div>
                      <div class="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
                        <span class="text-slate-400 font-medium">Address Preview: </span>
                        <span class="font-semibold text-slate-700">{{ previewAddress() || 'Enter address details above' }}</span>
                      </div>
                    } @else {
                      <span class="font-semibold text-slate-800 text-sm mt-0.5 block leading-relaxed">{{ displayAddress(user) }}</span>
                    }
                  </div>
                </div>

                <!-- 3. EMERGENCY CONTACT DETAILS -->
                <div class="pt-6">
                  <h3 class="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-4">
                    <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                    Emergency Contact Details
                  </h3>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span class="text-slate-400 font-medium block">Emergency Contact Person</span>
                      @if (isEditing()) {
                        <input type="text" [(ngModel)]="form.emergency_contact_name" placeholder="Full Name"
                               class="w-full mt-1 h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition" />
                      } @else {
                        <span class="font-semibold text-slate-800 text-sm mt-0.5 block">{{ user.emergency_contact_name || '—' }}</span>
                      }
                    </div>

                    <div>
                      <span class="text-slate-400 font-medium block">Emergency Contact Number</span>
                      @if (isEditing()) {
                        <input type="tel" [(ngModel)]="form.emergency_contact_number" placeholder="09123456789"
                               class="w-full mt-1 h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition" />
                      } @else {
                        <span class="font-semibold text-slate-800 text-sm mt-0.5 block">{{ user.emergency_contact_number || '—' }}</span>
                      }
                    </div>
                  </div>
                </div>

              </div>

              <!-- ============ CENTERED ACTION BUTTONS ============ -->
              <div class="mt-8 flex justify-center items-center pt-4 border-t border-slate-100">
                @if (!isEditing()) {
                  <!-- Default State: Centered Edit Profile Button -->
                  <button
                    type="button"
                    (click)="startEditing()"
                    class="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm transition shadow-xs cursor-pointer active:scale-98">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    Edit Profile
                  </button>
                } @else {
                  <!-- Editing State: Centered Update & Cancel Actions -->
                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      (click)="cancelEditing()"
                      [disabled]="isSaving()"
                      class="px-6 py-2.5 rounded-2xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm transition cursor-pointer disabled:opacity-50">
                      Cancel
                    </button>
                    <button
                      type="button"
                      (click)="saveProfile()"
                      [disabled]="isSaving()"
                      class="inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm shadow-xs transition active:scale-98 cursor-pointer disabled:opacity-50">
                      @if (isSaving()) {
                        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      } @else {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                        <span>Update</span>
                      }
                    </button>
                  </div>
                }
              </div>
            } @else {
              <!-- Not Logged In State -->
              <div class="text-center py-8">
                <div class="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-4">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
                <h2 class="text-xl font-bold text-slate-900">Not signed in</h2>
                <p class="text-sm text-slate-500 mt-1">Please sign in to view and manage your resident profile.</p>
                <div class="mt-6">
                  <a routerLink="/login" class="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm transition shadow-xs">
                    Login to Portal
                  </a>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- ============ RIGHT SIDEBAR ============ -->
        <div class="space-y-6">
          <!-- 1. Account Status Card (Positioned First) -->
          <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-black uppercase tracking-wider text-slate-900">Account Status</h3>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
              </span>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/></svg>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-800">Barangay ID</p>
                  <p class="text-xs font-semibold text-emerald-600">Registered & Verified</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Need Assistance Card -->
          <div class="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50/70 to-amber-50/50 p-6 shadow-xs">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              </div>
              <h3 class="text-sm font-black text-slate-900">Need Assistance?</h3>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed mb-4">
              For inquiries, record corrections, or concerns, visit or contact the Barangay San Manuel office.
            </p>
            <a routerLink="/contact" class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-orange-300 hover:bg-orange-100/50 text-orange-700 font-bold text-xs transition shadow-2xs">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent {
  isEditing = signal(false);
  isSaving = signal(false);
  saveError = signal('');
  saveSuccess = signal(false);

  form: Partial<PortalAccount> = {};

  constructor(public auth: AuthService) {}

  startEditing(): void {
    const user = this.auth.currentUser();
    this.form = {
      contact_number: user?.contact_number || '',
      email: user?.email || '',
      civil_status: user?.civil_status || 'Single',
      occupation: user?.occupation || '',
      religion: user?.religion || '',
      birth_place: user?.birth_place || '',
      subdivision: user?.subdivision || '',
      street: user?.street || '',
      block: user?.block || '',
      lot: user?.lot || '',
      purok_zone: user?.purok_zone || '',
      house_number: user?.house_number || '',
      emergency_contact_name: user?.emergency_contact_name || '',
      emergency_contact_number: user?.emergency_contact_number || ''
    };
    this.saveError.set('');
    this.saveSuccess.set(false);
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.saveError.set('');
  }

  previewAddress(): string {
    const raw = [
      this.form.block ? (String(this.form.block).toLowerCase().startsWith('blk') ? this.form.block : `Blk ${this.form.block}`) : null,
      this.form.lot ? (String(this.form.lot).toLowerCase().startsWith('lot') ? this.form.lot : `Lot ${this.form.lot}`) : null,
      this.form.house_number ? `House ${this.form.house_number}` : null,
      this.form.street,
      this.form.subdivision,
      this.form.purok_zone
    ].filter(Boolean);

    const unique: string[] = [];
    for (const p of raw) {
      if (p && !unique.some(u => u.toLowerCase() === String(p).toLowerCase())) {
        unique.push(p);
      }
    }
    return unique.join(', ');
  }

  saveProfile(): void {
    if (!this.form.contact_number || !this.form.contact_number.trim()) {
      this.saveError.set('Contact number is required.');
      return;
    }

    const cleanPhone = this.form.contact_number.trim().replace(/[\s\-()]/g, '');
    if (!/^(09\d{9}|\+639\d{9})$/.test(cleanPhone)) {
      this.saveError.set('Contact number must be a valid 11-digit mobile number (e.g. 09123456789).');
      return;
    }

    if (!this.form.email || !this.form.email.trim()) {
      this.saveError.set('Email address is required.');
      return;
    }

    const cleanEmail = this.form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      this.saveError.set('Please provide a valid email address.');
      return;
    }

    if (this.form.emergency_contact_number && this.form.emergency_contact_number.trim()) {
      const cleanEmergPhone = this.form.emergency_contact_number.trim().replace(/[\s\-()]/g, '');
      if (!/^(09\d{9}|\+639\d{9})$/.test(cleanEmergPhone)) {
        this.saveError.set('Emergency contact number must be a valid 11-digit mobile number.');
        return;
      }
    }

    this.saveError.set('');
    this.isSaving.set(true);

    this.auth.updateProfile({
      contact_number: cleanPhone,
      email: cleanEmail,
      civil_status: this.form.civil_status,
      occupation: this.form.occupation?.trim() || null,
      religion: this.form.religion?.trim() || null,
      birth_place: this.form.birth_place?.trim() || null,
      house_number: this.form.house_number?.trim() || null,
      street: this.form.street?.trim() || null,
      subdivision: this.form.subdivision?.trim() || null,
      block: this.form.block?.trim() || null,
      lot: this.form.lot?.trim() || null,
      purok_zone: this.form.purok_zone?.trim() || null,
      emergency_contact_name: this.form.emergency_contact_name?.trim() || null,
      emergency_contact_number: this.form.emergency_contact_number?.trim() || null
    }).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.isEditing.set(false);
          this.saveSuccess.set(true);
        } else {
          this.saveError.set(res.message || 'Failed to update profile.');
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.saveError.set(err.error?.message || 'Failed to update profile. Please try again.');
      }
    });
  }

  fullName(user: { first_name?: string; middle_name?: string | null; last_name?: string; suffix?: string | null }): string {
    return [user.first_name, user.middle_name, user.last_name, user.suffix].filter(Boolean).join(' ').trim() || 'Resident';
  }

  initials(user: { first_name?: string; last_name?: string }): string {
    return ((user.first_name || '')[0] || '') + ((user.last_name || '')[0] || '') || 'R';
  }

  displayAddress(user: PortalAccount): string {
    if (user.address_line && user.address_line.trim()) {
      return user.address_line;
    }
    const raw = [
      user.block ? (String(user.block).toLowerCase().startsWith('blk') ? user.block : `Blk ${user.block}`) : null,
      user.lot ? (String(user.lot).toLowerCase().startsWith('lot') ? user.lot : `Lot ${user.lot}`) : null,
      user.house_number,
      user.street,
      user.subdivision,
      user.purok_zone
    ].filter(Boolean);

    const unique: string[] = [];
    for (const p of raw) {
      if (p && !unique.some(u => u.toLowerCase() === String(p).toLowerCase())) {
        unique.push(p);
      }
    }
    return unique.join(', ') || '—';
  }

  photoUrl(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const base = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
    const clean = url.replace(/^\/+/, '');
    if (clean.startsWith('uploads/')) {
      return `${base}/${clean}`;
    }
    return `${base}/uploads/${clean}`;
  }
}
