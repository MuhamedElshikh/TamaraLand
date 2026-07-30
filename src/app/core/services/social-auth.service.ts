import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
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

export type SocialProvider = 'google' | 'facebook' | 'apple' | 'microsoft' | 'twitter';

@Injectable({
  providedIn: 'root',
})
export class SocialAuthService {
  private readonly authService = inject(AuthService);
  private readonly analyticsService = inject(AnalyticsService);

  private isGoogleLoaded = false;
  private isFacebookLoaded = false;

  /**
   * Main login method supporting multiple providers.
   */
  login(provider: SocialProvider): Observable<ApiResponse<AuthResponse>> {
    switch (provider) {
      case 'google':
        return this.loginWithGoogle();
      case 'facebook':
        return this.loginWithFacebook();
      default:
        return throwError(() => new Error(`Provider ${provider} is not supported yet.`));
    }
  }

  // ==========================================
  // Google Authentication (GIS)
  // ==========================================

  private loginWithGoogle(): Observable<ApiResponse<AuthResponse>> {
    return from(this.loadGoogleScript()).pipe(
      switchMap(() => this.getGoogleIdToken()),
      switchMap((idToken) => this.authService.loginWithGoogle(idToken)),
      tap((res) => {
        if (res.success) {
          this.analyticsService.login('google');
        }
      }),
      catchError((err) => {
        return throwError(() => new Error(err?.message || 'Google authentication was cancelled or failed.'));
      })
    );
  }

  private loadGoogleScript(): Promise<void> {
    if (this.isGoogleLoaded || typeof window === 'undefined') {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (document.getElementById('google-jssdk')) {
        this.isGoogleLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-jssdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.isGoogleLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK.'));
      document.head.appendChild(script);
    });
  }

  private getGoogleIdToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      const clientId = environment.socialAuth?.googleClientId;

      if (!clientId) {
        reject(new Error('Google Client ID is not configured.'));
        return;
      }

      if (!window.google?.accounts?.id) {
        reject(new Error('Google Identity Services SDK is not available.'));
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response && response.credential) {
              resolve(response.credential);
            } else {
              reject(new Error('Google login was cancelled or failed to return credentials.'));
            }
          },
          error_callback: (err: any) => {
            reject(new Error(err?.message || 'Google Sign-In popup error occurred.'));
          },
        });

        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If One Tap is skipped or blocked, fall back to standard credential request
            window.google.accounts.id.renderButton(document.createElement('div'), {});
          }
        });
      } catch (err: any) {
        reject(new Error(err?.message || 'Failed to initialize Google Sign-In.'));
      }
    });
  }

  // ==========================================
  // Facebook Authentication
  // ==========================================

  private loginWithFacebook(): Observable<ApiResponse<AuthResponse>> {
    return from(this.loadFacebookScript()).pipe(
      switchMap(() => this.getFacebookAccessToken()),
      switchMap((accessToken) => this.authService.loginWithFacebook(accessToken)),
      tap((res) => {
        if (res.success) {
          this.analyticsService.login('facebook');
        }
      }),
      catchError((err) => {
        return throwError(() => new Error(err?.message || 'Facebook authentication was cancelled or failed.'));
      })
    );
  }

  private loadFacebookScript(): Promise<void> {
    if (this.isFacebookLoaded || typeof window === 'undefined') {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (document.getElementById('facebook-jssdk')) {
        this.isFacebookLoaded = true;
        resolve();
        return;
      }

      const appId = environment.socialAuth?.facebookAppId || 'YOUR_FACEBOOK_APP_ID';

      window.fbAsyncInit = () => {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v19.0',
        });
        this.isFacebookLoaded = true;
        resolve();
      };

      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error('Failed to load Facebook SDK.'));
      document.head.appendChild(script);
    });
  }

  private getFacebookAccessToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!window.FB) {
        reject(new Error('Facebook SDK is not loaded.'));
        return;
      }

      window.FB.login(
        (response: any) => {
          if (response.authResponse && response.authResponse.accessToken) {
            resolve(response.authResponse.accessToken);
          } else {
            reject(new Error('Facebook authentication was cancelled or declined.'));
          }
        },
        { scope: 'public_profile,email' }
      );
    });
  }
}