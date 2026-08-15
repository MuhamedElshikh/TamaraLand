import {
  Injectable,
  inject,
} from '@angular/core';

import {
  Observable,
  from,
  throwError,
} from 'rxjs';

import {
  catchError,
  switchMap,
  tap,
} from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AnalyticsService } from './analytics.service';

import {
  ApiResponse,
} from '../models/api-response.model';

import {
  AuthResponse,
} from '../models/auth.models';

import {
  environment,
} from '../../../environments/environment';

import {
  API_BASE_URL,
} from '../constants/api.constants';

declare global {
  interface Window {
    google?: any;
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

export type SocialProvider =
  | 'google'
  | 'facebook'
  | 'apple'
  | 'microsoft'
  | 'twitter';

@Injectable({
  providedIn: 'root',
})
export class SocialAuthService {

  private readonly http =inject(HttpClient);

  private readonly authService =inject(AuthService);
   private readonly router =inject(Router);
private readonly analyticsService =
  inject(AnalyticsService);

  

  private isGoogleLoaded = false;
  private isFacebookLoaded = false;

  login(
    provider: SocialProvider
  ): Observable<ApiResponse<AuthResponse>> {

    switch (provider) {

      case 'facebook':
        return this.loginWithFacebook();

      default:
        return throwError(
          () =>
            new Error(
              `Provider ${provider} is not supported yet.`
            )
        );
    }
  }

  // ==========================================
  // GOOGLE
  // ==========================================

  public initializeGoogleButton(): Observable<void> {

    return from(
      this.loadGoogleScript()
    ).pipe(
      switchMap(() =>
        this.renderGoogleButton()
      )
    );
  }

  private renderGoogleButton(): Observable<void> {
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

    const container =
      document.getElementById(
        'google-signin-container'
      );

    if (!container) {
      subscriber.error(
        new Error(
          'Google Sign-In container was not found.'
        )
      );
      return;
    }

    container.innerHTML = '';

    try {

      window.google.accounts.id.initialize({

        client_id: clientId,

        ux_mode: 'popup',

        auto_select: false,

        callback: (response: any) => {

          const credential =
            response?.credential;

          if (!credential) {
            subscriber.error(
              new Error(
                'Google did not return an ID token.'
              )
            );
            return;
          }

          this.authService
  .loginWithGoogle(credential)
  .subscribe({
    next: (res) => {

      if (!res.success || !res.data) {
        console.error(
          'Google login failed.',
          res
        );

        subscriber.error(
          new Error(
            res.message ||
            'Google login failed.'
          )
        );

        return;
      }

      void this.router.navigateByUrl(
        this.authService.isAdmin()
          ? '/admin'
          : '/'
      );
    },

    error: (error) => {

      console.error(
        'Google backend login failed:',
        error
      );

      subscriber.error(
        error instanceof Error
          ? error
          : new Error(
              'Google login failed.'
            )
      );
    }
  });
        },

        error_callback: (error: any) => {

          subscriber.error(
            new Error(
              error?.message ||
              'Google Sign-In failed.'
            )
          );

        }

      });

      window.google.accounts.id.renderButton(
        container,
        {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 400
        }
      );

      subscriber.next();
      subscriber.complete();

    } catch (error: any) {

      subscriber.error(
        new Error(
          error?.message ||
          'Failed to render Google Sign-In.'
        )
      );

    }

  });
}
private loadGoogleScript(): Promise<void> {
  if (
    this.isGoogleLoaded &&
    window.google?.accounts?.id
  ) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existingScript =
      document.getElementById('google-jssdk');

    // Script already exists
    if (existingScript) {

      if (window.google?.accounts?.id) {
        this.isGoogleLoaded = true;
        resolve();
        return;
      }

      existingScript.addEventListener(
        'load',
        () => {
          this.isGoogleLoaded = true;
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

    // Load Google Identity Services SDK
    const script =
      document.createElement('script');

    script.id = 'google-jssdk';

    script.src =
      'https://accounts.google.com/gsi/client';

    script.async = true;
    script.defer = true;

    script.onload = () => {
      this.isGoogleLoaded = true;
      resolve();
    };

    script.onerror = () => {
      reject(
        new Error(
          'Failed to load Google Identity Services SDK.'
        )
      );
    };

    document.head.appendChild(script);
  });
}

  // ==========================================
  // FACEBOOK
  // ==========================================

  private loginWithFacebook():
    Observable<ApiResponse<AuthResponse>> {

    return from(
      this.loadFacebookScript()
    ).pipe(

      switchMap(() =>
        this.getFacebookAccessToken()
      ),

      switchMap(
        accessToken =>
          this.authService
            .loginWithFacebook(
              accessToken
            )
      ),

      tap(res => {

        if (res.success) {

          this.analyticsService
            .login('facebook');
        }

      }),

      catchError(err =>
        throwError(
          () =>
            new Error(
              err?.message ||
              'Facebook authentication was cancelled or failed.'
            )
        )
      )
    );
  }

  private loadFacebookScript():
    Promise<void> {

    if (
      this.isFacebookLoaded ||
      typeof window === 'undefined'
    ) {
      return Promise.resolve();
    }

    return new Promise(
      (resolve, reject) => {

        if (
          document.getElementById(
            'facebook-jssdk'
          )
        ) {

          this.isFacebookLoaded =
            true;

          resolve();

          return;
        }

        const appId =
          environment.socialAuth
            ?.facebookAppId ||
          'YOUR_FACEBOOK_APP_ID';

        window.fbAsyncInit = () => {

          window.FB.init({
            appId,
            cookie: true,
            xfbml: true,
            version: 'v19.0',
          });

          this.isFacebookLoaded =
            true;

          resolve();
        };

        const script =
          document.createElement(
            'script'
          );

        script.id =
          'facebook-jssdk';

        script.src =
          'https://connect.facebook.net/en_US/sdk.js';

        script.async = true;
        script.defer = true;

        script.onerror = () =>
          reject(
            new Error(
              'Failed to load Facebook SDK.'
            )
          );

        document.head.appendChild(
          script
        );
      }
    );
  }

  private getFacebookAccessToken():
    Promise<string> {

    return new Promise(
      (resolve, reject) => {

        if (!window.FB) {

          reject(
            new Error(
              'Facebook SDK is not loaded.'
            )
          );

          return;
        }

        window.FB.login(
          (response: any) => {

            if (
              response.authResponse &&
              response.authResponse
                .accessToken
            ) {

              resolve(
                response.authResponse
                  .accessToken
              );

            } else {

              reject(
                new Error(
                  'Facebook authentication was cancelled or declined.'
                )
              );
            }
          },
          {
            scope:
              'public_profile,email'
          }
        );
      }
    );
  }
}