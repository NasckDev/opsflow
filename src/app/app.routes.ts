import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inbox' },
  {
    path: 'inbox',
    loadComponent: () => import('./features/inbox/inbox').then((m) => m.Inbox),
  },
  {
    path: 'requests',
    loadComponent: () =>
      import('./features/requests/request-list/request-list').then((m) => m.RequestList),
  },
  {
    path: 'requests/new',
    loadChildren: () =>
      import('./features/requests/request-wizard/wizard.routes').then((m) => m.WIZARD_ROUTES),
  },
  {
    path: 'requests/:id',
    loadComponent: () =>
      import('./features/requests/request-detail/request-detail').then((m) => m.RequestDetail),
  },
  {
    path: 'board',
    loadComponent: () => import('./features/board/board').then((m) => m.Board),
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/analytics').then((m) => m.Analytics),
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
  },
  { path: '**', redirectTo: 'inbox' },
];
