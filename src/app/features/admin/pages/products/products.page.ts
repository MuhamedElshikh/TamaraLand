import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  DataTableComponent,
  DataTableColumn
} from '../../components/data-table/data-table.component';

import { PaginationComponent } from '../../../../shared/pagination/pagination';

import { AdminCatalogService } from '../../../../core/services/admin-catalog.service';

import { ProductAdminResponse } from '../../../../core/models/domain.models';

import {
  ProductFilterRequest,
  CategoryResponse,
  BrandResponse
} from '../../../../core/models/catalog.models';

import { TranslateModule } from '@ngx-translate/core';

import { extractErrorMessage } from '../../../../core/utils/error-message.util';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-admin-products-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    DataTableComponent,
    PaginationComponent,
    TranslateModule
  ],
  templateUrl: './products.page.html',
  styleUrl: './products.page.css',
})
export class ProductsPage implements OnInit {
  private readonly adminCatalogService =
    inject(AdminCatalogService);

  private readonly router =
    inject(Router);

  // =========================================================
  // FILTERS
  // =========================================================

  /**
   * Product active state.
   *
   * undefined = Active products (default)
   * true      = Active only
   * false     = Soft Deleted only
   */
  readonly isActive =
    signal<boolean | undefined>(undefined);

  /**
   * Product publishing state.
   *
   * undefined = All
   * true      = Published
   * false     = Unpublished
   */
  readonly isPublished =
    signal<boolean | undefined>(undefined);

  /**
   * Discount state.
   *
   * undefined = All
   * true      = Discounted
   * false     = Not discounted
   */
  readonly hasDiscount =
    signal<boolean | undefined>(undefined);

  /**
   * Featured state.
   *
   * undefined = All
   * true      = Featured
   * false     = Not featured
   */
  readonly isFeatured =
    signal<boolean | undefined>(undefined);

  /**
   * Stock filter.
   *
   * undefined = All
   * true      = In Stock only
   */
  readonly inStockOnly =
    signal<boolean | undefined>(undefined);

  // =========================================================
  // PRODUCTS
  // =========================================================

  readonly products =
    signal<ProductAdminResponse[]>([]);

  readonly isLoading =
    signal(true);

  readonly totalPages =
    signal(1);

  readonly pageNumber =
    signal(1);

  // =========================================================
  // OTHER FILTERS
  // =========================================================

  readonly search =
    signal('');

  readonly categoryId =
    signal<number | undefined>(undefined);

  readonly brandId =
    signal<number | undefined>(undefined);

  // =========================================================
  // DROPDOWN OPTIONS
  // =========================================================

  readonly categories =
    signal<CategoryResponse[]>([]);

  readonly brands =
    signal<BrandResponse[]>([]);

  // =========================================================
  // DELETE
  // =========================================================

  readonly isDeleting =
    signal<number | null>(null);

  readonly deleteError =
    signal<string | null>(null);

  // =========================================================
  // TABLE
  // =========================================================

  readonly columns:
    DataTableColumn<ProductAdminResponse>[] = [

    {
      key: 'mainImageUrl',
      header: 'Image',
      type: 'image',

      accessor: (r: any) =>
        r.imageUrl ||
        r.mainImageUrl ||
        r.image ||
        r.pictureUrl ||
        r.coverImage ||
        (
          Array.isArray(r.images) &&
          (
            r.images[0]?.imageUrl ||
            r.images[0]
          )
        ) ||
        '',
    },

    {
      key: 'name',
      header: 'Product Name'
    },

    {
      key: 'categoryName',
      header: 'Category',

      accessor: (r) =>
        r.categoryName || '—'
    },

    {
      key: 'brandName',
      header: 'Brand',

      accessor: (r) =>
        r.brandName || '—'
    },

    {
      key: 'averageRating',
      header: 'Rating',
      align: 'center',

      accessor: (r) =>
        r.averageRating
          ? `⭐ ${r.averageRating}`
          : '—'
    },

    {
      key: 'isPublished',
      header: 'Status',
      type: 'toggle',
      align: 'center'
    },

    {
      key: 'isFeatured',
      header: 'Featured',
      type: 'toggle',
      align: 'center'
    },
  ];

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.loadFilterDropdowns();

    this.load(1);
  }

  // =========================================================
  // SEARCH
  // =========================================================

  onSearchChange(
    value: string
  ): void {
    this.search.set(value);

    this.load(1);
  }

  // =========================================================
  // CATEGORY
  // =========================================================

  onCategoryChange(
    value: number | undefined
  ): void {
    this.categoryId.set(value);

    this.load(1);
  }

  // =========================================================
  // BRAND
  // =========================================================

  onBrandChange(
    value: number | undefined
  ): void {
    this.brandId.set(value);

    this.load(1);
  }

  // =========================================================
  // ACTIVE / SOFT DELETE
  // =========================================================

  onActiveChange(
    value: boolean | undefined
  ): void {
    this.isActive.set(value);

    this.load(1);
  }

  // =========================================================
  // PUBLISHED
  // =========================================================

  onPublishedChange(
    value: boolean | undefined
  ): void {
    this.isPublished.set(value);

    this.load(1);
  }

  // =========================================================
  // DISCOUNT
  // =========================================================

  onDiscountChange(
    value: boolean | undefined
  ): void {
    this.hasDiscount.set(value);

    this.load(1);
  }

  // =========================================================
  // FEATURED
  // =========================================================

  onFeaturedChange(
    value: boolean | undefined
  ): void {
    this.isFeatured.set(value);

    this.load(1);
  }

  // =========================================================
  // STOCK
  // =========================================================

  onStockChange(
    value: boolean | undefined
  ): void {
    this.inStockOnly.set(value);

    this.load(1);
  }

  // =========================================================
  // PAGINATION
  // =========================================================

  onPageChange(
    page: number
  ): void {
    this.load(page);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // =========================================================
  // EDIT
  // =========================================================

  editProduct(
    product: ProductAdminResponse
  ): void {
    this.router.navigate([
      '/admin/product-form',
      product.id
    ]);
  }

  // =========================================================
  // DELETE
  // =========================================================

  deleteProduct(
    product: ProductAdminResponse
  ): void {

    if (
      !confirm(
        `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    this.isDeleting.set(product.id);

    this.deleteError.set(null);

    this.adminCatalogService
      .deleteProduct(product.id)
      .subscribe({

        next: (res) => {

          this.isDeleting.set(null);

          if (res.success) {

            this.load(
              this.pageNumber()
            );

          } else {

            this.deleteError.set(
              res.message ||
              'Failed to delete product.'
            );
          }
        },

        error: (err) => {

          this.isDeleting.set(null);

          this.deleteError.set(
            extractErrorMessage(
              err,
              'Could not delete product.'
            )
          );
        },
      });
  }

  // =========================================================
  // DROPDOWNS
  // =========================================================

  private loadFilterDropdowns(): void {

    this.adminCatalogService
      .getCategories({
        pageSize: 100
      })
      .subscribe((res) => {

        if (
          res?.success &&
          res.data
        ) {
          this.categories.set(
            res.data.items
          );
        }
      });

    this.adminCatalogService
      .getBrands({
        pageSize: 100
      })
      .subscribe((res) => {

        if (
          res?.success &&
          res.data
        ) {
          this.brands.set(
            res.data.items
          );
        }
      });
  }

  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  private load(
    pageNumber: number
  ): void {

    this.isLoading.set(true);

    this.pageNumber.set(
      pageNumber
    );

    const filter:
      ProductFilterRequest = {

      search:
        this.search().trim() ||
        undefined,

      categoryId:
        this.categoryId(),

      brandId:
        this.brandId(),

      // -----------------------------------------------------
      // Product status / Soft Delete
      //
      // undefined = default Active
      // true      = Active
      // false     = Soft Deleted
      // -----------------------------------------------------

      isActive:
        this.isActive(),

      // -----------------------------------------------------
      // Publishing status
      // -----------------------------------------------------

      isPublished:
        this.isPublished(),

      // -----------------------------------------------------
      // Active discount
      // -----------------------------------------------------

      hasDiscount:
        this.hasDiscount(),

      // -----------------------------------------------------
      // Featured
      // -----------------------------------------------------

      isFeatured:
        this.isFeatured(),

      // -----------------------------------------------------
      // Stock
      // -----------------------------------------------------

      inStockOnly:
        this.inStockOnly(),

      pageNumber,

      pageSize:
        PAGE_SIZE,
    };

    this.adminCatalogService
      .getProducts(filter)
      .subscribe({

        next: (res) => {

          if (
            res?.success &&
            res.data
          ) {

            this.products.set(
              res.data.items
            );

            this.totalPages.set(
              res.data.totalPages || 1
            );

          } else {

            this.products.set([]);

            this.totalPages.set(1);
          }

          this.isLoading.set(false);
        },

        error: () => {

          this.products.set([]);

          this.totalPages.set(1);

          this.isLoading.set(false);
        },
      });
  }

  // =========================================================
  // ROW CLICK
  // =========================================================

  onRowClick(
    product: ProductAdminResponse
  ): void {
    this.editProduct(product);
  }

  // =========================================================
  // TABLE TOGGLES
  // =========================================================

  onStatusToggle(
    event: {
      row: ProductAdminResponse;
      column: DataTableColumn<ProductAdminResponse>;
      value: boolean;
    }
  ): void {

    const product =
      event.row;

    if (
      event.column.key ===
      'isPublished'
    ) {
      this.updatePublishStatus(
        product,
        event.value
      );

      return;
    }

    if (
      event.column.key ===
      'isFeatured'
    ) {
      this.updateFeaturedStatus(
        product,
        event.value
      );

      return;
    }
  }

  // =========================================================
  // UPDATE PUBLISH STATUS
  // =========================================================

  private updatePublishStatus(
    product: ProductAdminResponse,
    isPublished: boolean
  ): void {

    this.adminCatalogService
      .updateProductPublishStatus(
        product.id,
        isPublished
      )
      .subscribe({

        next: (res) => {

          if (res.success) {

            this.products.update(
              (products) =>
                products.map(
                  (item) =>
                    item.id === product.id
                      ? {
                          ...item,
                          isPublished
                        }
                      : item
                )
            );
          }
        }
      });
  }

  // =========================================================
  // UPDATE FEATURED STATUS
  // =========================================================

  private updateFeaturedStatus(
    product: ProductAdminResponse,
    isFeatured: boolean
  ): void {

    this.adminCatalogService
      .updateProductFeaturedStatus(
        product.id,
        isFeatured
      )
      .subscribe({

        next: (res) => {

          if (res.success) {

            this.products.update(
              (products) =>
                products.map(
                  (item) =>
                    item.id === product.id
                      ? {
                          ...item,
                          isFeatured
                        }
                      : item
                )
            );
          }
        }
      });
  }
}