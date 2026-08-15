import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataTableComponent, DataTableColumn } from '../../components/data-table/data-table.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination';
import { AdminCatalogService } from '../../../../core/services/admin-catalog.service';
import { ProductAdminResponse } from '../../../../core/models/domain.models';
import { ProductFilterRequest, CategoryResponse, BrandResponse } from '../../../../core/models/catalog.models';
import { TranslateModule } from '@ngx-translate/core';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-admin-products-page',
  standalone: true,
  imports: [RouterLink, FormsModule, DataTableComponent, PaginationComponent, TranslateModule],
  templateUrl: './products.page.html',
  styleUrl: './products.page.css',
})
export class ProductsPage implements OnInit {
  private readonly adminCatalogService = inject(AdminCatalogService);
  private readonly router = inject(Router);

  readonly products = signal<ProductAdminResponse[]>([]);
  readonly isLoading = signal(true);
  readonly totalPages = signal(1);
  readonly pageNumber = signal(1);

  // Filters
  readonly search = signal('');
  readonly categoryId = signal<number | undefined>(undefined);
  readonly brandId = signal<number | undefined>(undefined);

  // Dropdown options
  readonly categories = signal<CategoryResponse[]>([]);
  readonly brands = signal<BrandResponse[]>([]);

  readonly isDeleting = signal<number | null>(null);
  readonly deleteError = signal<string | null>(null);

  readonly columns: DataTableColumn<ProductAdminResponse>[] = [
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
        (Array.isArray(r.images) && (r.images[0]?.imageUrl || r.images[0])) ||
        '',
    },
    { key: 'name', header: 'Product Name' },
    { key: 'categoryName', header: 'Category', accessor: (r) => r.categoryName || '—' },
    { key: 'brandName', header: 'Brand', accessor: (r) => r.brandName || '—' },
    { key: 'averageRating', header: 'Rating', align: 'center', accessor: (r) => r.averageRating ? `⭐ ${r.averageRating}` : '—' },
    {
    key: 'isPublished',
    header: 'Status',
    type: 'toggle',
    align: 'center'
  },
  ];

  ngOnInit(): void {
    this.loadFilterDropdowns();
    this.load(1);
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.load(1);
  }

  onCategoryChange(val: string): void {
    const catId = val ? Number(val) : undefined;
    this.categoryId.set(catId);
    this.load(1);
  }

  onBrandChange(val: string): void {
    const bId = val ? Number(val) : undefined;
    this.brandId.set(bId);
    this.load(1);
  }

  onPageChange(page: number): void {
    this.load(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editProduct(product: ProductAdminResponse): void {
    this.router.navigate(['/admin/product-form', product.id]);
  }

  deleteProduct(product: ProductAdminResponse): void {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    this.isDeleting.set(product.id);
    this.deleteError.set(null);

    this.adminCatalogService.deleteProduct(product.id).subscribe({
      next: (res) => {
        this.isDeleting.set(null);
        if (res.success) {
          this.load(this.pageNumber());
        } else {
          this.deleteError.set(res.message || 'Failed to delete product.');
        }
      },
      error: (err) => {
        this.isDeleting.set(null);
        this.deleteError.set(extractErrorMessage(err, 'Could not delete product.'));
      },
    });
  }

  private loadFilterDropdowns(): void {
    this.adminCatalogService.getCategories({ pageSize: 100 }).subscribe((res) => {
      if (res?.success && res.data) {
        this.categories.set(res.data.items);
      }
    });
    this.adminCatalogService.getBrands({ pageSize: 100 }).subscribe((res) => {
      if (res?.success && res.data) {
        this.brands.set(res.data.items);
      }
    });
  }

  private load(pageNumber: number): void {
    this.isLoading.set(true);
    this.pageNumber.set(pageNumber);

    const filter: ProductFilterRequest = {
      search: this.search().trim() || undefined,
      categoryId: this.categoryId(),
      brandId: this.brandId(),
      pageNumber,
      pageSize: PAGE_SIZE,
    };

    this.adminCatalogService.getProducts(filter).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.products.set(res.data.items);
          this.totalPages.set(res.data.totalPages || 1);
        } else {
          this.products.set([]);
          this.totalPages.set(1);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.isLoading.set(false);
      },
    });
  }
  onRowClick(product: ProductAdminResponse): void {
  this.editProduct(product);
}
onStatusToggle(event: {
  row: ProductAdminResponse;
  column: DataTableColumn<ProductAdminResponse>;
  value: boolean;
}): void {
  const product = event.row;

  this.adminCatalogService
    .updateProductPublishStatus(product.id, event.value)
    .subscribe({
      next: (res) => {
        if (res.success) {
          this.products.update(products =>
            products.map(item =>
              item.id === product.id
                ? {
                    ...item,
                    isPublished: event.value
                  }
                : item
            )
          );
        }
      }
    });
}

}
