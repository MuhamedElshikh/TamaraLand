import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { StoreSettingsService } from '../../../../core/services/store-settings.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './contact.page.html',
  styleUrl: './contact.page.css',
})
export class ContactPage {
  private readonly fb = inject(FormBuilder);
  private readonly storeSettingsService = inject(StoreSettingsService);
  readonly languageService = inject(LanguageService);

  readonly settings = this.storeSettingsService.settings;
  readonly submitted = signal(false);
  readonly sending = signal(false);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    // Simulate submission
    setTimeout(() => {
      this.sending.set(false);
      this.submitted.set(true);
      this.form.reset();
    }, 1200);
  }

  get nameCtrl() { return this.form.get('name')!; }
  get emailCtrl() { return this.form.get('email')!; }
  get subjectCtrl() { return this.form.get('subject')!; }
  get messageCtrl() { return this.form.get('message')!; }
}
