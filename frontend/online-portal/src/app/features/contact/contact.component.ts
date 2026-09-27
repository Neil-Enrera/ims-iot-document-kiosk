import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface ContactForm {
  fullName: string;
  email: string;
  phoneNumber: string;
  subject: string;
  message: string;
}

interface BarangayContactInfo {
  barangayName: string;
  officeAddress: string;
  addressLine1: string;
  addressLine2: string;
  contactNumber: string;
  contactHours: string;
  email: string;
  emailResponseTime: string;
  officeHoursDays: string;
  officeHoursTime: string;
  mapsUrl: string;
}

@Component({
  selector: 'portal-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Top Hero Banner: Spans full width matching reference image -->
    <div class="relative w-full border-b border-slate-200/80 bg-white overflow-hidden select-none">
      <!-- Background Panoramic Photo of Barangay San Manuel Hall -->
      <img
        src="Barangay Hall.png"
        alt="Barangay San Manuel Hall"
        class="absolute inset-0 w-full h-full object-cover object-right pointer-events-none"
      />
      <!-- Gradient Mask: Smooth fade on left so header text is crisp, clear and readable -->
      <div class="absolute inset-0 bg-gradient-to-r from-white via-white/95 sm:via-white/90 md:via-white/75 to-white/20 sm:to-transparent pointer-events-none"></div>

      <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        <!-- Breadcrumb Navigation -->
        <nav class="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3" aria-label="Breadcrumb">
          <a routerLink="/" class="hover:text-orange-600 transition flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Home
          </a>
          <span>/</span>
          <span class="text-slate-800 font-semibold">Contact Us</span>
        </nav>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <!-- Main Hero Text -->
          <div class="max-w-xl">
            <p class="text-xs font-black uppercase tracking-wider text-orange-600">GET IN TOUCH</p>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f172a] mt-1 tracking-tight">
              We're Here to Help
            </h1>
            <p class="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
              Have questions, concerns, or need assistance? Reach out to us and we'll get back to you as soon as possible.
            </p>
          </div>

          <!-- Handwritten Slogan Callout Badge -->
          <div class="hidden lg:flex flex-col items-center select-none transform -rotate-3 shrink-0 self-center pr-8 pointer-events-none">
            <div class="relative text-center">
              <span class="block font-black text-lg lg:text-xl text-[#0f172a] italic tracking-tight font-serif">
                Tulong sa
              </span>
              <span class="block font-black text-xl lg:text-2xl text-[#0f172a] italic tracking-tight font-serif -mt-1">
                bawat San Manuel!
              </span>
              <!-- Curved orange brush underline -->
              <svg class="w-36 h-3 mx-auto text-orange-500 mt-0.5" viewBox="0 0 140 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8.5C35 2.5 105 2.5 137 8.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Container -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      
      <!-- Main 2-Column Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <!-- ============ LEFT 2 COLUMNS: CONTACT FORM ============ -->
        <div class="lg:col-span-2">
          <div class="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            
            <!-- Card Header -->
            <div class="flex items-start gap-4 pb-6 border-b border-slate-100">
              <div class="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <p class="text-[11px] font-black uppercase tracking-wider text-orange-600">SEND US A MESSAGE</p>
                <h2 class="text-2xl font-black text-slate-900 leading-tight mt-0.5">Contact Form</h2>
                <p class="text-xs text-slate-500 mt-1">Fill out the form below and we'll get back to you as soon as possible.</p>
              </div>
            </div>

            <!-- Success Alert Banner -->
            @if (submittedSuccess()) {
              <div class="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start justify-between gap-3 animate-in fade-in duration-200">
                <div class="flex items-start gap-3">
                  <div class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <div>
                    <p class="font-bold">Message Sent Successfully</p>
                    <p class="text-xs text-emerald-700 mt-0.5">Thank you for contacting Barangay San Manuel. Our team will review your message and reach out shortly.</p>
                  </div>
                </div>
                <button (click)="submittedSuccess.set(false)" class="text-emerald-600 hover:text-emerald-800 p-1 rounded-lg cursor-pointer">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            }

            <!-- Error Alert Banner -->
            @if (errorMessage()) {
              <div class="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200">
                <svg class="w-5 h-5 shrink-0 text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <!-- Form Content -->
            <form (ngSubmit)="submitMessage()" class="mt-6 space-y-5">
              
              <!-- Row 1: Full Name & Email Address -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="form.fullName"
                    name="fullName"
                    placeholder="Juan Dela Cruz"
                    required
                    class="w-full h-11 px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    [(ngModel)]="form.email"
                    name="email"
                    placeholder="youremail@example.com"
                    required
                    class="w-full h-11 px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition"
                  />
                </div>
              </div>

              <!-- Row 2: Phone Number & Subject -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    [(ngModel)]="form.phoneNumber"
                    name="phoneNumber"
                    placeholder="09123456789"
                    class="w-full h-11 px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">
                    Subject <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <select
                      [(ngModel)]="form.subject"
                      name="subject"
                      required
                      class="w-full h-11 px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition appearance-none cursor-pointer pr-10"
                    >
                      <option value="" disabled selected>Select a subject</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Document Request Assistance">Document Request Assistance</option>
                      <option value="Barangay ID Inquiry">Barangay ID Inquiry</option>
                      <option value="Technical Support / Online Portal">Technical Support / Online Portal</option>
                      <option value="Feedback & Suggestions">Feedback & Suggestions</option>
                      <option value="Other Concern">Other Concern</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Row 3: Message -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">
                  Message <span class="text-red-500">*</span>
                </label>
                <textarea
                  [(ngModel)]="form.message"
                  name="message"
                  rows="5"
                  placeholder="Type your message here..."
                  required
                  class="w-full p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition resize-y min-h-[120px]"
                ></textarea>
              </div>

              <!-- Submit Button (Right-aligned, no attach file option) -->
              <div class="flex justify-end pt-2">
                <button
                  type="submit"
                  [disabled]="isSubmitting()"
                  class="inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm shadow-xs transition active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  @if (isSubmitting()) {
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending Message...</span>
                  } @else {
                    <svg class="w-4 h-4 transform rotate-45 -mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    </svg>
                    <span>Send Message</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- ============ RIGHT 1 COLUMN: OFFICIAL BARANGAY INFORMATION ============ -->
        <div class="space-y-6">

          <!-- Card 1: Official Barangay Information & Channels -->
          <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            
            <!-- Office Address (Official Barangay Location) -->
            <div class="flex items-start gap-4">
              <div class="w-11 h-11 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-black text-slate-900">Office Address</h3>
                <p class="text-xs text-slate-600 mt-1 font-semibold leading-snug">
                  {{ barangayInfo().addressLine1 }}
                </p>
                <p class="text-xs text-slate-500 leading-snug mt-0.5">
                  {{ barangayInfo().addressLine2 }}
                </p>
              </div>
            </div>

            <!-- Official Barangay Contact Number -->
            <div class="flex items-start gap-4 pt-4 border-t border-slate-100">
              <div class="w-11 h-11 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-black text-slate-900">Contact Number</h3>
                <p class="text-xs font-bold text-slate-800 mt-1">{{ barangayInfo().contactNumber }}</p>
                <p class="text-[11px] text-slate-400">{{ barangayInfo().contactHours }}</p>
              </div>
            </div>

            <!-- Official Barangay Email Address -->
            <div class="flex items-start gap-4 pt-4 border-t border-slate-100">
              <div class="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-black text-slate-900">Email Address</h3>
                <p class="text-xs font-bold text-slate-800 mt-1">{{ barangayInfo().email }}</p>
                <p class="text-[11px] text-slate-400">{{ barangayInfo().emailResponseTime }}</p>
              </div>
            </div>

          </div>

          <!-- Card 2: Official Office Hours -->
          <div class="rounded-3xl border border-orange-200/80 bg-orange-50/70 p-5 flex items-center gap-4 shadow-2xs">
            <div class="w-11 h-11 rounded-2xl bg-white text-orange-600 flex items-center justify-center shrink-0 border border-orange-200 shadow-2xs">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <h3 class="text-xs font-black uppercase tracking-wider text-orange-950">Office Hours</h3>
              <p class="text-xs text-slate-600 mt-0.5 font-medium">{{ barangayInfo().officeHoursDays }}</p>
              <p class="text-xs font-bold text-orange-900">{{ barangayInfo().officeHoursTime }}</p>
            </div>
          </div>

          <!-- Card 3: Find Us on Map -->
          <div class="relative rounded-3xl overflow-hidden shadow-xs border border-slate-200 bg-slate-900 min-h-[170px] flex flex-col justify-between p-5 text-white group">
            <!-- Background Image with Overlay -->
            <img
              src="Barangay Hall.png"
              alt="Barangay San Manuel Map Location"
              class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-slate-900/40"></div>

            <!-- Card Content Top -->
            <div class="relative z-10 flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 text-white border border-white/30">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <h4 class="text-sm font-black text-white">Find Us on Map</h4>
                <p class="text-[11px] text-slate-200/90">View our location on Google Maps</p>
              </div>
            </div>

            <!-- Card Action Bottom: Uses provided Google Maps Link -->
            <div class="relative z-10 mt-6 flex justify-center">
              <a
                [href]="barangayInfo().mapsUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs border border-white/30 transition shadow-sm cursor-pointer active:scale-98"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>

        </div>

      </div>

      <!-- Bottom Urgent Concerns Notification Bar -->
      <div class="mt-8 rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 text-xs text-amber-950 flex items-center gap-3 shadow-2xs">
        <div class="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
        <p class="leading-relaxed">
          For <strong class="text-orange-700 font-bold">urgent concerns</strong>, you may also visit our Barangay Office during business hours for immediate assistance.
        </p>
      </div>

    </div>
  `
})
export class ContactComponent implements OnInit {
  isSubmitting = signal(false);
  submittedSuccess = signal(false);
  errorMessage = signal('');

  // Official Barangay Contact Info (independent from logged-in resident)
  barangayInfo = signal<BarangayContactInfo>({
    barangayName: 'Barangay San Manuel',
    officeAddress: 'Barangay San Manuel Hall, San Manuel, City of San Jose del Monte, 3023 Bulacan',
    addressLine1: 'Barangay San Manuel Hall',
    addressLine2: 'San Manuel, City of San Jose del Monte, 3023 Bulacan',
    contactNumber: '(044) 307-8899 / 0917-123-4567',
    contactHours: '(Mon–Fri, 8:00 AM – 5:00 PM)',
    email: 'barangaysanmanuel.csjdm@gmail.com',
    emailResponseTime: "(We'll respond as soon as possible)",
    officeHoursDays: 'Monday – Friday',
    officeHoursTime: '8:00 AM – 5:00 PM',
    mapsUrl: 'https://maps.app.goo.gl/ShncDzyj6p411n5g6'
  });

  form: ContactForm = {
    fullName: '',
    email: '',
    phoneNumber: '',
    subject: '',
    message: ''
  };

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // 1. Fetch official barangay details from API if available
    const apiUrl = environment.apiUrl.replace(/\/+$/, '');
    this.http.get<{ success: boolean; data: BarangayContactInfo }>(`${apiUrl}/portal/contact-info`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.barangayInfo.set({ ...this.barangayInfo(), ...res.data });
        }
      },
      error: () => {
        // Fallback default official barangay info remains active
      }
    });

    // 2. Pre-fill the contact form input fields if resident is logged in
    const user = this.auth.currentUser();
    if (user) {
      this.form.fullName = [user.first_name, user.middle_name, user.last_name, user.suffix].filter(Boolean).join(' ').trim();
      this.form.email = user.email || '';
      this.form.phoneNumber = user.contact_number || '';
    }
  }

  submitMessage(): void {
    if (!this.form.fullName.trim()) {
      this.errorMessage.set('Please enter your full name.');
      return;
    }

    if (!this.form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim())) {
      this.errorMessage.set('Please provide a valid email address.');
      return;
    }

    if (!this.form.subject.trim()) {
      this.errorMessage.set('Please select a subject.');
      return;
    }

    if (!this.form.message.trim()) {
      this.errorMessage.set('Please enter your message.');
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    const apiUrl = environment.apiUrl.replace(/\/+$/, '');

    this.http.post<{ success: boolean; message: string }>(`${apiUrl}/portal/contact`, this.form).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.submittedSuccess.set(true);
        // Reset message and subject while keeping contact details
        this.form.subject = '';
        this.form.message = '';
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to send message. Please check your network and try again.');
      }
    });
  }
}
