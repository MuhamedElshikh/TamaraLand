  import { Component, OnInit, inject, signal, viewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
  import { RouterLink } from '@angular/router';
  import { CatalogService } from '../../../../core/services/catalog.service'; // عدّل المسار
  import { CategoryResponse } from '../../../../core/models/catalog.models'; // عدّل المسار
  import { HeroBannerComponent } from '../../components/hero-banner/hero-banner.component';
  import { Banners } from '../../components/bannres/bannres'; // عدّل المسار
  import { BannerType } from '../../../../core/models/banner.models'; // عدّل المسار
  import { FeaturedProductsComponent } from '../../components/featured-products/featured-products.component';
  import { TranslatePipe } from '@ngx-translate/core';
  import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe';
  import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
  import { AutoSlideDirective } from '../../../../shared/directives/auto-slide.directive';
  import { TestimonialsComponent } from '../../components/testimonials-component/testimonials-component';
import { SeoService } from '../../../../core/services/seo.service';
  @Component({
    selector: 'app-home-page',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
      RouterLink,
      HeroBannerComponent,
      Banners,
      FeaturedProductsComponent,
      TranslatePipe,
      LocalizedNamePipe,
      ScrollRevealDirective,
      TestimonialsComponent
    ],
    templateUrl: './home.page.html',
    styleUrl: './home.page.css',
  })
  export class HomePage implements OnInit {
    private catalog = inject(CatalogService);
private readonly seo = inject(SeoService);
    protected readonly bannerType = BannerType;

    categories = signal<CategoryResponse[]>([]);
    categoriesLoading = signal(true);
    readonly fallbackImage = 'assets/placeholder-product.jpg';

   ngOnInit(): void {
this.seo.setSeo({
  title: 'Tamara Land Boutique | Fashion & Style',

  description:
    'Discover Tamara Land Boutique — curated fashion, elegant styles, and contemporary collections.',

  canonicalUrl: '/',

  image: '../../../../../assets/home-og.jpg',

  imageType: 'image/jpeg',
  imageWidth: 1200,
  imageHeight: 630,

  imageAlt:
    'Tamara Land Boutique fashion collection',

  type: 'website',

  siteName: 'Tamara Land',

  locale: 'en_EG',

  robots: 'index, follow'
});

  this.catalog.getCategories({ pageSize: 4 }).subscribe({
    next: (res) => {
      if (res.success && res.data) {
        this.categories.set(res.data.items);
      }

      this.categoriesLoading.set(false);
    },

    error: () => {
      this.categoriesLoading.set(false);
    }
  });

}

    readonly categoryStrip = viewChild<ElementRef<HTMLDivElement>>('categoryStrip');
    readonly categoryStripAuto = viewChild<AutoSlideDirective>('categoryStripAuto');

    scrollCategories(direction: 1 | -1): void {
      const el = this.categoryStrip()?.nativeElement;
      if (!el) return;

      this.categoryStripAuto()?.pauseNow();
      const scrollAmount = el.clientWidth * 0.7;
      el.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
      this.categoryStripAuto()?.resumeSoon();
    }
  }