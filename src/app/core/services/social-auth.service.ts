import {
  Injectable,
  NgZone,
  PLATFORM_ID,
  inject,
} from '@angular/core';

import {
  DOCUMENT,
  isPlatformBrowser,
} from '@angular/common';

import {
  Observable,
  Subject,
  Subscriber,
  from,
  of,
  throwError,
} from 'rxjs';

import {
  switchMap,
} from 'rxjs/operators';

import { AuthService } from './auth.service';
import { AnalyticsService } from './analytics.service';

import { ApiResponse } from '../models/api-response.model';
import { AuthResponse } from '../models/auth.models';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    google?: any;
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

export type SocialProvider =
  | 'google'
  | 'apple'
  | 'microsoft'
  | 'twitter';

export interface GoogleAuthEvent {
  status: 'success' | 'error' | 'cancelled';
  response?: ApiResponse<AuthResponse>;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SocialAuthService {

  private readonly authService = inject(AuthService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly zone = inject(NgZone);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  private readonly isBrowser =
    isPlatformBrowser(this.platformId);

  private isGoogleLoaded = false;

  private googleClickTarget: HTMLElement | null = null;
  private googleHiddenHost: HTMLElement | null = null;

  private readonly googleAuthSubject =
    new Subject<GoogleAuthEvent>();

  public readonly googleAuth$ =
    this.googleAuthSubject.asObservable();


  // ==========================================
  // GOOGLE
  // ==========================================

  public initializeGoogleButton(): Observable<void> {

    if (!this.isBrowser) {
      return of(void 0);
    }

    return from(this.loadGoogleScript()).pipe(
      switchMap(() => this.setupGoogleAuth())
    );
  }


  public refreshGoogleButtonTheme(): Observable<void> {
    return of(void 0);
  }


  public destroyGoogleButton(): void {

    if (!this.isBrowser) {
      return;
    }

    this.googleHiddenHost?.remove();

    this.googleHiddenHost = null;
    this.googleClickTarget = null;
  }


  public triggerGoogleSignIn(): boolean {

    if (
      !this.isBrowser ||
      !this.googleClickTarget
    ) {
      return false;
    }

    this.googleClickTarget.click();

    return true;
  }


  private setupGoogleAuth(): Observable<void> {

    if (!this.isBrowser) {
      return of(void 0);
    }

    return new Observable<void>((subscriber) => {

      const clientId =
        environment.socialAuth?.googleClientId;

      if (!clientId) {
        subscriber.error(
          new Error(
            'Google Client ID is not configured.'
          )
        );
        return;
      }

      if (!window.google?.accounts?.id) {
        subscriber.error(
          new Error(
            'Google Identity Services SDK is not available.'
          )
        );
        return;
      }

      try {

        window.google.accounts.id.initialize({

          client_id: clientId,

          ux_mode: 'popup',

          auto_select: false,

          cancel_on_tap_outside: true,

          callback: (response: any) => {

            this.zone.run(() =>
              this.handleGoogleCredential(response)
            );

          },

          error_callback: (error: any) => {

            this.zone.run(() => {

              this.googleAuthSubject.next({
                status: 'cancelled',
                message: error?.message,
              });

            });

          },

        });

        this.mountHiddenGoogleButton(
          subscriber
        );

      } catch (error: any) {

        subscriber.error(
          new Error(
            error?.message ||
            'Failed to initialize Google Sign-In.'
          )
        );

      }

    });

  }


  private handleGoogleCredential(
    response: any
  ): void {

    if (!this.isBrowser) {
      return;
    }

    const credential =
      response?.credential;

    if (!credential) {

      this.googleAuthSubject.next({
        status: 'error',
        message:
          'Google did not return an ID token.',
      });

      return;
    }

    this.authService
      .loginWithGoogle(credential)
      .subscribe({

        next: (res) => {

          this.zone.run(() => {

            this.googleAuthSubject.next({

              status:
                res.success
                  ? 'success'
                  : 'error',

              response: res,

              message: res.message,

            });

          });

        },

        error: (error) => {

          console.error(
            'Google backend login failed:',
            error
          );

          this.zone.run(() => {

            this.googleAuthSubject.next({

              status: 'error',

              message:
                error?.error?.Message ||
                error?.error?.message ||
                error?.message,

            });

          });

        },

      });

  }


  private mountHiddenGoogleButton(
    subscriber: Subscriber<void>
  ): void {

    if (!this.isBrowser) {

      subscriber.complete();

      return;
    }

    this.googleHiddenHost?.remove();


    const host =
      this.document.createElement('div');

    host.id =
      'google-hidden-host';

    host.setAttribute(
      'aria-hidden',
      'true'
    );

    host.style.cssText = [

      'position:fixed',

      'top:0',

      'left:0',

      'width:1px',

      'height:1px',

      'overflow:hidden',

      'opacity:0',

      'pointer-events:none',

      'z-index:-1',

    ].join(';');


    const slot =
      this.document.createElement('div');

    slot.style.width =
      '300px';

    host.appendChild(slot);


    this.document.body.appendChild(
      host
    );

    this.googleHiddenHost =
      host;


    window.google.accounts.id.renderButton(
      slot,
      {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: 300,
      }
    );


    let tries = 0;


    const poll = () => {

      const target =

        slot.querySelector<HTMLElement>(
          'div[role="button"]'
        ) ??

        slot.querySelector<HTMLElement>(
          'iframe'
        );


      if (target) {

        this.googleClickTarget =
          target;

        this.zone.run(() => {

          subscriber.next();
          subscriber.complete();

        });

        return;
      }


      if (++tries > 90) {

        subscriber.error(
          new Error(
            'Google Sign-In button did not render.'
          )
        );

        return;
      }


      window.requestAnimationFrame(
        poll
      );

    };


    window.requestAnimationFrame(
      poll
    );

  }


  private loadGoogleScript(): Promise<void> {

    if (!this.isBrowser) {
      return Promise.resolve();
    }


    if (
      this.isGoogleLoaded &&
      window.google?.accounts?.id
    ) {
      return Promise.resolve();
    }


    return new Promise<void>(
      (resolve, reject) => {

        const existingScript =
          this.document.getElementById(
            'google-jssdk'
          );


        if (existingScript) {

          if (
            window.google?.accounts?.id
          ) {

            this.isGoogleLoaded =
              true;

            resolve();

            return;
          }


          existingScript.addEventListener(
            'load',
            () => {

              this.isGoogleLoaded =
                true;

              resolve();

            },
            { once: true }
          );


          existingScript.addEventListener(
            'error',
            () => {

              reject(
                new Error(
                  'Failed to load Google Identity Services SDK.'
                )
              );

            },
            { once: true }
          );


          return;
        }


        const script =
          this.document.createElement(
            'script'
          );


        script.id =
          'google-jssdk';

        script.src =
          'https://accounts.google.com/gsi/client';

        script.async =
          true;

        script.defer =
          true;


        script.onload = () => {

          this.isGoogleLoaded =
            true;

          resolve();

        };


        script.onerror = () => {

          reject(
            new Error(
              'Failed to load Google Identity Services SDK.'
            )
          );

        };


        this.document.head.appendChild(
          script
        );

      }
    );

  }

}