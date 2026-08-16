import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
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
  imports: [TranslatePipe, LocalizedNamePipe],
  templateUrl: './product-filters.component.html',
  styleUrl: './product-filters.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFiltersComponent implements OnInit, OnDestroy {
  private readonly catalogService = inject(CatalogService);
  private readonly elRef = inject(ElementRef);
  private searchTimer?: ReturnType<typeof setTimeout>;

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

  // ---- حالة الـ dropdown panel المفتوح حاليًا (اسم الفلتر أو null) ----
  readonly openPanel = signal<string | null>(null);

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

  readonly selectedCategory = computed(() =>
    this.categories().find((c) => c.id === this.selectedCategoryId())
  );

  readonly selectedBrand = computed(() =>
    this.brands().find((b) => b.id === this.selectedBrandId())
  );

  readonly filtersChanged = output<ProductFilterRequest>();

  ngOnInit(): void {
    if (!this.hideCategoryFilter) this.loadCategories();
    if (!this.hideBrandFilter) this.loadBrands();
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
  }

  // ---- قفل الـ panel لو المستخدم دوس بره الـ component خالص ----
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.openPanel.set(null);
    }
  }

  togglePanel(name: string): void {
    this.openPanel.update((current) => (current === name ? null : name));
  }

  closePanel(): void {
    this.openPanel.set(null);
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

  onSearch(value: string): void {
    this.search.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.applyFilters(), SEARCH_DEBOUNCE_MS);
  }

  selectCategory(id: number | undefined): void {
    this.selectedCategoryId.set(id);
    this.applyFilters();
    this.closePanel();
  }

  selectBrand(id: number | undefined): void {
    this.selectedBrandId.set(id);
    this.applyFilters();
    this.closePanel();
  }

  toggleInStock(): void {
    this.inStockOnly.update((v) => !v);
    this.applyFilters();
  }

  changeSort(value: string): void {
    this.sortBy.set(value);
    this.applyFilters();
  }

  applyPriceRange(): void {
    this.applyFilters();
    this.closePanel();
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
    this.closePanel();
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