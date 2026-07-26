import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('usertoken');

  if (token) {
    // Check if token is expired (basic check on client side)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      if (expiry && now >= expiry) {
        localStorage.removeItem('usertoken');
        router.navigate(['/login']);
        return false;
      }
      return true;
    } catch {
      localStorage.removeItem('usertoken');
      router.navigate(['/login']);
      return false;
    }
  }

  router.navigate(['/login']);
  return false;
};
