import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service'; // عدّل المسار
import { extractErrorMessage } from '../../../../core/utils/error-message.util';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmNewPassword = control.get('confirmNewPassword')?.value;
  return newPassword && confirmNewPassword && newPassword !== confirmNewPassword
    ? { passwordMismatch: true }
    : null;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css',
})
export class ProfilePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly profile = this.auth.profile;

  readonly isEditingProfile = signal(false);
  readonly isChangingPassword = signal(false);

  readonly isSavingProfile = signal(false);
  readonly profileError = signal<string | null>(null);

  readonly isSavingPassword = signal(false);
  readonly passwordSuccess = signal(false);
  readonly passwordError = signal<string | null>(null);

  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    phoneNumber: [''],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmNewPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator }
  );

  ngOnInit(): void {
    if (!this.profile()) {
      this.auth.getProfile().subscribe(() => this.patchProfileForm());
    } else {
      this.patchProfileForm();
    }
  }

  private patchProfileForm(): void {
    const p = this.profile();
    if (p) {
      this.profileForm.patchValue({
        firstName: p.firstName,
        lastName: p.lastName,
        phoneNumber: p.phoneNumber || '',
      });
    }
  }

  profileControlHasError(name: string, error: string): boolean {
    const control = this.profileForm.get(name);
    return Boolean(control && control.touched && control.hasError(error));
  }

  passwordControlHasError(name: string, error: string): boolean {
    const control = this.passwordForm.get(name);
    return Boolean(control && control.touched && control.hasError(error));
  }

  get passwordMismatch(): boolean {
    return this.passwordForm.hasError('passwordMismatch') && Boolean(this.passwordForm.get('confirmNewPassword')?.touched);
  }

  startEditProfile(): void {
    this.patchProfileForm();
    this.profileError.set(null);
    this.isEditingProfile.set(true);
  }

  cancelEditProfile(): void {
    this.isEditingProfile.set(false);
    this.profileError.set(null);
  }

  startChangePassword(): void {
    this.passwordForm.reset();
    this.passwordError.set(null);
    this.isChangingPassword.set(true);
  }

  cancelChangePassword(): void {
    this.isChangingPassword.set(false);
    this.passwordError.set(null);
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.isSavingProfile()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSavingProfile.set(true);
    this.profileError.set(null);

    this.auth.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: (res) => {
        this.isSavingProfile.set(false);
        if (res.success) {
          this.isEditingProfile.set(false); // رجّع لوضع العرض تلقائي بعد الحفظ
        } else {
          this.profileError.set(res.message);
        }
      },
      error: (err) => {
        this.isSavingProfile.set(false);
        this.profileError.set(extractErrorMessage(err, 'Could not update your profile.'));
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.isSavingPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSavingPassword.set(true);
    this.passwordError.set(null);

    this.auth.changePassword(this.passwordForm.getRawValue()).subscribe({
      next: (res) => {
        this.isSavingPassword.set(false);
        if (res.success) {
          this.passwordForm.reset();
          this.isChangingPassword.set(false); // رجّع لوضع العرض تلقائي بعد الحفظ
          this.passwordSuccess.set(true);
          setTimeout(() => this.passwordSuccess.set(false), 3000);
        } else {
          this.passwordError.set(res.message);
        }
      },
      error: (err) => {
        this.isSavingPassword.set(false);
        this.passwordError.set(extractErrorMessage(err, 'Could not change your password.'));
      },
    });
  }
}