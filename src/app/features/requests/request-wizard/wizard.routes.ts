import { Routes } from '@angular/router';
import { provideUiDates } from '../../../ui/provide-ui';

/** O seletor de data (e o date-fns) só carregam junto com o wizard. */
export const WIZARD_ROUTES: Routes = [
  {
    path: '',
    providers: [provideUiDates()],
    loadComponent: () => import('./request-wizard').then((m) => m.RequestWizard),
  },
];
