import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

/** @see .ai/STRUCTURE.md */
export const WISHLIST_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/wishlist/wishlist.page').then((m) => m.WishlistPage),
    
  },
];
