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
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive'; // عدّل المسار على حسب مكان الديركتيف عندك

@Component({
  selector: 'app-banners',
  standalone: true,
  imports: [RouterLink, TranslatePipe, NgClass, ScrollRevealDirective],
  templateUrl: './bannres.html',
  styleUrl: './bannres.css'
})
export class Banners implements OnInit {

  @Input({ required: true }) bannerType!: BannerType;

  private readonly bannerService = inject(BannerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly banners = signal<BannerResponse[]>([]);

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