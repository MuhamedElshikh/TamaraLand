import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { catchError, of } from 'rxjs';

import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductFiltersComponent } from '../../components/product-filters/product-filters.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination';
import { BreadcrumbsComponent } from '../../../../shared/breadcrumbs.component/breadcrumbs.component';

import { CatalogService } from '../../../../core/services/catalog.service';

import {
  ProductCardResponse,
  BrandResponse,
  ProductFilterRequest
} from '../../../../core/models/catalog.models';

import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe';
import { TranslatePipe } from '@ngx-translate/core';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-brand-products',
  standalone: true,

  imports: [
    ProductCardComponent,
    ProductFiltersComponent,
    PaginationComponent,
    BreadcrumbsComponent,
    TranslatePipe,
    LocalizedNamePipe
  ],

  templateUrl: './brand-products.page.html',
  styleUrl: './brand-products.page.css',
})
export class BrandProductsPage implements OnInit, OnDestroy {

  // =========================================================
  // Services
  // =========================================================

  private readonly catalogService = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);


  // =========================================================
  // Page State
  // =========================================================

  private brandId = 0;

  private currentFilter: ProductFilterRequest = {};


  readonly products = signal<ProductCardResponse[]>([]);

  readonly brand = signal<BrandResponse | null>(null);

  readonly totalCount = signal(0);

  readonly pageNumber = signal(1);

  readonly totalPages = signal(1);

  readonly isLoading = signal(true);

  readonly notFound = signal(false);


  // =========================================================
  // Mobile Filters
  // =========================================================

  readonly filtersOpen = signal(false);


  // =========================================================
  // Lifecycle
  // =========================================================

  ngOnInit(): void {

    this.route.paramMap.subscribe((params) => {

      this.brandId = Number(params.get('id'));

      if (!this.brandId) {

        this.notFound.set(true);
        this.isLoading.set(false);

        return;
      }


      // Reset page state when navigating
      // between different brands.

      this.notFound.set(false);

      this.brand.set(null);

      this.products.set([]);

      this.totalCount.set(0);

      this.totalPages.set(1);

      this.pageNumber.set(1);


      this.currentFilter = {};


      // Load brand information
      this.loadBrand();


      // Load brand products
      this.loadProducts(
        this.currentFilter,
        1
      );

    });

  }


  ngOnDestroy(): void {

    // Make sure the page doesn't remain
    // locked if the component is destroyed
    // while the drawer is open.

    document.body.style.overflow = '';

  }


  // =========================================================
  // Mobile Filter Drawer
  // =========================================================

  openFilters(): void {

    this.filtersOpen.set(true);

    document.body.style.overflow = 'hidden';

  }


  closeFilters(): void {

    this.filtersOpen.set(false);

    document.body.style.overflow = '';

  }


  applyFilters(): void {

    /*
     * ProductFiltersComponent currently emits
     * filtersChanged immediately when the filter changes.
     *
     * Therefore the API request has already happened
     * by the time the user presses "Show Results".
     *
     * For now Apply only closes the drawer.
     */

    this.closeFilters();

  }


  clearFilters(): void {

    /*
     * Keep the current behavior for now.
     *
     * The actual reset should ideally be handled
     * by ProductFiltersComponent so its internal UI
     * state is reset as well.
     */

    this.currentFilter = {};

    this.loadProducts(
      {},
      1
    );

    this.closeFilters();

  }


  // =========================================================
  // Filters
  // =========================================================

  onFiltersChanged(
    filter: ProductFilterRequest
  ): void {

    this.currentFilter = {
      ...filter
    };

    /*
     * Any new filter starts from page 1.
     */

    this.loadProducts(
      this.currentFilter,
      1
    );

  }


  // =========================================================
  // Pagination
  // =========================================================

  onPageChange(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages() ||
      page === this.pageNumber()
    ) {
      return;
    }


    this.loadProducts(
      this.currentFilter,
      page
    );


    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }


  // =========================================================
  // Brand
  // =========================================================

  private loadBrand(): void {

    this.catalogService
      .getBrandById(this.brandId)

      .pipe(
        catchError(() => of(null))
      )

      .subscribe((response) => {

        if (
          response?.success &&
          response.data
        ) {

          this.brand.set(response.data);

          return;
        }


        this.notFound.set(true);

      });

  }


  // =========================================================
  // Products
  // =========================================================

  private loadProducts(
    filter: ProductFilterRequest = {},
    pageNumber = 1
  ): void {

    this.isLoading.set(true);

    this.pageNumber.set(pageNumber);


    const request: ProductFilterRequest = {
      ...filter,

      brandId: this.brandId,

      pageNumber,

      pageSize: PAGE_SIZE
    };


    this.catalogService
      .getProducts(request)

      .pipe(
        catchError(() => of(null))
      )

      .subscribe((response) => {

        if (
          response?.success &&
          response.data
        ) {

          this.products.set(
            response.data.items
          );

          this.totalCount.set(
            response.data.totalCount
          );

          this.totalPages.set(
            response.data.totalPages || 1
          );

        } else {

          this.products.set([]);

          this.totalCount.set(0);

          this.totalPages.set(1);

        }


        this.isLoading.set(false);

      });

  }

}