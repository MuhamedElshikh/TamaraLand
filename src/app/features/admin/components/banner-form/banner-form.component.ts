import {
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';

import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import {
  BannerImageResponse,
  BannerImageUpload,
  BannerResponse,
  BannerType,
  UpsertBannerRequest,
} from '../../../../core/models/banner.models';

import { AdminBannerService } from '../../../../core/services/admn-banner.service';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

interface ImageItem {
  id?: number;          // موجودة فعلاً لو صورة قديمة، undefined لو جديدة
  preview: string;       // Object URL أو الـ imageUrl من السيرفر
  file?: File;           // موجودة لو صورة جديدة لسه ماترفعتش
  link: string;
}

@Component({
  selector: 'app-banner-form',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],

  templateUrl: './banner-form.component.html',
  styleUrl: './banner-form.component.css',
})
export class BannerFormComponent {

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly bannerService = inject(AdminBannerService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // =========================================================
  // State
  // =========================================================

  readonly banner = signal<BannerResponse | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // صور موجودة فعلاً على السيرفر (وضع التعديل)، بتتحذف بـ endpoint منفصل
  readonly existingDesktopImages = signal<BannerImageResponse[]>([]);
  readonly existingMobileImages = signal<BannerImageResponse[]>([]);

  // صور جديدة لسه ماترفعتش، هتتبعت مع الـ submit
  readonly newDesktopImages = signal<ImageItem[]>([]);
  readonly newMobileImages = signal<ImageItem[]>([]);

  readonly deletingImageId = signal<number | null>(null);

  // =========================================================
  // Computed
  // =========================================================

  readonly isEdit = computed(() => this.banner() !== null);

  // =========================================================
  // Banner Types
  // =========================================================

  readonly bannerTypes = [
    { value: BannerType.HeroSlider, textKey: 'banners.types.heroSlider' },
    { value: BannerType.HomeBanner, textKey: 'banners.types.homeBanner' },
    { value: BannerType.OfferBanner, textKey: 'banners.types.offerBanner' },
    { value: BannerType.CategoryBanner, textKey: 'banners.types.categoryBanner' },
  ];

  // =========================================================
  // Form
  // =========================================================

  readonly form = this.fb.group(
    {
      title: ['', [Validators.required, Validators.maxLength(150)]],
      description: ['', Validators.maxLength(1000)],
      type: [BannerType.HeroSlider, Validators.required],
      displayOrder: [1, [Validators.required, Validators.min(1)]],
      isActive: [true],
      startDate: [''],
      endDate: [''],
    },
    { validators: this.dateValidator }
  );

  // =========================================================
  // Constructor
  // =========================================================

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (id) {
      this.loadBanner(id);
    }

    effect(() => {
      const banner = this.banner();
      if (!banner) return;

      this.form.patchValue({
        title: banner.title,
        description: banner.description ?? '',
        type: banner.type,
        displayOrder: banner.displayOrder,
        isActive: banner.isActive,
        startDate: banner.startDate?.substring(0, 10) ?? '',
        endDate: banner.endDate?.substring(0, 10) ?? '',
      });

      this.existingDesktopImages.set(
        banner.images.filter(x => !x.isMobile)
      );

      this.existingMobileImages.set(
        banner.images.filter(x => x.isMobile)
      );
    });
  }

  // =========================================================
  // Load Banner
  // =========================================================

  private loadBanner(id: number): void {
    this.bannerService.getById(id).subscribe({
      next: (res) => {
        if (!res.success || !res.data) {
          this.router.navigate(['/admin/banners']);
          return;
        }
        this.banner.set(res.data);
      },
      error: () => {
        this.router.navigate(['/admin/banners']);
      },
    });
  }

  // =========================================================
  // Add New Images
  // =========================================================

  desktopSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    this.addNewImages(files, this.newDesktopImages);
    (event.target as HTMLInputElement).value = '';
  }

  mobileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    this.addNewImages(files, this.newMobileImages);
    (event.target as HTMLInputElement).value = '';
  }

  desktopDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files) return;
    this.addNewImages(files, this.newDesktopImages);
  }

  mobileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files) return;
    this.addNewImages(files, this.newMobileImages);
  }

  private addNewImages(
    files: FileList,
    target: typeof this.newDesktopImages
  ): void {
    const valid: ImageItem[] = [];

    Array.from(files).forEach(file => {
      if (!this.validateImage(file)) return;
      valid.push({
        preview: URL.createObjectURL(file),
        file,
        link: '',
      });
    });

    target.update(current => [...current, ...valid]);
  }

  // =========================================================
  // Update Link (new images)
  // =========================================================

  updateNewImageLink(
    target: typeof this.newDesktopImages,
    index: number,
    link: string
  ): void {
    target.update(current => {
      const copy = [...current];
      copy[index] = { ...copy[index], link };
      return copy;
    });
  }

  // =========================================================
  // Remove New Image (not yet uploaded)
  // =========================================================

  removeNewImage(
    target: typeof this.newDesktopImages,
    index: number
  ): void {
    target.update(current => {
      const copy = [...current];
      copy.splice(index, 1);
      return copy;
    });
  }

  // =========================================================
  // Delete Existing Image (already on server)
  // =========================================================

  deleteExistingImage(image: BannerImageResponse): void {
    const bannerId = this.banner()?.id;
    if (!bannerId) return;

    if (!confirm('Delete this image?')) return;

    this.deletingImageId.set(image.id);

    this.bannerService.deleteImage(bannerId, image.id).subscribe({
      next: (res) => {
        this.deletingImageId.set(null);
        if (res.success) {
          if (image.isMobile) {
            this.existingMobileImages.update(imgs =>
              imgs.filter(x => x.id !== image.id)
            );
          } else {
            this.existingDesktopImages.update(imgs =>
              imgs.filter(x => x.id !== image.id)
            );
          }
        }
      },
      error: () => this.deletingImageId.set(null),
    });
  }

  // =========================================================
  // Submit
  // =========================================================

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const isNewBanner = !this.isEdit();
    const hasAnyImage =
      this.newDesktopImages().length > 0 ||
      this.newMobileImages().length > 0 ||
      this.existingDesktopImages().length > 0 ||
      this.existingMobileImages().length > 0;

    if (isNewBanner && !hasAnyImage) {
      this.errorMessage.set('banners.errors.imageRequired');
      return;
    }

    this.errorMessage.set(null);
    this.isSaving.set(true);

    const desktopUploads: BannerImageUpload[] = this.newDesktopImages().map(img => ({
      file: img.file!,
      link: img.link || undefined,
    }));

    const mobileUploads: BannerImageUpload[] = this.newMobileImages().map(img => ({
      file: img.file!,
      link: img.link || undefined,
    }));

    const request: UpsertBannerRequest = {
      ...this.form.getRawValue(),
      desktopImages: desktopUploads,
      mobileImages: mobileUploads,
    };

    if (this.isEdit()) {
      const id = this.banner()!.id;

      this.bannerService.update(id, request).subscribe({
        next: (res) => {
          this.isSaving.set(false);
          if (res.success) {
            this.router.navigate(['/admin/banners']);
            return;
          }
          this.errorMessage.set(res.message ?? 'banners.errors.update');
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(extractErrorMessage(err, 'banners.errors.update'));
        },
      });

      return;
    }

    this.bannerService.create(request).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.router.navigate(['/admin/banners']);
          return;
        }
        this.errorMessage.set(res.message ?? 'banners.errors.create');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'banners.errors.create'));
      },
    });
  }

  // =========================================================
  // Validate Image
  // =========================================================

  private validateImage(file: File): boolean {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowed.includes(file.type)) {
      alert('banners.errors.invalidImageType');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('banners.errors.imageTooLarge');
      return false;
    }

    return true;
  }

  // =========================================================
  // Date Validator
  // =========================================================

  private dateValidator(control: AbstractControl): ValidationErrors | null {
    const start = control.get('startDate')?.value;
    const end = control.get('endDate')?.value;

    if (!start || !end) return null;

    return new Date(start) <= new Date(end)
      ? null
      : { invalidDateRange: true };
  }
  
}
