import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './core/layouts/layout.component';
import { PublicLayoutComponent } from './core/layouts/public-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'residents', loadComponent: () => import('./features/residents/residents.component').then(m => m.ResidentsComponent) },
      { path: 'requests', loadComponent: () => import('./features/requests/requests.component').then(m => m.RequestsComponent) },
      { path: 'applications', loadComponent: () => import('./features/applications/applications.component').then(m => m.ApplicationsComponent) },
      { path: 'services', loadComponent: () => import('./features/services/services.component').then(m => m.ServicesComponent) },
      { path: 'rfid', loadComponent: () => import('./features/rfid/rfid.component').then(m => m.RfidComponent) },
      { path: 'users', loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent), canActivate: [authGuard] },
      { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent), canActivate: [authGuard] },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'files', loadComponent: () => import('./features/files/files.component').then(m => m.FilesComponent) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent), canActivate: [authGuard] },
      { path: 'audit', loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent), canActivate: [authGuard] },
    ]
  },
  { path: '403', loadComponent: () => import('./features/errors/forbidden.component').then(m => m.ForbiddenComponent) },
  { path: '404', loadComponent: () => import('./features/errors/not-found.component').then(m => m.NotFoundComponent) },
  { path: '500', loadComponent: () => import('./features/errors/server-error.component').then(m => m.ServerErrorComponent) },
  { path: '**', redirectTo: '404' }
];
