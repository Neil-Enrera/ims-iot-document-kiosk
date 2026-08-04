import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/kiosk/kiosk.component').then(m => m.KioskComponent) },
  { path: 'status-display', loadComponent: () => import('./features/status-display/status-display.component').then(m => m.StatusDisplayComponent) },
  { path: '**', redirectTo: '' }
];
