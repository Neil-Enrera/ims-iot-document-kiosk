import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <div class="text-6xl font-bold text-gray-300 mb-4">500</div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Server Error</h1>
        <p class="text-gray-500 mb-6">Something went wrong on our end. Please try again later.</p>
        <a routerLink="/dashboard" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Return to Dashboard
        </a>
      </div>
    </div>
  `
})
export class ServerErrorComponent {}
