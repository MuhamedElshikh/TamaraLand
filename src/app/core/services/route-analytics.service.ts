import {
  DOCUMENT,
  isPlatformBrowser,
} from '@angular/common';

import {
  Injectable,
  PLATFORM_ID,
  inject,
} from '@angular/core';

import {
  NavigationEnd,
  Router,
} from '@angular/router';

import { filter } from 'rxjs/operators';

import { AnalyticsService } from './analytics.service';

@Injectable({
  providedIn: 'root'
})
export class RouteAnalyticsService {

  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);

  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {

    // Analytics is browser-only.
    // Do not subscribe to router navigation events during SSR/prerender.
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.router.events
      .pipe(
        filter(
          event => event instanceof NavigationEnd
        )
      )
      .subscribe(() => {

        this.analytics.pageView(
          this.document.title
        );

      });

  }
}