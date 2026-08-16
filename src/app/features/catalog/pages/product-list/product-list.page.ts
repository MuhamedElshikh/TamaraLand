import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductFiltersComponent } from '../../components/product-filters/product-filters.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination'; // عدّل المسار حسب مكانه عندك
import { CatalogService } from '../../../../core/services/catalog.service';
import { ProductCardResponse, ProductFilterRequest,ProductCollection } from '../../../../core/models/catalog.models';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { AnalyticsService } from '../../../../core/services/analytics.service';
const PAGE_SIZE = 12;

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ProductCardComponent, ProductFiltersComponent, PaginationComponent,TranslatePipe],
  templateUrl: './product-list.page.html',
  styleUrl: './product-list.page.css',
})
export class ProductListPage implements OnInit {
  private readonly catalogService = inject(CatalogService);
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




applyFilters(): void {
  this.closeFilters();
}


  private currentFilter: ProductFilterRequest = {};
  private readonly route = inject(ActivatedRoute);
private readonly translate = inject(TranslateService);
private readonly AnalyticsService = inject(AnalyticsService);
  readonly products = signal<ProductCardResponse[]>([]);
  readonly isLoading = signal(false);
  readonly totalCount = signal(0);
  readonly pageNumber = signal(1);
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

 this.translate.stream(data['title']).subscribe(title => {
  this.pageTitle.set(title);
});

this.translate.stream(data['kicker']).subscribe(kicker => {
  this.pageKicker.set(kicker);
});

this.translate.stream(data['subtitle']).subscribe(subtitle => {
  this.pageSubtitle.set(subtitle);
});

  this.collection = data['collection'] ?? ProductCollection.None;

  this.route.queryParams.subscribe(params => {

    const filter: ProductFilterRequest = {

      search: params['search'] ?? '',
      pageNumber: +(params['page'] ?? 1),
      collection: this.collection

    };

    this.currentFilter = filter;
if (filter.search?.trim()) {
  this.AnalyticsService.search(filter.search);
}
    this.loadProducts(filter, filter.pageNumber);

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

  private loadProducts(filter: ProductFilterRequest = {}, pageNumber = 1): void {
    this.isLoading.set(true);
    this.pageNumber.set(pageNumber);

    this.catalogService.getProducts({ ...filter, pageNumber, pageSize: PAGE_SIZE }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.products.set(response.data.items);
          this.AnalyticsService.viewItemList(
  response.data.items.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
  })),
  this.pageTitle()
);
          this.totalCount.set(response.data.totalCount);
          this.totalPages.set(response.data.totalPages || 1);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}