import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

/** @see .ai/STRUCTURE.md */
export const CHECKOUT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/checkout/checkout.page').then((m) => m.CheckoutPage),
    canActivate: [authGuard],
  },
];
