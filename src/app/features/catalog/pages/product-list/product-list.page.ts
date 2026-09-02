import {
  Component,
  computed,
  inject,
  signal,
  OnInit,
  DestroyRef,
  ChangeDetectionStrategy,
  PLATFORM_ID,
} from '@angular/core';

import { isPlatformBrowser, UpperCasePipe } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { combineLatest } from 'rxjs';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ProductCardComponent } from '../../components/product-card/product-card.component';

import { ProductFiltersComponent } from '../../components/product-filters/product-filters.component';

import { PaginationComponent } from '../../../../shared/pagination/pagination';

import { CatalogService } from '../../../../core/services/catalog.service';

import {
  ProductCardResponse,
  ProductFilterRequest,
  ProductCollection,
} from '../../../../core/models/catalog.models';

import { AnalyticsService } from '../../../../core/services/analytics.service';

import { SeoService } from '../../../../core/services/seo.service';


const PAGE_SIZE = 12;


type SeasonKey =
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'spring';


interface SeasonConfig {
  key: SeasonKey;
  kicker: string;
  title: string;
  description: string;
}


interface SeasonalParticle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  symbol: string;
}


@Component({
  selector: 'app-product-list',
  standalone: true,

  imports: [
    ProductCardComponent,
    ProductFiltersComponent,
    PaginationComponent,
    TranslatePipe,
    UpperCasePipe,
  ],

  templateUrl: './product-list.page.html',

  styleUrl: './product-list.page.css',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListPage implements OnInit {

  private readonly catalogService = inject(CatalogService);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly translate = inject(TranslateService);

  private readonly analyticsService = inject(AnalyticsService);

  private readonly seo = inject(SeoService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly isBrowser =
    isPlatformBrowser(inject(PLATFORM_ID));


  readonly filtersOpen = signal(false);


  readonly products =
    signal<ProductCardResponse[]>([]);


  readonly isLoading =
    signal(false);


  readonly totalCount =
    signal(0);


  readonly pageNumber =
    signal(1);


  readonly totalPages =
    signal(1);


  readonly didYouMean =
    signal<string[]>([]);


  readonly currentSearch =
    signal('');


  readonly pageTitle =
    signal('All Products');


  readonly pageKicker =
    signal('Catalog');


  readonly pageSubtitle =
    signal(
      'Explore curated pieces with refined filters and elegant browsing.'
    );


  private readonly collection =
    signal<ProductCollection>(ProductCollection.None);


  readonly priceCap =
    signal<number | null>(null);


  private currentFilter: ProductFilterRequest = {};


  readonly summary = computed(() => {

    const count = this.totalCount();

    return count > 0
      ? `Showing ${count} product${count === 1 ? '' : 's'}`
      : 'Showing curated pieces';

  });


  readonly isSalePage = computed(
    () =>
      this.collection() === ProductCollection.Offers
  );


  readonly season = computed<SeasonConfig>(() => {

    const month = new Date().getMonth() + 1;

    if (month >= 3 && month <= 5) {

      return {
        key: 'spring',

        kicker: 'Spring Edit',

        title: 'A New Season Is Blooming',

        description:
          'Fresh silhouettes, softer details, and pieces made for brighter days.',
      };

    }


    if (month >= 6 && month <= 8) {

      return {
        key: 'summer',

        kicker: 'Summer Edit',

        title: 'Summer Is On Its Way',

        description:
          'Light textures, effortless silhouettes, and pieces made for sun-filled days.',
      };

    }


    if (month >= 9 && month <= 11) {

      return {
        key: 'autumn',

        kicker: 'Autumn Edit',

        title: 'A Softer Season Begins',

        description:
          'Layered textures, elegant tones, and effortless pieces for the new season.',
      };

    }


    return {
      key: 'winter',

      kicker: 'Winter Edit',

      title: 'Winter Is Coming',

      description:
        'Refined layers, cozy textures, and timeless silhouettes for colder days.',
    };

  });


  readonly seasonalParticles =
    computed<SeasonalParticle[]>(() => {

      const symbols =
        this.season().key === 'summer'
          ? ['✦', '·', '✧', '○']
          : this.season().key === 'winter'
            ? ['✦', '❄', '·', '✧']
            : this.season().key === 'spring'
              ? ['✿', '·', '✦', '❀']
              : ['✦', '·', '❧', '○'];


      return Array.from(
        { length: 10 },
        (_, index) => ({
          id: index,

          left: Math.random() * 90 + 5,

          delay: Math.random() * 4,

          duration: 4 + Math.random() * 4,

          symbol:
            symbols[index % symbols.length],
        })
      );

    });


  ngOnInit(): void {

    const data = this.route.snapshot.data;


    this.collection.set(
      data['collection'] ??
      ProductCollection.None
    );


    this.priceCap.set(
      data['priceCap'] ??
      null
    );


    /*
     * Translation + query params
     *
     * We use the same route translation keys that
     * already control the visible H1 / subtitle.
     *
     * This means:
     *
     * /products
     * /new-in
     * /sale
     * /under-800
     *
     * automatically get their correct SEO content.
     */

    combineLatest([

      this.translate.stream(
        data['title']
      ),

      this.translate.stream(
        data['kicker']
      ),

      this.translate.stream(
        data['subtitle']
      ),

      this.route.queryParams,

    ])
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        ([
          title,
          kicker,
          subtitle,
          params,
        ]) => {

          this.pageTitle.set(title);

          this.pageKicker.set(kicker);

          this.pageSubtitle.set(subtitle);


          this.setCatalogSeo(
            title,
            subtitle,
            params
          );

        }
      );


    this.route.queryParams
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(params => {

        const cap =
          this.priceCap();


        const requestedMax =
          params['maxPrice']
            ? +params['maxPrice']
            : undefined;


        const clampedMax =
          cap
            ? Math.min(
                requestedMax ?? cap,
                cap
              )
            : requestedMax;


        const filter:
          ProductFilterRequest = {

          search:
            params['search'] ??
            undefined,

          categoryId:
            params['categoryId']
              ? +params['categoryId']
              : undefined,

          brandId:
            params['brandId']
              ? +params['brandId']
              : undefined,

          minPrice:
            params['minPrice']
              ? +params['minPrice']
              : undefined,

          maxPrice:
            clampedMax,

          sortBy:
            params['sortBy'] ??
            undefined,

          desc:
            params['desc'] === 'true',

          inStockOnly:
            params['inStockOnly'] === 'true',

          pageNumber:
            +(params['page'] ?? 1),

          collection:
            this.collection(),

        };


        this.currentFilter =
          filter;


        this.currentSearch.set(
          filter.search?.trim() ??
          ''
        );


        if (
          filter.search?.trim()
        ) {

          this.analyticsService.search(
            filter.search
          );

        }


        this.loadProducts(
          filter,
          filter.pageNumber ?? 1
        );

      });

  }


  /*
   * ============================================================
   * SEO
   * ============================================================
   */


  private setCatalogSeo(
    title: string,
    description: string,
    queryParams: Record<string, unknown>
  ): void {

    const canonicalUrl =
      this.getCatalogCanonicalUrl();


    /*
     * Only the clean/base catalog URLs should
     * be indexable.
     *
     * Examples:
     *
     * /products              -> index
     * /new-in                -> index
     * /sale                  -> index
     * /under-800             -> index
     *
     * /products?page=2       -> noindex
     * /products?brandId=15   -> noindex
     * /products?search=dress -> noindex
     */

    const hasQueryParams =
      Object.keys(queryParams).length > 0;


    const robots =
      hasQueryParams
        ? 'noindex, follow'
        : 'index, follow';


    const seoTitle =
      `${title} | Tamara Land`;


    /*
     * We intentionally don't add filter values
     * to the SEO title/description.
     *
     * Filtered URLs are noindex anyway.
     */


    this.seo.setSeo({

      title: seoTitle,

      description,

      canonicalUrl,

      type: 'website',

      robots,

      siteName: 'Tamara Land',

      locale:
        this.translate.currentLang === 'ar'
          ? 'ar_EG'
          : 'en_US',

      /*
       * JSON-LD is added after the products
       * have been loaded.
       */

    });

  }


  private getCatalogCanonicalUrl(): string {

    const path =
      this.route.routeConfig?.path;


    switch (path) {

      case 'new-in':
        return '/new-in';


      case 'sale':
        return '/sale';


      case 'under-800':
        return '/under-800';


      case 'products':
      default:
        return '/products';

    }

  }


  private setCatalogJsonLd(
    title: string,
    description: string,
    products: ProductCardResponse[]
  ): void {

    /*
     * Do not generate structured data for
     * filtered/search/paginated URLs.
     *
     * They are already noindex.
     */

    const hasQueryParams =
      Object.keys(
        this.route.snapshot.queryParams
      ).length > 0;


    if (hasQueryParams) {

      this.seo.setSeo({

        title: `${title} | Tamara Land`,

        description,

        canonicalUrl:
          this.getCatalogCanonicalUrl(),

        type: 'website',

        robots: 'noindex, follow',

        siteName: 'Tamara Land',

        locale:
          this.translate.currentLang === 'ar'
            ? 'ar_EG'
            : 'en_US',

      });

      return;

    }


    this.seo.setSeo({

      title: `${title} | Tamara Land`,

      description,

      canonicalUrl:
        this.getCatalogCanonicalUrl(),

      type: 'website',

      robots: 'index, follow',

      siteName: 'Tamara Land',

      locale:
        this.translate.currentLang === 'ar'
          ? 'ar_EG'
          : 'en_US',

      jsonLd:
        this.buildCatalogSchema(
          title,
          description,
          products
        ),

    });

  }


  private buildCatalogSchema(
    title: string,
    description: string,
    products: ProductCardResponse[]
  ): Record<string, unknown> {

    const canonicalUrl =
      this.getCatalogCanonicalUrl();


    const itemListElement =
      products.map(
        (product, index) => {

          const item: Record<string, unknown> = {

            '@type': 'ListItem',

            position: index + 1,

            name: product.name,

            url:
              `https://www.tamaraland.shop/products/${product.id}`,

          };


          if (product.imageUrl) {

            item['image'] =
              this.absoluteUrl(
                product.imageUrl
              );

          }


          return item;

        }
      );


    const itemList: Record<string, unknown> = {

      '@type': 'ItemList',

      itemListOrder:
        'https://schema.org/ItemListOrderAscending',

      numberOfItems:
        products.length,

      itemListElement,

    };


    return {

      '@context': 'https://schema.org',

      '@type': 'CollectionPage',

      name:
        `${title} | Tamara Land`,

      description,

      url:
        `https://www.tamaraland.shop${canonicalUrl}`,

      isPartOf: {

        '@type': 'WebSite',

        name: 'Tamara Land',

        url:
          'https://www.tamaraland.shop',

      },

      mainEntity: itemList,

    };

  }


  private absoluteUrl(
    url: string
  ): string {

    if (
      url.startsWith('http://') ||
      url.startsWith('https://')
    ) {

      return url;

    }


    return `https://www.tamaraland.shop${
      url.startsWith('/')
        ? ''
        : '/'
    }${url}`;

  }


  /*
   * ============================================================
   * FILTERS
   * ============================================================
   */


  onFiltersChanged(
    filter: ProductFilterRequest
  ): void {

    const queryParams: Record<string, unknown> = {};


    if (filter.search) {

      queryParams['search'] =
        filter.search;

    }


    if (filter.categoryId) {

      queryParams['categoryId'] =
        filter.categoryId;

    }


    if (filter.brandId) {

      queryParams['brandId'] =
        filter.brandId;

    }


    if (
      filter.minPrice !== undefined
    ) {

      queryParams['minPrice'] =
        filter.minPrice;

    }


    if (
      filter.maxPrice !== undefined
    ) {

      queryParams['maxPrice'] =
        filter.maxPrice;

    }


    if (filter.sortBy) {

      queryParams['sortBy'] =
        filter.sortBy;

    }


    if (filter.desc !== undefined) {

      queryParams['desc'] =
        filter.desc;

    }


    if (filter.inStockOnly) {

      queryParams['inStockOnly'] =
        true;

    }


    this.router.navigate(
      [],
      {
        relativeTo: this.route,

        queryParams,

        queryParamsHandling: '',

      }
    );

  }


  onPageChange(
    page: number
  ): void {

    this.router.navigate(
      [],

      {
        relativeTo: this.route,

        queryParams: {
          ...this.route.snapshot.queryParams,

          page:
            page > 1
              ? page
              : null,
        },

        queryParamsHandling: '',

      }
    );


    if (this.isBrowser) {

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });

    }

  }


  selectDidYouMean(
    term: string
  ): void {

    this.router.navigate(
      ['/products'],

      {
        queryParams: {
          search: term,
        },
      }
    );

  }


  /*
   * ============================================================
   * PRODUCTS
   * ============================================================
   */


  private loadProducts(
    filter: ProductFilterRequest = {},
    pageNumber = 1
  ): void {

    this.isLoading.set(true);

    this.pageNumber.set(
      pageNumber
    );


    const request:
      ProductFilterRequest = {

      ...filter,

      collection:
        this.collection(),

      pageNumber,

      pageSize:
        PAGE_SIZE,

    };


    this.catalogService
      .getProducts(request)
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({

        next: response => {

          if (
            response.success &&
            response.data
          ) {

            const items =
              response.data.items;


            this.products.set(
              items
            );


            this.didYouMean.set(
              response.data.didYouMean ??
              []
            );


            this.totalCount.set(
              response.data.totalCount
            );


            this.totalPages.set(
              response.data.totalPages ||
              1
            );


            this.analyticsService.viewItemList(

              items.map(item => ({

                id:
                  item.id,

                name:
                  item.name,

                price:
                  item.price,

              })),

              this.pageTitle()

            );


            /*
             * Update JSON-LD after the
             * prerendered product list
             * has been loaded.
             */

            this.setCatalogJsonLd(

              this.pageTitle(),

              this.pageSubtitle(),

              items

            );

          }


          this.isLoading.set(false);

        },


        error: () => {

          this.products.set([]);

          this.didYouMean.set([]);

          this.totalCount.set(0);

          this.totalPages.set(1);

          this.isLoading.set(false);


          /*
           * Keep the normal page SEO even
           * when the product API fails.
           *
           * The page itself remains indexable
           * because the canonical route is still
           * the real catalog page.
           */

          this.setCatalogSeo(

            this.pageTitle(),

            this.pageSubtitle(),

            this.route.snapshot.queryParams

          );

        },

      });

  }


  /*
   * ============================================================
   * MOBILE FILTER DRAWER
   * ============================================================
   */


  openFilters(): void {

    this.filtersOpen.set(true);

  }


  closeFilters(): void {

    this.filtersOpen.set(false);

  }


  clearFilters(): void {

    this.router.navigate(
      [],

      {

        relativeTo: this.route,

        queryParams: {},

        queryParamsHandling: '',

      }
    );


    this.closeFilters();

  }

}