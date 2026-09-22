import { Routes } from '@angular/router';
import { PortalLayoutComponent } from './core/layouts/portal-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: PortalLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
      { path: 'services', loadComponent: () => import('./features/services/services.component').then(m => m.ServicesComponent) },
      { path: 'requests', loadComponent: () => import('./features/requests/requests.component').then(m => m.RequestsComponent) },
      { path: 'contact', loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent) },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
