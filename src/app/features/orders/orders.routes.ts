import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

/** @see .ai/STRUCTURE.md */
export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/order-list/order-list.page').then((m) => m.OrderListPage),
    canActivate: [authGuard],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/order-details/order-details.page').then((m) => m.OrderDetailsPage),
    canActivate: [authGuard],
  },
];
