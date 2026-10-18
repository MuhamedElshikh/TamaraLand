import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });
}

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  const token = isBrowser ? authService.getAccessToken() : null;

  let authReq = req;
  if (token && !req.headers.has('Authorization')) {
    authReq = addToken(req, token);
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (
        isBrowser &&
        error instanceof HttpErrorResponse &&
        error.status === 401
      ) {
        const isAuthEndpoint =
          req.url.includes('/api/Auth/login') ||
          req.url.includes('/api/Auth/register') ||
          req.url.includes('/api/Auth/refresh-token') ||
          req.url.includes('/api/Auth/revoke-token');

        if (isAuthEndpoint) {
          if (req.url.includes('/api/Auth/refresh-token')) {
            authService.logout();
          }
          return throwError(() => error);
        }

        const refreshToken = authService.getRefreshToken();
        if (!refreshToken) {
          if (token) {
            authService.logout();
          }
          return throwError(() => error);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap((res) => {
              isRefreshing = false;
              const newAccessToken = res.data?.accessToken;
              if (newAccessToken) {
                refreshTokenSubject.next(newAccessToken);
                return next(addToken(req, newAccessToken));
              } else {
                authService.logout();
                return throwError(() => error);
              }
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              refreshTokenSubject.next(null);
              authService.logout();
              return throwError(() => refreshErr);
            })
          );
        } else {
          return refreshTokenSubject.pipe(
            filter((newToken): newToken is string => newToken !== null),
            take(1),
            switchMap((newToken) => next(addToken(req, newToken)))
          );
        }
      }

      return throwError(() => error);
    })
  );
};