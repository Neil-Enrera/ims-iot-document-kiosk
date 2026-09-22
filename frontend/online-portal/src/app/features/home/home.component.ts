import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'portal-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="relative overflow-hidden bg-gradient-to-b from-orange-50 via-white to-slate-50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid gap-10 lg:grid-cols-2 items-center">
        <div class="space-y-6">
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider">
            Remote Online Document Request
          </span>
          <h1 class="text-4xl sm:text-5xl font-black tracking-tight text-[#0f172a] leading-tight">
            Request barangay documents from home.
          </h1>
          <p class="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
            The Barangay San Manuel Online Portal lets verified residents submit document requests remotely,
            upload requirements, and monitor status — processed through the same system used by the kiosk.
          </p>
          <div class="flex flex-wrap gap-3">
            <a routerLink="/services"
               class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm shadow-lg transition">
              Browse Services
            </a>
            <a routerLink="/contact"
               class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 hover:border-orange-400 text-slate-800 font-bold text-sm transition">
              Contact Us
            </a>
          </div>
        </div>

        <div class="relative">
          <div class="rounded-3xl overflow-hidden border border-orange-200/70 shadow-xl">
            <img src="Barangay Hall.png" alt="Barangay San Manuel Hall"
                 class="w-full h-64 sm:h-80 object-cover" />
          </div>
          <div class="absolute -bottom-5 -left-4 bg-white border border-slate-200 rounded-2xl shadow-lg px-5 py-4">
            <p class="text-xs font-bold uppercase tracking-wider text-orange-600">Barangay ID Required</p>
            <p class="text-sm text-slate-600 mt-1">Online accounts are issued after Barangay ID approval.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <div class="text-center max-w-2xl mx-auto mb-10">
        <h2 class="text-2xl sm:text-3xl font-black text-[#0f172a]">How it works</h2>
        <p class="text-slate-500 mt-2 text-sm sm:text-base">Submit online, upload requirements, and track your request until release.</p>
      </div>

      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        @for (step of steps; track step.title) {
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div class="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center font-black">
              {{ step.number }}
            </div>
            <h3 class="mt-4 font-bold text-slate-900">{{ step.title }}</h3>
            <p class="mt-1.5 text-sm text-slate-500 leading-relaxed">{{ step.body }}</p>
          </div>
        }
      </div>
    </section>

    <section class="bg-white border-y border-slate-200">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid gap-8 md:grid-cols-3">
        <div>
          <h3 class="font-black text-[#0f172a] text-lg">Same centralized system</h3>
          <p class="text-sm text-slate-500 mt-2 leading-relaxed">Online and kiosk requests share one resident, transaction, and document workflow.</p>
        </div>
        <div>
          <h3 class="font-black text-[#0f172a] text-lg">Digital requirements</h3>
          <p class="text-sm text-slate-500 mt-2 leading-relaxed">Upload PDF, JPG, or PNG files instead of visiting the barangay for every submission.</p>
        </div>
        <div>
          <h3 class="font-black text-[#0f172a] text-lg">Status monitoring</h3>
          <p class="text-sm text-slate-500 mt-2 leading-relaxed">Follow your request from Submitted through Ready for Release in My Requests.</p>
        </div>
      </div>
    </section>
  `
})
export class HomeComponent {
  readonly steps = [
    { number: '1', title: 'Browse services', body: 'Open the Services page and choose the document you need.' },
    { number: '2', title: 'Upload requirements', body: 'Submit digital copies of required documents online.' },
    { number: '3', title: 'Complete the form', body: 'Fill or confirm your application details and review before submitting.' },
    { number: '4', title: 'Track status', body: 'Use My Requests to monitor review, approval, and release.' },
  ];
}
