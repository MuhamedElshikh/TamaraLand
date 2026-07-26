import {Component,computed,effect,inject,signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import {NonNullableFormBuilder ,ReactiveFormsModule,Validators,AbstractControl,ValidationErrors} from '@angular/forms';
import {BannerResponse,BannerType,UpsertBannerRequest} from '../../../../core/models/banner.models';
import { AdminBannerService } from '../../../../core/services/admn-banner.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-banner-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './banner-form.component.html',
  styleUrl: './banner-form.component.css',
})
export class BannerFormComponent {
private readonly fb = inject(NonNullableFormBuilder);
private readonly bannerService = inject(AdminBannerService);
 readonly router = inject(Router);
private readonly route = inject(ActivatedRoute);
readonly banner = signal<BannerResponse | null>(null);

readonly isSaving = signal(false);

readonly errorMessage = signal<string | null>(null);
  readonly desktopPreview = signal<string | null>(null);

  readonly mobilePreview = signal<string | null>(null);

  readonly desktopDragging = signal(false);

  readonly mobileDragging = signal(false);

  private desktopImage?: File;

  private mobileImage?: File;

  readonly isEdit = computed(() => this.banner() !== null);

  readonly bannerTypes = [
    {
      value: BannerType.HeroSlider,
      text: 'Hero Slider',
    },
    {
      value: BannerType.HomeBanner,
      text: 'Home Banner',
    },
    {
      value: BannerType.OfferBanner,
      text: 'Offer Banner',
    },
    {
      value: BannerType.CategoryBanner,
      text: 'Category Banner',
    },
  ];
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
 readonly form = this.fb.group(
  {
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', Validators.maxLength(1000)],
    link: [''],
    type: [BannerType.HeroSlider, Validators.required],
    displayOrder: [1, [Validators.required, Validators.min(1)]],
    isActive: [true],
    startDate: [''],
    endDate: [''],
  },
  {
    validators: this.dateValidator,
  }
);

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
      link: banner.link ?? '',
      type: banner.type,
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
      startDate: banner.startDate?.substring(0, 10) ?? '',
      endDate: banner.endDate?.substring(0, 10) ?? '',

    });

    this.desktopPreview.set(banner.imageUrl);

    this.mobilePreview.set(banner.mobileImageUrl ?? null);

  });

}

  // =========================
  // Desktop Image
  // =========================

  desktopSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];

    this.setDesktopImage(file);
  }

  desktopDrop(event: DragEvent) {
    event.preventDefault();

    this.desktopDragging.set(false);

    const file = event.dataTransfer?.files?.[0];

    this.setDesktopImage(file);
  }

  removeDesktopImage() {
  this.desktopImage = undefined;
  this.desktopPreview.set(null);
}

  // =========================
  // Mobile Image
  // =========================

  mobileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];

    this.setMobileImage(file);
  }

  mobileDrop(event: DragEvent) {
    event.preventDefault();

    this.mobileDragging.set(false);

    const file = event.dataTransfer?.files?.[0];

    this.setMobileImage(file);
  }

 removeMobileImage(): void {
  this.mobileImage = undefined;
  this.mobilePreview.set(null);
}

  // =========================

  submit(): void {

  if (this.form.invalid) {

    this.form.markAllAsTouched();

    return;

  }

  this.errorMessage.set(null);

  this.isSaving.set(true);

  const request: UpsertBannerRequest = {

    ...this.form.getRawValue(),

    image: this.desktopImage,

    mobileImage: this.mobileImage,

  };

  if (this.isEdit()) {

    const id = this.banner()!.id;

    this.bannerService.update(id, request).subscribe({

      next: (res) => {

        this.isSaving.set(false);

        if (res.success) {

          this.router.navigate(['/admin/banners']);

        } else {

          this.errorMessage.set(
            res.message ?? 'Failed to update banner.'
          );

        }

      },

      error: (err) => {

        this.isSaving.set(false);

        this.errorMessage.set(
          err?.error?.message ?? 'Failed to update banner.'
        );

      },

    });

  } else {

    this.bannerService.create(request).subscribe({

      next: (res) => {

        this.isSaving.set(false);

        if (res.success) {

          this.router.navigate(['/admin/banners']);

        } else {

          this.errorMessage.set(
            res.message ?? 'Failed to create banner.'
          );

        }

      },

      error: (err) => {

        this.isSaving.set(false);

        this.errorMessage.set(
          err?.error?.message ?? 'Failed to create banner.'
        );

      },

    });

  }

}
  // =========================

  private setDesktopImage(file?: File) {
    if (!file) return;

    if (!this.validateImage(file)) return;

    this.desktopImage = file;

    this.desktopPreview.set(URL.createObjectURL(file));
  }

  private setMobileImage(file?: File) {
    if (!file) return;

    if (!this.validateImage(file)) return;

    this.mobileImage = file;

    this.mobilePreview.set(URL.createObjectURL(file));
  }

  private validateImage(file: File): boolean {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowed.includes(file.type)) {
      alert('Only JPG, PNG and WEBP images are allowed.');

      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Maximum image size is 5 MB.');

      return false;
    }

    return true;
  }

  private dateValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const start = control.get('startDate')?.value;

    const end = control.get('endDate')?.value;

    if (!start || !end) return null;

    return new Date(start) <= new Date(end)
      ? null
      : { invalidDateRange: true };
  }
}