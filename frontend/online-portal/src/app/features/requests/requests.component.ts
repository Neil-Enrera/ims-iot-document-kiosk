import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'portal-requests',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <p class="text-xs font-black uppercase tracking-wider text-orange-600">My Requests</p>
      <h1 class="text-3xl sm:text-4xl font-black text-[#0f172a] mt-1">Your document requests</h1>
      <p class="text-slate-500 mt-2 leading-relaxed">
        Track submitted requests and their status from Submitted to Ready for Release.
      </p>

      <div class="mt-8 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-xs">
        <div class="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 text-orange-500 mx-auto flex items-center justify-center">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <h2 class="mt-5 text-xl font-black text-slate-900">Request history will appear here</h2>
        <p class="mt-2 text-sm text-slate-500 leading-relaxed max-w-lg mx-auto">
          This page becomes available after portal login is enabled. You'll see request numbers, statuses,
          and correction notices for every online submission.
        </p>
        <div class="mt-6">
          <a routerLink="/services"
             class="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm transition">
            Browse Services
          </a>
        </div>
      </div>
    </div>
  `
})
export class RequestsComponent {}
