import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  template: `
    <div class="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden bg-slate-900">

      <!-- ==================== FULL VIEWPORT BACKGROUND IMAGE & OVERLAYS ==================== -->
      <div class="absolute inset-0 z-0">
        <!-- Barangay Hall Full Photograph -->
        <img
          src="Barangay Hall.png"
          alt="Barangay San Manuel Hall"
          class="w-full h-full object-cover object-center lg:object-[30%_center]"
        />
        <!-- Subtle dark gradient on top-left to ensure text readability -->
        <div class="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/40 to-slate-950/20 lg:to-transparent"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/30"></div>
      </div>

      <!-- ==================== LEFT COLUMN: BRANDING & WAVE OVERLAY (~52% on desktop) ==================== -->
      <div class="w-full lg:w-[52%] xl:w-[54%] flex flex-col justify-between relative z-10 min-h-[460px] lg:min-h-screen p-6 sm:p-10 lg:p-14">

        <!-- Top Section: Official Logo & White Branding Typography -->
        <div class="relative z-10 max-w-lg">
          <!-- Official Barangay Logo -->
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-white/40 p-1 bg-white/95 shadow-xl mb-6 inline-block backdrop-blur-xs">
            <img src="Barangay Logo.png" alt="Barangay San Manuel Logo" class="w-full h-full object-contain" />
          </div>

          <!-- Title & Subtitle -->
          <h1 class="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
            Barangay San Manuel
          </h1>
          <p class="text-lg sm:text-xl font-bold text-orange-400 mt-1.5 drop-shadow-sm">
            IMS Document Request Services
          </p>

          <!-- Orange Accent Line -->
          <div class="w-14 h-1.5 bg-orange-500 rounded-full mt-3.5 mb-4 shadow-sm"></div>

          <!-- Short Description -->
          <p class="text-sm sm:text-base text-slate-100/95 max-w-md leading-relaxed font-medium drop-shadow-sm">
            Streamlining document requests and information management for a faster and better service.
          </p>
        </div>

        <!-- Bottom Wave with Orange Accent Line & 3 Feature Highlights -->
        <div class="relative z-10 -mx-6 sm:-mx-10 lg:-mx-14 -mb-6 sm:-mb-10 lg:-mb-14 mt-12">
          <!-- Flowing Wave SVG with Orange Top Border -->
          <svg class="w-full h-14 sm:h-18 block -mb-0.5" viewBox="0 0 500 70" preserveAspectRatio="none">
            <path d="M 0 36 Q 250 0 500 46 L 500 70 L 0 70 Z" fill="#0f172a" />
            <path d="M 0 36 Q 250 0 500 46" fill="none" stroke="#f97316" stroke-width="4.5" />
          </svg>

          <!-- Dark Navy Bar with 3 Feature Highlights -->
          <div class="bg-[#0f172a] px-6 sm:px-10 lg:px-14 py-4 sm:py-5 border-t border-slate-800/60">
            <div class="flex items-center justify-between text-white gap-2 sm:gap-4 max-w-xl">

              <!-- Feature 1: Secure -->
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full border border-orange-500 text-orange-500 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <p class="font-bold text-xs sm:text-sm leading-tight text-white">Secure</p>
                  <p class="text-[10px] sm:text-xs text-slate-400 leading-tight">Data Protection</p>
                </div>
              </div>

              <!-- Vertical Divider -->
              <div class="h-8 w-px bg-slate-700/80 shrink-0"></div>

              <!-- Feature 2: Efficient -->
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 text-orange-500 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <p class="font-bold text-xs sm:text-sm leading-tight text-white">Efficient</p>
                  <p class="text-[10px] sm:text-xs text-slate-400 leading-tight">Document Requests</p>
                </div>
              </div>

              <!-- Vertical Divider -->
              <div class="h-8 w-px bg-slate-700/80 shrink-0"></div>

              <!-- Feature 3: Better Service -->
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 text-orange-500 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <p class="font-bold text-xs sm:text-sm leading-tight text-white">Better Service</p>
                  <p class="text-[10px] sm:text-xs text-slate-400 leading-tight">For Our Residents</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      <!-- ==================== RIGHT COLUMN: FLOATING ADMIN LOGIN CARD (~48% on desktop) ==================== -->
      <div class="w-full lg:w-[48%] xl:w-[46%] flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 relative z-10 bg-slate-900/30 lg:bg-white/90 backdrop-blur-md lg:backdrop-blur-none border-t lg:border-t-0 lg:border-l border-white/20 lg:border-slate-100">

        <!-- Background Subtle Dot Grid on Right (Desktop only) -->
        <div class="absolute top-8 right-8 grid grid-cols-6 gap-2.5 opacity-25 pointer-events-none hidden xl:grid">
          @for (i of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]; track i) {
            <div class="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
          }
        </div>
        <div class="absolute bottom-8 right-8 grid grid-cols-6 gap-2.5 opacity-25 pointer-events-none hidden xl:grid">
          @for (i of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]; track i) {
            <div class="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
          }
        </div>

        <!-- Floating White Card (Properly Centered with Generous Edge Margins) -->
        <div class="w-full max-w-[410px] bg-white rounded-3xl shadow-2xl shadow-slate-950/15 border border-slate-100 p-7 sm:p-9 lg:p-10 relative z-10 mx-auto">

          @if (loginStep() === 'CREDENTIALS') {
            <!-- Circular User Avatar Icon -->
            <div class="w-16 h-16 rounded-full bg-[#fdede4] border border-[#fbd9c8] text-[#ea580c] flex items-center justify-center mx-auto mb-4 shadow-xs">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <!-- Welcome Back Title & Subtitle -->
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center tracking-tight">
              Welcome Back!
            </h2>
            <p class="text-xs sm:text-sm text-slate-500 text-center mt-1 mb-6 font-medium">
              Sign in to your admin account
            </p>

            <!-- Error Banner -->
            @if (error()) {
              <div class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <svg class="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ error() }}</span>
              </div>
            }

            <!-- Step 1: Credentials Form -->
            <form (submit)="onLogin($event)" class="space-y-4">
              <!-- Email Address -->
              <div>
                <label for="email" class="block text-xs font-bold text-slate-800 mb-1.5">Email Address</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    required
                    placeholder="Enter your registered email"
                    [value]="email()"
                    (input)="email.set($any($event.target).value)"
                    class="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white placeholder:text-slate-400 shadow-2xs transition"
                  />
                </div>
              </div>

              <!-- Password -->
              <div>
                <label for="password" class="block text-xs font-bold text-slate-800 mb-1.5">Password</label>
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
                    class="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white placeholder:text-slate-400 shadow-2xs transition"
                  />
                  <button
                    type="button"
                    (click)="showPassword.set(!showPassword())"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    [title]="showPassword() ? 'Hide password' : 'Show password'">
                    @if (showPassword()) {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    } @else {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    }
                  </button>
                </div>
              </div>

              <!-- Remember Me & Forgot Password Row -->
              <div class="flex items-center justify-between text-xs pt-0.5">
                <label class="inline-flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium hover:text-slate-900">
                  <input
                    type="checkbox"
                    [checked]="rememberMe()"
                    (change)="rememberMe.set($any($event.target).checked)"
                    class="w-4 h-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  (click)="openForgotPassword()"
                  class="font-semibold text-orange-600 hover:text-orange-700 hover:underline transition cursor-pointer">
                  Forgot password?
                </button>
              </div>

              <!-- Primary Sign In Button -->
              <button
                type="submit"
                [disabled]="loading()"
                class="w-full py-2.5 px-4 bg-[#ea580c] hover:bg-[#c2410c] active:bg-[#9a3412] disabled:opacity-60 text-white font-bold text-sm rounded-lg shadow-sm transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer mt-5">
                @if (loading()) {
                  <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Signing in...</span>
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Continue</span>
                }
              </button>
            </form>
          } @else {
            <!-- Step 2: Two-Factor OTP Verification -->
            <div class="text-center animate-fadeIn">
              <!-- Shield Icon -->
              <div class="w-16 h-16 rounded-full bg-[#fdede4] border border-[#fbd9c8] text-[#ea580c] flex items-center justify-center mx-auto mb-4 shadow-xs">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>

              <!-- Title & Subtitle -->
              <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Two-Factor Auth
              </h2>
              <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Enter the 6-digit verification code sent to:
              </p>
              <div class="inline-block mt-1 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-800 border border-slate-200">
                {{ maskedEmail() }}
              </div>

              <!-- Error Banner -->
              @if (error()) {
                <div class="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2 text-left animate-fadeIn">
                  <svg class="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ error() }}</span>
                </div>
              }

              <!-- Success Notification Banner -->
              @if (otpSuccessMessage()) {
                <div class="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 text-left animate-fadeIn">
                  <svg class="w-4 h-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{{ otpSuccessMessage() }}</span>
                </div>
              }

              <!-- OTP Verification Form -->
              <form (submit)="onVerifyOtp($event)" class="mt-5 space-y-4">
                <div>
                  <label for="otpCode" class="block text-xs font-bold text-slate-800 mb-1.5 text-left">Verification Code</label>
                  <input
                    id="otpCode"
                    name="otpCode"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="6"
                    autocomplete="one-time-code"
                    required
                    autofocus
                    placeholder="------"
                    [value]="otpCode()"
                    (input)="otpCode.set($any($event.target).value)"
                    class="w-full py-3 px-4 rounded-xl border-2 border-slate-200 text-slate-900 text-2xl font-mono font-extrabold text-center tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white placeholder:text-slate-300 shadow-2xs transition"
                  />
                </div>

                <!-- Submit Button -->
                <button
                  type="submit"
                  [disabled]="loading() || otpCode().length !== 6"
                  class="w-full py-2.5 px-4 bg-[#ea580c] hover:bg-[#c2410c] active:bg-[#9a3412] disabled:opacity-50 text-white font-bold text-sm rounded-lg shadow-sm transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer">
                  @if (loading()) {
                    <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Verifying Code...</span>
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Verify & Sign In</span>
                  }
                </button>
              </form>

              <!-- Resend and Back links -->
              <div class="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
                @if (loginCooldown() > 0) {
                  <p class="text-xs text-slate-400 font-medium">
                    Resend new code in <span class="font-bold text-slate-600">{{ loginCooldown() }}s</span>
                  </p>
                } @else {
                  <button
                    type="button"
                    (click)="onResendLoginOtp()"
                    [disabled]="loading()"
                    class="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline transition cursor-pointer">
                    Didn't receive the code? Resend Code
                  </button>
                }

                <button
                  type="button"
                  (click)="backToCredentials()"
                  class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to Sign In</span>
                </button>
              </div>

            </div>
          }

        </div>
      </div>

      <!-- Forgot Password Multi-Step Modal -->
      @if (showForgotPassword()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div class="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-7 sm:p-9 relative">

            <!-- Close Button (Top Right) -->
            @if (forgotStep() !== 4) {
              <button
                type="button"
                (click)="closeForgotPassword()"
                class="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
                title="Close"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            }

            <!-- ================= STEP 1: ENTER REGISTERED EMAIL ================= -->
            @if (forgotStep() === 1) {
              <div class="text-center">
                <div class="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 mx-auto mb-4 flex items-center justify-center shadow-2xs">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 class="text-xl font-extrabold text-slate-900 tracking-tight">Forgot Password?</h3>
                <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Enter your registered administrator email address. We will send you a 6-digit one-time verification code.
                </p>
              </div>

              @if (forgotError()) {
                <div class="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <svg class="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ forgotError() }}</span>
                </div>
              }

              <form (submit)="onRequestResetCode($event)" class="mt-5 space-y-4">
                <div>
                  <label for="forgot-email" class="block text-xs font-bold text-slate-800 mb-1.5 text-left">Email Address</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      placeholder="admin@sanmanuel.gov.ph"
                      [value]="forgotEmail()"
                      (input)="forgotEmail.set($any($event.target).value)"
                      class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  [disabled]="forgotLoading()"
                  class="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  @if (forgotLoading()) {
                    <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Sending code...</span>
                  } @else {
                    <span>Send Verification Code</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  }
                </button>
              </form>
            }

            <!-- ================= STEP 2: ENTER VERIFICATION CODE ================= -->
            @if (forgotStep() === 2) {
              <div class="text-center">
                <div class="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 mx-auto mb-4 flex items-center justify-center shadow-2xs">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 class="text-xl font-extrabold text-slate-900 tracking-tight">Enter Verification Code</h3>
                <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  We sent a 6-digit code to <strong class="text-slate-800">{{ forgotEmail() }}</strong>.<br>
                  The code expires in <strong class="text-orange-600">10 minutes</strong>.
                </p>
              </div>

              @if (forgotError()) {
                <div class="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <svg class="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ forgotError() }}</span>
                </div>
              }

              @if (forgotSuccessMessage()) {
                <div class="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <svg class="w-4 h-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{{ forgotSuccessMessage() }}</span>
                </div>
              }

              <form (submit)="onVerifyResetCode($event)" class="mt-5 space-y-4">
                <div>
                  <label for="verification-code" class="block text-xs font-bold text-slate-800 mb-1.5 text-left">6-Digit Code</label>
                  <input
                    id="verification-code"
                    type="text"
                    required
                    maxlength="6"
                    pattern="[0-9]{6}"
                    placeholder="123456"
                    [value]="verificationCode()"
                    (input)="verificationCode.set($any($event.target).value)"
                    class="w-full text-center tracking-[10px] text-2xl font-bold font-mono py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-300 placeholder:tracking-normal transition"
                  />
                </div>

                <div class="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    (click)="forgotStep.set(1)"
                    class="text-slate-500 hover:text-slate-700 font-medium transition cursor-pointer"
                  >
                    &larr; Change email
                  </button>

                  <button
                    type="button"
                    [disabled]="resendCooldown() > 0 || forgotLoading()"
                    (click)="onResendCode()"
                    class="text-orange-600 hover:text-orange-700 disabled:text-slate-400 font-semibold transition cursor-pointer"
                  >
                    @if (resendCooldown() > 0) {
                      Resend in {{ resendCooldown() }}s
                    } @else {
                      Resend Code
                    }
                  </button>
                </div>

                <button
                  type="submit"
                  [disabled]="forgotLoading() || verificationCode().length !== 6"
                  class="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  @if (forgotLoading()) {
                    <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Verifying...</span>
                  } @else {
                    <span>Verify Code</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  }
                </button>
              </form>
            }

            <!-- ================= STEP 3: SET NEW PASSWORD ================= -->
            @if (forgotStep() === 3) {
              <div class="text-center">
                <div class="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 mx-auto mb-4 flex items-center justify-center shadow-2xs">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 class="text-xl font-extrabold text-slate-900 tracking-tight">Set New Password</h3>
                <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Enter your new password below (minimum 6 characters).
                </p>
              </div>

              @if (forgotError()) {
                <div class="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <svg class="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ forgotError() }}</span>
                </div>
              }

              <form (submit)="onResetPassword($event)" class="mt-5 space-y-4">
                <!-- New Password -->
                <div>
                  <label for="new-password" class="block text-xs font-bold text-slate-800 mb-1.5 text-left">New Password</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="new-password"
                      [type]="showNewPassword() ? 'text' : 'password'"
                      required
                      minlength="6"
                      placeholder="Enter at least 6 characters"
                      [value]="newPassword()"
                      (input)="newPassword.set($any($event.target).value)"
                      class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400 transition"
                    />
                    <button
                      type="button"
                      (click)="showNewPassword.set(!showNewPassword())"
                      class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      @if (showNewPassword()) {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      } @else {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      }
                    </button>
                  </div>
                </div>

                <!-- Confirm Password -->
                <div>
                  <label for="confirm-password" class="block text-xs font-bold text-slate-800 mb-1.5 text-left">Confirm Password</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="confirm-password"
                      [type]="showConfirmPassword() ? 'text' : 'password'"
                      required
                      minlength="6"
                      placeholder="Re-enter your new password"
                      [value]="confirmPassword()"
                      (input)="confirmPassword.set($any($event.target).value)"
                      class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder:text-slate-400 transition"
                    />
                    <button
                      type="button"
                      (click)="showConfirmPassword.set(!showConfirmPassword())"
                      class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      @if (showConfirmPassword()) {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      } @else {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      }
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  [disabled]="forgotLoading() || newPassword().length < 6 || confirmPassword().length < 6"
                  class="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  @if (forgotLoading()) {
                    <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Saving password...</span>
                  } @else {
                    <span>Save New Password</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  }
                </button>
              </form>
            }

            <!-- ================= STEP 4: SUCCESS CONFIRMATION ================= -->
            @if (forgotStep() === 4) {
              <div class="text-center py-2 animate-fadeIn">
                <div class="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto mb-4 flex items-center justify-center shadow-xs">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 class="text-xl font-extrabold text-slate-900 tracking-tight">Password Reset Complete!</h3>
                <p class="text-xs text-slate-600 mt-2 leading-relaxed max-w-xs mx-auto">
                  Your administrator account password has been updated successfully. You can now sign in with your new password.
                </p>

                <button
                  type="button"
                  (click)="closeForgotPassword()"
                  class="w-full mt-6 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-sm transition cursor-pointer"
                >
                  Return to Login
                </button>
              </div>
            }

          </div>
        </div>
      }

    </div>
  `
})
export class LoginComponent implements OnInit {
  // Login Workflow Signals
  loginStep = signal<'CREDENTIALS' | 'OTP'>('CREDENTIALS');
  email = signal('');
  password = signal('');
  showPassword = signal(false);
  rememberMe = signal(false);
  error = signal('');
  loading = signal(false);

  // OTP Verification Signals
  otpCode = signal('');
  tempToken = signal('');
  maskedEmail = signal('');
  otpSuccessMessage = signal('');
  loginCooldown = signal(0);
  private loginCooldownInterval: any = null;

  // Forgot Password Workflow Signals
  showForgotPassword = signal(false);
  forgotStep = signal<1 | 2 | 3 | 4>(1);
  forgotEmail = signal('');
  verificationCode = signal('');
  resetToken = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  forgotLoading = signal(false);
  forgotError = signal('');
  forgotSuccessMessage = signal('');
  resendCooldown = signal(0);
  private cooldownInterval: any = null;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    // Load saved email if rememberMe was previously set
    if (typeof localStorage !== 'undefined') {
      const savedEmail = localStorage.getItem('ims_remember_email');
      if (savedEmail) {
        this.email.set(savedEmail);
        this.rememberMe.set(true);
      }
    }
  }

  private startLoginCooldown(seconds = 60) {
    this.loginCooldown.set(seconds);
    if (this.loginCooldownInterval) clearInterval(this.loginCooldownInterval);
    this.loginCooldownInterval = setInterval(() => {
      if (this.loginCooldown() <= 1) {
        clearInterval(this.loginCooldownInterval);
        this.loginCooldownInterval = null;
        this.loginCooldown.set(0);
      } else {
        this.loginCooldown.update(c => c - 1);
      }
    }, 1000);
  }

  onLogin(event: Event) {
    event.preventDefault();
    const emailVal = this.email().trim();
    const passVal = this.password().trim();

    if (!emailVal || !passVal) {
      this.error.set('Please enter both your email address and password.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    // Handle Remember Me persistence
    if (typeof localStorage !== 'undefined') {
      if (this.rememberMe()) {
        localStorage.setItem('ims_remember_email', emailVal);
      } else {
        localStorage.removeItem('ims_remember_email');
      }
    }

    this.auth.login(emailVal, passVal).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.tempToken.set(res.data.tempToken);
          this.maskedEmail.set(res.data.maskedEmail);
          this.otpCode.set('');
          this.otpSuccessMessage.set('');
          this.loginStep.set('OTP');
          this.startLoginCooldown(60);
        } else {
          this.error.set(res.message || 'Invalid email or password.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Invalid email or password.');
      }
    });
  }

  onVerifyOtp(event: Event) {
    event.preventDefault();
    const code = this.otpCode().trim();
    const emailVal = this.email().trim();
    const token = this.tempToken().trim();

    if (!code || code.length !== 6) {
      this.error.set('Please enter the complete 6-digit verification code.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.otpSuccessMessage.set('');

    this.auth.verifyLoginOtp(emailVal, code, token).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          if (this.loginCooldownInterval) {
            clearInterval(this.loginCooldownInterval);
            this.loginCooldownInterval = null;
          }
          this.router.navigate(['/dashboard']);
        } else {
          this.error.set(res.message || 'Invalid or expired verification code.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Invalid or expired verification code.');
      }
    });
  }

  onResendLoginOtp() {
    if (this.loginCooldown() > 0 || this.loading()) return;
    const emailVal = this.email().trim();
    const token = this.tempToken().trim();
    if (!emailVal || !token) return;

    this.loading.set(true);
    this.error.set('');
    this.otpSuccessMessage.set('');

    this.auth.resendLoginOtp(emailVal, token).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.tempToken.set(res.data.tempToken);
          this.maskedEmail.set(res.data.maskedEmail);
          this.otpSuccessMessage.set('A new verification code has been sent to your email.');
          this.startLoginCooldown(60);
        } else {
          this.error.set(res.message || 'Failed to resend verification code.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to resend verification code.');
      }
    });
  }

  backToCredentials() {
    if (this.loginCooldownInterval) {
      clearInterval(this.loginCooldownInterval);
      this.loginCooldownInterval = null;
    }
    this.loginStep.set('CREDENTIALS');
    this.otpCode.set('');
    this.error.set('');
    this.otpSuccessMessage.set('');
  }

  openForgotPassword() {
    this.forgotStep.set(1);
    this.forgotEmail.set(this.email());
    this.verificationCode.set('');
    this.resetToken.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.forgotError.set('');
    this.forgotSuccessMessage.set('');
    this.forgotLoading.set(false);
    this.showForgotPassword.set(true);
  }

  closeForgotPassword() {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
    this.showForgotPassword.set(false);
  }

  private startCooldown(seconds = 60) {
    this.resendCooldown.set(seconds);
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      if (this.resendCooldown() <= 1) {
        clearInterval(this.cooldownInterval);
        this.cooldownInterval = null;
        this.resendCooldown.set(0);
      } else {
        this.resendCooldown.update(c => c - 1);
      }
    }, 1000);
  }

  onRequestResetCode(event: Event) {
    event.preventDefault();
    const email = this.forgotEmail().trim();
    if (!email) {
      this.forgotError.set('Please enter your email address.');
      return;
    }

    this.forgotLoading.set(true);
    this.forgotError.set('');

    this.auth.forgotPassword(email).subscribe({
      next: (res) => {
        this.forgotLoading.set(false);
        this.forgotStep.set(2);
        this.startCooldown(60);
      },
      error: (err) => {
        this.forgotLoading.set(false);
        this.forgotError.set(err.error?.message || 'Failed to send verification code. Please try again.');
      }
    });
  }

  onResendCode() {
    if (this.resendCooldown() > 0 || this.forgotLoading()) return;
    const email = this.forgotEmail().trim();
    if (!email) return;

    this.forgotLoading.set(true);
    this.forgotError.set('');
    this.forgotSuccessMessage.set('');

    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.forgotLoading.set(false);
        this.forgotSuccessMessage.set('A new verification code has been sent.');
        this.startCooldown(60);
      },
      error: (err) => {
        this.forgotLoading.set(false);
        this.forgotError.set(err.error?.message || 'Failed to resend verification code.');
      }
    });
  }

  onVerifyResetCode(event: Event) {
    event.preventDefault();
    const email = this.forgotEmail().trim();
    const code = this.verificationCode().trim();

    if (!code || code.length !== 6) {
      this.forgotError.set('Please enter the complete 6-digit verification code.');
      return;
    }

    this.forgotLoading.set(true);
    this.forgotError.set('');
    this.forgotSuccessMessage.set('');

    this.auth.verifyResetCode(email, code).subscribe({
      next: (res) => {
        this.forgotLoading.set(false);
        if (res.success && res.data?.resetToken) {
          this.resetToken.set(res.data.resetToken);
          this.forgotStep.set(3);
        } else {
          this.forgotError.set(res.message || 'Invalid or expired verification code.');
        }
      },
      error: (err) => {
        this.forgotLoading.set(false);
        this.forgotError.set(err.error?.message || 'Invalid or expired verification code.');
      }
    });
  }

  onResetPassword(event: Event) {
    event.preventDefault();
    const email = this.forgotEmail().trim();
    const token = this.resetToken();
    const pass = this.newPassword();
    const confirm = this.confirmPassword();

    if (!pass || pass.length < 6) {
      this.forgotError.set('Password must be at least 6 characters.');
      return;
    }

    if (pass !== confirm) {
      this.forgotError.set('Passwords do not match. Please re-enter.');
      return;
    }

    this.forgotLoading.set(true);
    this.forgotError.set('');

    this.auth.resetPassword(email, token, pass).subscribe({
      next: (res) => {
        this.forgotLoading.set(false);
        if (res.success) {
          this.forgotStep.set(4);
        } else {
          this.forgotError.set(res.message || 'Failed to reset password.');
        }
      },
      error: (err) => {
        this.forgotLoading.set(false);
        this.forgotError.set(err.error?.message || 'Failed to reset password. Please try again.');
      }
    });
  }
}


