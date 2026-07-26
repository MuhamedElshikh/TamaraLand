import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductFiltersComponent } from '../../components/product-filters/product-filters.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination';
import { BreadcrumbsComponent } from '../../../../shared/breadcrumbs.component/breadcrumbs.component';
import { CatalogService } from '../../../../core/services/catalog.service';
import { ProductCardResponse, CategoryResponse, ProductFilterRequest } from '../../../../core/models/catalog.models';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-category-products',
  standalone: true,
  imports: [ProductCardComponent, ProductFiltersComponent, PaginationComponent, BreadcrumbsComponent],
  templateUrl: './category-products.page.html',
  styleUrl: './category-products.page.css',
})
export class CategoryProductsPage implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);

  private categoryId = 0;
  private currentFilter: ProductFilterRequest = {};

  readonly products = signal<ProductCardResponse[]>([]);
  readonly category = signal<CategoryResponse | null>(null);
  readonly totalCount = signal(0);
  readonly pageIndex = signal(1);
  readonly totalPages = signal(1);
  readonly isLoading = signal(true);
  readonly notFound = signal(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.categoryId = Number(params.get('id'));

      if (!this.categoryId) {
        this.notFound.set(true);
        this.isLoading.set(false);
        return;
      }

      this.loadCategory();
      this.currentFilter = {};
      this.loadProducts(this.currentFilter, 1);
    });
  }

  onFiltersChanged(filter: ProductFilterRequest): void {
    this.currentFilter = filter;
    this.loadProducts(filter, 1);
  }

  onPageChange(page: number): void {
    this.loadProducts(this.currentFilter, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private loadCategory(): void {
    this.catalogService
      .getCategoryById(this.categoryId)
      .pipe(catchError(() => of(null)))
      .subscribe((response) => {
        if (response?.success && response.data) {
          this.category.set(response.data);
        } else {
          this.notFound.set(true);
        }
      });
  }

  private loadProducts(filter: ProductFilterRequest, pageIndex: number): void {
    this.isLoading.set(true);
    this.pageIndex.set(pageIndex);

    this.catalogService
      .getProducts({ ...filter, categoryId: this.categoryId, pageIndex, pageSize: PAGE_SIZE })
      .pipe(catchError(() => of(null)))
      .subscribe((response) => {
        if (response?.success && response.data) {
          this.products.set(response.data.items);
          this.totalCount.set(response.data.totalCount);
          this.totalPages.set(response.data.totalPages || 1);
        }
        this.isLoading.set(false);
      });
  }
}