import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BannerService } from '../../../../core/services/banner.service';
import {
  BannerResponse,
  BannerType
} from '../../../../core/models/banner.models';

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero-banner.component.html',
  styleUrl: './hero-banner.component.css'
})
export class HeroBannerComponent implements OnInit, OnDestroy {

  private readonly bannerService = inject(BannerService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Intro Screen
   */

  readonly showIntro = signal(true);
  readonly showSlider = signal(false);
  private introTimer?: ReturnType<typeof setTimeout>;

  /**
   * Banner Data
   */

  readonly banners = signal<BannerResponse[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly currentIndex = signal(0);
  readonly isAnimating = signal(false);
  readonly showCurrent = signal(true);
  readonly currentImage = signal('');
  readonly nextImage = signal('');
  readonly nextBanner = signal<BannerResponse | null>(null);

  readonly currentBanner = computed(() =>
    this.banners()[this.currentIndex()] ?? null
  );

  readonly hasBanners = computed(() => this.banners().length > 0);

  private autoSlideTimer?: number;

  // ==========================
  // Touch / Swipe (Mobile)
  // ==========================

  private touchStartX = 0;
  private touchStartY = 0;

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.pause();
  }

  onTouchEnd(event: TouchEvent): void {
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    const deltaY = event.changedTouches[0].clientY - this.touchStartY;

    // بنتجاهل اللمسة لو حركة رأسية (سكرول) أكبر من الأفقية، عشان منتدخلش في السكرول العادي
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        this.next();
      } else {
        this.previous();
      }
    }

    this.resume();
  }

  ngOnInit(): void {

    this.loadBanners();

    window.addEventListener('resize', this.onResize);

    this.introTimer = setTimeout(() => {

      this.showIntro.set(false);

      requestAnimationFrame(() => {

        this.showSlider.set(true);

      });

    }, 5000);

  }

  ngOnDestroy(): void {

    this.pause();
    clearTimeout(this.introTimer);
    window.removeEventListener('resize', this.onResize);

  }

  // ==========================
  // Load
  // ==========================

  private loadBanners(): void {

    this.bannerService
      .getHeroBanners(BannerType.HeroSlider)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({

        next: (response) => {

          this.banners.set(response.data ?? []);

          const first = this.banners()[0];

          if (first) {

            this.currentImage.set(this.resolveImage(first));
          this.nextBanner.set(first);

          }

          this.loading.set(false);
          this.loadError.set(false);

          if (this.banners().length > 1) {

            this.startAutoSlide();

          }

        },

        error: () => {

          this.loading.set(false);
          this.loadError.set(true);

        }

      });

  }

  // ==========================
  // Slider Controls
  // ==========================

  next(): void {

    if (this.isAnimating()) return;

    const total = this.banners().length;

    if (total <= 1) return;

    this.changeTo((this.currentIndex() + 1) % total);

  }

  previous(): void {

    if (this.isAnimating()) return;

    const total = this.banners().length;

    if (total <= 1) return;

    this.changeTo(
      (this.currentIndex() - 1 + total) % total
    );

  }

  go(index: number): void {

    // كانت ناقصة هنا - كانت بتسمح تدوس على أي نقطة حتى لو transition شغالة
    if (this.isAnimating()) return;

    if (index === this.currentIndex()) return;

    this.changeTo(index);

  }

  // ==========================
  // Animation
  // ==========================

  private changeTo(index: number): void {

    const banner = this.banners()[index];

    if (!banner) return;
this.nextBanner.set(banner);
    this.isAnimating.set(true);

    const image = new Image();

    image.src = this.resolveImage(banner);

    image.onload = () => this.finishTransition(image.src, index);

    // كانت ناقصة: لو الصورة فشلت تحميل، isAnimating كانت بتفضل true للأبد
    // وتوقف الـ slider بالكامل. دلوقتي بننتقل للسلايد المطلوب برضو من غير الصورة الجديدة.
    image.onerror = () => this.finishTransition(this.currentImage(), index);

  }

  private finishTransition(imageSrc: string, index: number): void {

    this.nextImage.set(imageSrc);

    requestAnimationFrame(() => {

      this.showCurrent.set(false);

    });

    setTimeout(() => {

      this.currentImage.set(imageSrc);

      this.currentIndex.set(index);
      this.nextBanner.set(this.banners()[index] ?? null);

      this.showCurrent.set(true);

      this.isAnimating.set(false);

    }, 600);

  }

  // ==========================
  // Auto Slide
  // ==========================

  private startAutoSlide(): void {

    this.pause();

    this.autoSlideTimer = window.setInterval(() => {

      this.next();

    }, 5000);

  }

  pause(): void {

    if (this.autoSlideTimer) {

      clearInterval(this.autoSlideTimer);

    }

  }

  resume(): void {

    if (this.banners().length > 1) {

      this.startAutoSlide();

    }

  }

  // ==========================
  // Helpers
  // ==========================

  private resolveImage(
    banner: BannerResponse
  ): string {

    return window.innerWidth <= 768 &&
      banner.mobileImageUrl
      ? banner.mobileImageUrl
      : banner.imageUrl;

  }

  private onResize = () => {

    const banner = this.currentBanner();

    if (!banner) return;

    this.currentImage.set(
      this.resolveImage(banner)
    );

  };

}