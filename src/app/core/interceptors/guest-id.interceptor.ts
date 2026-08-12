import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { GuestSessionService } from '../services/guest-session.service';

export const guestIdInterceptor: HttpInterceptorFn = (req, next) => {
  const guestSessionService = inject(GuestSessionService);
  const guestId = guestSessionService.getGuestId();

  let headers = req.headers;
  if (guestId) {
  headers = headers.set('X-Guest-Id', guestId);
}

  const clonedReq = req.clone({ headers });

  return next(clonedReq);
};
