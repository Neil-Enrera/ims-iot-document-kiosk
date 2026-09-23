import { Component, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'portal-login',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen w-full bg-slate-50 flex items-center justify-center px-4 py-10">
      <div class="w-full max-w-md">
        <a routerLink="/" class="flex items-center justify-center gap-3 mb-8">
          <div class="w-12 h-12 rounded-full border border-orange-500/30 p-1 bg-white shadow-xs flex items-center justify-center overflow-hidden">
            <img src="Barangay Logo.png" alt="Barangay San Manuel Seal" class="w-full h-full object-contain" />
          </div>
          <div class="leading-tight text-left">
            <p class="text-[10px] font-black uppercase tracking-wider text-[#ea580c]">Barangay San Manuel</p>
            <p class="text-sm font-bold text-[#0f172a]">Online Document Request Portal</p>
          </div>
        </a>

        <div class="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 shadow-xs">
          <div class="text-center mb-6">
            <div class="w-14 h-14 rounded-full bg-orange-50 border border-orange-100 text-orange-600 mx-auto flex items-center justify-center">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-[#0f172a] mt-4">Resident login</h1>
            <p class="text-sm text-slate-500 mt-1">Sign in with your portal Account ID.</p>
          </div>

          @if (mode() === 'LOGIN') {
            @if (error()) {
              <div class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {{ error() }}
              </div>
            }

            <form (submit)="onLogin($event)" class="space-y-4">
              <div>
                <label for="accountId" class="block text-xs font-bold text-slate-800 mb-1.5">Account ID</label>
                <input
                  id="accountId"
                  name="accountId"
                  type="text"
                  autocomplete="username"
                  required
                  placeholder="e.g. BSM-000001"
                  [value]="accountId()"
                  (input)="accountId.set($any($event.target).value)"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white placeholder:text-slate-400 transition"
                />
              </div>

              <div>
                <label for="password" class="block text-xs font-bold text-slate-800 mb-1.5">Password</label>
                <div class="relative">
                  <input
                    id="password"
                    name="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    autocomplete="current-password"
                    required
                    placeholder="Enter your password"
                    [value]="password()"
                    (input)="password.set($any($event.target).value)"
                    class="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white placeholder:text-slate-400 transition"
                  />
                  <button
                    type="button"
                    (click)="showPassword.set(!showPassword())"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    [title]="showPassword() ? 'Hide password' : 'Show password'">
                    @if (showPassword()) {
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
              </div>

              <div class="flex items-center justify-between text-xs pt-0.5">
                <span></span>
                <button
                  type="button"
                  (click)="openForgotPassword()"
                  class="font-semibold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer">
                  Forgot password?
                </button>
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
                  <span>Signing in...</span>
                } @else {
                  <span>Login</span>
                }
              </button>
            </form>

            <div class="mt-6 rounded-xl bg-orange-50 border border-orange-200 p-4 text-xs text-orange-900 leading-relaxed">
              Don't have an online account? Visit Barangay San Manuel to apply for a Barangay ID and activate your online portal account.
            </div>
          } @else if (mode() === 'FORGOT') {
            @if (error()) {
              <div class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {{ error() }}
              </div>
            }
            @if (success()) {
              <div class="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold">
                {{ success() }}
              </div>
            }

            <h2 class="text-lg font-black text-slate-900">Forgot password?</h2>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed mb-4">
              Enter your Account ID. We will send a 6-digit verification code to your registered email.
            </p>

            <form (submit)="onRequestCode($event)" class="space-y-4">
              <div>
                <label for="forgotAccountId" class="block text-xs font-bold text-slate-800 mb-1.5">Account ID</label>
                <input
                  id="forgotAccountId"
                  type="text"
                  required
                  placeholder="e.g. BSM-000001"
                  [value]="accountId()"
                  (input)="accountId.set($any($event.target).value)"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white placeholder:text-slate-400 transition"
                />
              </div>
              <button
                type="submit"
                [disabled]="loading()"
                class="w-full py-2.5 px-4 bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-60 text-white font-bold text-sm rounded-xl transition cursor-pointer">
                Send verification code
              </button>
            </form>

            <button
              type="button"
              (click)="mode.set('LOGIN'); error.set(''); success.set('')"
              class="mt-4 w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
              Back to login
            </button>
          } @else if (mode() === 'VERIFY') {
            @if (error()) {
              <div class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {{ error() }}
              </div>
            }

            <h2 class="text-lg font-black text-slate-900">Enter verification code</h2>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed mb-4">
              We sent a 6-digit code to your registered email for <strong>{{ accountId() }}</strong>. Code expires in 10 minutes.
            </p>

            <form (submit)="onVerifyCode($event)" class="space-y-4">
              <div>
                <label for="code" class="block text-xs font-bold text-slate-800 mb-1.5">6-Digit Code</label>
                <input
                  id="code"
                  type="text"
                  required
                  maxlength="6"
                  pattern="[0-9]{6}"
                  placeholder="123456"
                  [value]="code()"
                  (input)="code.set($any($event.target).value)"
                  class="w-full text-center tracking-[10px] text-2xl font-bold font-mono py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-300 placeholder:tracking-normal transition"
                />
              </div>
              <button
                type="submit"
                [disabled]="loading() || code().length !== 6"
                class="w-full py-2.5 px-4 bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-60 text-white font-bold text-sm rounded-xl transition cursor-pointer">
                Verify code
              </button>
            </form>

            <button
              type="button"
              (click)="mode.set('FORGOT'); error.set('')"
              class="mt-4 w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
              &larr; Change Account ID
            </button>
          } @else if (mode() === 'RESET') {
            @if (error()) {
              <div class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {{ error() }}
              </div>
            }

            <h2 class="text-lg font-black text-slate-900">Set new password</h2>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed mb-4">
              Create a new password for <strong>{{ accountId() }}</strong>. Minimum 8 characters.
            </p>

            <form (submit)="onResetPassword($event)" class="space-y-4">
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
                <label for="confirmPassword" class="block text-xs font-bold text-slate-800 mb-1.5">Confirm password</label>
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
                class="w-full py-2.5 px-4 bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-60 text-white font-bold text-sm rounded-xl transition cursor-pointer">
                Reset password
              </button>
            </form>

            <button
              type="button"
              (click)="mode.set('LOGIN'); error.set('')"
              class="mt-4 w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
              Back to login
            </button>
          }
        </div>

        <p class="text-center text-xs text-slate-400 mt-6">
          IMS Document Request Services &bull; Barangay San Manuel
        </p>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  mode = signal<'LOGIN' | 'FORGOT' | 'VERIFY' | 'RESET'>('LOGIN');
  accountId = signal('');
  password = signal('');
  showPassword = signal(false);
  code = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  error = signal('');
  success = signal('');
  loading = signal(false);
  resetToken = signal('');

  private returnUrl = '/';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });

    if (this.auth.isAuthenticated() && !this.auth.mustChangePassword()) {
      this.router.navigate([this.returnUrl || '/']);
    }
  }

  onLogin(event: Event): void {
    event.preventDefault();
    const accountIdVal = this.accountId().trim();
    const passwordVal = this.password();

    if (!accountIdVal || !passwordVal) {
      this.error.set('Please enter your Account ID and password.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login(accountIdVal, passwordVal).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (!res.success || !res.data) {
          this.error.set(res.message || 'Login failed.');
          return;
        }
        if (res.data.mustChangePassword) {
          this.router.navigate(['/change-password']);
        } else {
          this.router.navigateByUrl(this.returnUrl || '/');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Invalid Account ID or password.');
      }
    });
  }

  openForgotPassword(): void {
    this.mode.set('FORGOT');
    this.error.set('');
    this.success.set('');
  }

  onRequestCode(event: Event): void {
    event.preventDefault();
    const id = this.accountId().trim();
    if (!id) {
      this.error.set('Please enter your Account ID.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.auth.forgotPassword(id).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.mode.set('VERIFY');
        this.code.set('');
        this.success.set(res.message);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Unable to send verification code.');
      }
    });
  }

  onVerifyCode(event: Event): void {
    event.preventDefault();
    const id = this.accountId().trim();
    const codeVal = this.code().trim();
    if (!id || codeVal.length !== 6) {
      this.error.set('Please enter the 6-digit verification code.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.verifyResetCode(id, codeVal).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.resetToken.set(res.data.resetToken);
          this.mode.set('RESET');
          this.newPassword.set('');
          this.confirmPassword.set('');
        } else {
          this.error.set(res.message || 'Invalid code.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Invalid or expired code.');
      }
    });
  }

  onResetPassword(event: Event): void {
    event.preventDefault();
    const id = this.accountId().trim();
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

    this.auth.resetPassword(id, this.resetToken(), pass).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.mode.set('LOGIN');
          this.password.set('');
          this.success.set('Password reset successful. You can now log in.');
          this.error.set('');
        } else {
          this.error.set(res.message || 'Unable to reset password.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Unable to reset password.');
      }
    });
  }
}
