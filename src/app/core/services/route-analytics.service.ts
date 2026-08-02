import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AnalyticsService } from './analytics.service';

@Injectable({
  providedIn: 'root'
})
export class RouteAnalyticsService {

  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);

  constructor() {

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {

        this.analytics.pageView(document.title);

      });

  }
}