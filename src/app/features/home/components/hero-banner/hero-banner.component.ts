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
import { forkJoin } from 'rxjs';
import { BannerService } from '../../../../core/services/banner.service';
import {
  BannerResponse,
  BannerType
} from '../../../../core/models/banner.models';
import { TranslatePipe } from '@ngx-translate/core';

interface HeroSlide {
  desktopUrl: string;
  mobileUrl?: string;
  link?: string;
}

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './hero-banner.component.html',
  styleUrl: './hero-banner.component.css'
})
export class HeroBannerComponent implements OnInit, OnDestroy {

  private readonly bannerService = inject(BannerService);
  private readonly destroyRef = inject(DestroyRef);
  readonly homeBanners = signal<BannerResponse[]>([]);
  readonly offerBanners = signal<BannerResponse[]>([]);
  readonly categoryBanners = signal<BannerResponse[]>([]);

  /**
   * Intro Screen
   */

  readonly showIntro = signal(true);
  readonly showSlider = signal(false);
  private introTimer?: ReturnType<typeof setTimeout>;

  /**
   * Slider Data
   */

  readonly slides = signal<HeroSlide[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly currentIndex = signal(0);
  readonly isAnimating = signal(false);
  readonly showCurrent = signal(true);
  readonly currentImage = signal('');
  readonly nextImage = signal('');
  readonly nextSlide = signal<HeroSlide | null>(null);

  readonly currentSlide = computed(() =>
    this.slides()[this.currentIndex()] ?? null
  );

  readonly hasBanners = computed(() => this.slides().length > 0);

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
    this.loadStaticBanners();
    window.addEventListener('resize', this.onResize);

  }

  ngOnDestroy(): void {

    this.pause();
    clearTimeout(this.introTimer);
    window.removeEventListener('resize', this.onResize);

  }

  // ==========================
  // Load
  // ==========================

  private loadStaticBanners(): void {

    forkJoin({
      home: this.bannerService.getHeroBanners(BannerType.HomeBanner),
      offer: this.bannerService.getHeroBanners(BannerType.OfferBanner),
      category: this.bannerService.getHeroBanners(BannerType.CategoryBanner),
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({

      next: ({ home, offer, category }) => {

        this.homeBanners.set(home.data ?? []);
        this.offerBanners.set(offer.data ?? []);
        this.categoryBanners.set(category.data ?? []);

      },

      error: () => {
        // السكاشن دي مش أساسية زي الهيرو، فمش هنعمل حاجة لو فشلت
      }

    });

  }

  // ==========================
  // Helpers (Static Banners)
  // ==========================

  resolveImage(banner: BannerResponse): string {

    const isMobileView = window.innerWidth <= 768;

    const mobileImage = banner.images.find(x => x.isMobile);
    const desktopImage = banner.images.find(x => !x.isMobile);

    if (isMobileView && mobileImage) {
      return mobileImage.imageUrl;
    }

    return desktopImage?.imageUrl ?? mobileImage?.imageUrl ?? '';
  }

  resolveLink(banner: BannerResponse | null): string | undefined {

    if (!banner) return undefined;

    const isMobileView = window.innerWidth <= 768;

    const mobileImage = banner.images.find(x => x.isMobile);
    const desktopImage = banner.images.find(x => !x.isMobile);

    if (isMobileView && mobileImage) {
      return mobileImage.link;
    }

    return desktopImage?.link ?? mobileImage?.link;
  }

  // ==========================
  // Helpers (Slider Slides)
  // ==========================

  private buildSlides(banners: BannerResponse[]): HeroSlide[] {

    const slides: HeroSlide[] = [];

    for (const banner of banners) {

      const desktopImages = banner.images
        .filter(x => !x.isMobile)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      const mobileImages = banner.images
        .filter(x => x.isMobile)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      if (desktopImages.length === 0 && mobileImages.length > 0) {
        // مفيش صور ديسكتوب، بس فيه موبايل → اعتبرها سلايدات مستقلة
        mobileImages.forEach(m => {
          slides.push({
            desktopUrl: m.imageUrl,
            mobileUrl: m.imageUrl,
            link: m.link
          });
        });
        continue;
      }

      // كل صورة ديسكتوب = سلايد منفصل، ولو فيه صورة موبايل بنفس الترتيب نستخدمها ليها
      desktopImages.forEach((d, i) => {
        const mobileMatch = mobileImages[i];
        slides.push({
          desktopUrl: d.imageUrl,
          mobileUrl: mobileMatch?.imageUrl,
          link: d.link ?? mobileMatch?.link
        });
      });
    }

    return slides;
  }

  private resolveSlideImage(slide: HeroSlide): string {

    const isMobileView = window.innerWidth <= 768;

    if (isMobileView && slide.mobileUrl) {
      return slide.mobileUrl;
    }

    return slide.desktopUrl;
  }

  resolveSlideLink(slide: HeroSlide | null): string | undefined {

    return slide?.link;
  }

  private loadBanners(): void {

    this.bannerService
      .getHeroBanners(BannerType.HeroSlider)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({

        next: (response) => {

          const rawBanners = response.data ?? [];

          this.slides.set(this.buildSlides(rawBanners));

          const first = this.slides()[0];

          if (first) {

            this.currentImage.set(this.resolveSlideImage(first));
            this.nextSlide.set(first);

          }

          this.loading.set(false);
          this.loadError.set(false);

          if (this.slides().length > 1) {

            this.startAutoSlide();

          }

          if (this.hasBanners()) {

            this.introTimer = setTimeout(() => {

              this.showIntro.set(false);

              requestAnimationFrame(() => {

                this.showSlider.set(true);

              });

            }, 5000);

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

    const total = this.slides().length;

    if (total <= 1) return;

    this.changeTo((this.currentIndex() + 1) % total);

  }

  previous(): void {

    if (this.isAnimating()) return;

    const total = this.slides().length;

    if (total <= 1) return;

    this.changeTo(
      (this.currentIndex() - 1 + total) % total
    );

  }

  go(index: number): void {

    if (this.isAnimating()) return;

    if (index === this.currentIndex()) return;

    this.changeTo(index);

  }

  // ==========================
  // Animation
  // ==========================

  private changeTo(index: number): void {

    const slide = this.slides()[index];

    if (!slide) return;

    this.nextSlide.set(slide);
    this.isAnimating.set(true);

    const image = new Image();

    image.src = this.resolveSlideImage(slide);

    image.onload = () => this.finishTransition(image.src, index);

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
      this.nextSlide.set(this.slides()[index] ?? null);

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

    if (this.slides().length > 1) {

      this.startAutoSlide();

    }

  }

  // ==========================
  // Resize
  // ==========================

  private onResize = () => {

    const slide = this.currentSlide();

    if (!slide) return;

    this.currentImage.set(
      this.resolveSlideImage(slide)
    );

  };

}