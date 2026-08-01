import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthFormShellComponent } from '../../components/auth-form-shell/auth-form-shell.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ResetPasswordRequest } from '../../../../core/models/auth.models';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';
import { finalize } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

/** Reset password page. */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [AuthFormShellComponent, ReactiveFormsModule, RouterLink, ErrorMessageComponent, TranslatePipe],
  templateUrl: './reset-password.page.html',
  styleUrl: './reset-password.page.css'
})
export class ResetPasswordPage implements OnInit {
  protected readonly isSubmitting = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly emailHint = signal('');
  protected readonly tokenHint = signal('');

  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      token: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmNewPassword: ['', [Validators.required]],
    },
    { validators: [passwordsMatchValidator] }
  );

  constructor(
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (email) {
      this.emailHint.set(email);
      this.form.controls.email.setValue(email);
    }

    if (token) {
      this.tokenHint.set(token);
      this.form.controls.token.setValue(token);
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload = this.form.getRawValue() satisfies ResetPasswordRequest;

    this.authService
      .resetPassword(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage.set(response.message || 'Password updated successfully.');
            this.form.reset({ email: payload.email, token: payload.token, newPassword: '', confirmNewPassword: '' });
            void this.router.navigate(['/login'], { queryParams: { email: payload.email } });
            return;
          }

          this.errorMessage.set(
            extractErrorMessage(response, 'Unable to reset the password right now.')
          );
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            extractErrorMessage(error, 'Something went wrong while resetting the password.')
          );
        },
      });
  }

  protected controlHasError(
    name: 'email' | 'token' | 'newPassword' | 'confirmNewPassword',
    errorKey?: string
  ): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid && (!errorKey || control.hasError(errorKey));
  }

  protected passwordMismatch(): boolean {
    return this.form.touched && this.form.hasError('passwordMismatch');
  }
}

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmNewPassword')?.value;

  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}
