import { Routes } from '@angular/router';

/** Allow both guest and authenticated users to access cart page. */
export const CART_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/cart/cart.page').then((m) => m.CartPage),
  },
];
