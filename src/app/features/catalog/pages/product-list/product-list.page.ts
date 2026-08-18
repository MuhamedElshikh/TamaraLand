import {
  Component,
  computed,
  inject,
  signal,
  OnInit
} from '@angular/core';
import { UpperCasePipe } from '@angular/common';

import { ActivatedRoute , Router} from '@angular/router';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

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

const PAGE_SIZE = 12;

type SeasonKey = 'summer' | 'winter' | 'spring' | 'autumn';

interface SeasonConfig {
  key: SeasonKey;
  kicker: string;
  title: string;
  description: string;
  particles: string[];
}

@Component({
  selector: 'app-product-list',
  standalone: true,

  imports: [
    ProductCardComponent,
    ProductFiltersComponent,
    PaginationComponent,
    TranslatePipe,
    UpperCasePipe
  ],

  templateUrl: './product-list.page.html',
  styleUrl: './product-list.page.css',
})
export class ProductListPage implements OnInit {

  // =========================================================
  // SERVICES
  // =========================================================

  private readonly catalogService = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly analyticsService = inject(AnalyticsService);


  // =========================================================
  // FILTER DRAWER
  // =========================================================

  readonly filtersOpen = signal(false);

  openFilters(): void {
    this.filtersOpen.set(true);

    document.body.style.overflow = 'hidden';
  }

  closeFilters(): void {
    this.filtersOpen.set(false);

    document.body.style.overflow = '';
  }

  clearFilters(): void {
    // Reset filters logic can be added here later
    this.closeFilters();
  }

  applyFilters(): void {
    this.closeFilters();
  }


  // =========================================================
  // PRODUCTS
  // =========================================================

  readonly products = signal<ProductCardResponse[]>([]);

  readonly isLoading = signal(false);

  readonly totalCount = signal(0);

  readonly pageNumber = signal(1);

  readonly totalPages = signal(1);

readonly didYouMean = signal<string[]>([]);
readonly currentSearch = signal('');


  // =========================================================
  // PAGE CONTENT
  // =========================================================

  readonly pageTitle = signal('All Products');

  readonly pageKicker = signal('Catalog');

  readonly pageSubtitle = signal(
    'Explore curated pieces with refined filters and elegant browsing.'
  );


  // =========================================================
  // COLLECTION
  // =========================================================

  private readonly collection = signal<ProductCollection>(
    ProductCollection.None
  );


  // =========================================================
  // CURRENT FILTER
  // =========================================================

  private currentFilter: ProductFilterRequest = {};
  private readonly router = inject(Router);


  // =========================================================
  // SUMMARY
  // =========================================================

  readonly summary = computed(() => {
    const count = this.totalCount();

    return count > 0
      ? `Showing ${count} product${count === 1 ? '' : 's'}`
      : 'Showing curated pieces';
  });


  // =========================================================
  // SALE PAGE DETECTION
  // =========================================================

  readonly isSalePage = computed(() => {
    return this.collection() === ProductCollection.Offers;
  });


  // =========================================================
  // CURRENT SEASON
  // =========================================================
  month : number = new Date().getMonth() + 1;
  readonly season = computed<SeasonConfig>(() => {


  const currentMonth = this.month;

  // الموسم القادم
  if (currentMonth >= 3 && currentMonth <= 5) {
    // Current: Spring
    // Next: Summer

    return {
      key: 'summer',

      kicker: 'Something Beautiful Is Coming',

      title: 'Wait for Our Summer Offers',

      description:
        'Our summer collection of special offers is on its way. Stay tuned.',

      particles: ['✦', '·', '✧', '·'],
    };
  }

  if (currentMonth >= 6 && currentMonth <= 8) {
    // Current: Summer
    // Next: Autumn

    return {
      key: 'autumn',

      kicker: 'A New Chapter Is Coming',

      title: 'Wait for Our Autumn Offers',

      description:
        'A warmer edit is coming soon, with special offers made for the season.',

      particles: ['🍂', '·', '🍁', '·'],
    };
  }

  if (currentMonth >= 9 && currentMonth <= 11) {
    // Current: Autumn
    // Next: Winter

    return {
      key: 'winter',

      kicker: 'The Season Of Giving',

      title: 'Wait for Our Winter Offers',

      description:
        'Something special is coming. Discover our winter offers very soon.',

      particles: ['❄', '·', '❆', '·'],
    };
  }

  // Current: Winter
  // Next: Spring

  return {
    key: 'spring',

    kicker: 'A New Season Awaits',

    title: 'Wait for Our Spring Offers',

    description:
      'Fresh styles are coming soon. Stay close for something beautifully new.',

    particles: ['✿', '❀', '·', '✦'],
  };
});

  // =========================================================
  // SEASONAL PARTICLES
  // =========================================================

  readonly seasonalParticles = computed(() => {

    const particles = this.season().particles;

    return Array.from({ length: 14 }, (_, index) => ({
      id: index,

      symbol: particles[index % particles.length],

      left: Math.random() * 100,

      delay: Math.random() * 5,

      duration: 5 + Math.random() * 5,
    }));
  });


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    const data = this.route.snapshot.data;


    // -------------------------------------------------------
    // Collection
    // -------------------------------------------------------

    this.collection.set(
      data['collection'] ?? ProductCollection.None
    );


    // -------------------------------------------------------
    // Translations
    // -------------------------------------------------------

    this.translate
      .stream(data['title'])
      .subscribe(title => {
        this.pageTitle.set(title);
      });


    this.translate
      .stream(data['kicker'])
      .subscribe(kicker => {
        this.pageKicker.set(kicker);
      });


    this.translate
      .stream(data['subtitle'])
      .subscribe(subtitle => {
        this.pageSubtitle.set(subtitle);
      });


    // -------------------------------------------------------
    // Query Params
    // -------------------------------------------------------

    this.route.queryParams.subscribe(params => {

  const filter: ProductFilterRequest = {
    search: params['search'] ?? '',
    pageNumber: +(params['page'] ?? 1),
    collection: this.collection(),
  };

  this.currentFilter = filter;

  this.currentSearch.set(
    filter.search?.trim() ?? ''
  );

      // -----------------------------------------------------
      // Analytics - Search
      // -----------------------------------------------------

      if (filter.search?.trim()) {
        this.analyticsService.search(filter.search);
      }


      // -----------------------------------------------------
      // Load Products
      // -----------------------------------------------------

      this.loadProducts(
        filter,
        filter.pageNumber ?? 1
      );
    });
  }


  // =========================================================
  // FILTERS CHANGED
  // =========================================================

  onFiltersChanged(filter: ProductFilterRequest): void {

    this.currentFilter = {
      ...filter,

      collection: this.collection(),
    };


    // أي فلتر جديد يرجع لأول صفحة
    this.loadProducts(
      this.currentFilter,
      1
    );
  }


  // =========================================================
  // PAGINATION
  // =========================================================

  onPageChange(page: number): void {

    this.loadProducts(
      this.currentFilter,
      page
    );


    // ارجع لأول الليستة
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }


  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  private loadProducts(
    filter: ProductFilterRequest = {},
    pageNumber = 1
  ): void {

    this.isLoading.set(true);

    this.pageNumber.set(pageNumber);


    // -------------------------------------------------------
    // Final Filter
    // -------------------------------------------------------

    const request: ProductFilterRequest = {

      ...filter,

      collection: this.collection(),

      pageNumber,

      pageSize: PAGE_SIZE,
    };


    // -------------------------------------------------------
    // API
    // -------------------------------------------------------

    this.catalogService
      .getProducts(request)
      .subscribe({

        // ===================================================
        // SUCCESS
        // ===================================================

        next: response => {

         if (response.success && response.data) {

  this.products.set(
    response.data.items
  );

  this.didYouMean.set(
    response.data.didYouMean ?? []
  );

  // -----------------------------------------------
  // Analytics
  // -----------------------------------------------

  this.analyticsService.viewItemList(
    response.data.items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
    })),
    this.pageTitle()
  );

  // -----------------------------------------------
  // Pagination
  // -----------------------------------------------

  this.totalCount.set(
    response.data.totalCount
  );

  this.totalPages.set(
    response.data.totalPages || 1
  );
}


          this.isLoading.set(false);
        },


        // ===================================================
        // ERROR
        // ===================================================

       error: () => {

  this.isLoading.set(false);

  this.products.set([]);

  this.totalCount.set(0);

  this.totalPages.set(1);

  this.didYouMean.set([]);
},
      });
  }
  selectDidYouMean(term: string): void {
  const search = term.trim();

  if (!search) return;

  this.router.navigate(
    ['/products'],
    {
      queryParams: {
        search
      }
    }
  );
}
}