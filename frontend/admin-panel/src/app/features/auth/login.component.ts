import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InputComponent } from '../../shared/components/input.component';
import { ButtonComponent } from '../../shared/components/button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [InputComponent, ButtonComponent],
  template: `
    <div class="w-full max-w-md bg-white rounded-lg shadow-md p-8">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-800">Barangay San Manuel</h1>
        <p class="text-sm text-gray-500 mt-1">IMS Document Request Services</p>
      </div>
      <form (submit)="onLogin($event)" class="space-y-4">
        <app-input label="Username" placeholder="Enter username" [value]="username()" (valueChange)="username.set($event)" />
        <app-input label="Password" type="password" placeholder="Enter password" [value]="password()" (valueChange)="password.set($event)" />
        @if (error()) {
          <p class="text-red-500 text-sm text-center">{{ error() }}</p>
        }
        <app-button type="submit" [loading]="loading()" variant="primary">Login</app-button>
      </form>
    </div>
  `
})
export class LoginComponent {
  username = signal('');
  password = signal('');
  error = signal('');
  loading = signal(false);

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onLogin(event: Event) {
    event.preventDefault();
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.username(), this.password()).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error.set(res.message);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Login failed. Please try again.');
      }
    });
  }
}
