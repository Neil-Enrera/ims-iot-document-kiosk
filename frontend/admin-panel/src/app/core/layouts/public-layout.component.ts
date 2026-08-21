import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main class="min-h-screen w-full bg-slate-50">
      <router-outlet />
    </main>
  `
})
export class PublicLayoutComponent {}
