import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'portal-login',
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

      <!-- Center Content Area: Login Card -->
      <main class="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6 py-6 flex items-center justify-center">
        <!-- ============ MAIN LOGIN / AUTH CARD ============ -->
        <div class="w-full rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-md p-7 sm:p-9 shadow-xl shadow-slate-200/50">
            
            <!-- Top Avatar Badge -->
            <div class="w-14 h-14 rounded-full bg-orange-50 border border-orange-200 text-orange-600 mx-auto flex items-center justify-center shadow-2xs">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <!-- Card Titles -->
            <div class="text-center mt-3 mb-6">
              <h2 class="text-2xl font-black text-[#0f172a] tracking-tight">
                @if (mode() === 'LOGIN') { Welcome Back }
                @else if (mode() === 'FORGOT') { Forgot Password }
                @else if (mode() === 'VERIFY') { Verify Code }
                @else if (mode() === 'RESET') { Reset Password }
              </h2>
              <p class="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                @if (mode() === 'LOGIN') { Sign in to your online portal account }
                @else if (mode() === 'FORGOT') { Enter your registered Account ID or email to receive a code }
                @else if (mode() === 'VERIFY') { Enter the 6-digit verification code sent to your email }
                @else if (mode() === 'RESET') { Create your new secure password }
              </p>
            </div>

            <!-- ============ MODE 1: LOGIN ============ -->
            @if (mode() === 'LOGIN') {
              @if (error()) {
                <div class="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-150">
                  <svg class="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <span>{{ error() }}</span>
                </div>
              }

              <form (submit)="onLogin($event)" class="space-y-4">
                <!-- Account ID Input -->
                <div>
                  <label for="identifier" class="block text-xs font-bold text-slate-700 mb-1.5">Account ID</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autocomplete="username"
                      required
                      placeholder="e.g. BSM-000001"
                      [value]="identifier()"
                      (input)="identifier.set($any($event.target).value)"
                      class="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400 transition"
                    />
                  </div>
                </div>

                <!-- Password Input -->
                <div>
                  <label for="password" class="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      [type]="showPassword() ? 'text' : 'password'"
                      autocomplete="current-password"
                      required
                      placeholder="Enter your password"
                      [value]="password()"
                      (input)="password.set($any($event.target).value)"
                      class="w-full pl-10 pr-11 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400 transition"
                    />
                    <button
                      type="button"
                      (click)="showPassword.set(!showPassword())"
                      class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
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

                <!-- Forgot Password Link -->
                <div class="flex justify-end pt-0.5">
                  <button
                    type="button"
                    (click)="openForgotPassword()"
                    class="text-xs font-bold text-orange-600 hover:text-orange-700 transition cursor-pointer">
                    Forgot password?
                  </button>
                </div>

                <!-- Submit Button -->
                <button
                  type="submit"
                  [disabled]="loading()"
                  class="w-full py-3 px-4 bg-[#ea580c] hover:bg-[#c2410c] active:scale-98 disabled:opacity-60 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer">
                  @if (loading()) {
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Login</span>
                  }
                </button>
              </form>

              <!-- Bottom Info Card -->
              <div class="mt-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3.5 flex items-start gap-3">
                <div class="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  i
                </div>
                <div class="leading-snug">
                  <p class="font-bold text-xs text-amber-950">Don't have an online account?</p>
                  <p class="text-[11px] text-amber-900/90 mt-0.5">Visit Barangay San Manuel to apply for a Barangay ID and activate your online portal account.</p>
                </div>
              </div>
            }

            <!-- ============ MODE 2: FORGOT PASSWORD ============ -->
            @else if (mode() === 'FORGOT') {
              @if (error()) {
                <div class="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold">
                  {{ error() }}
                </div>
              }
              @if (success()) {
                <div class="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold">
                  {{ success() }}
                </div>
              }

              <form (submit)="onRequestCode($event)" class="space-y-4">
                <div>
                  <label for="forgotIdentifier" class="block text-xs font-bold text-slate-700 mb-1.5">Account ID or Email</label>
                  <input
                    id="forgotIdentifier"
                    type="text"
                    required
                    placeholder="e.g. BSM-000001 or email@example.com"
                    [value]="identifier()"
                    (input)="identifier.set($any($event.target).value)"
                    class="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  [disabled]="loading()"
                  class="w-full py-3 px-4 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm rounded-2xl transition shadow-xs cursor-pointer disabled:opacity-60">
                  @if (loading()) {
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  } @else {
                    <span>Send Verification Code</span>
                  }
                </button>
              </form>

              <button
                type="button"
                (click)="mode.set('LOGIN'); error.set(''); success.set('')"
                class="mt-4 w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer">
                &larr; Back to Login
              </button>
            }

            <!-- ============ MODE 3: VERIFY OTP ============ -->
            @else if (mode() === 'VERIFY') {
              @if (error()) {
                <div class="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold">
                  {{ error() }}
                </div>
              }

              <form (submit)="onVerifyCode($event)" class="space-y-4">
                <div>
                  <label for="code" class="block text-xs font-bold text-slate-700 mb-1.5 text-center">6-Digit Verification Code</label>
                  <input
                    id="code"
                    type="text"
                    required
                    maxlength="6"
                    pattern="[0-9]{6}"
                    placeholder="123456"
                    [value]="code()"
                    (input)="code.set($any($event.target).value)"
                    class="w-full text-center tracking-[10px] text-2xl font-black font-mono py-2.5 rounded-2xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50/70 focus:bg-white transition"
                  />
                </div>

                <button
                  type="submit"
                  [disabled]="loading() || code().length !== 6"
                  class="w-full py-3 px-4 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm rounded-2xl transition shadow-xs cursor-pointer disabled:opacity-60">
                  @if (loading()) {
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  } @else {
                    <span>Verify Code</span>
                  }
                </button>
              </form>

              <button
                type="button"
                (click)="mode.set('FORGOT'); error.set('')"
                class="mt-4 w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer">
                &larr; Change Account ID or Email
              </button>
            }

            <!-- ============ MODE 4: RESET PASSWORD ============ -->
            @else if (mode() === 'RESET') {
              @if (error()) {
                <div class="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold">
                  {{ error() }}
                </div>
              }

              <form (submit)="onResetPassword($event)" class="space-y-4">
                <div>
                  <label for="newPassword" class="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
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
                      class="w-full pl-3.5 pr-11 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                    <button
                      type="button"
                      (click)="showNewPassword.set(!showNewPassword())"
                      class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                      @if (showNewPassword()) {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                      } @else {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 4.8 12 4.8c4.478 0 8.268 3.094 9.542 7.504a1.5 1.5 0 010 .004C20.268 16.106 16.478 19.2 12 19.2c-4.477 0-8.268-3.094-9.542-7.5z" /></svg>
                      }
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  [disabled]="loading() || newPassword().length < 8"
                  class="w-full py-3 px-4 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm rounded-2xl transition shadow-xs cursor-pointer disabled:opacity-60">
                  @if (loading()) {
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  } @else {
                    <span>Save New Password & Login</span>
                  }
                </button>
              </form>

              <button
                type="button"
                (click)="mode.set('LOGIN'); error.set('')"
                class="mt-4 w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer">
                &larr; Cancel and return to Login
              </button>
            }

          </div>
      </main>

      <!-- Bottom Footer -->
      <footer class="relative z-10 py-6 text-center text-[11px] font-medium text-slate-400">
        IMS Document Request Services • Barangay San Manuel
      </footer>

    </div>
  `
})
export class LoginComponent implements OnInit {
  mode = signal<'LOGIN' | 'FORGOT' | 'VERIFY' | 'RESET'>('LOGIN');

  identifier = signal('');
  password = signal('');
  code = signal('');
  newPassword = signal('');
  resetToken = signal('');

  showPassword = signal(false);
  showNewPassword = signal(false);
  loading = signal(false);
  error = signal('');
  success = signal('');

  private returnUrl = '/';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  onLogin(event: Event): void {
    event.preventDefault();
    if (!this.identifier() || !this.password()) {
      this.error.set('Please enter both Account ID and password.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.identifier().trim(), this.password()).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          if (res.data.mustChangePassword) {
            this.router.navigate(['/change-password']);
          } else {
            this.router.navigateByUrl(this.returnUrl);
          }
        } else {
          this.error.set(res.message || 'Login failed. Please check your credentials.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Login failed. Please check your credentials.');
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
    if (!this.identifier()) {
      this.error.set('Please enter your Account ID or email address.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.auth.forgotPassword(this.identifier().trim()).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.mode.set('VERIFY');
          this.success.set('A 6-digit verification code has been sent to your registered email.');
        } else {
          this.error.set(res.message || 'Account not found.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to request code. Please check your input.');
      }
    });
  }

  onVerifyCode(event: Event): void {
    event.preventDefault();
    if (this.code().length !== 6) {
      this.error.set('Please enter a 6-digit code.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.verifyResetCode(this.identifier().trim(), this.code().trim()).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data?.resetToken) {
          this.resetToken.set(res.data.resetToken);
          this.mode.set('RESET');
        } else {
          this.error.set(res.message || 'Invalid verification code.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Invalid or expired code.');
      }
    });
  }

  onResetPassword(event: Event): void {
    event.preventDefault();
    if (this.newPassword().length < 8) {
      this.error.set('Password must be at least 8 characters long.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.resetPassword(this.identifier().trim(), this.resetToken(), this.newPassword()).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.mode.set('LOGIN');
          this.password.set('');
          this.newPassword.set('');
          this.error.set('');
          this.success.set('Password reset successfully! You can now log in.');
        } else {
          this.error.set(res.message || 'Failed to reset password.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to reset password.');
      }
    });
  }
}
