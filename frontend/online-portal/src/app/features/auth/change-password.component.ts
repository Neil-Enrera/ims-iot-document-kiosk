import { Component, OnInit, signal } from '@angular/core';
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
              <input
                id="newPassword"
                type="password"
                required
                minlength="8"
                autocomplete="new-password"
                placeholder="At least 8 characters"
                [value]="newPassword()"
                (input)="newPassword.set($any($event.target).value)"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white placeholder:text-slate-400 transition"
              />
            </div>
            <div>
              <label for="confirmPassword" class="block text-xs font-bold text-slate-800 mb-1.5">Confirm new password</label>
              <input
                id="confirmPassword"
                type="password"
                required
                minlength="8"
                autocomplete="new-password"
                placeholder="Re-enter new password"
                [value]="confirmPassword()"
                (input)="confirmPassword.set($any($event.target).value)"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white placeholder:text-slate-400 transition"
              />
            </div>

            <button
              type="submit"
              [disabled]="loading()"
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
  error = signal('');
  loading = signal(false);

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
