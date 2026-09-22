import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'portal-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen w-full bg-slate-50 flex flex-col font-sans text-slate-900">
      <a href="#main" class="skip-link">Skip to main content</a>

      <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a routerLink="/" class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-full border border-orange-500/30 p-1 bg-white shrink-0 flex items-center justify-center overflow-hidden">
              <img src="Barangay Logo.png" alt="Barangay San Manuel Seal" class="w-full h-full object-contain" />
            </div>
            <div class="leading-tight min-w-0 hidden sm:block">
              <p class="text-[10px] font-black uppercase tracking-wider text-[#ea580c]">Barangay San Manuel</p>
              <p class="text-sm font-bold text-[#0f172a] truncate">Online Document Request Portal</p>
            </div>
          </a>

          <nav class="flex items-center gap-1 sm:gap-2 text-sm font-semibold" aria-label="Portal">
            <a routerLink="/" routerLinkActive="text-[#ea580c] bg-orange-50" [routerLinkActiveOptions]="{ exact: true }"
               class="px-3 py-2 rounded-lg hover:bg-slate-100 transition">Home</a>
            <a routerLink="/services" routerLinkActive="text-[#ea580c] bg-orange-50"
               class="px-3 py-2 rounded-lg hover:bg-slate-100 transition">Services</a>
            <a routerLink="/requests" routerLinkActive="text-[#ea580c] bg-orange-50"
               class="px-3 py-2 rounded-lg hover:bg-slate-100 transition hidden sm:inline-flex">My Requests</a>
            <a routerLink="/contact" routerLinkActive="text-[#ea580c] bg-orange-50"
               class="px-3 py-2 rounded-lg hover:bg-slate-100 transition hidden sm:inline-flex">Contact Us</a>
            <a routerLink="/profile" routerLinkActive="text-[#ea580c] bg-orange-50"
               class="px-3 py-2 rounded-lg hover:bg-slate-100 transition">Profile</a>
          </nav>
        </div>
      </header>

      <main id="main" class="flex-1">
        <router-outlet />
      </main>

      <footer class="bg-[#0f172a] text-slate-300 mt-12">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid gap-6 sm:grid-cols-3 text-sm">
          <div>
            <p class="font-black text-white uppercase tracking-wider text-xs mb-2">Barangay San Manuel</p>
            <p class="text-slate-400 leading-relaxed">City of San Jose del Monte, Bulacan</p>
          </div>
          <div>
            <p class="font-black text-white uppercase tracking-wider text-xs mb-2">Online Portal</p>
            <p class="text-slate-400 leading-relaxed">Remote document request services for verified residents with an issued Barangay ID.</p>
          </div>
          <div>
            <p class="font-black text-white uppercase tracking-wider text-xs mb-2">Access</p>
            <ul class="space-y-1.5 text-slate-400">
              <li><a routerLink="/services" class="hover:text-orange-400 transition">Services</a></li>
              <li><a routerLink="/requests" class="hover:text-orange-400 transition">My Requests</a></li>
              <li><a routerLink="/contact" class="hover:text-orange-400 transition">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div class="border-t border-white/10 py-4 text-center text-xs text-slate-500">
          IMS Document Request Services &bull; Barangay San Manuel
        </div>
      </footer>
    </div>
  `
})
export class PortalLayoutComponent {}
