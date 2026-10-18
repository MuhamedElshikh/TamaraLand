import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const token = authService.getAccessToken();

  const redirectToLogin = (): false => {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  };

  if (!token) {
    const refreshToken = authService.getRefreshToken();
    if (refreshToken) {
      return authService.refreshToken().pipe(
        map((res) => (res.success && res.data?.accessToken ? true : redirectToLogin())),
        catchError(() => of(redirectToLogin()))
      );
    }
    return redirectToLogin();
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp;
    const now = Math.floor(Date.now() / 1000);

    if (expiry && now >= expiry) {
      const refreshToken = authService.getRefreshToken();
      if (refreshToken) {
        return authService.refreshToken().pipe(
          map((res) => (res.success && res.data?.accessToken ? true : redirectToLogin())),
          catchError(() => of(redirectToLogin()))
        );
      }
      authService.logout();
      return redirectToLogin();
    }

    return true;
  } catch {
    authService.logout();
    return redirectToLogin();
  }
};