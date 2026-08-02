import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthFormShellComponent } from '../../components/auth-form-shell/auth-form-shell.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { AuthService } from '../../../../core/services/auth.service';
import { SocialAuthService } from '../../../../core/services/social-auth.service';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { AuthResponse, LoginRequest } from '../../../../core/models/auth.models';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';
import { TranslatePipe } from '@ngx-translate/core';
import { AnalyticsService } from '../../../../core/services/analytics.service';

/** Login page with form and social authentication. */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [AuthFormShellComponent, ReactiveFormsModule, RouterLink, ErrorMessageComponent,TranslatePipe],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {
  protected readonly isSubmitting = signal(false);
  protected readonly isGoogleSubmitting = signal(false);
  protected readonly isFacebookSubmitting = signal(false);
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

  protected signInWithGoogle(): void {
    if (this.isGoogleSubmitting() || this.isSubmitting() || this.isFacebookSubmitting()) return;

    this.isGoogleSubmitting.set(true);
    this.errorMessage.set(null);

    this.socialAuthService
      .login('google')
      .pipe(finalize(() => this.isGoogleSubmitting.set(false)))
      .subscribe({
        next: (response: ApiResponse<AuthResponse>) => {
          const token = response.data?.accessToken ?? this.authService.token();
          if (token) {
            this.analytics.login('google');
            void this.router.navigateByUrl(this.authService.isAdmin() ? '/admin' : '/');
            return;
          }
          this.errorMessage.set(extractErrorMessage(response.message, 'Google login failed.'));
        },
        error: (error) => {
          this.errorMessage.set(
            extractErrorMessage(error?.message || error?.error?.Message, 'Failed to sign in with Google.')
          );
        },
      });
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
