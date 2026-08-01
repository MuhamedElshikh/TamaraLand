import { Component } from '@angular/core';
import { AuthFormShellComponent } from '../../components/auth-form-shell/auth-form-shell.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { inject, signal } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { AuthResponse, RegisterRequest } from '../../../../core/models/auth.models';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';
import { finalize } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

/** Register page. */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [AuthFormShellComponent, ReactiveFormsModule, RouterLink, ErrorMessageComponent,TranslatePipe],
  templateUrl: './register.page.html',
  styleUrl: './register.page.css'
})
export class RegisterPage {
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordsMatchValidator] }
  );

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = this.form.getRawValue() satisfies RegisterRequest;

    this.authService
      .register(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
      next: (response: ApiResponse<AuthResponse>) => {
        const token = response.data?.accessToken ?? this.authService.token();

        if (token) {
          void this.router.navigateByUrl(this.authService.isAdmin() ? '/admin' : '/');
          return;
        }

        this.errorMessage.set(
          extractErrorMessage(response, 'Unable to create account right now.')
        );
      },
      error: (error) => {
        this.errorMessage.set(extractErrorMessage(error.error.Message, 'Something went wrong while creating your account.'));
      },
      });
  }

  protected controlHasError(
    name: 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword',
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
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}
