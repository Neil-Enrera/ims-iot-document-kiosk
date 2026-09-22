import { Component } from '@angular/core';

@Component({
  selector: 'portal-contact',
  standalone: true,
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <p class="text-xs font-black uppercase tracking-wider text-orange-600">Contact Us</p>
      <h1 class="text-3xl sm:text-4xl font-black text-[#0f172a] mt-1">Get in touch</h1>
      <p class="text-slate-500 mt-2 leading-relaxed max-w-2xl">
        Reach Barangay San Manuel for questions about document requests, Barangay ID application, or online portal access.
      </p>

      <div class="mt-8 grid gap-6 lg:grid-cols-2">
        <div class="rounded-3xl overflow-hidden border border-slate-200 shadow-xs">
          <img src="Barangay Hall.png" alt="Barangay San Manuel Hall" class="w-full h-56 sm:h-72 object-cover" />
        </div>

        <div class="space-y-4">
          <div class="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
            <p class="text-[11px] font-black uppercase tracking-wider text-slate-400">Office</p>
            <p class="mt-1 font-bold text-slate-900">Barangay San Manuel</p>
            <p class="text-sm text-slate-500">City of San Jose del Monte, Bulacan</p>
          </div>

          <div class="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
            <p class="text-[11px] font-black uppercase tracking-wider text-slate-400">Online Portal Access</p>
            <p class="mt-1 text-sm text-slate-600 leading-relaxed">
              Don't have an online account? Visit Barangay San Manuel to apply for a Barangay ID and activate your online portal account.
            </p>
          </div>

          <div class="rounded-2xl bg-orange-50 border border-orange-200 p-5">
            <p class="text-[11px] font-black uppercase tracking-wider text-orange-700">Office Hours</p>
            <p class="mt-1 text-sm text-orange-900 leading-relaxed">
              Contact the barangay office during business hours for document verification and releases.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ContactComponent {}
