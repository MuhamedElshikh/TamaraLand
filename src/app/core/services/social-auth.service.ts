import {
  Injectable,
  NgZone,
  inject,
} from '@angular/core';

import {
  Observable,
  Subject,
  Subscriber,
  from,
  of,
  throwError,
} from 'rxjs';

import {
  catchError,
  switchMap,
  tap,
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

/** نتيجة محاولة تسجيل الدخول بجوجل — بتترسل للصفحة عن طريق googleAuth$ */
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

  private isGoogleLoaded = false;

  /** العنصر الحقيقي بتاع جوجل اللي بيستقبل الكليك (جوّه الهوست المخفي) */
  private googleClickTarget: HTMLElement | null = null;
  private googleHiddenHost: HTMLElement | null = null;

  private readonly googleAuthSubject = new Subject<GoogleAuthEvent>();

  /** الصفحة بتسمع منه عشان توقف اللودر وتنقل المستخدم */
  public readonly googleAuth$ = this.googleAuthSubject.asObservable();


  // ==========================================
  // GOOGLE
  // ==========================================

  /**
   * بتحمّل الـ SDK، بتعمل initialize، وبترندر زرار جوجل الحقيقي
   * في هوست مخفي بره الشاشة. بتـ emit لما الزرار يبقى جاهز للكليك.
   */
  public initializeGoogleButton(): Observable<void> {

    return from(this.loadGoogleScript()).pipe(
      switchMap(() => this.setupGoogleAuth())
    );
  }

  /** اتسابت no-op للتوافق — إحنا مش بنعرض زرار جوجل عشان نلوّنه */
  public refreshGoogleButtonTheme(): Observable<void> {
    return of(void 0);
  }

  /** تتنادى في ngOnDestroy — بتشيل الهوست المخفي من الـ DOM */
  public destroyGoogleButton(): void {
    this.googleHiddenHost?.remove();
    this.googleHiddenHost = null;
    this.googleClickTarget = null;
  }

  /**
   * لازم تتنادى من جوّه (click) handler حقيقي، ومن غير أي await
   * أو setTimeout قبلها — عشان الـ user gesture ميضيعش والبوب أب
   * ميتبلكش على Safari و Samsung Internet.
   */
  public triggerGoogleSignIn(): boolean {

    if (!this.googleClickTarget) {
      return false;
    }

    this.googleClickTarget.click();
    return true;
  }

  private setupGoogleAuth(): Observable<void> {

    return new Observable<void>((subscriber) => {

      const clientId = environment.socialAuth?.googleClientId;

      if (!clientId) {
        subscriber.error(new Error('Google Client ID is not configured.'));
        return;
      }

      if (!window.google?.accounts?.id) {
        subscriber.error(new Error('Google Identity Services SDK is not available.'));
        return;
      }

      try {

        window.google.accounts.id.initialize({

          client_id: clientId,
          ux_mode: 'popup', // مهم جدًا — redirect هيكسر الفكرة كلها
          auto_select: false,
          cancel_on_tap_outside: true,

          callback: (response: any) => {
            // الكولباك جاي من جوجل بره Angular zone، فبنرجّعه جوه
            this.zone.run(() => this.handleGoogleCredential(response));
          },

          error_callback: (error: any) => {
            this.zone.run(() => {

              // المستخدم قفل البوب أب أو لغى — مش error حقيقي
              this.googleAuthSubject.next({
                status: 'cancelled',
                message: error?.message,
              });
            });
          },
        });

        this.mountHiddenGoogleButton(subscriber);

      } catch (error: any) {
        subscriber.error(
          new Error(error?.message || 'Failed to initialize Google Sign-In.')
        );
      }

    });
  }

  private handleGoogleCredential(response: any): void {

    const credential = response?.credential;

    if (!credential) {
      this.googleAuthSubject.next({
        status: 'error',
        message: 'Google did not return an ID token.',
      });
      return;
    }

    this.authService.loginWithGoogle(credential).subscribe({

      next: (res) => {
        this.zone.run(() =>
          this.googleAuthSubject.next({
            status: res.success ? 'success' : 'error',
            response: res,
            message: res.message,
          })
        );
      },

      error: (error) => {
        console.error('Google backend login failed:', error);

        this.zone.run(() =>
          this.googleAuthSubject.next({
            status: 'error',
            message:
              error?.error?.Message ||
              error?.error?.message ||
              error?.message,
          })
        );
      },
    });
  }

  /**
   * بنرندر زرار جوجل الحقيقي جوّه هوست 1px × 1px بـ overflow:hidden.
   * ملاحظة: مش بنستخدم display:none ولا visibility:hidden لأن بعض
   * إصدارات GIS بتتجاهل الرندر لو العنصر مش متلاي (not laid out).
   * وبنستخدم position:fixed بدل left سالب عشان منفتحش سكرول في RTL.
   */
  private mountHiddenGoogleButton(subscriber: Subscriber<void>): void {

    this.googleHiddenHost?.remove();

    const host = document.createElement('div');
    host.id = 'google-hidden-host';
    host.setAttribute('aria-hidden', 'true');

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

    // ديف داخلي بعرض طبيعي عشان جوجل ترسم فيه براحتها قبل ما يتقص
    const slot = document.createElement('div');
    slot.style.width = '300px';
    host.appendChild(slot);

    document.body.appendChild(host);
    this.googleHiddenHost = host;

    window.google.accounts.id.renderButton(slot, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      width: 300,
    });

    // الرندر بياخد كام فريم — بنستنى العنصر القابل للكليك يظهر
    let tries = 0;

    const poll = () => {

      const target =
        slot.querySelector<HTMLElement>('div[role="button"]') ??
        slot.querySelector<HTMLElement>('iframe');

      if (target) {
        this.googleClickTarget = target;
        this.zone.run(() => {
          subscriber.next();
          subscriber.complete();
        });
        return;
      }

      if (++tries > 90) {
        subscriber.error(new Error('Google Sign-In button did not render.'));
        return;
      }

      requestAnimationFrame(poll);
    };

    requestAnimationFrame(poll);
  }

  private loadGoogleScript(): Promise<void> {

    if (this.isGoogleLoaded && window.google?.accounts?.id) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {

      const existingScript = document.getElementById('google-jssdk');

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
            reject(new Error('Failed to load Google Identity Services SDK.'));
          },
          { once: true }
        );

        return;
      }

      // Load Google Identity Services SDK
      const script = document.createElement('script');

      script.id = 'google-jssdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isGoogleLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services SDK.'));
      };

      document.head.appendChild(script);
    });
  }
}