import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

/**
 * Root application routes.
 * Customer routes use CustomerLayoutComponent; admin routes use AdminLayoutComponent + adminGuard.
 * @see .ai/STRUCTURE.md
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/customer-layout/customer-layout.component').then(
        (m) => m.CustomerLayoutComponent
      ),
    children: [
      {
        path: '',
        loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
      },
      {
        path: '',
        loadChildren: () => import('./features/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES),
      },
      {
        path: 'cart',
        loadChildren: () => import('./features/cart/cart.routes').then((m) => m.CART_ROUTES),
      },
      {
        path: 'checkout',
        loadChildren: () =>
          import('./features/checkout/checkout.routes').then((m) => m.CHECKOUT_ROUTES),
      },
      {
        path: 'orders',
        loadChildren: () => import('./features/orders/orders.routes').then((m) => m.ORDERS_ROUTES),
      },
      {
        path: 'wishlist',
        loadChildren: () =>
          import('./features/wishlist/wishlist.routes').then((m) => m.WISHLIST_ROUTES),
      },
      {
        path: 'addresses',
        loadChildren: () =>
          import('./features/addresses/addresses.routes').then((m) => m.ADDRESSES_ROUTES),
      },
    ],
  },
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
