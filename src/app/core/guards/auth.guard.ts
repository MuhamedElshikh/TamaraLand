import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // جوه بيئة الـ SSR/build مفيش localStorage خالص، والراوت ده أصلاً
  // Client-render mode، فمفيش داعي نمنع أي حاجة هنا - الحماية الحقيقية
  // بتحصل في المتصفح بعد الـ hydration
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

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