import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductFiltersComponent } from '../../components/product-filters/product-filters.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination'; // عدّل المسار حسب مكانه عندك
import { CatalogService } from '../../../../core/services/catalog.service';
import { ProductCardResponse, ProductFilterRequest,ProductCollection } from '../../../../core/models/catalog.models';
import { ActivatedRoute } from '@angular/router';
const PAGE_SIZE = 12;

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ProductCardComponent, ProductFiltersComponent, PaginationComponent],
  templateUrl: './product-list.page.html',
  styleUrl: './product-list.page.css',
})
export class ProductListPage implements OnInit {
  private readonly catalogService = inject(CatalogService);

  private currentFilter: ProductFilterRequest = {};
  private readonly route = inject(ActivatedRoute);

  readonly products = signal<ProductCardResponse[]>([]);
  readonly isLoading = signal(false);
  readonly totalCount = signal(0);
  readonly pageIndex = signal(1);
  readonly totalPages = signal(1);
readonly pageTitle = signal('All Products');
readonly pageKicker = signal('Catalog');
readonly pageSubtitle = signal(
  'Explore curated pieces with refined filters and elegant browsing.'
);

private collection: ProductCollection = ProductCollection.None;
  readonly summary = computed(() => {
    const count = this.totalCount();
    return count > 0 ? `Showing ${count} product${count === 1 ? '' : 's'}` : 'Showing curated pieces';
  });

  ngOnInit(): void {

  const data = this.route.snapshot.data;

  this.pageTitle.set(data['title'] ?? 'All Products');
  this.pageKicker.set(data['kicker'] ?? 'Catalog');
  this.pageSubtitle.set(
    data['subtitle'] ??
      'Explore curated pieces with refined filters and elegant browsing.'
  );

  this.collection = data['collection'] ?? ProductCollection.None;

  this.route.queryParams.subscribe(params => {

    const filter: ProductFilterRequest = {

      search: params['search'] ?? '',
      pageIndex: +(params['page'] ?? 1),
      collection: this.collection

    };

    this.currentFilter = filter;

    this.loadProducts(filter, filter.pageIndex);

  });

}

  onFiltersChanged(filter: ProductFilterRequest): void {
    this.currentFilter = filter;
    this.loadProducts(filter, 1); // أي فلتر جديد يرجّعنا لأول صفحة
  }

  onPageChange(page: number): void {
    this.loadProducts(this.currentFilter, page);
    // ارجع لأول الليستة عشان المستخدم مايفضلش تحت من غير ما يلاحظ إن الصفحة اتغيرت
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private loadProducts(filter: ProductFilterRequest = {}, pageIndex = 1): void {
    this.isLoading.set(true);
    this.pageIndex.set(pageIndex);

    this.catalogService.getProducts({ ...filter, pageIndex, pageSize: PAGE_SIZE }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.products.set(response.data.items);
          this.totalCount.set(response.data.totalCount);
          this.totalPages.set(response.data.totalPages || 1);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}