import { Component } from '@angular/core';
import { AuthFormShellComponent } from '../../components/auth-form-shell/auth-form-shell.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { inject, signal } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { AuthResponse, LoginRequest } from '../../../../core/models/auth.models';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';


/** Login page. */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [AuthFormShellComponent, ReactiveFormsModule, RouterLink, ErrorMessageComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css'
})
export class LoginPage {
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

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

    const payload = this.form.getRawValue() satisfies LoginRequest;

    this.authService
      .login(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
      next: (response: ApiResponse<AuthResponse>) => {
        console.log('raw response', JSON.stringify(response));
        const token = response.data?.accessToken ?? this.authService.token();
        if (token) {
          void this.router.navigateByUrl(this.authService.isAdmin() ? '/admin' : '/');
          return;
        }

        this.errorMessage.set(
          extractErrorMessage(response.message, 'Unable to sign in right now.')
          
          
        );
      },
   error: (error) => {
  console.log('value', error.error.Message);

  this.errorMessage.set(
    extractErrorMessage( error.error.Message, 'Something went wrong while signing in.')
  );
},
      });
  }

  protected controlHasError(name: 'email' | 'password', errorKey?: string): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid && (!errorKey || control.hasError(errorKey));
  }
}
