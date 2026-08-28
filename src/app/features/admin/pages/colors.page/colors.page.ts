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
  TranslateService,
} from '@ngx-translate/core';

import {
  ColorResponse,
  CreateColorRequest,
  UpdateColorRequest,
} from '../../../../core/models';

import {
  ColorService,
} from '../../../../core/services/color.service';

interface ColorPreset {
  label: string;
  arabicName: string;
  hex: string;
}

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

  private readonly translate =
    inject(TranslateService);

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

  // باليتة ألوان شائعة لتسهيل الاختيار على الموبايل بدل الاعتماد على الـ color wheel الصغيرة
  // ملحوظة: الـ label/arabicName هنا بيانات المنتج نفسه (بيتملوا في حقل الاسم) مش نصوص واجهة، فمش بيتترجموا
  readonly presetColors: ColorPreset[] = [
    { label: 'White',  arabicName: 'أبيض',    hex: '#FFFFFF' },
    { label: 'Black',  arabicName: 'أسود',    hex: '#000000' },
    { label: 'Beige',  arabicName: 'بيج',     hex: '#F5F0E6' },
    { label: 'Cream',  arabicName: 'كريمي',   hex: '#FFFDD0' },
    { label: 'Grey',   arabicName: 'رمادي',   hex: '#9CA3AF' },
    { label: 'Navy',   arabicName: 'كحلي',    hex: '#1E2A47' },
    { label: 'Blue',   arabicName: 'أزرق',    hex: '#3B82F6' },
    { label: 'Green',  arabicName: 'أخضر',    hex: '#4CAF50' },
    { label: 'Olive',  arabicName: 'زيتي',    hex: '#708238' },
    { label: 'Red',    arabicName: 'أحمر',    hex: '#DC2626' },
    { label: 'Maroon', arabicName: 'كستنائي', hex: '#7B1E2B' },
    { label: 'Pink',   arabicName: 'وردي',    hex: '#F472B6' },
    { label: 'Purple', arabicName: 'بنفسجي',  hex: '#8B5CF6' },
    { label: 'Brown',  arabicName: 'بني',     hex: '#8B5E3C' },
    { label: 'Gold',   arabicName: 'ذهبي',    hex: '#C9A24B' },
    { label: 'Silver', arabicName: 'فضي',     hex: '#C0C0C0' },
  ];

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
            response.message || this.translate.instant('admin.colors.errors.loadFailed')
          );
        }

        this.isLoading.set(false);
      },

      error: (error) => {
        this.isLoading.set(false);

        this.errorMessage.set(
          error?.error?.message ||
          this.translate.instant('admin.colors.errors.loadFailed')
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

  // يختار المستخدم لون جاهز من الباليتة بدل ما يفتح الـ color wheel
  selectPreset(preset: ColorPreset, target: 'primary' | 'secondary' = 'primary'): void {

    if (target === 'primary') {
      this.hexCode = preset.hex;

      // نملأ الاسم تلقائيًا بس لو المستخدم لسه ماكتبش حاجة، عشان منلخبطش بيانات مكتوبة بالفعل
      if (!this.name.trim()) {
        this.name = preset.label;
      }

      if (!this.arabicName.trim()) {
        this.arabicName = preset.arabicName;
      }

      return;
    }

    this.secondaryHexCode = preset.hex;
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
        this.translate.instant('admin.colors.errors.nameRequired')
      );
      return;
    }

    if (!arabicName) {
      this.errorMessage.set(
        this.translate.instant('admin.colors.errors.arabicNameRequired')
      );
      return;
    }

    if (
      hexCode &&
      !this.isValidHex(hexCode)
    ) {
      this.errorMessage.set(
        this.translate.instant('admin.colors.errors.invalidPrimaryHex')
      );
      return;
    }

    if (
      secondaryHexCode &&
      !this.isValidHex(secondaryHexCode)
    ) {
      this.errorMessage.set(
        this.translate.instant('admin.colors.errors.invalidSecondaryHex')
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
                this.translate.instant('admin.colors.errors.createFailed')
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
              this.translate.instant('admin.colors.success.created')
            );

            this.resetForm(false);
          },

          error: (error) => {
            this.isSaving.set(false);

            this.errorMessage.set(
              error?.error?.message ||
              this.translate.instant('admin.colors.errors.createFailed')
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
              this.translate.instant('admin.colors.errors.updateFailed')
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
            this.translate.instant('admin.colors.success.updated')
          );

          this.resetForm(false);
        },

        error: (error) => {
          this.isSaving.set(false);

          this.errorMessage.set(
            error?.error?.message ||
            this.translate.instant('admin.colors.errors.updateFailed')
          );
        },
      });
  }

  delete(color: ColorResponse): void {

    const confirmed =
      window.confirm(
        this.translate.instant('admin.colors.confirmDelete', { name: color.name })
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
              this.translate.instant('admin.colors.errors.deleteFailed')
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
            this.translate.instant('admin.colors.success.deleted')
          );
        },

        error: (error) => {
          this.errorMessage.set(
            error?.error?.message ||
            this.translate.instant('admin.colors.errors.deleteFailed')
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