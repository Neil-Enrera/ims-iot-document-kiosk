import { Routes } from '@angular/router';
import { PortalLayoutComponent } from './core/layouts/portal-layout.component';
import { authGuard, guestGuard, changePasswordGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'change-password',
    canActivate: [changePasswordGuard],
    loadComponent: () => import('./features/auth/change-password.component').then(m => m.ChangePasswordComponent)
  },
  {
    path: '',
    component: PortalLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
      { path: 'services', loadComponent: () => import('./features/services/services.component').then(m => m.ServicesComponent) },
      {
        path: 'apply',
        canActivate: [authGuard],
        loadComponent: () => import('./features/apply/apply.component').then(m => m.ApplyComponent)
      },
      {
        path: 'requests/new',
        redirectTo: 'apply',
        pathMatch: 'full'
      },
      {
        path: 'requests',
        canActivate: [authGuard],
        loadComponent: () => import('./features/requests/requests.component').then(m => m.RequestsComponent)
      },
      { path: 'contact', loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent) },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
    ]
  },
  { path: '**', redirectTo: '' }
];
