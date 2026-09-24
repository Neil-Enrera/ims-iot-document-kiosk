import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, PortalAccount } from '../services/auth.service';

@Component({
  selector: 'portal-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
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

            <!-- Profile Dropdown Menu Trigger -->
            <div
              class="relative profile-menu-container group"
              (mouseenter)="onMouseEnter()"
              (mouseleave)="onMouseLeave()">
              <button
                type="button"
                id="profileDropdownTrigger"
                (click)="toggleDropdown($event)"
                [class.bg-orange-50]="isDropdownOpen()"
                [class.text-[#ea580c]]="isDropdownOpen()"
                class="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold text-sm transition focus:outline-hidden focus:ring-2 focus:ring-orange-400/30 cursor-pointer"
                aria-haspopup="true"
                [attr.aria-expanded]="isDropdownOpen()"
                title="Profile Menu">
                <!-- Profile Avatar / Icon -->
                <div class="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 overflow-hidden font-black text-xs border border-orange-200 shadow-2xs">
                  @if (auth.currentUser()?.photo) {
                    <img [src]="'/uploads/' + auth.currentUser()?.photo" alt="Profile" class="w-full h-full object-cover" />
                  } @else if (auth.isAuthenticated()) {
                    <span>{{ userInitials(auth.currentUser()) }}</span>
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  }
                </div>

                <span class="hidden md:inline-block max-w-[110px] truncate text-xs font-bold text-slate-800">
                  {{ auth.isAuthenticated() ? (auth.currentUser()?.first_name || 'Profile') : 'Profile' }}
                </span>

                <!-- Subtle Chevron indicator -->
                <svg
                  class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200"
                  [class.rotate-180]="isDropdownOpen()"
                  fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <!-- Dropdown Content Container with Bridge Padding -->
              <div
                [class.opacity-100]="isDropdownOpen()"
                [class.translate-y-0]="isDropdownOpen()"
                [class.pointer-events-auto]="isDropdownOpen()"
                [class.visible]="isDropdownOpen()"
                class="absolute right-0 top-full pt-1.5 w-72 transition-all duration-150 ease-out z-50
                       opacity-0 -translate-y-1 pointer-events-none invisible
                       group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-hover:visible">
                <div class="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2 text-slate-800 overflow-hidden ring-1 ring-black/5">
                  @if (auth.isAuthenticated() && !auth.mustChangePassword()) {
                    <!-- Header with resident info -->
                    <div class="px-3 py-3 bg-gradient-to-br from-orange-50/80 via-white to-slate-50 rounded-xl border border-orange-100/60 mb-1.5">
                      <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                          @if (auth.currentUser()?.photo) {
                            <img [src]="'/uploads/' + auth.currentUser()?.photo" alt="Photo" class="w-full h-full object-cover" />
                          } @else {
                            <span>{{ userInitials(auth.currentUser()) }}</span>
                          }
                        </div>
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-1.5">
                            <p class="text-xs font-black text-slate-900 truncate leading-tight">{{ displayName(auth.currentUser()) }}</p>
                            <span class="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 shrink-0">
                              Verified
                            </span>
                          </div>
                          <p class="text-[11px] text-slate-500 font-mono truncate mt-0.5">{{ auth.currentUser()?.account_id }}</p>
                        </div>
                      </div>
                    </div>

                    <!-- Profile Features Menu Links -->
                    <div class="space-y-0.5">
                      <a
                        routerLink="/profile"
                        (click)="closeDropdown()"
                        class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-orange-600 hover:bg-orange-50/70 transition group/item">
                        <div class="w-7 h-7 rounded-lg bg-slate-100 group-hover/item:bg-orange-100 text-slate-500 group-hover/item:text-orange-600 flex items-center justify-center shrink-0 transition">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                          </svg>
                        </div>
                        <div class="min-w-0">
                          <p class="leading-tight">Resident Profile</p>
                          <p class="text-[10px] text-slate-400 font-normal">View personal & ID details</p>
                        </div>
                      </a>

                      <a
                        routerLink="/requests"
                        (click)="closeDropdown()"
                        class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-orange-600 hover:bg-orange-50/70 transition group/item">
                        <div class="w-7 h-7 rounded-lg bg-slate-100 group-hover/item:bg-orange-100 text-slate-500 group-hover/item:text-orange-600 flex items-center justify-center shrink-0 transition">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                        </div>
                        <div class="min-w-0">
                          <p class="leading-tight">My Requests</p>
                          <p class="text-[10px] text-slate-400 font-normal">Track document applications</p>
                        </div>
                      </a>

                      <a
                        routerLink="/services"
                        (click)="closeDropdown()"
                        class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-orange-600 hover:bg-orange-50/70 transition group/item">
                        <div class="w-7 h-7 rounded-lg bg-slate-100 group-hover/item:bg-orange-100 text-slate-500 group-hover/item:text-orange-600 flex items-center justify-center shrink-0 transition">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                          </svg>
                        </div>
                        <div class="min-w-0">
                          <p class="leading-tight">Apply for Document</p>
                          <p class="text-[10px] text-slate-400 font-normal">Browse available certificates</p>
                        </div>
                      </a>
                    </div>

                    <div class="my-1.5 border-t border-slate-100"></div>

                    <!-- Sign out Action -->
                    <button
                      type="button"
                      (click)="openLogoutModal()"
                      class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition group/logout cursor-pointer">
                      <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 group-hover/logout:bg-rose-100 flex items-center justify-center shrink-0 transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                      </div>
                      <span class="leading-tight">Log out</span>
                    </button>
                  } @else {
                    <!-- Guest Dropdown Menu -->
                    <div class="px-3 py-2.5 bg-slate-50 rounded-xl mb-2 text-xs text-slate-600">
                      <p class="font-bold text-slate-800">Resident Portal</p>
                      <p class="text-[11px] text-slate-500 mt-0.5">Sign in to view your profile and requests.</p>
                    </div>

                    <div class="space-y-1">
                      <a
                        routerLink="/login"
                        (click)="closeDropdown()"
                        class="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                        </svg>
                        Login to Portal
                      </a>
                      <a
                        routerLink="/services"
                        (click)="closeDropdown()"
                        class="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition">
                        Browse Services
                      </a>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Header Login button for quick access if guest -->
            @if (!auth.isAuthenticated() || auth.mustChangePassword()) {
              <a routerLink="/login"
                 class="ml-1 px-3 py-2 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs sm:text-sm transition hidden sm:inline-flex">
                Login
              </a>
            }
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
              <li>
                @if (auth.isAuthenticated()) {
                  <button type="button" (click)="openLogoutModal()" class="hover:text-orange-400 transition cursor-pointer">Logout</button>
                } @else {
                  <a routerLink="/login" class="hover:text-orange-400 transition">Login</a>
                }
              </li>
            </ul>
          </div>
        </div>
        <div class="border-t border-white/10 py-4 text-center text-xs text-slate-500">
          IMS Document Request Services &bull; Barangay San Manuel
        </div>
      </footer>

      <!-- Logout Confirmation Modal -->
      @if (isLogoutModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
             role="dialog"
             aria-modal="true"
             aria-labelledby="logout-modal-title"
             (click)="closeLogoutModal()">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 transform transition-all animate-in zoom-in-95 duration-150"
               (click)="$event.stopPropagation()">
            <div class="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-2xs">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </div>

            <div class="text-center">
              <h3 id="logout-modal-title" class="text-lg font-black text-slate-900">Confirm Log Out</h3>
              <p class="text-sm text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to log out of your Barangay San Manuel Online Portal account?
              </p>
            </div>

            <div class="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                (click)="closeLogoutModal()"
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
export class PortalLayoutComponent {
  isDropdownOpen = signal(false);
  isLogoutModalOpen = signal(false);
  private hideTimeout: any = null;

  constructor(public auth: AuthService) {}

  onMouseEnter(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.isDropdownOpen.set(true);
  }

  onMouseLeave(): void {
    this.hideTimeout = setTimeout(() => {
      this.isDropdownOpen.set(false);
    }, 150);
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen.update(v => !v);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  openLogoutModal(): void {
    this.closeDropdown();
    this.isLogoutModalOpen.set(true);
  }

  closeLogoutModal(): void {
    this.isLogoutModalOpen.set(false);
  }

  confirmLogout(): void {
    this.closeLogoutModal();
    this.auth.logout();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isLogoutModalOpen()) {
      this.closeLogoutModal();
    } else if (this.isDropdownOpen()) {
      this.closeDropdown();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-menu-container')) {
      this.closeDropdown();
    }
  }

  displayName(user: PortalAccount | null): string {
    if (!user) return 'Resident';
    return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'Resident';
  }

  userInitials(user: PortalAccount | null): string {
    if (!user) return 'R';
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'R';
  }
}

