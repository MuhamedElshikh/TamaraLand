import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTableComponent, DataTableColumn } from '../../components/data-table/data-table.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination';
import { AdminCatalogService } from '../../../../core/services/admin-catalog.service';
import { CategoryResponse, CategoryFilterRequest } from '../../../../core/models/catalog.models';
import { CreateCategoryRequest, UpdateCategoryRequest } from '../../../../core/models/domain.models';
import { TranslatePipe } from '@ngx-translate/core';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DataTableComponent, PaginationComponent,TranslatePipe],
  templateUrl: './categories.page.html',
  styleUrl: './categories.page.css',
})
export class AdminCategoriesPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminCatalogService = inject(AdminCatalogService);

  readonly categories = signal<CategoryResponse[]>([]);
  readonly isLoading = signal(true);
  readonly totalPages = signal(1);
  readonly pageIndex = signal(1);
  readonly search = signal('');

  // Form & Drawer State
  readonly showFormModal = signal(false);
  readonly isEditing = signal(false);
  readonly editingCategoryId = signal<number | null>(null);
  readonly isSubmitting = signal(false);
  readonly formError = signal<string | null>(null);

  readonly isDeletingId = signal<number | null>(null);
  readonly deleteError = signal<string | null>(null);

  // Image state
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  currentImageUrl: string | null = null;

 categoryForm: FormGroup = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(2)]],

  arabicName: ['', [Validators.required, Validators.minLength(2)]],

  description: [''],

  isPublished: [true],
});
 readonly columns: DataTableColumn<CategoryResponse>[] = [
  {
    key: 'imageUrl',
    header: 'admin.categories.columns.image',
    type: 'image',
    accessor: r => r.imageUrl || '',
  },

  {
    key: 'name',
    header: 'admin.categories.columns.englishName',
  },

  {
    key: 'arabicName',
    header: 'admin.categories.columns.arabicName',
  },

  {
  key: 'isPublished',
  header: 'Status',
  type: 'toggle',
  align: 'center'
},

  {
    key: 'description',
    header: 'admin.categories.columns.description',
    accessor: r => r.description || '—',
  },
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
    this.editingCategoryId.set(null);
    this.categoryForm.reset();
    this.formError.set(null);
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.currentImageUrl = null;
    this.showFormModal.set(true);
  }

  openEditModal(category: CategoryResponse): void {
    this.isEditing.set(true);
    this.editingCategoryId.set(category.id);
    this.categoryForm.patchValue({
  name: category.name,
  arabicName: category.arabicName,
  description: category.description || '',
  isPublished: category.isPublished,
});
    this.formError.set(null);
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.currentImageUrl = (category as any).imageUrl || null;
    this.showFormModal.set(true);
  }

  closeModal(): void {
    this.showFormModal.set(false);
    this.categoryForm.reset();
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
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);

    const formVal = this.categoryForm.value;

    if (this.isEditing() && this.editingCategoryId()) {
      const updateData: UpdateCategoryRequest = {
  name: formVal.name.trim(),
  arabicName: formVal.arabicName.trim(),
  description: formVal.description?.trim() || undefined,
  isPublished: formVal.isPublished
};

      this.adminCatalogService.updateCategory(this.editingCategoryId()!, updateData, this.selectedImageFile).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success) {
            this.closeModal();
            this.load(this.pageIndex());
          } else {
            this.formError.set(res.message || 'Failed to update category.');
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(err?.error?.message || 'Error updating category.');
        },
      });
    } else {
      const createData: CreateCategoryRequest = {
  name: formVal.name.trim(),
  arabicName: formVal.arabicName.trim(),
  description: formVal.description?.trim() || undefined,
  isPublished: formVal.isPublished
};

      this.adminCatalogService.createCategory(createData, this.selectedImageFile).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success) {
            this.closeModal();
            this.load(1);
          } else {
            this.formError.set(res.message || 'Failed to create category.');
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(err?.error?.message || 'Error creating category.');
        },
      });
    }
  }

  deleteCategory(category: CategoryResponse): void {
    if (!confirm(`Are you sure you want to delete category "${category.name}"?`)) return;

    this.isDeletingId.set(category.id);
    this.deleteError.set(null);

    this.adminCatalogService.deleteCategory(category.id).subscribe({
      next: (res) => {
        this.isDeletingId.set(null);
        if (res.success) {
          this.load(this.pageIndex());
        } else {
          this.deleteError.set(res.message || 'Failed to delete category.');
        }
      },
      error: (err) => {
        this.isDeletingId.set(null);
        this.deleteError.set(err?.error?.message || 'Error deleting category.');
      },
    });
  }

  private load(pageIndex: number): void {
    this.isLoading.set(true);
    this.pageIndex.set(pageIndex);

    const filter: CategoryFilterRequest = {
      search: this.search().trim() || undefined,
      pageIndex,
      pageSize: PAGE_SIZE,
    };

    this.adminCatalogService.getCategories(filter).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res?.success && res.data) {
          this.categories.set(res.data.items);
          this.totalPages.set(res.data.totalPages || 1);
        } else {
          this.categories.set([]);
          this.totalPages.set(1);
        }
      },
      error: () => {
        this.categories.set([]);
        this.isLoading.set(false);
      },
    });
  }
   onRowClick(categry: CategoryResponse): void {
    this.openEditModal(categry);
  }
  onStatusToggle(event: {
  row: CategoryResponse;
  column: DataTableColumn<CategoryResponse>;
  value: boolean;
}): void {
  const category = event.row;

  this.adminCatalogService
    .updatecategoryPublishStatus(category.id, event.value)
    .subscribe({
      next: (res) => {
        if (res.success) {
          this.categories.update(categories =>
            categories.map(item =>
              item.id === category.id
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