import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import {
  DataTableComponent,
  DataTableColumn,
} from '../../components/data-table/data-table.component';

import { AdminDiscountService } from '../../../../core/services/admin-discount.service';
import { CatalogService } from '../../../../core/services/catalog.service';

import { DiscountResponse } from '../../../../core/models/domain.models';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';

import { TranslatePipe } from '@ngx-translate/core';

const DISCOUNT_TYPE_LABELS: Record<number, string> = {
  0: 'Percentage',
  1: 'Fixed amount',
};

const TARGET_LABELS: Record<number, string> = {
  0: 'Product',
  1: 'Category',
  2: 'Brand',
};

interface DiscountRow extends DiscountResponse {
  targetName: string;
}

function dateRangeValidator(
  group: AbstractControl,
): ValidationErrors | null {
  const start = group.get('startDate')?.value;
  const end = group.get('endDate')?.value;

  if (!start || !end) {
    return null;
  }

  return new Date(end) > new Date(start)
    ? null
    : { dateRange: true };
}

@Component({
  selector: 'app-admin-discounts-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DataTableComponent,
    TranslatePipe,
  ],
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
  readonly editingDiscount =
    signal<DiscountResponse | null>(null);

  readonly isSubmitting = signal(false);
  readonly formError = signal<string | null>(null);

  readonly discountTypeLabels = DISCOUNT_TYPE_LABELS;
  readonly targetLabels = TARGET_LABELS;

  readonly products =
    signal<{ id: number; name: string }[]>([]);

  readonly categories =
    signal<{ id: number; name: string }[]>([]);

  readonly brands =
    signal<{ id: number; name: string }[]>([]);

  readonly form = this.fb.nonNullable.group(
    {
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
        ],
      ],

      discountType: [
        0,
        Validators.required,
      ],

      discountValue: [
        0,
        [
          Validators.required,
          Validators.min(0.01),
        ],
      ],

     maximumDiscount: this.fb.control<number | null>(
  null,
  Validators.min(0),
),

      target: [
        0,
        Validators.required,
      ],

      targetIds:
        this.fb.nonNullable.control<number[]>(
          [],
          Validators.required,
        ),

      priority: [
        0,
        Validators.min(0),
      ],

      isActive: [
        true,
      ],

      startDate: [
        '',
        Validators.required,
      ],

      endDate: [
        '',
        Validators.required,
      ],
    },
    {
      validators: dateRangeValidator,
    },
  );

  private readonly selectedTarget = toSignal(
    this.form.controls.target.valueChanges,
    {
      initialValue:
        this.form.controls.target.value,
    },
  );

  readonly targetOptions = computed<
    { id: number; name: string }[]
  >(() => {
    switch (this.selectedTarget()) {
      case 1:
        return this.categories();

      case 2:
        return this.brands();

      default:
        return this.products();
    }
  });

  readonly selectedTargetIds = computed<number[]>(
    () => this.form.controls.targetIds.value,
  );

  readonly selectedTargetOptions = computed<
    { id: number; name: string }[]
  >(() => {
    const selectedIds =
      new Set(this.selectedTargetIds());

    return this.targetOptions().filter(
      (option) => selectedIds.has(option.id),
    );
  });

  readonly rows = computed<DiscountRow[]>(() => {
    return this.discounts().map((discount) => ({
      ...discount,
      targetName:
        this.resolveTargetName(discount),
    }));
  });

  readonly columns: DataTableColumn<DiscountRow>[] = [
    {
      key: 'name',
      header: 'Name',
    },

    {
      key: 'discountType',
      header: 'Type',
      accessor: (row) =>
        this.discountTypeLabels[
          row.discountType
        ] ?? '—',
    },

    {
      key: 'discountValue',
      header: 'Value',
      align: 'right',
      accessor: (row) =>
        row.discountType === 0
          ? `${row.discountValue}%`
          : `${row.discountValue} EGP`,
    },

    {
      key: 'target',
      header: 'Applies to',
      accessor: (row) =>
        `${this.targetLabels[row.target]}: ${row.targetName}`,
    },

    {
      key: 'priority',
      header: 'Priority',
      align: 'right',
    },

    {
      key: 'endDate',
      header: 'Ends',
      type: 'date',
    },

    {
      key: 'isActive',
      header: 'Status',
      type: 'badge',
      accessor: (row) =>
        row.isActive
          ? 'Active'
          : 'Inactive',
    },
  ];

  ngOnInit(): void {
    this.loadCatalogData();
    this.load();
  }

  private loadCatalogData(): void {
    this.catalogService
      .getProducts({ pageSize: 200 })
      .subscribe((res) => {
        if (res.success && res.data) {
          this.products.set(
            res.data.items.map((product) => ({
              id: product.id,
              name: product.name,
            })),
          );
        }
      });

    this.catalogService
      .getCategories({ pageSize: 200 })
      .subscribe((res) => {
        if (res.success && res.data) {
          this.categories.set(
            res.data.items.map((category) => ({
              id: category.id,
              name: category.name,
            })),
          );
        }
      });

    this.catalogService
      .getBrands({ pageSize: 200 })
      .subscribe((res) => {
        if (res.success && res.data) {
          this.brands.set(
            res.data.items.map((brand) => ({
              id: brand.id,
              name: brand.name,
            })),
          );
        }
      });
  }

  onTargetChange(): void {
    this.form.controls.targetIds.setValue([]);
    this.form.controls.targetIds.markAsUntouched();
  }

  isTargetSelected(id: number): boolean {
    return this.form.controls.targetIds.value.includes(id);
  }

  toggleTarget(id: number): void {
    const control =
      this.form.controls.targetIds;

    const current =
      control.value;

    if (current.includes(id)) {
      control.setValue(
        current.filter(
          (targetId) =>
            targetId !== id,
        ),
      );
    } else {
      control.setValue([
        ...current,
        id,
      ]);
    }

    control.markAsTouched();
    control.markAsDirty();
  }

  removeTarget(id: number): void {
    const control =
      this.form.controls.targetIds;

    control.setValue(
      control.value.filter(
        (targetId) =>
          targetId !== id,
      ),
    );

    control.markAsTouched();
    control.markAsDirty();
  }

  clearTargets(): void {
    this.form.controls.targetIds.setValue([]);
    this.form.controls.targetIds.markAsTouched();
    this.form.controls.targetIds.markAsDirty();
  }

  private resolveTargetName(
    discount: DiscountResponse,
  ): string {
    const list =
      discount.target === 0
        ? this.products()
        : discount.target === 1
          ? this.categories()
          : this.brands();

    const names = discount.targetIds
      .map(
        (targetId) =>
          list.find(
            (item) =>
              item.id === targetId,
          )?.name ?? `#${targetId}`,
      );

    return names.length > 0
      ? names.join(', ')
      : '—';
  }

  openCreateForm(): void {
    this.editingDiscount.set(null);
    this.formError.set(null);

    this.form.reset({
      name: '',
      discountType: 0,
      discountValue: 0,
maximumDiscount: null,
      target: 0,
      targetIds: [],
      priority: 0,
      isActive: true,
      startDate: '',
      endDate: '',
    });

    this.isFormOpen.set(true);
  }

  openEditForm(
    discount: DiscountResponse,
  ): void {
    this.editingDiscount.set(discount);
    this.formError.set(null);

    this.form.patchValue({
      name: discount.name,
      discountType:
        discount.discountType,
      discountValue:
        discount.discountValue,
      maximumDiscount:
        discount.maximumDiscount,
      target: discount.target,
      targetIds: [
        ...discount.targetIds,
      ],
      priority: discount.priority,
      isActive: discount.isActive,
      startDate:
        discount.startDate?.substring(
          0,
          10,
        ),
      endDate:
        discount.endDate?.substring(
          0,
          10,
        ),
    });

    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingDiscount.set(null);
    this.formError.set(null);
  }

  controlHasError(
    name: string,
    error: string,
  ): boolean {
    const control =
      this.form.get(name);

    return Boolean(
      control &&
      control.touched &&
      control.hasError(error),
    );
  }

  submit(): void {
    if (
      this.form.invalid ||
      this.isSubmitting()
    ) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);

    const value =
      this.form.getRawValue();

    const payload = {
      ...value,

      targetIds: [
        ...new Set(value.targetIds),
      ],

      startDate:
        new Date(
          value.startDate,
        ).toISOString(),

      endDate:
        new Date(
          value.endDate,
        ).toISOString(),
    };

    const existing =
      this.editingDiscount();

    const request$ = existing
      ? this.discountService.update(
          existing.id,
          payload,
        )
      : this.discountService.create(
          payload,
        );

    request$.subscribe({
      next: (res) => {
        this.isSubmitting.set(false);

        if (res.success) {
          this.closeForm();
          this.load();
        } else {
          this.formError.set(
            res.message,
          );
        }
      },

      error: (error) => {
        this.isSubmitting.set(false);

        this.formError.set(
          extractErrorMessage(
            error,
            'Could not save this discount.',
          ),
        );
      },
    });
  }

  deleteDiscount(
    discount: DiscountResponse,
  ): void {
    if (
      !confirm(
        `Delete discount "${discount.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    this.isDeleting.set(
      discount.id,
    );

    this.listError.set(null);

    this.discountService
      .delete(discount.id)
      .subscribe({
        next: (res) => {
          this.isDeleting.set(null);

          if (res.success) {
            this.load();
          } else {
            this.listError.set(
              res.message,
            );
          }
        },

        error: (error) => {
          this.isDeleting.set(null);

          this.listError.set(
            extractErrorMessage(
              error,
              'Could not delete this discount.',
            ),
          );
        },
      });
  }

  private load(): void {
    this.isLoading.set(true);
    this.listError.set(null);

    this.discountService
      .getAll()
      .subscribe({
        next: (res) => {
          if (
            res.success &&
            res.data
          ) {
            this.discounts.set(
              res.data,
            );
          }

          this.isLoading.set(false);
        },

        error: (error) => {
          this.isLoading.set(false);

          this.listError.set(
            extractErrorMessage(
              error,
              'Could not load discounts.',
            ),
          );
        },
      });
  }
}