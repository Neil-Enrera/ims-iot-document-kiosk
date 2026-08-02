import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/kiosk/kiosk.component').then(m => m.KioskComponent) },
  { path: '**', redirectTo: '' }
];
