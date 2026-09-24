import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'portal-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <p class="text-xs font-black uppercase tracking-wider text-orange-600">Profile</p>
      <h1 class="text-3xl sm:text-4xl font-black text-[#0f172a] mt-1">Resident profile</h1>
      <p class="text-slate-500 mt-2 leading-relaxed">
        Your account is linked to your verified Barangay ID and resident record.
      </p>

      <div class="mt-8 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-xs">
        @if (auth.currentUser(); as user) {
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center shrink-0 overflow-hidden">
              @if (user.photo) {
                <img [src]="'/uploads/' + user.photo" alt="" class="w-full h-full object-cover" />
              } @else {
                <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              }
            </div>
            <div class="min-w-0">
              <h2 class="text-lg font-black text-slate-900 truncate">{{ fullName(user) }}</h2>
              <p class="text-sm text-slate-500">{{ user.email }}</p>
            </div>
          </div>

          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl border border-slate-200 p-4">
              <p class="text-[11px] font-black uppercase tracking-wider text-slate-400">Account ID</p>
              <p class="text-sm font-bold text-slate-800 mt-1">{{ user.account_id }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 p-4">
              <p class="text-[11px] font-black uppercase tracking-wider text-slate-400">Resident Code</p>
              <p class="text-sm font-bold text-slate-800 mt-1">{{ user.resident_code || '—' }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 p-4">
              <p class="text-[11px] font-black uppercase tracking-wider text-slate-400">Address</p>
              <p class="text-sm text-slate-700 mt-1">{{ user.address_line || '—' }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 p-4">
              <p class="text-[11px] font-black uppercase tracking-wider text-slate-400">Contact</p>
              <p class="text-sm text-slate-700 mt-1">{{ user.contact_number || '—' }}</p>
            </div>
          </div>

          <div class="mt-6 rounded-xl bg-orange-50 border border-orange-200 p-4 text-sm text-orange-900 leading-relaxed">
            Your Account ID is separate from your Barangay ID number and RFID UID. Keep your login credentials confidential.
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <a routerLink="/requests"
               class="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm transition">
              My Requests
            </a>
            <button
              type="button"
              (click)="showLogoutModal.set(true)"
              class="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-orange-400 text-slate-800 font-bold text-sm transition cursor-pointer">
              Logout
            </button>
          </div>
        } @else {
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900">Not signed in</h2>
              <p class="text-sm text-slate-500">Sign in to view your account details.</p>
            </div>
          </div>

          <div class="mt-6">
            <a routerLink="/login"
               class="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm transition">
              Login to Portal
            </a>
          </div>
        }
      </div>

      <!-- Logout Confirmation Modal -->
      @if (showLogoutModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
             role="dialog"
             aria-modal="true"
             aria-labelledby="profile-logout-modal-title"
             (click)="showLogoutModal.set(false)">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 transform transition-all animate-in zoom-in-95 duration-150"
               (click)="$event.stopPropagation()">
            <div class="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-2xs">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </div>

            <div class="text-center">
              <h3 id="profile-logout-modal-title" class="text-lg font-black text-slate-900">Confirm Log Out</h3>
              <p class="text-sm text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to log out of your Barangay San Manuel Online Portal account?
              </p>
            </div>

            <div class="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                (click)="showLogoutModal.set(false)"
                class="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm transition cursor-pointer flex items-center justify-center">
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmLogout()"
                class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Log Out
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ProfileComponent {
  showLogoutModal = signal(false);

  constructor(public auth: AuthService) {}

  confirmLogout(): void {
    this.showLogoutModal.set(false);
    this.auth.logout();
  }

  fullName(user: { first_name?: string; middle_name?: string | null; last_name?: string; suffix?: string | null }): string {
    return [user.first_name, user.middle_name, user.last_name, user.suffix].filter(Boolean).join(' ').trim() || 'Resident';
  }
}
