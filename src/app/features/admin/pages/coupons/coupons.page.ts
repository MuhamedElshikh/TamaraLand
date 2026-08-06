import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTableComponent, DataTableColumn } from '../../components/data-table/data-table.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination'; // عدّل المسار
import { AdminCouponService } from '../../../../core/services/admin-coupon.service'; // عدّل المسار
import { CouponResponse, CreateCouponRequest } from '../../../../core/models/domain.models';
import { extractErrorMessage } from '../../../../core/utils/error-message.util'; // عدّل المسار

const PAGE_SIZE = 15;
const DISCOUNT_TYPE_LABELS: Record<number, string> = { 0: 'Percentage', 1: 'Fixed amount' };

@Component({
  selector: 'app-admin-coupons-page',
  standalone: true,
  imports: [ReactiveFormsModule, DataTableComponent, PaginationComponent],
  templateUrl: './coupons.page.html',
  styleUrl: './coupons.page.css',
})
export class CouponsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly couponService = inject(AdminCouponService);

  readonly coupons = signal<CouponResponse[]>([]);
  readonly isLoading = signal(true);
  readonly totalPages = signal(1);
  readonly pageIndex = signal(1);
  readonly search = signal('');
  readonly isDeleting = signal<number | null>(null);
  readonly listError = signal<string | null>(null);

  readonly isFormOpen = signal(false);
  readonly editingCoupon = signal<CouponResponse | null>(null);
  readonly isSubmitting = signal(false);
  readonly formError = signal<string | null>(null);

  readonly discountTypeLabels = DISCOUNT_TYPE_LABELS;

  readonly columns: DataTableColumn<CouponResponse>[] = [
    { key: 'code', header: 'Code' },
    { key: 'discountType', header: 'Type', accessor: (r) => this.discountTypeLabels[r.discountType] ?? '—' },
    {key: 'value',header: 'Value',align: 'right',accessor: (r) => (r.discountType === 0 ? `${r.discountValue}%` : `${r.discountValue} EGP`),
    },
    { key: 'minimumOrderAmount', header: 'Min. order', type: 'currency', align: 'right' },
    { key: 'usedCount', header: 'Used', align: 'right', accessor: (r) => `${r.usedCount} / ${r.usageLimit}` },
    { key: 'userUsageLimit', header: 'Per User', align: 'right'},
    { key: 'expiresAt', header: 'Expires', type: 'date' },
    { key: 'isActive', header: 'Status', type: 'badge', accessor: (r) => (r.isActive ? 'Active' : 'Inactive') },
  ];

  readonly form = this.fb.nonNullable.group({
  code: ['', [Validators.required, Validators.minLength(3)]],
  discountType: [0, Validators.required],
  discountValue: [0, [Validators.required, Validators.min(0.01)]],
  minimumOrder: [0],
  maximumDiscount: [0],
  usageLimit: [1, [Validators.required, Validators.min(1)]],
  userUsageLimit: [1, [Validators.required,Validators.min(1)]],
  startDate: ['', Validators.required],
  endDate: ['', Validators.required],
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
    this.editingCoupon.set(null);
    this.formError.set(null);
    this.form.reset({
      code: '',
      discountType: 0,
      discountValue: 0,
      minimumOrder: 0,
      usageLimit: 1,
      userUsageLimit: 1,
      isActive: true,
      endDate: '',
      startDate:'',

    });
    this.isFormOpen.set(true);
  }

  openEditForm(coupon: CouponResponse): void {
    this.editingCoupon.set(coupon);
    this.formError.set(null);
    this.form.patchValue({
      code: coupon.code,
      discountType: coupon.discountType,
      usageLimit: coupon.usageLimit,
      userUsageLimit: coupon.userUsageLimit,
      isActive: coupon.isActive,
      discountValue: coupon.discountValue,
minimumOrder: coupon.minimumOrder,
maximumDiscount: coupon.maximumDiscount,
startDate: coupon.startDate.substring(0, 10),
endDate: coupon.endDate.substring(0, 10),
    });
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingCoupon.set(null);
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
const payload: CreateCouponRequest = {
  ...value,
  startDate: new Date(value.startDate).toISOString(),
  endDate: new Date(value.endDate).toISOString(),
};
console.log(payload)
    const existing = this.editingCoupon();
    const request$ = existing
      ? this.couponService.update(existing.id, payload)
      : this.couponService.create(payload);

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
        this.formError.set(extractErrorMessage(err, 'Could not save this coupon.'));
      },
    });
  }

  deleteCoupon(coupon: CouponResponse): void {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;

    this.isDeleting.set(coupon.id);
    this.listError.set(null);

    this.couponService.delete(coupon.id).subscribe({
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
        this.listError.set(extractErrorMessage(err, 'Could not delete this coupon.'));
      },
    });
  }

  private load(pageIndex: number): void {
    this.isLoading.set(true);
    this.pageIndex.set(pageIndex);

    this.couponService.getAll({ search: this.search() || undefined, pageIndex, pageSize: PAGE_SIZE }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.coupons.set(res.data.items);
          this.totalPages.set(res.data.totalPages || 1);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}