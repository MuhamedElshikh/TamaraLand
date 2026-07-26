import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

/** @see .ai/STRUCTURE.md */
export const CART_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/cart/cart.page').then((m) => m.CartPage),
    canActivate: [authGuard],
  },
];
