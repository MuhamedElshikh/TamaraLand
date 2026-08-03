import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTableComponent, DataTableColumn } from '../../components/data-table/data-table.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination';
import { AdminCatalogService } from '../../../../core/services/admin-catalog.service';
import { BrandResponse, BrandFilterRequest } from '../../../../core/models/catalog.models';
import { CreateBrandRequest, UpdateBrandRequest } from '../../../../core/models/domain.models';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DataTableComponent, PaginationComponent],
  templateUrl: './brands.page.html',
  styleUrl: './brands.page.css',
})
export class AdminBrandsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminCatalogService = inject(AdminCatalogService);

  readonly brands = signal<BrandResponse[]>([]);
  readonly isLoading = signal(true);
  readonly totalPages = signal(1);
  readonly pageIndex = signal(1);
  readonly search = signal('');

  // Form & Modal State
  readonly showFormModal = signal(false);
  readonly isEditing = signal(false);
  readonly editingBrandId = signal<number | null>(null);
  readonly isSubmitting = signal(false);
  readonly formError = signal<string | null>(null);

  readonly isDeletingId = signal<number | null>(null);
  readonly deleteError = signal<string | null>(null);

  // Image state
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  currentImageUrl: string | null = null;

  brandForm: FormGroup = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(2)]],

  arabicName: ['', [Validators.required, Validators.minLength(2)]],

  description: [''],

  isPublished: [true]
});

readonly columns: DataTableColumn<BrandResponse>[] = [
  {
    key: 'imageUrl',
    header: 'Logo',
    type: 'image',
    accessor: r => r.imageUrl || ''
  },

  {
    key: 'name',
    header: 'English Name'
  },

  {
    key: 'arabicName',
    header: 'Arabic Name'
  },

  {
    key: 'isPublished',
    header: 'Published',
    type: 'boolean'
  },

  {
    key: 'description',
    header: 'Description',
    accessor: r => r.description || '—'
  }
];

  ngOnInit(): void {
    this.load(1);
  }

  onSearchChange(val: string): void {
    this.search.set(val);
    this.load(1);
  }

  onPageChange(page: number): void {
    this.load(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingBrandId.set(null);
    this.brandForm.reset();
    this.formError.set(null);
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.currentImageUrl = null;
    this.showFormModal.set(true);
  }

  openEditModal(brand: BrandResponse): void {
    this.isEditing.set(true);
    this.editingBrandId.set(brand.id);
    this.brandForm.patchValue({
  name: brand.name,
  arabicName: brand.arabicName,
  description: brand.description || '',
  isPublished: brand.isPublished
});
    this.formError.set(null);
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.currentImageUrl = (brand as any).imageUrl || null;
    this.showFormModal.set(true);
  }

  closeModal(): void {
    this.showFormModal.set(false);
    this.brandForm.reset();
    this.formError.set(null);
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.currentImageUrl = null;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedImageFile);
    }
  }

  clearImage(): void {
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
  }

  onSubmit(): void {
    if (this.brandForm.invalid) {
      this.brandForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);

    const formVal = this.brandForm.value;

    if (this.isEditing() && this.editingBrandId()) {
     const updateData: UpdateBrandRequest = {
  name: formVal.name.trim(),

  arabicName: formVal.arabicName.trim(),

  description: formVal.description?.trim(),

  isPublished: formVal.isPublished
};

      this.adminCatalogService.updateBrand(this.editingBrandId()!, updateData, this.selectedImageFile).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success) {
            this.closeModal();
            this.load(this.pageIndex());
          } else {
            this.formError.set(res.message || 'Failed to update brand.');
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(err?.error?.message || 'Error updating brand.');
        },
      });
    } else {
      const createData: CreateBrandRequest = {
  name: formVal.name.trim(),

  arabicName: formVal.arabicName.trim(),

  description: formVal.description?.trim(),

  isPublished: formVal.isPublished
};

      this.adminCatalogService.createBrand(createData, this.selectedImageFile).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success) {
            this.closeModal();
            this.load(1);
          } else {
            this.formError.set(res.message || 'Failed to create brand.');
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(err?.error?.message || 'Error creating brand.');
        },
      });
    }
  }

  deleteBrand(brand: BrandResponse): void {
    if (!confirm(`Are you sure you want to delete brand "${brand.name}"?`)) return;

    this.isDeletingId.set(brand.id);
    this.deleteError.set(null);

    this.adminCatalogService.deleteBrand(brand.id).subscribe({
      next: (res) => {
        this.isDeletingId.set(null);
        if (res.success) {
          this.load(this.pageIndex());
        } else {
          this.deleteError.set(res.message || 'Failed to delete brand.');
        }
      },
      error: (err) => {
        this.isDeletingId.set(null);
        this.deleteError.set(err?.error?.message || 'Error deleting brand.');
      },
    });
  }

  private load(pageIndex: number): void {
    this.isLoading.set(true);
    this.pageIndex.set(pageIndex);

    const filter: BrandFilterRequest = {
      search: this.search().trim() || undefined,
      pageIndex,
      pageSize: PAGE_SIZE,
    };

    this.adminCatalogService.getBrands(filter).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res?.success && res.data) {
          this.brands.set(res.data.items);
          this.totalPages.set(res.data.totalPages || 1);
        } else {
          this.brands.set([]);
          this.totalPages.set(1);
        }
      },
      error: () => {
        this.brands.set([]);
        this.isLoading.set(false);
      },
    });
  }
}
