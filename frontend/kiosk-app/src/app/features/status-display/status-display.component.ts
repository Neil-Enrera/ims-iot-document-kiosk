import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KioskService } from '../kiosk/kiosk.service';

@Component({
  selector: 'app-status-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-screen w-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="px-10 py-6 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <p class="text-2xl font-light text-slate-400 uppercase tracking-[0.3em]">Barangay San Manuel</p>
          <h1 class="text-5xl font-black mt-1">Document Request Status Board</h1>
        </div>
        <div class="text-right">
          <p class="text-7xl font-bold tabular-nums leading-none">{{ now() | date: 'HH:mm:ss' }}</p>
          <p class="text-2xl text-slate-400 mt-2">{{ now() | date: 'EEEE, MMMM d, yyyy' }}</p>
        </div>
      </header>

      <!-- Board -->
      <main class="flex-1 grid grid-cols-2 gap-8 p-8 min-h-0">
        <!-- Under Review -->
        <section class="flex flex-col rounded-3xl overflow-hidden border-2 border-yellow-400/40 bg-slate-900 min-h-0">
          <div class="bg-yellow-400 text-slate-950 text-center py-5 shrink-0">
            <h2 class="text-5xl font-black uppercase tracking-widest">Under Review</h2>
            <p class="text-2xl mt-1 font-medium">Being Reviewed or Processed</p>
          </div>
          <div class="flex-1 p-6 overflow-y-auto">
            @if (underReview().length === 0) {
              <p class="text-3xl text-slate-500 text-center mt-20">No requests in progress</p>
            } @else {
              <ul class="space-y-4">
                @for (num of underReview(); track num) {
                  <li class="bg-slate-800 border-2 border-yellow-400/30 rounded-2xl px-8 py-6 text-center">
                    <span class="text-6xl font-black text-yellow-300 tabular-nums tracking-widest">{{ num }}</span>
                  </li>
                }
              </ul>
            }
          </div>
        </section>

        <!-- Ready for Release -->
        <section class="flex flex-col rounded-3xl overflow-hidden border-2 border-green-400/40 bg-slate-900 min-h-0">
          <div class="bg-green-400 text-slate-950 text-center py-5 shrink-0">
            <h2 class="text-5xl font-black uppercase tracking-widest">Ready for Release</h2>
            <p class="text-2xl mt-1 font-medium">Please Proceed to the Front Desk</p>
          </div>
          <div class="flex-1 p-6 overflow-y-auto">
            @if (readyForRelease().length === 0) {
              <p class="text-3xl text-slate-500 text-center mt-20">No requests ready for release</p>
            } @else {
              <ul class="space-y-4">
                @for (num of readyForRelease(); track num) {
                  <li class="bg-slate-800 border-2 border-green-400/30 rounded-2xl px-8 py-6 text-center">
                    <span class="text-6xl font-black text-green-300 tabular-nums tracking-widest">{{ num }}</span>
                  </li>
                }
              </ul>
            }
          </div>
        </section>
      </main>

      <!-- Footer -->
      <footer class="px-10 py-4 border-t border-slate-800 flex items-center justify-between shrink-0">
        <p class="text-xl text-slate-400">For your privacy, only request numbers are displayed.</p>
        <p class="text-xl text-slate-400">
          @if (loading()) {
            <span class="text-slate-500">Connecting...</span>
          } @else {
            Last updated {{ lastUpdated() | date: 'hh:mm:ss a' }}
          }
        </p>
      </footer>
    </div>
  `
})
export class StatusDisplayComponent implements OnInit, OnDestroy {
  underReview = signal<string[]>([]);
  readyForRelease = signal<string[]>([]);
  lastUpdated = signal<Date>(new Date());
  now = signal<Date>(new Date());
  loading = signal(true);

  private pollTimer: any;
  private clockTimer: any;

  constructor(private kioskService: KioskService) {}

  ngOnInit() {
    this.load();
    this.pollTimer = setInterval(() => this.load(), 7000);
    this.clockTimer = setInterval(() => this.now.set(new Date()), 1000);
  }

  ngOnDestroy() {
    clearInterval(this.pollTimer);
    clearInterval(this.clockTimer);
  }

  private load() {
    this.kioskService.getStatusDisplay().subscribe({
      next: (res) => {
        this.underReview.set(res.data.underReview);
        this.readyForRelease.set(res.data.readyForRelease);
        this.lastUpdated.set(new Date(res.data.updatedAt));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
