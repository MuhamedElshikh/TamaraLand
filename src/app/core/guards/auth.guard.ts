import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('usertoken');

  // ✅ دالة موحدة: بترجع للـ Login وبتحفظ الصفحة اللي كان رايحلها
  // في returnUrl، عشان بعد ما يسجل دخول يرجع لنفس المكان تلقائيًا
  const redirectToLogin = (): false => {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  };

  if (!token) {
    return redirectToLogin();
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp;
    const now = Math.floor(Date.now() / 1000);

    if (expiry && now >= expiry) {
      localStorage.removeItem('usertoken');
      return redirectToLogin();
    }

    return true;
  } catch {
    localStorage.removeItem('usertoken');
    return redirectToLogin();
  }
};