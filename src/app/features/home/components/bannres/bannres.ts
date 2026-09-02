import {
  Component,
  DestroyRef,
  Input,
  OnInit,
  computed,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';

import {
  isPlatformBrowser,
  NgClass,
} from '@angular/common';

import {
  Router,
  RouterLink,
  UrlTree,
} from '@angular/router';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import { TranslatePipe } from '@ngx-translate/core';

import { BannerService } from '../../../../core/services/banner.service';

import {
  BannerResponse,
  BannerType,
} from '../../../../core/models/banner.models';

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

  imports: [
    RouterLink,
    TranslatePipe,
    NgClass,
    ScrollRevealDirective,
    AutoSlideDirective,
  ],

  templateUrl: './bannres.html',
  styleUrl: './bannres.css',
})
export class Banners implements OnInit {

  @Input({ required: true })
  bannerType!: BannerType;


  private readonly bannerService =
    inject(BannerService);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly router =
    inject(Router);

  private readonly platformId =
    inject(PLATFORM_ID);


  readonly banners =
    signal<BannerResponse[]>([]);


  readonly isHomeBanner =
    computed(
      () =>
        this.bannerType ===
        BannerType.HomeBanner
    );


  readonly stripClass =
    computed(() => {

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


  readonly homeSlides =
    computed(() =>
      this.buildSlides(
        this.banners()
      )
    );


  ngOnInit(): void {

    this.bannerService
      .getHeroBanners(this.bannerType)

      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )

      .subscribe({

        next: (response) => {

          this.banners.set(
            response.data ?? []
          );

        },

        error: () => {
          // Optional banner section.
        },

      });

  }


  private buildSlides(
    banners: BannerResponse[]
  ): BannerSlide[] {

    const slides: BannerSlide[] = [];


    for (const banner of banners) {

      const desktopImages =
        banner.images

          .filter(
            x => !x.isMobile
          )

          .sort(
            (a, b) =>
              a.displayOrder -
              b.displayOrder
          );


      const mobileImages =
        banner.images

          .filter(
            x => x.isMobile
          )

          .sort(
            (a, b) =>
              a.displayOrder -
              b.displayOrder
          );


      if (
        desktopImages.length === 0 &&
        mobileImages.length > 0
      ) {

        mobileImages.forEach(
          mobile => {

            slides.push({

              desktopUrl:
                mobile.imageUrl,

              mobileUrl:
                mobile.imageUrl,

              link:
                mobile.link,

            });

          }
        );

        continue;

      }


      desktopImages.forEach(
        (desktop, index) => {

          const mobileMatch =
            mobileImages[index];


          slides.push({

            desktopUrl:
              desktop.imageUrl,

            mobileUrl:
              mobileMatch?.imageUrl,

            link:
              desktop.link ??
              mobileMatch?.link,

          });

        }
      );

    }


    return slides;

  }


  resolveSlideImage(
    slide: BannerSlide
  ): string {

    if (
      isPlatformBrowser(
        this.platformId
      ) &&
      window.innerWidth <= 768 &&
      slide.mobileUrl
    ) {

      return slide.mobileUrl;

    }


    return slide.desktopUrl;

  }


  resolveImage(
    banner: BannerResponse
  ): string {

    const mobileImage =
      banner.images.find(
        x => x.isMobile
      );


    const desktopImage =
      banner.images.find(
        x => !x.isMobile
      );


    if (
      isPlatformBrowser(
        this.platformId
      ) &&
      window.innerWidth <= 768 &&
      mobileImage
    ) {

      return mobileImage.imageUrl;

    }


    return (
      desktopImage?.imageUrl ??
      mobileImage?.imageUrl ??
      ''
    );

  }


  resolveLink(
    banner: BannerResponse
  ): string | undefined {

    const mobileImage =
      banner.images.find(
        x => x.isMobile
      );


    const desktopImage =
      banner.images.find(
        x => !x.isMobile
      );


    if (
      isPlatformBrowser(
        this.platformId
      ) &&
      window.innerWidth <= 768 &&
      mobileImage
    ) {

      return mobileImage.link;

    }


    return (
      desktopImage?.link ??
      mobileImage?.link
    );

  }


  resolveRouterLink(
    link?: string
  ): UrlTree | null {

    if (!link) {
      return null;
    }


    const trimmedLink =
      link.trim();


    if (!trimmedLink) {
      return null;
    }


    try {

      const [
        path,
        queryString,
      ] =
        trimmedLink.split('?');


      const queryParams:
        Record<string, string> = {};


      if (queryString) {

        const params =
          new URLSearchParams(
            queryString
          );


        params.forEach(
          (value, key) => {

            queryParams[key] =
              value;

          }
        );

      }


      return this.router.createUrlTree(
        [path],
        {

          queryParams:
            Object.keys(
              queryParams
            ).length > 0
              ? queryParams
              : undefined,

        }
      );

    } catch {

      return null;

    }

  }

}