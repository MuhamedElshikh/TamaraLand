import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('usertoken');

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roleClaim = payload['role'] || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      
      const roles = Array.isArray(roleClaim) ? roleClaim : [roleClaim];
      if (roles.includes('Admin')) {
        return true;
      }
    } catch {
      // Ignore parsing errors and deny
    }
  }

  router.navigate(['/']);
  return false;
};
