import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'portal-change-password',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden bg-[#fafafa]">
      
      <!-- Background Graphic Layer -->
      <img
        src="Background.png"
        alt="Barangay San Manuel Portal Background"
        class="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none opacity-90"
      />

      <!-- Top Header Branding -->
      <header class="relative z-10 pt-8 sm:pt-10 pb-4 text-center px-4">
        <a routerLink="/" class="inline-flex flex-col items-center group">
          <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-orange-500/40 p-1 bg-white shadow-sm flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-200">
            <img src="Barangay Logo.png" alt="Barangay San Manuel Seal" class="w-full h-full object-contain" />
          </div>
          <div class="mt-2.5 leading-tight">
            <p class="text-[11px] font-black uppercase tracking-wider text-[#ea580c]">BARANGAY SAN MANUEL</p>
            <h1 class="text-base sm:text-lg font-black text-[#0f172a] mt-0.5">Online Document Request Portal</h1>
            <p class="text-xs text-slate-400 font-medium mt-0.5">Fast • Secure • Convenient</p>
          </div>
        </a>
      </header>

      <!-- Center Content Area: Change Password Card -->
      <main class="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6 py-6 flex items-center justify-center">
        <div class="w-full rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-md p-7 sm:p-9 shadow-xl shadow-slate-200/50">
          
          <!-- Top Icon Badge -->
          <div class="w-14 h-14 rounded-full bg-orange-50 border border-orange-200 text-orange-600 mx-auto flex items-center justify-center shadow-2xs">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <!-- Card Headings -->
          <div class="text-center mt-3 mb-6">
            <h2 class="text-2xl font-black text-[#0f172a] tracking-tight">Set New Password</h2>
            <p class="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
              You signed in with a temporary password. Create a new password to activate your online portal account.
            </p>
          </div>

          <!-- Error Banner -->
          @if (error()) {
            <div class="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-150">
              <svg class="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span>{{ error() }}</span>
            </div>
          }

          <form (submit)="onChange($event)" class="space-y-4">
            
            <!-- New Password -->
            <div>
              <label for="newPassword" class="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="newPassword"
                  [type]="showNewPassword() ? 'text' : 'password'"
                  required
                  minlength="8"
                  autocomplete="new-password"
                  placeholder="At least 8 characters"
                  [value]="newPassword()"
                  (input)="newPassword.set($any($event.target).value)"
                  class="w-full pl-10 pr-11 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400 transition"
                />
                <button
                  type="button"
                  (click)="showNewPassword.set(!showNewPassword())"
                  class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  [title]="showNewPassword() ? 'Hide password' : 'Show password'">
                  @if (showNewPassword()) {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 4.8 12 4.8c4.478 0 8.268 3.094 9.542 7.504a1.5 1.5 0 010 .004C20.268 16.106 16.478 19.2 12 19.2c-4.477 0-8.268-3.094-9.542-7.5z" /></svg>
                  }
                </button>
              </div>

              <!-- Password Strength Meter -->
              @if (newPassword().length > 0) {
                <div class="mt-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-600">Password Strength</span>
                    <span
                      class="px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider transition-colors duration-200"
                      [class]="strengthBadgeClass()">
                      {{ strengthLabel() }}
                    </span>
                  </div>

                  <div class="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                    <div class="rounded-full transition-colors duration-300" [class]="strengthSegmentClass(1)"></div>
                    <div class="rounded-full transition-colors duration-300" [class]="strengthSegmentClass(2)"></div>
                    <div class="rounded-full transition-colors duration-300" [class]="strengthSegmentClass(3)"></div>
                    <div class="rounded-full transition-colors duration-300" [class]="strengthSegmentClass(4)"></div>
                  </div>

                  <div class="pt-1 grid grid-cols-1 sm:grid-cols-3 gap-1 text-[10px]">
                    <div class="flex items-center gap-1.5" [class]="hasMinLength() ? 'text-emerald-700 font-bold' : 'text-slate-400'">
                      <span>{{ hasMinLength() ? '✓' : '○' }}</span>
                      <span>8+ characters</span>
                    </div>
                    <div class="flex items-center gap-1.5" [class]="hasUpperAndLower() ? 'text-emerald-700 font-bold' : 'text-slate-400'">
                      <span>{{ hasUpperAndLower() ? '✓' : '○' }}</span>
                      <span>Upper & lower</span>
                    </div>
                    <div class="flex items-center gap-1.5" [class]="hasNumber() ? 'text-emerald-700 font-bold' : 'text-slate-400'">
                      <span>{{ hasNumber() ? '✓' : '○' }}</span>
                      <span>Numbers (0-9)</span>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Confirm New Password -->
            <div>
              <label for="confirmPassword" class="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  [type]="showConfirmPassword() ? 'text' : 'password'"
                  required
                  minlength="8"
                  autocomplete="new-password"
                  placeholder="Re-enter your new password"
                  [value]="confirmPassword()"
                  (input)="confirmPassword.set($any($event.target).value)"
                  class="w-full pl-10 pr-11 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400 transition"
                />
                <button
                  type="button"
                  (click)="showConfirmPassword.set(!showConfirmPassword())"
                  class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                  @if (showConfirmPassword()) {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 4.8 12 4.8c4.478 0 8.268 3.094 9.542 7.504a1.5 1.5 0 010 .004C20.268 16.106 16.478 19.2 12 19.2c-4.477 0-8.268-3.094-9.542-7.5z" /></svg>
                  }
                </button>
              </div>

              @if (confirmPassword().length > 0 && !passwordsMatch()) {
                <p class="text-[11px] font-bold text-rose-600 mt-1">Passwords do not match.</p>
              }
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="loading() || !canSubmit()"
              class="w-full py-3 px-4 bg-[#ea580c] hover:bg-[#c2410c] active:scale-98 disabled:opacity-60 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer">
              @if (loading()) {
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving Password...</span>
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Save & Continue to Portal</span>
              }
            </button>

            <!-- Cancel / Sign Out -->
            <div class="pt-1 text-center">
              <button
                type="button"
                (click)="onCancel()"
                class="text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer">
                Cancel and Log Out
              </button>
            </div>
          </form>

          <!-- Bottom Security Tip -->
          <div class="mt-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3.5 flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
              i
            </div>
            <p class="text-[11px] text-amber-900 leading-snug">
              Keep your password confidential. Barangay officials will never ask for your account password.
            </p>
          </div>

        </div>
      </main>

      <!-- Bottom Footer -->
      <footer class="relative z-10 py-6 text-center text-[11px] font-medium text-slate-400">
        IMS Document Request Services • Barangay San Manuel
      </footer>

    </div>
  `
})
export class ChangePasswordComponent implements OnInit {
  newPassword = signal('');
  confirmPassword = signal('');
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  loading = signal(false);
  error = signal('');

  hasMinLength = computed(() => this.newPassword().length >= 8);
  hasUpperAndLower = computed(() => /[a-z]/.test(this.newPassword()) && /[A-Z]/.test(this.newPassword()));
  hasNumber = computed(() => /[0-9]/.test(this.newPassword()));
  passwordsMatch = computed(() => this.newPassword() === this.confirmPassword());

  strengthScore = computed(() => {
    let score = 0;
    if (this.hasMinLength()) score++;
    if (this.hasUpperAndLower()) score++;
    if (this.hasNumber()) score++;
    if (/[^A-Za-z0-9]/.test(this.newPassword())) score++;
    return score;
  });

  canSubmit = computed(() => {
    return this.hasMinLength() && this.passwordsMatch() && this.newPassword().length > 0;
  });

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  strengthLabel(): string {
    const score = this.strengthScore();
    if (score <= 1) return 'Weak';
    if (score === 2) return 'Fair';
    if (score === 3) return 'Good';
    return 'Strong';
  }

  strengthBadgeClass(): string {
    const score = this.strengthScore();
    if (score <= 1) return 'bg-red-50 text-red-700 border-red-200';
    if (score === 2) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (score === 3) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  strengthSegmentClass(index: number): string {
    const score = this.strengthScore();
    if (score >= index) {
      if (score <= 1) return 'bg-red-500';
      if (score === 2) return 'bg-amber-500';
      if (score === 3) return 'bg-blue-500';
      return 'bg-emerald-500';
    }
    return 'bg-slate-200';
  }

  onChange(event: Event): void {
    event.preventDefault();
    if (!this.hasMinLength()) {
      this.error.set('Password must be at least 8 characters.');
      return;
    }
    if (!this.passwordsMatch()) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.changePassword(this.newPassword()).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.router.navigate(['/']);
        } else {
          this.error.set(res.message || 'Failed to update password.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to update password. Please try again.');
      }
    });
  }

  onCancel(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
