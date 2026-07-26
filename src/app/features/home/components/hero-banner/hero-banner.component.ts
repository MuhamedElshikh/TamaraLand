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

  /**
   * Banner Data
   */

  readonly banners = signal<BannerResponse[]>([]);

  readonly loading = signal(true);

  readonly currentIndex = signal(0);

  readonly isAnimating = signal(false);

  readonly showCurrent = signal(true);

  readonly currentImage = signal('');

  readonly nextImage = signal('');

  readonly currentBanner = computed(() =>
    this.banners()[this.currentIndex()] ?? null
  );

  readonly hasBanners = computed(() => this.banners().length > 0);

  private autoSlideTimer?: number;

  ngOnInit(): void {

    this.loadBanners();

    window.addEventListener('resize', this.onResize);

    setTimeout(() => {

  this.showIntro.set(false);

  requestAnimationFrame(() => {

    this.showSlider.set(true);

  });

},5000);

  }

  ngOnDestroy(): void {

    this.pause();

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

          }

          this.loading.set(false);

          if (this.banners().length > 1) {

            this.startAutoSlide();

          }

        },

        error: () => {

          this.loading.set(false);

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

    if (index === this.currentIndex()) return;

    this.changeTo(index);

  }

  // ==========================
  // Animation
  // ==========================

  private changeTo(index: number): void {

    const banner = this.banners()[index];

    if (!banner) return;

    this.isAnimating.set(true);

    const image = new Image();

    image.src = this.resolveImage(banner);

    image.onload = () => {

      this.nextImage.set(image.src);

      requestAnimationFrame(() => {

        this.showCurrent.set(false);

      });

      setTimeout(() => {

        this.currentImage.set(image.src);

        this.currentIndex.set(index);

        this.showCurrent.set(true);

        this.isAnimating.set(false);

      }, 600);

    };

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