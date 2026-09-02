import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GoogleTagManagerService {

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(
    @Inject(DOCUMENT) private document: Document
  ) {}

  initialize(): void {

    if (!this.isBrowser) return;

    if (!environment.analytics.enabled)
      return;

    if (this.document.getElementById('gtm-script'))
      return;

    (window as any).dataLayer = (window as any).dataLayer || [];

    (window as any).dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    const script = this.document.createElement('script');

    script.id = 'gtm-script';
    script.async = true;
    script.src =
      `https://www.googletagmanager.com/gtm.js?id=${environment.analytics.gtmId}`;

    this.document.head.appendChild(script);
  }

  push(event: object): void {

    if (!this.isBrowser) return;

    if (!environment.analytics.enabled)
      return;

    (window as any).dataLayer = (window as any).dataLayer || [];

    (window as any).dataLayer.push(event);

  }

}