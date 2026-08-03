import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { StoreSettingsService } from '../../../../core/services/store-settings.service';
import {
  StoreSettings,
  UpdateStoreSettingsRequest
} from '../../../../core/models/domain.models';
import { Router  } from '@angular/router';

@Component({
  selector: 'app-admin-store-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, 
  ],
  templateUrl: './store-settings.page.html',
  styleUrl: './store-settings.page.css'
})
export class AdminStoreSettingsPage implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly storeSettingsService = inject(StoreSettingsService);
private readonly router = inject(Router);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);

  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly form = this.fb.group({
    storeName: ['', Validators.required],
    storeArabicName: ['', Validators.required],

    supportEmail: ['', [Validators.required, Validators.email]],
    supportPhone: ['', Validators.required],

    address: ['', Validators.required],

    currency: ['', Validators.required],
    currencySymbol: ['', Validators.required],

    shippingCost: [0],
    freeShippingThreshold: [0],
    taxPercentage: [0],

    facebookUrl: [''],
    instagramUrl: [''],
    whatsAppNumber: [''],

    maintenanceMode: [false]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {

    this.isLoading.set(true);

    this.storeSettingsService.load().subscribe({

      next: (res) => {

        this.isLoading.set(false);

        if (res.success && res.data) {

          this.form.patchValue(res.data);

        }

      },

      error: (err) => {

        this.isLoading.set(false);

        this.error.set(
          err?.error?.message ??
          'Failed to load settings.'
        );

      }

    });

  }

  save(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;

    }

    this.isSubmitting.set(true);

    this.error.set(null);

    this.success.set(null);

    this.storeSettingsService
      .update(this.form.getRawValue() as UpdateStoreSettingsRequest)
      .subscribe({

        next: (res) => {

          this.isSubmitting.set(false);

          if (res.success) {
 this.success.set('Settings updated successfully.');

    setTimeout(() => {
          this.router.navigate(['/admin/store-settings']);
    }, 1000);

          } else {

            this.error.set(res.message);

          }

        },

        error: (err) => {

          this.isSubmitting.set(false);

          this.error.set(
            err?.error?.message ??
            'Failed to save settings.'
          );

        }

      });

  }

}