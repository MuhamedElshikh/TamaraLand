import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import {
  catchError,
  of
} from 'rxjs';

import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductFiltersComponent } from '../../components/product-filters/product-filters.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination';
import { BreadcrumbsComponent } from '../../../../shared/breadcrumbs.component/breadcrumbs.component';

import { CatalogService } from '../../../../core/services/catalog.service';

import {
  ProductCardResponse,
  CategoryResponse,
  ProductFilterRequest
} from '../../../../core/models/catalog.models';

import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-category-products',
  standalone: true,

  imports: [
    ProductCardComponent,
    ProductFiltersComponent,
    PaginationComponent,
    BreadcrumbsComponent,
    TranslatePipe,
    LocalizedNamePipe
  ],

  templateUrl: './category-products.page.html',
  styleUrl: './category-products.page.css',
})
export class CategoryProductsPage
  implements OnInit, OnDestroy {

  private readonly catalogService =
    inject(CatalogService);

  private readonly route =
    inject(ActivatedRoute);


  // =========================================================
  // State
  // =========================================================

  private categoryId = 0;

  private currentFilter: ProductFilterRequest = {};


  readonly products =
    signal<ProductCardResponse[]>([]);

  readonly category =
    signal<CategoryResponse | null>(null);

  readonly totalCount =
    signal(0);

  readonly pageNumber =
    signal(1);

  readonly totalPages =
    signal(1);

  readonly isLoading =
    signal(true);

  readonly notFound =
    signal(false);


  // =========================================================
  // Mobile Filters
  // =========================================================

  readonly filtersOpen =
    signal(false);


  // =========================================================
  // Lifecycle
  // =========================================================

  ngOnInit(): void {

    this.route.paramMap.subscribe((params) => {

      this.categoryId =
        Number(params.get('id'));


      if (!this.categoryId) {

        this.notFound.set(true);

        this.isLoading.set(false);

        return;
      }


      // Reset page state

      this.notFound.set(false);

      this.category.set(null);

      this.products.set([]);

      this.totalCount.set(0);

      this.pageNumber.set(1);

      this.totalPages.set(1);

      this.currentFilter = {};


      this.loadCategory();

      this.loadProducts(
        this.currentFilter,
        1
      );

    });

  }


  ngOnDestroy(): void {

    // Prevent the page from remaining
    // locked after navigating away.

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
     * filtersChanged immediately whenever a filter
     * changes.
     *
     * Therefore the products are already refreshed.
     * Apply simply closes the drawer.
     */

    this.closeFilters();

  }


  clearFilters(): void {

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

    // Every new filter starts from page 1.

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
  // Category
  // =========================================================

  private loadCategory(): void {

    this.catalogService
      .getCategoryById(this.categoryId)

      .pipe(
        catchError(() => of(null))
      )

      .subscribe((response) => {

        if (
          response?.success &&
          response.data
        ) {

          this.category.set(
            response.data
          );

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

      categoryId: this.categoryId,

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