import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'requests' },
  {
    path: 'requests',
    loadComponent: () =>
      import('./features/requests/request-list/request-list').then((m) => m.RequestList),
  },
  {
    path: 'requests/new',
    loadComponent: () =>
      import('./features/requests/request-wizard/request-wizard').then((m) => m.RequestWizard),
  },
  {
    path: 'requests/:id',
    loadComponent: () =>
      import('./features/requests/request-detail/request-detail').then((m) => m.RequestDetail),
  },
  { path: '**', redirectTo: 'requests' },
];
