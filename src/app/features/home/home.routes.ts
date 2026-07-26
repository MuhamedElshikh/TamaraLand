import { Routes } from '@angular/router';

/** @see .ai/STRUCTURE.md */
export const HOME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
];
