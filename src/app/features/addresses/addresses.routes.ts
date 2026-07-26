import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

/** @see .ai/STRUCTURE.md */
export const ADDRESSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/address-list/address-list.page').then((m) => m.AddressListPage),
    canActivate: [authGuard],
  },
];
