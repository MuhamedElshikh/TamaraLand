import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductFiltersComponent } from '../../components/product-filters/product-filters.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination';
import { BreadcrumbsComponent } from '../../../../shared/breadcrumbs.component/breadcrumbs.component';
import { CatalogService } from '../../../../core/services/catalog.service';
import { ProductCardResponse, BrandResponse, ProductFilterRequest } from '../../../../core/models/catalog.models';
import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe';
import { TranslatePipe } from '@ngx-translate/core';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-brand-products',
  standalone: true,
  imports: [ProductCardComponent, ProductFiltersComponent, PaginationComponent, BreadcrumbsComponent,TranslatePipe,LocalizedNamePipe],
  templateUrl: './brand-products.page.html',
  styleUrl: './brand-products.page.css',
})
export class BrandProductsPage implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);

  private brandId = 0;
  private currentFilter: ProductFilterRequest = {};

  readonly products = signal<ProductCardResponse[]>([]);
  readonly brand = signal<BrandResponse | null>(null);
  readonly totalCount = signal(0);
  readonly pageNumber = signal(1);
  readonly totalPages = signal(1);
  readonly isLoading = signal(true);
  readonly notFound = signal(false);
filtersOpen = signal(false);

openFilters() {
  this.filtersOpen.set(true);
  document.body.style.overflow = 'hidden';
}

closeFilters() {
  this.filtersOpen.set(false);
  document.body.style.overflow = '';
}

clearFilters() {
  // reset your filters
  this.closeFilters();
}
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.brandId = Number(params.get('id'));

      if (!this.brandId) {
        this.notFound.set(true);
        this.isLoading.set(false);
        return;
      }

      this.loadBrand();
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

  private loadBrand(): void {
    this.catalogService
      .getBrandById(this.brandId)
      .pipe(catchError(() => of(null)))
      .subscribe((response) => {
        if (response?.success && response.data) {
          this.brand.set(response.data);
        } else {
          this.notFound.set(true);
        }
      });
  }

  private loadProducts(filter: ProductFilterRequest, pageNumber: number): void {
    this.isLoading.set(true);
    this.pageNumber.set(pageNumber);

    this.catalogService
      .getProducts({ ...filter, brandId: this.brandId, pageNumber, pageSize: PAGE_SIZE })
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