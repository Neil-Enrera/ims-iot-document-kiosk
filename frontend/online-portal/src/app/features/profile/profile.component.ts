import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'portal-profile',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <p class="text-xs font-black uppercase tracking-wider text-orange-600">Profile</p>
      <h1 class="text-3xl sm:text-4xl font-black text-[#0f172a] mt-1">Resident profile</h1>
      <p class="text-slate-500 mt-2 leading-relaxed">
        Your account is linked to your verified Barangay ID and resident record.
      </p>

      <div class="mt-8 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-xs">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-black text-slate-900">Not signed in</h2>
            <p class="text-sm text-slate-500">Profile details will appear after login is enabled.</p>
          </div>
        </div>

        <div class="mt-6 grid gap-3 sm:grid-cols-2">
          <div class="rounded-xl border border-dashed border-slate-300 p-4">
            <p class="text-[11px] font-black uppercase tracking-wider text-slate-400">Account ID</p>
            <p class="text-sm text-slate-400 mt-1">BSM-000000</p>
          </div>
          <div class="rounded-xl border border-dashed border-slate-300 p-4">
            <p class="text-[11px] font-black uppercase tracking-wider text-slate-400">Barangay ID</p>
            <p class="text-sm text-slate-400 mt-1">Verified residents only</p>
          </div>
        </div>

        <div class="mt-6 rounded-xl bg-orange-50 border border-orange-200 p-4 text-sm text-orange-900 leading-relaxed">
          Portal accounts are created automatically after your Barangay ID application is approved and issued.
          Login will be enabled in a later phase.
        </div>

        <div class="mt-6">
          <a routerLink="/contact"
             class="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm transition">
            Contact Barangay Office
          </a>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent {}
