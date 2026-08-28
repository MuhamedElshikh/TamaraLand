import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DataTableComponent, DataTableColumn } from '../../components/data-table/data-table.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination';
import { AdminCouponService } from '../../../../core/services/admin-coupon.service';
import { CouponResponse, CreateCouponRequest } from '../../../../core/models/domain.models';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';

const PAGE_SIZE = 15;

@Component({
  selector: 'app-admin-coupons-page',
  standalone: true,
  imports: [ReactiveFormsModule, DataTableComponent, PaginationComponent, TranslatePipe],
  templateUrl: './coupons.page.html',
  styleUrl: './coupons.page.css',
})
export class CouponsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly couponService = inject(AdminCouponService);
  private readonly translate = inject(TranslateService);

  readonly coupons = signal<CouponResponse[]>([]);
  readonly isLoading = signal(true);
  readonly totalPages = signal(1);
  readonly pageNumber = signal(1);
  readonly search = signal('');
  readonly isDeleting = signal<number | null>(null);
  readonly listError = signal<string | null>(null);

  readonly isFormOpen = signal(false);
  readonly editingCoupon = signal<CouponResponse | null>(null);
  readonly isSubmitting = signal(false);
  readonly formError = signal<string | null>(null);

  // يتحدث كل ما اللغة تتغيّر، عشان الأعمدة تتترجم لايف
  private readonly langChange = toSignal(this.translate.onLangChange, { initialValue: null });

  readonly columns = computed<DataTableColumn<CouponResponse>[]>(() => {
    this.langChange();

    return [
      { key: 'code', header: this.translate.instant('admin.coupons.columns.code') },
      {
        key: 'discountType',
        header: this.translate.instant('admin.coupons.columns.type'),
        accessor: (r) => this.translate.instant(r.discountType === 0 ? 'admin.labels.percentage' : 'admin.labels.fixedAmount'),
      },
      {
        key: 'value',
        header: this.translate.instant('admin.coupons.columns.value'),
        align: 'right',
        accessor: (r) => (r.discountType === 0
          ? `${r.discountValue}%`
          : `${r.discountValue} ${this.translate.instant('orders.currency')}`),
      },
      { key: 'minimumOrderAmount', header: this.translate.instant('admin.coupons.columns.minOrder'), type: 'currency', align: 'right' },
      {
        key: 'usedCount',
        header: this.translate.instant('admin.coupons.columns.used'),
        align: 'right',
        accessor: (r) => `${r.usedCount} / ${r.usageLimit}`,
      },
      { key: 'userUsageLimit', header: this.translate.instant('admin.coupons.columns.perUser'), align: 'right' },
      { key: 'expiresAt', header: this.translate.instant('admin.coupons.columns.expires'), type: 'date' },
      {
        key: 'isActive',
        header: this.translate.instant('admin.coupons.columns.status'),
        type: 'badge',
        accessor: (r) => this.translate.instant(r.isActive ? 'common.active' : 'common.inactive'),
      },
    ];
  });

  readonly form = this.fb.nonNullable.group(
    {
      code: ['', [Validators.required, Validators.minLength(3)]],
      discountType: [0, Validators.required],
      discountValue: [0, [Validators.required, Validators.min(0.01)]],
      minimumOrder: [0],
      maximumDiscount: [0],
      usageLimit: [1, [Validators.required, Validators.min(1)]],
      userUsageLimit: [1, [Validators.required, Validators.min(1)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      isActive: [true],
    },
    { validators: this.dateRangeValidator }
  );

  constructor() {
    // الكود دايمًا بحروف كبيرة، أوتوماتيك، عشان منسيبش تعارض بين "summer20" و"SUMMER20" في قاعدة البيانات
    this.form.get('code')!.valueChanges.subscribe((val) => {
      const upper = (val || '').toUpperCase();
      if (upper !== val) {
        this.form.get('code')!.setValue(upper, { emitEvent: false });
      }
    });

    // الخصم بالنسبة المئوية مايتعديش 100%؛ الخصم بقيمة ثابتة مفيهوش سقف
    this.form.get('discountType')!.valueChanges.subscribe((type) => this.applyDiscountValueValidators(type));
    this.applyDiscountValueValidators(this.form.get('discountType')!.value);
  }

  private applyDiscountValueValidators(discountType: number): void {
    const control = this.form.get('discountValue')!;
    const validators = discountType === 0
      ? [Validators.required, Validators.min(0.01), Validators.max(100)]
      : [Validators.required, Validators.min(0.01)];
    control.setValidators(validators);
    control.updateValueAndValidity({ emitEvent: false });
  }

  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const start = control.get('startDate')?.value;
    const end = control.get('endDate')?.value;

    if (!start || !end) return null;

    return new Date(start) <= new Date(end) ? null : { invalidDateRange: true };
  }

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
      maximumDiscount: 0,
      usageLimit: 1,
      userUsageLimit: 1,
      isActive: true,
      endDate: '',
      startDate: '',
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

  get hasDateRangeError(): boolean {
    const start = this.form.get('startDate');
    const end = this.form.get('endDate');
    return Boolean(
      this.form.hasError('invalidDateRange') &&
      (start?.touched || end?.touched)
    );
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

    const existing = this.editingCoupon();
    const request$ = existing
      ? this.couponService.update(existing.id, payload)
      : this.couponService.create(payload);

    request$.subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.closeForm();
          this.load(this.pageNumber());
        } else {
          this.formError.set(res.message || this.translate.instant('admin.coupons.errors.saveFailed'));
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.formError.set(extractErrorMessage(err, this.translate.instant('admin.coupons.errors.saveFailed')));
      },
    });
  }

  deleteCoupon(coupon: CouponResponse): void {
    const message = this.translate.instant('admin.coupons.confirmDelete', { code: coupon.code });
    if (!confirm(message)) return;

    this.isDeleting.set(coupon.id);
    this.listError.set(null);

    this.couponService.delete(coupon.id).subscribe({
      next: (res) => {
        this.isDeleting.set(null);
        if (res.success) {
          this.load(this.pageNumber());
        } else {
          this.listError.set(res.message || this.translate.instant('admin.coupons.errors.deleteFailed'));
        }
      },
      error: (err) => {
        this.isDeleting.set(null);
        this.listError.set(extractErrorMessage(err, this.translate.instant('admin.coupons.errors.deleteFailed')));
      },
    });
  }

  private load(pageNumber: number): void {
    this.isLoading.set(true);
    this.pageNumber.set(pageNumber);

    this.couponService.getAll({ search: this.search() || undefined, pageNumber, pageSize: PAGE_SIZE }).subscribe({
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