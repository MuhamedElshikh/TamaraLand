import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('usertoken');

  let authReq = req;
  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // Only redirect to login if a token existed but was rejected (expired/invalid).
      // Guests (no token) should NOT be redirected away from guest-accessible pages.
      if (error.status === 401 && token) {
        localStorage.removeItem('usertoken');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
