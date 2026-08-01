import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  output,
} from '@angular/core';

import { CatalogService } from '../../../../core/services/catalog.service';
import { BrandResponse, CategoryResponse, ProductFilterRequest } from '../../../../core/models/catalog.models';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe';

const SEARCH_DEBOUNCE_MS = 350;

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [TranslatePipe,LocalizedNamePipe],
  templateUrl: './product-filters.component.html',
  styleUrl: './product-filters.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFiltersComponent implements OnInit, OnDestroy {
  private readonly catalogService = inject(CatalogService);
  private searchTimer?: ReturnType<typeof setTimeout>;

  /** استخدمهم في صفحات الفئة/البراند عشان تخفي الفلتر المتكرر مع الـ route نفسه */
  @Input() hideCategoryFilter = false;
  @Input() hideBrandFilter = false;

  readonly categories = signal<CategoryResponse[]>([]);
  readonly brands = signal<BrandResponse[]>([]);

  readonly search = signal('');
  readonly selectedCategoryId = signal<number | undefined>(undefined);
  readonly selectedBrandId = signal<number | undefined>(undefined);
  readonly minPrice = signal<number | undefined>(undefined);
  readonly maxPrice = signal<number | undefined>(undefined);
  readonly inStockOnly = signal(false);
  readonly sortBy = signal('');

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.search()) count++;
    if (this.selectedCategoryId() !== undefined) count++;
    if (this.selectedBrandId() !== undefined) count++;
    if (this.minPrice() !== undefined) count++;
    if (this.maxPrice() !== undefined) count++;
    if (this.inStockOnly()) count++;
    if (this.sortBy()) count++;
    return count;
  });

  readonly filtersChanged = output<ProductFilterRequest>();

  ngOnInit(): void {
    if (!this.hideCategoryFilter) this.loadCategories();
    if (!this.hideBrandFilter) this.loadBrands();
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
  }

  private loadCategories(): void {
    this.catalogService.getCategories().subscribe((res) => {
      if (res.success && res.data) this.categories.set(res.data.items);
    });
  }

  private loadBrands(): void {
    this.catalogService.getBrands().subscribe((res) => {
      if (res.success && res.data) this.brands.set(res.data.items);
    });
  }

  // ---- البحث بيتأخر شوية (debounce) عشان مش نضرب الـ API مع كل حرف ----
  onSearch(value: string): void {
    this.search.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.applyFilters(), SEARCH_DEBOUNCE_MS);
  }

  // ---- دول بيطبّقوا فورًا (auto-apply)، مفيش داعي للمستخدم يدوس زرار ----
  selectCategory(id: number | undefined): void {
    this.selectedCategoryId.set(id);
    this.applyFilters();
  }

  selectBrand(id: number | undefined): void {
    this.selectedBrandId.set(id);
    this.applyFilters();
  }

  toggleInStock(): void {
    this.inStockOnly.update((v) => !v);
    this.applyFilters();
  }

  changeSort(value: string): void {
    this.sortBy.set(value);
    this.applyFilters();
  }

  // ---- السعر بس محتاج تأكيد صريح (زرار Apply) عشان منضربش API مع كل رقم ----
  applyPriceRange(): void {
    this.applyFilters();
  }

  setMinPrice(value: string): void {
    this.minPrice.set(value ? Number(value) : undefined);
  }

  setMaxPrice(value: string): void {
    this.maxPrice.set(value ? Number(value) : undefined);
  }

  clearFilters(): void {
    this.search.set('');
    this.selectedCategoryId.set(undefined);
    this.selectedBrandId.set(undefined);
    this.minPrice.set(undefined);
    this.maxPrice.set(undefined);
    this.inStockOnly.set(false);
    this.sortBy.set('');
    this.applyFilters();
  }

  applyFilters(): void {
    this.filtersChanged.emit({
      search: this.search() || undefined,
      categoryId: this.selectedCategoryId(),
      brandId: this.selectedBrandId(),
      minPrice: this.minPrice(),
      maxPrice: this.maxPrice(),
      sortBy: this.sortBy() || undefined,
    });
  }
}