import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTableComponent, DataTableColumn } from '../../components/data-table/data-table.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination'; // عدّل المسار
import { AdminShippingAreaService } from '../../../../core/services/AdminShippingArea.Service'; // عدّل المسار
import { ShippingAreaAdminResponse } from '../../../../core/models/domain.models';
import { extractErrorMessage } from '../../../../core/utils/error-message.util'; // عدّل المسار

const PAGE_SIZE = 15;

@Component({
  selector: 'app-admin-shipping-areas-page',
  standalone: true,
  imports: [ReactiveFormsModule, DataTableComponent, PaginationComponent],
  templateUrl: './shipping-areas.page.html',
  styleUrl: './shipping-areas.page.css',
})
export class ShippingAreasPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly shippingAreaService = inject(AdminShippingAreaService);

  readonly areas = signal<ShippingAreaAdminResponse[]>([]);
  readonly isLoading = signal(true);
  readonly totalPages = signal(1);
  readonly pageIndex = signal(1);
  readonly search = signal('');
  readonly isDeleting = signal<number | null>(null);
  readonly listError = signal<string | null>(null);

  readonly isFormOpen = signal(false);
  readonly editingArea = signal<ShippingAreaAdminResponse | null>(null);
  readonly isSubmitting = signal(false);
  readonly formError = signal<string | null>(null);

  readonly columns: DataTableColumn<ShippingAreaAdminResponse>[] = [
    { key: 'governorate', header: 'Governorate' },
    { key: 'area', header: 'Area' },
    { key: 'shippingCost', header: 'Shipping cost', type: 'currency', align: 'right' },
    { key: 'isActive', header: 'Status', type: 'badge', accessor: (r) => (r.isActive ? 'Active' : 'Inactive') },
  ];

  readonly form = this.fb.nonNullable.group({
    governorate: ['', Validators.required],
    area: ['', Validators.required],
    shippingCost: [0, [Validators.required, Validators.min(0)]],
    isActive: [true],
  });

  ngOnInit(): void {
    this.load(1);
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.load(1);
  }

  onPageChange(page: number): void {
    this.load(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openCreateForm(): void {
    this.editingArea.set(null);
    this.formError.set(null);
    this.form.reset({ governorate: '', area: '', shippingCost: 0, isActive: true });
    this.isFormOpen.set(true);
  }

  openEditForm(area: ShippingAreaAdminResponse): void {
    this.editingArea.set(area);
    this.formError.set(null);
    this.form.patchValue({
      governorate: area.governorate,
      area: area.area,
      shippingCost: area.shippingCost,
      isActive: area.isActive,
    });
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingArea.set(null);
  }

  controlHasError(name: string, error: string): boolean {
    const control = this.form.get(name);
    return Boolean(control && control.touched && control.hasError(error));
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);
    const value = this.form.getRawValue();

    const existing = this.editingArea();
    const request$ = existing
      ? this.shippingAreaService.update(existing.id, value)
      : this.shippingAreaService.create(value);

    request$.subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.closeForm();
          this.load(this.pageIndex());
        } else {
          this.formError.set(res.message);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.formError.set(extractErrorMessage(err, 'Could not save this shipping area.'));
      },
    });
  }

  deleteArea(area: ShippingAreaAdminResponse): void {
    if (!confirm(`Delete "${area.area}, ${area.governorate}"? This cannot be undone.`)) return;

    this.isDeleting.set(area.id);
    this.listError.set(null);

    this.shippingAreaService.delete(area.id).subscribe({
      next: (res) => {
        this.isDeleting.set(null);
        if (res.success) {
          this.load(this.pageIndex());
        } else {
          this.listError.set(res.message);
        }
      },
      error: (err) => {
        this.isDeleting.set(null);
        this.listError.set(extractErrorMessage(err, 'Could not delete this shipping area.'));
      },
    });
  }

  private load(pageIndex: number): void {
    this.isLoading.set(true);
    this.pageIndex.set(pageIndex);

    this.shippingAreaService
      .getAll({ search: this.search() || undefined, pageIndex, pageSize: PAGE_SIZE })
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.areas.set(res.data.items);
            this.totalPages.set(res.data.totalPages || 1);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }
}