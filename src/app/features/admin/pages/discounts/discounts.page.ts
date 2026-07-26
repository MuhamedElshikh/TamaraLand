import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTableComponent, DataTableColumn } from '../../components/data-table/data-table.component';
import { AdminDiscountService } from '../../../../core/services/admin-discount.service'; // عدّل المسار
import { CatalogService } from '../../../../core/services/catalog.service';
import { DiscountResponse } from '../../../../core/models/domain.models';
import { extractErrorMessage } from '../../../../core/utils/error-message.util'; // عدّل المسار

const DISCOUNT_TYPE_LABELS: Record<number, string> = { 0: 'Percentage', 1: 'Fixed amount' };
const TARGET_LABELS: Record<number, string> = { 0: 'Product', 1: 'Category', 2: 'Brand' };

interface DiscountRow extends DiscountResponse {
  targetName: string;
}

@Component({
  selector: 'app-admin-discounts-page',
  standalone: true,
  imports: [ReactiveFormsModule, DataTableComponent],
  templateUrl: './discounts.page.html',
  styleUrl: './discounts.page.css',
})
export class DiscountsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly discountService = inject(AdminDiscountService);
  private readonly catalogService = inject(CatalogService);

  readonly discounts = signal<DiscountResponse[]>([]);
  readonly isLoading = signal(true);
  readonly listError = signal<string | null>(null);
  readonly isDeleting = signal<number | null>(null);

  readonly isFormOpen = signal(false);
  readonly editingDiscount = signal<DiscountResponse | null>(null);
  readonly isSubmitting = signal(false);
  readonly formError = signal<string | null>(null);

  readonly discountTypeLabels = DISCOUNT_TYPE_LABELS;
  readonly targetLabels = TARGET_LABELS;

  // بنجيب المنتجات/الفئات/البراندات عشان نعرض اسم الهدف في الليستة، ونملأ dropdown الفورم
  readonly products = signal<{ id: number; name: string }[]>([]);
  readonly categories = signal<{ id: number; name: string }[]>([]);
  readonly brands = signal<{ id: number; name: string }[]>([]);

  readonly targetOptions = computed(() => {
    const targetType = this.form.get('target')?.value;
    if (targetType === 0) return this.products();
    if (targetType === 1) return this.categories();
    if (targetType === 2) return this.brands();
    return [];
  });

  readonly rows = computed<DiscountRow[]>(() => {
    return this.discounts().map((d) => ({ ...d, targetName: this.resolveTargetName(d) }));
  });

  readonly columns: DataTableColumn<DiscountRow>[] = [
    { key: 'name', header: 'Name' },
    { key: 'discountType', header: 'Type', accessor: (r) => this.discountTypeLabels[r.discountType] ?? '—' },
    {
      key: 'discountValue',
      header: 'Value',
      align: 'right',
      accessor: (r) => (r.discountType === 0 ? `${r.discountValue}%` : `${r.discountValue} EGP`),
    },
    { key: 'target', header: 'Applies to', accessor: (r) => `${this.targetLabels[r.target]}: ${r.targetName}` },
    { key: 'priority', header: 'Priority', align: 'right' },
    { key: 'endDate', header: 'Ends', type: 'date' },
    { key: 'isActive', header: 'Status', type: 'badge', accessor: (r) => (r.isActive ? 'Active' : 'Inactive') },
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    discountType: [0, Validators.required],
    discountValue: [0, [Validators.required, Validators.min(0.01)]],
    maximumDiscount: [0, [Validators.min(0)]],
    target: [0, Validators.required],
    targetId: [0, Validators.required],
    priority: [0, [Validators.min(0)]],
    isActive: [true],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });

  ngOnInit(): void {
    this.catalogService.getProducts({ pageSize: 200 }).subscribe((res) => {
      if (res.success && res.data) this.products.set(res.data.items.map((p) => ({ id: p.id, name: p.name })));
    });
    this.catalogService.getCategories({ pageSize: 200 }).subscribe((res) => {
      if (res.success && res.data) this.categories.set(res.data.items.map((c) => ({ id: c.id, name: c.name })));
    });
    this.catalogService.getBrands({ pageSize: 200 }).subscribe((res) => {
      if (res.success && res.data) this.brands.set(res.data.items.map((b) => ({ id: b.id, name: b.name })));
    });

    // لما نغيّر نوع الهدف، نصفّر الـ targetId عشان مايفضلش رقم من نوع تاني
    this.form.get('target')?.valueChanges.subscribe(() => {
      this.form.get('targetId')?.setValue(0);
    });

    this.load();
  }

  private resolveTargetName(d: DiscountResponse): string {
    const list = d.target === 0 ? this.products() : d.target === 1 ? this.categories() : this.brands();
    return list.find((x) => x.id === d.targetId)?.name ?? `#${d.targetId}`;
  }

  openCreateForm(): void {
    this.editingDiscount.set(null);
    this.formError.set(null);
    this.form.reset({
      name: '',
      discountType: 0,
      discountValue: 0,
      maximumDiscount: 0,
      target: 0,
      targetId: 0,
      priority: 0,
      isActive: true,
      startDate: '',
      endDate: '',
    });
    this.isFormOpen.set(true);
  }

  openEditForm(discount: DiscountResponse): void {
    this.editingDiscount.set(discount);
    this.formError.set(null);
    this.form.patchValue({
      name: discount.name,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      maximumDiscount: discount.maximumDiscount,
      target: discount.target,
      targetId: discount.targetId,
      priority: discount.priority,
      isActive: discount.isActive,
      startDate: discount.startDate?.substring(0, 10),
      endDate: discount.endDate?.substring(0, 10),
    });
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingDiscount.set(null);
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
    const payload = {
      ...value,
      startDate: new Date(value.startDate).toISOString(),
      endDate: new Date(value.endDate).toISOString(),
    };

    const existing = this.editingDiscount();
    const request$ = existing
      ? this.discountService.update(existing.id, payload)
      : this.discountService.create(payload);

    request$.subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.closeForm();
          this.load();
        } else {
          this.formError.set(res.message);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.formError.set(extractErrorMessage(err, 'Could not save this discount.'));
      },
    });
  }

  deleteDiscount(discount: DiscountResponse): void {
    if (!confirm(`Delete discount "${discount.name}"? This cannot be undone.`)) return;

    this.isDeleting.set(discount.id);
    this.listError.set(null);

    this.discountService.delete(discount.id).subscribe({
      next: (res) => {
        this.isDeleting.set(null);
        if (res.success) {
          this.load();
        } else {
          this.listError.set(res.message);
        }
      },
      error: (err) => {
        this.isDeleting.set(null);
        this.listError.set(extractErrorMessage(err, 'Could not delete this discount.'));
      },
    });
  }

  private load(): void {
    this.isLoading.set(true);
    this.discountService.getAll().subscribe({
      next: (res) => {
        if (res.success && res.data) this.discounts.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}