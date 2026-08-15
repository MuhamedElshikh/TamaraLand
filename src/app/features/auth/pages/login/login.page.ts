import { AfterViewInit, Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { AuthFormShellComponent } from '../../components/auth-form-shell/auth-form-shell.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { AuthService } from '../../../../core/services/auth.service';
import { GoogleAuthEvent, SocialAuthService } from '../../../../core/services/social-auth.service';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { AuthResponse, LoginRequest } from '../../../../core/models/auth.models';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';
import { TranslatePipe } from '@ngx-translate/core';
import { AnalyticsService } from '../../../../core/services/analytics.service';

/** Login page with form and social authentication. */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [AuthFormShellComponent, ReactiveFormsModule, RouterLink, ErrorMessageComponent, TranslatePipe],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage implements AfterViewInit, OnDestroy {
  private readonly subscriptions = new Subscription();

  protected readonly isSubmitting = signal(false);
  protected readonly isGoogleSubmitting = signal(false);
  protected readonly isFacebookSubmitting = signal(false);
  protected readonly isGoogleReady = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private readonly analytics = inject(AnalyticsService);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly socialAuthService = inject(SocialAuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngAfterViewInit(): void {
    // بنجهّز زرار جوجل المخفي — الزرار الظاهر بيفضل disabled لحد ما يجهز
    this.subscriptions.add(
      this.socialAuthService.initializeGoogleButton().subscribe({
        next: () => this.isGoogleReady.set(true),
        error: (error) => console.error('Failed to initialize Google Sign-In:', error),
      })
    );

    // نتيجة تسجيل الدخول بجوجل بترجع من الـ service على الستريم ده
    this.subscriptions.add(
      this.socialAuthService.googleAuth$.subscribe((event) => this.handleGoogleAuth(event))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.socialAuthService.destroyGoogleButton();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = this.form.getRawValue() satisfies LoginRequest;

    this.authService
      .login(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response: ApiResponse<AuthResponse>) => {
          const token = response.data?.accessToken ?? this.authService.token();
          if (token) {
            this.analytics.login('email');
            void this.router.navigateByUrl(this.authService.isAdmin() ? '/admin' : '/');
            return;
          }

          this.errorMessage.set(extractErrorMessage(response.message, 'Unable to sign in right now.'));
        },
        error: (error) => {
          this.errorMessage.set(
            extractErrorMessage(error?.error?.Message || error?.error?.message, 'Something went wrong while signing in.')
          );
        },
      });
  }

  /**
   * مهم: النداء على triggerGoogleSignIn لازم يفضل sync جوّه الـ click
   * (من غير await ولا setTimeout) عشان البراوزر ميبلكش البوب أب.
   */
  protected signInWithGoogle(): void {
    if (this.isGoogleSubmitting() || this.isSubmitting() || this.isFacebookSubmitting()) {
      return;
    }

    this.errorMessage.set(null);
    this.isGoogleSubmitting.set(true);

    const opened = this.socialAuthService.triggerGoogleSignIn();

    if (!opened) {
      this.isGoogleSubmitting.set(false);
      this.errorMessage.set('Google Sign-In is not ready yet. Please try again.');
    }
  }

  private handleGoogleAuth(event: GoogleAuthEvent): void {
    this.isGoogleSubmitting.set(false);

    // المستخدم قفل البوب أب — مش لازم نعرض رسالة خطأ
    if (event.status === 'cancelled') {
      return;
    }

    if (event.status === 'error' || !event.response?.success) {
      this.errorMessage.set(
        extractErrorMessage(event.message ?? event.response?.message, 'Failed to sign in with Google.')
      );
      return;
    }

    const token = event.response.data?.accessToken ?? this.authService.token();

    if (!token) {
      this.errorMessage.set(extractErrorMessage(event.response.message, 'Failed to sign in with Google.'));
      return;
    }

    this.analytics.login('google');
    void this.router.navigateByUrl(this.authService.isAdmin() ? '/admin' : '/');
  }

  protected signInWithFacebook(): void {
    if (this.isFacebookSubmitting() || this.isSubmitting() || this.isGoogleSubmitting()) return;

    this.isFacebookSubmitting.set(true);
    this.errorMessage.set(null);

    this.socialAuthService
      .login('facebook')
      .pipe(finalize(() => this.isFacebookSubmitting.set(false)))
      .subscribe({
        next: (response: ApiResponse<AuthResponse>) => {
          const token = response.data?.accessToken ?? this.authService.token();
          if (token) {
            this.analytics.login('facebook');
            void this.router.navigateByUrl(this.authService.isAdmin() ? '/admin' : '/');
            return;
          }
          this.errorMessage.set(extractErrorMessage(response.message, 'Facebook login failed.'));
        },
        error: (error) => {
          this.errorMessage.set(
            extractErrorMessage(error?.message || error?.error?.Message, 'Failed to sign in with Facebook.')
          );
        },
      });
  }

  protected controlHasError(name: 'email' | 'password', errorKey?: string): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid && (!errorKey || control.hasError(errorKey));
  }
}