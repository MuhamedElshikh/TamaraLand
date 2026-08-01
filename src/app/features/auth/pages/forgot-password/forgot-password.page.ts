import { Component, inject, signal } from '@angular/core';
import { AuthFormShellComponent } from '../../components/auth-form-shell/auth-form-shell.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ForgotPasswordRequest } from '../../../../core/models/auth.models';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';
import { finalize } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

/** Forgot password page. */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [AuthFormShellComponent, ReactiveFormsModule, RouterLink, ErrorMessageComponent,TranslatePipe],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.css'
})
export class ForgotPasswordPage {
  protected readonly isSubmitting = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(private readonly authService: AuthService) {}

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload = this.form.getRawValue() satisfies ForgotPasswordRequest;

    this.authService
      .forgotPassword(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage.set(response.message || 'If the email exists, a reset link has been sent.');
            this.form.reset({ email: payload.email });
            return;
          }

          this.errorMessage.set(
            extractErrorMessage(response, 'Unable to process your request right now.')
          );
        },
        error: (error: unknown) => {
          this.errorMessage.set(extractErrorMessage(error, 'Something went wrong while requesting a reset link.'));
        },
      });
  }

  protected controlHasError(errorKey?: string): boolean {
    const control = this.form.controls.email;
    return control.touched && control.invalid && (!errorKey || control.hasError(errorKey));
  }
}
