import {
  Component,
  DestroyRef,
  Input,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { BannerService } from '../../../../core/services/banner.service';
import { BannerResponse, BannerType } from '../../../../core/models/banner.models';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
import { AutoSlideDirective } from '../../../../shared/directives/auto-slide.directive';

interface BannerSlide {
  desktopUrl: string;
  mobileUrl?: string;
  link?: string;
}

@Component({
  selector: 'app-banners',
  standalone: true,
  imports: [RouterLink, TranslatePipe, NgClass, ScrollRevealDirective, AutoSlideDirective],
  templateUrl: './bannres.html',
  styleUrl: './bannres.css'
})
export class Banners implements OnInit {

  @Input({ required: true }) bannerType!: BannerType;

  private readonly bannerService = inject(BannerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly banners = signal<BannerResponse[]>([]);

  readonly isHomeBanner = computed(() => this.bannerType === BannerType.HomeBanner);

  readonly stripClass = computed(() => {
    switch (this.bannerType) {
      case BannerType.HomeBanner:
        return 'static-banner-strip--home';
      case BannerType.OfferBanner:
        return 'static-banner-strip--offer';
      case BannerType.CategoryBanner:
        return 'static-banner-strip--category';
      default:
        return '';
    }
  });

  // ==========================
  // Home Banner: سلايدات مبنية من كل صور كل البانرز (مش بانر = كارت واحد بس)
  // ==========================

  readonly homeSlides = computed(() => this.buildSlides(this.banners()));

  ngOnInit(): void {

    this.bannerService.getHeroBanners(this.bannerType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({

        next: (response) => {
          this.banners.set(response.data ?? []);
        },

        error: () => {
          // السكاشن دي مش أساسية زي الهيرو، فمش هنعمل حاجة لو فشلت
        }

      });

  }

  private buildSlides(banners: BannerResponse[]): BannerSlide[] {

    const slides: BannerSlide[] = [];

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

  resolveSlideImage(slide: BannerSlide): string {

    const isMobileView = window.innerWidth <= 768;

    if (isMobileView && slide.mobileUrl) {
      return slide.mobileUrl;
    }

    return slide.desktopUrl;
  }

  // ==========================
  // Offer / Category: بانر = كارت واحد
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

  resolveLink(banner: BannerResponse): string | undefined {

    const isMobileView = window.innerWidth <= 768;

    const mobileImage = banner.images.find(x => x.isMobile);
    const desktopImage = banner.images.find(x => !x.isMobile);

    if (isMobileView && mobileImage) {
      return mobileImage.link;
    }

    return desktopImage?.link ?? mobileImage?.link;
  }

}