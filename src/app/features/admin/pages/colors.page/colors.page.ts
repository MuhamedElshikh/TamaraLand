import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  TranslatePipe,
} from '@ngx-translate/core';

import {
  ColorResponse,
  CreateColorRequest,
  UpdateColorRequest,
} from '../../../../core/models';

import {
  ColorService,
} from '../../../../core/services/color.service';

@Component({
  selector: 'app-admin-colors',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
  ],
  templateUrl: './colors.page.html',
  styleUrl: './colors.page.css',
})
export class AdminColorsPage implements OnInit {

  private readonly colorService =
    inject(ColorService);

  readonly colors =
    signal<ColorResponse[]>([]);

  readonly isLoading =
    signal(false);

  readonly isSaving =
    signal(false);

  readonly errorMessage =
    signal<string | null>(null);

  readonly successMessage =
    signal<string | null>(null);

  readonly editingId =
    signal<number | null>(null);

  name = '';

  arabicName = '';

  hexCode = '';

  secondaryHexCode = '';

  ngOnInit(): void {
    this.loadColors();
  }

  loadColors(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.colorService.getAll().subscribe({
      next: (response) => {

        if (response.success && response.data) {
          this.colors.set(response.data);
        } else {
          this.errorMessage.set(
            response.message || 'Could not load colors.'
          );
        }

        this.isLoading.set(false);
      },

      error: (error) => {
        this.isLoading.set(false);

        this.errorMessage.set(
          error?.error?.message ||
          'Could not load colors.'
        );
      },
    });
  }

  startCreate(): void {
    this.resetForm();
  }

  edit(color: ColorResponse): void {

    this.editingId.set(color.id);

    this.name = color.name;

    this.arabicName = color.arabicName;

    this.hexCode =
      color.hexCode ?? '';

    this.secondaryHexCode =
      color.secondaryHexCode ?? '';

    this.clearMessages();
  }

  cancelEdit(): void {
    this.resetForm();
  }

  save(): void {

    this.clearMessages();

    const name =
      this.name.trim();

    const arabicName =
      this.arabicName.trim();

    const hexCode =
      this.normalizeHex(this.hexCode);

    const secondaryHexCode =
      this.normalizeHex(this.secondaryHexCode);

    if (!name) {
      this.errorMessage.set(
        'Color name is required.'
      );
      return;
    }

    if (!arabicName) {
      this.errorMessage.set(
        'Arabic color name is required.'
      );
      return;
    }

    if (
      hexCode &&
      !this.isValidHex(hexCode)
    ) {
      this.errorMessage.set(
        'Invalid primary hex color.'
      );
      return;
    }

    if (
      secondaryHexCode &&
      !this.isValidHex(secondaryHexCode)
    ) {
      this.errorMessage.set(
        'Invalid secondary hex color.'
      );
      return;
    }

    this.isSaving.set(true);

    const id =
      this.editingId();

    if (id === null) {

      const request: CreateColorRequest = {
        name,
        arabicName,
        hexCode: hexCode || null,
        secondaryHexCode:
          secondaryHexCode || null,
      };

      this.colorService
        .create(request)
        .subscribe({
          next: (response) => {

            this.isSaving.set(false);

            if (
              !response.success ||
              !response.data
            ) {
              this.errorMessage.set(
                response.message ||
                'Could not create color.'
              );
              return;
            }

            this.colors.update(
              colors => [
                ...colors,
                response.data!,
              ]
            );

            this.successMessage.set(
              'Color created successfully.'
            );

            this.resetForm(false);
          },

          error: (error) => {
            this.isSaving.set(false);

            this.errorMessage.set(
              error?.error?.message ||
              'Could not create color.'
            );
          },
        });

      return;
    }

    const request: UpdateColorRequest = {
      name,
      arabicName,
      hexCode: hexCode || null,
      secondaryHexCode:
        secondaryHexCode || null,
    };

    this.colorService
      .update(id, request)
      .subscribe({
        next: (response) => {

          this.isSaving.set(false);

          if (
            !response.success ||
            !response.data
          ) {
            this.errorMessage.set(
              response.message ||
              'Could not update color.'
            );
            return;
          }

          this.colors.update(
            colors =>
              colors.map(color =>
                color.id === id
                  ? response.data!
                  : color
              )
          );

          this.successMessage.set(
            'Color updated successfully.'
          );

          this.resetForm(false);
        },

        error: (error) => {
          this.isSaving.set(false);

          this.errorMessage.set(
            error?.error?.message ||
            'Could not update color.'
          );
        },
      });
  }

  delete(color: ColorResponse): void {

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${color.name}"?`
      );

    if (!confirmed) {
      return;
    }

    this.clearMessages();

    this.colorService
      .delete(color.id)
      .subscribe({
        next: (response) => {

          if (!response.success) {
            this.errorMessage.set(
              response.message ||
              'Could not delete color.'
            );
            return;
          }

          this.colors.update(
            colors =>
              colors.filter(
                item => item.id !== color.id
              )
          );

          if (
            this.editingId() === color.id
          ) {
            this.resetForm(false);
          }

          this.successMessage.set(
            'Color deleted successfully.'
          );
        },

        error: (error) => {
          this.errorMessage.set(
            error?.error?.message ||
            'Could not delete color.'
          );
        },
      });
  }

  normalizeHex(value: string): string {
    const trimmed =
      value.trim();

    if (!trimmed) {
      return '';
    }

    return trimmed.startsWith('#')
      ? trimmed.toUpperCase()
      : `#${trimmed.toUpperCase()}`;
  }

  isValidHex(value: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(value);
  }

  colorBackground(
    color: ColorResponse
  ): string {

    const primary =
      color.hexCode || '#D1D1D1';

    if (!color.secondaryHexCode) {
      return primary;
    }

    return `linear-gradient(135deg, ${primary} 0%, ${primary} 50%, ${color.secondaryHexCode} 50%, ${color.secondaryHexCode} 100%)`;
  }

  clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  resetForm(
    clearMessages = true
  ): void {

    this.editingId.set(null);

    this.name = '';

    this.arabicName = '';

    this.hexCode = '';

    this.secondaryHexCode = '';

    if (clearMessages) {
      this.clearMessages();
    }
  }
}