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
import {
  BrandResponse,
  CategoryResponse,
  ProductFilterRequest,
} from '../../../../core/models/catalog.models';

import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe';

const SEARCH_DEBOUNCE_MS = 350;

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [
    TranslatePipe,
    LocalizedNamePipe,
  ],
  templateUrl: './product-filters.component.html',
  styleUrl: './product-filters.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFiltersComponent implements OnInit, OnDestroy {

  private readonly catalogService = inject(CatalogService);
  private readonly elRef = inject(ElementRef);

  private searchTimer?: ReturnType<typeof setTimeout>;

  // =========================================================
  // INPUTS
  // =========================================================

  @Input() hideCategoryFilter = false;
  @Input() hideBrandFilter = false;

  /**
   * لو الصفحة اللي فيها الفلتر محدودة بسقف سعر (زي صفحة "أقل من 800")
   * هيتقفل عليها أي سعر أعلى منه، والـ input بتاع الحد الأقصى هيتقيد بيه.
   */
  @Input() maxAllowedPrice: number | null = null;

  // =========================================================
  // DATA
  // =========================================================

  readonly categories = signal<CategoryResponse[]>([]);
  readonly brands = signal<BrandResponse[]>([]);

  // =========================================================
  // FILTER STATE
  // =========================================================

  readonly search = signal('');
readonly sortDescending = signal(false);
  readonly selectedCategoryId =
    signal<number | undefined>(undefined);

  readonly selectedBrandId =
    signal<number | undefined>(undefined);

  readonly minPrice =
    signal<number | undefined>(undefined);

  readonly maxPrice =
    signal<number | undefined>(undefined);

  readonly inStockOnly =
    signal(false);

  readonly sortBy =
    signal('');

  // =========================================================
  // UI STATE
  // =========================================================

  readonly openPanel =
    signal<string | null>(null);

  // =========================================================
  // COMPUTED
  // =========================================================

  readonly activeFiltersCount = computed(() => {
    let count = 0;

    if (this.search().trim()) {
      count++;
    }

    if (this.selectedCategoryId() !== undefined) {
      count++;
    }

    if (this.selectedBrandId() !== undefined) {
      count++;
    }

    if (this.minPrice() !== undefined) {
      count++;
    }

    if (this.maxPrice() !== undefined) {
      count++;
    }

    if (this.inStockOnly()) {
      count++;
    }

    return count;
  });

  readonly selectedCategory = computed(() =>
    this.categories().find(
      category =>
        category.id === this.selectedCategoryId()
    )
  );

  readonly selectedBrand = computed(() =>
    this.brands().find(
      brand =>
        brand.id === this.selectedBrandId()
    )
  );

  /**
   * الحد الأقصى اللي المفروض يظهر في الـ input بتاع السعر (attr max).
   * بنعرضه في التمبلت عشان اليوزر ميقدرش يكتب رقم أكبر من الـ cap أصلاً.
   */
  readonly priceInputMax = computed(() =>
    this.maxAllowedPrice ?? undefined
  );

  // =========================================================
  // OUTPUT
  // =========================================================

  readonly filtersChanged =
    output<ProductFilterRequest>();

  // =========================================================
  // LIFECYCLE
  // =========================================================

  ngOnInit(): void {

    if (!this.hideCategoryFilter) {
      this.loadCategories();
    }

    if (!this.hideBrandFilter) {
      this.loadBrands();
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
  }

  // =========================================================
  // OUTSIDE CLICK
  // =========================================================

  @HostListener(
    'document:click',
    ['$event']
  )
  onDocumentClick(event: MouseEvent): void {

    if (
      !this.elRef.nativeElement.contains(
        event.target
      )
    ) {
      this.openPanel.set(null);
    }
  }

  // =========================================================
  // PANELS
  // =========================================================

  togglePanel(name: string): void {

    this.openPanel.update(
      current =>
        current === name
          ? null
          : name
    );
  }

  closePanel(): void {
    this.openPanel.set(null);
  }

  // =========================================================
  // LOAD CATEGORIES
  // =========================================================

  private loadCategories(): void {

    this.catalogService
      .getCategories()
      .subscribe(res => {

        if (
          res.success &&
          res.data
        ) {
          this.categories.set(
            res.data.items
          );
        }

      });
  }

  // =========================================================
  // LOAD BRANDS
  // =========================================================

  private loadBrands(): void {

    this.catalogService
      .getBrands()
      .subscribe(res => {

        if (
          res.success &&
          res.data
        ) {
          this.brands.set(
            res.data.items
          );
        }

      });
  }

  // =========================================================
  // SEARCH
  // =========================================================

  onSearch(value: string): void {

    this.search.set(value);

    clearTimeout(
      this.searchTimer
    );

    this.searchTimer =
      setTimeout(
        () => this.applyFilters(),
        SEARCH_DEBOUNCE_MS
      );
  }

  // =========================================================
  // CATEGORY
  // =========================================================

  selectCategory(
    id: number | undefined
  ): void {

    this.selectedCategoryId.set(id);

    this.applyFilters();

    this.closePanel();
  }

  // =========================================================
  // BRAND
  // =========================================================

  selectBrand(
    id: number | undefined
  ): void {

    this.selectedBrandId.set(id);

    this.applyFilters();

    this.closePanel();
  }

  // =========================================================
  // STOCK
  // =========================================================

  toggleInStock(): void {

    this.inStockOnly.update(
      value => !value
    );

    this.applyFilters();
  }

  // =========================================================
  // SORT
  // =========================================================

 changeSort(value: string): void {
  switch (value) {

    case 'newest':
      this.sortBy.set('created');
      this.sortDescending.set(true);
      break;

    case 'priceAsc':
      this.sortBy.set('price');
      this.sortDescending.set(false);
      break;

    case 'priceDesc':
      this.sortBy.set('price');
      this.sortDescending.set(true);
      break;

    case 'discount':
      this.sortBy.set('discount');
      this.sortDescending.set(true);
      break;

    default:
      this.sortBy.set('');
      this.sortDescending.set(false);
      break;
  }

  this.applyFilters();
}

  // =========================================================
  // PRICE
  // =========================================================

  applyPriceRange(): void {

    this.applyFilters();

    this.closePanel();
  }

  setMinPrice(value: string): void {

    let parsed = value
      ? Number(value)
      : undefined;

    // امنع الحد الأدنى إنه يتخطى الـ cap لو موجود
    if (
      parsed !== undefined &&
      this.maxAllowedPrice !== null &&
      parsed > this.maxAllowedPrice
    ) {
      parsed = this.maxAllowedPrice;
    }

    this.minPrice.set(parsed);
  }

  setMaxPrice(value: string): void {

    let parsed = value
      ? Number(value)
      : undefined;

    // امنع الحد الأقصى إنه يتخطى الـ cap لو موجود
    if (
      parsed !== undefined &&
      this.maxAllowedPrice !== null &&
      parsed > this.maxAllowedPrice
    ) {
      parsed = this.maxAllowedPrice;
    }

    this.maxPrice.set(parsed);
  }

  // =========================================================
  // CLEAR
  // =========================================================

  clearFilters(): void {
  this.search.set('');

  this.selectedCategoryId.set(undefined);

  this.selectedBrandId.set(undefined);

  this.minPrice.set(undefined);

  this.maxPrice.set(undefined);

  this.inStockOnly.set(false);

  this.sortBy.set('');

  this.sortDescending.set(false);

  this.applyFilters();

  this.closePanel();
}

  // =========================================================
  // APPLY
  // =========================================================

applyFilters(): void {

  // آخر خط دفاع: أي قيمة maxPrice طالعة أعلى من الـ cap تتقفل عليه هنا
  const effectiveMaxPrice =
    this.maxAllowedPrice !== null
      ? Math.min(
          this.maxPrice() ?? this.maxAllowedPrice,
          this.maxAllowedPrice
        )
      : this.maxPrice();

  this.filtersChanged.emit({
    search:
      this.search().trim() || undefined,

    categoryId:
      this.selectedCategoryId(),

    brandId:
      this.selectedBrandId(),

    minPrice:
      this.minPrice(),

    maxPrice:
      effectiveMaxPrice,

    inStockOnly:
      this.inStockOnly()
        ? true
        : undefined,

    sortBy:
      this.sortBy() || undefined,

    desc:
      this.sortDescending(),
  });
}
}