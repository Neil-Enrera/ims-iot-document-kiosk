import { Component, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'portal-change-password',
  standalone: true,
  template: `
    <div class="min-h-screen w-full bg-slate-50 flex items-center justify-center px-4 py-10">
      <div class="w-full max-w-md">
        <div class="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 shadow-xs">
          <div class="text-center mb-6">
            <div class="w-14 h-14 rounded-full bg-orange-50 border border-orange-100 text-orange-600 mx-auto flex items-center justify-center">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 class="text-2xl font-black text-[#0f172a] mt-4">Change your password</h1>
            <p class="text-sm text-slate-500 mt-1 leading-relaxed">
              You signed in with a temporary password. Create a new password to continue to the portal.
            </p>
          </div>

          @if (error()) {
            <div class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {{ error() }}
            </div>
          }

          <form (submit)="onChange($event)" class="space-y-4">
            <div>
              <label for="newPassword" class="block text-xs font-bold text-slate-800 mb-1.5">New password</label>
              <div class="relative">
                <input
                  id="newPassword"
                  [type]="showNewPassword() ? 'text' : 'password'"
                  required
                  minlength="8"
                  autocomplete="new-password"
                  placeholder="At least 8 characters"
                  [value]="newPassword()"
                  (input)="newPassword.set($any($event.target).value)"
                  class="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white placeholder:text-slate-400 transition"
                />
                <button
                  type="button"
                  (click)="showNewPassword.set(!showNewPassword())"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  [title]="showNewPassword() ? 'Hide password' : 'Show password'">
                  @if (showNewPassword()) {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 4.8 12 4.8c4.478 0 8.268 3.094 9.542 7.504a1.5 1.5 0 010 .004C20.268 16.106 16.478 19.2 12 19.2c-4.477 0-8.268-3.094-9.542-7.5z" />
                    </svg>
                  }
                </button>
              </div>

              <!-- Password Strength Meter & ASCII/Character Guidelines -->
              @if (newPassword().length > 0) {
                <div class="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-semibold text-slate-600">Password Strength</span>
                    <span
                      class="px-2 py-0.5 rounded-md text-[11px] font-bold border uppercase tracking-wider transition-colors duration-200"
                      [class]="strengthBadgeClass()">
                      {{ strengthLabel() }}
                    </span>
                  </div>

                  <!-- 4-segment strength bar -->
                  <div class="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                    <div class="rounded-full transition-colors duration-300" [class]="strengthSegmentClass(1)"></div>
                    <div class="rounded-full transition-colors duration-300" [class]="strengthSegmentClass(2)"></div>
                    <div class="rounded-full transition-colors duration-300" [class]="strengthSegmentClass(3)"></div>
                    <div class="rounded-full transition-colors duration-300" [class]="strengthSegmentClass(4)"></div>
                  </div>

                  <!-- Real-time Complexity Checklist -->
                  <div class="pt-1 grid grid-cols-1 sm:grid-cols-3 gap-1 text-[11px]">
                    <div class="flex items-center gap-1.5" [class]="hasMinLength() ? 'text-emerald-700 font-medium' : 'text-slate-400'">
                      <span>{{ hasMinLength() ? '✓' : '○' }}</span>
                      <span>8+ characters</span>
                    </div>
                    <div class="flex items-center gap-1.5" [class]="hasUpperAndLower() ? 'text-emerald-700 font-medium' : 'text-slate-400'">
                      <span>{{ hasUpperAndLower() ? '✓' : '○' }}</span>
                      <span>Upper & lowercase</span>
                    </div>
                    <div class="flex items-center gap-1.5" [class]="hasNumber() ? 'text-emerald-700 font-medium' : 'text-slate-400'">
                      <span>{{ hasNumber() ? '✓' : '○' }}</span>
                      <span>Numbers (0-9)</span>
                    </div>
                  </div>
                </div>
              }
            </div>

            <div>
              <label for="confirmPassword" class="block text-xs font-bold text-slate-800 mb-1.5">Confirm new password</label>
              <div class="relative">
                <input
                  id="confirmPassword"
                  [type]="showConfirmPassword() ? 'text' : 'password'"
                  required
                  minlength="8"
                  autocomplete="new-password"
                  placeholder="Re-enter new password"
                  [value]="confirmPassword()"
                  (input)="confirmPassword.set($any($event.target).value)"
                  class="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white placeholder:text-slate-400 transition"
                />
                <button
                  type="button"
                  (click)="showConfirmPassword.set(!showConfirmPassword())"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  [title]="showConfirmPassword() ? 'Hide password' : 'Show password'">
                  @if (showConfirmPassword()) {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 4.8 12 4.8c4.478 0 8.268 3.094 9.542 7.504a1.5 1.5 0 010 .004C20.268 16.106 16.478 19.2 12 19.2c-4.477 0-8.268-3.094-9.542-7.5z" />
                    </svg>
                  }
                </button>
              </div>
              @if (confirmPassword().length > 0 && newPassword() !== confirmPassword()) {
                <p class="text-[11px] text-rose-600 font-medium mt-1">Passwords do not match</p>
              } @else if (confirmPassword().length > 0 && newPassword() === confirmPassword()) {
                <p class="text-[11px] text-emerald-600 font-medium mt-1">✓ Passwords match</p>
              }
            </div>

            <button
              type="submit"
              [disabled]="loading() || newPassword().length < 8 || newPassword() !== confirmPassword()"
              class="w-full py-2.5 px-4 bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-60 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer">
              @if (loading()) {
                <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>Saving...</span>
              } @else {
                <span>Save new password</span>
              }
            </button>
          </form>

          <button
            type="button"
            (click)="onLogout()"
            class="mt-4 w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
            Log out instead
          </button>
        </div>
      </div>
    </div>
  `
})
export class ChangePasswordComponent implements OnInit {
  newPassword = signal('');
  confirmPassword = signal('');
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  error = signal('');
  loading = signal(false);

  // Real-time Complexity Criteria
  hasMinLength = computed(() => this.newPassword().length >= 8);
  hasUpperAndLower = computed(() => /[a-z]/.test(this.newPassword()) && /[A-Z]/.test(this.newPassword()));
  hasNumber = computed(() => /\d/.test(this.newPassword()));

  strengthScore = computed(() => {
    const p = this.newPassword();
    if (!p) return 0;
    let score = 0;
    if (this.hasMinLength()) score++;
    if (this.hasUpperAndLower()) score++;
    if (this.hasNumber()) score++;
    return score;
  });

  strengthLabel = computed(() => {
    const p = this.newPassword();
    if (!p) return '';
    const score = this.strengthScore();
    if (score <= 1) return 'Weak';
    if (score === 2) return 'Moderate';
    return 'Strong';
  });

  strengthBadgeClass = computed(() => {
    const score = this.strengthScore();
    if (score <= 1) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (score === 2) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  });

  strengthSegmentClass(index: number): string {
    const score = this.strengthScore();
    const effectiveScore = score === 3 ? 4 : (score === 2 ? 2 : 1);
    if (effectiveScore < index) {
      return 'bg-slate-200';
    }
    if (score <= 1) return 'bg-rose-500';
    if (score === 2) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (!this.auth.getToken()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.auth.isAuthenticated() && !this.auth.mustChangePassword()) {
      this.router.navigate(['/']);
    }
  }

  onChange(event: Event): void {
    event.preventDefault();
    const pass = this.newPassword();
    const confirm = this.confirmPassword();

    if (pass.length < 8) {
      this.error.set('Password must be at least 8 characters.');
      return;
    }
    if (pass !== confirm) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.changePassword(pass).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.router.navigate(['/']);
        } else {
          this.error.set(res.message || 'Unable to change password.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Unable to change password.');
      }
    });
  }

  onLogout(): void {
    this.auth.logout();
  }
}

