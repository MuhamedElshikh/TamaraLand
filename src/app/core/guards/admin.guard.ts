import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // مسار /admin أصلاً Client-render mode، مش هيتلمس وقت الـ build/SSR،
  // بس الحماية دي بتضمن إننا منكسرش لو اتنده عليه بأي طريقة وقت الـ build
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

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