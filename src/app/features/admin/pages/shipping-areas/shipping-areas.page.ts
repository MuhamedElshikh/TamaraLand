import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  DataTableComponent,
  DataTableColumn,
} from '../../components/data-table/data-table.component';

import { PaginationComponent } from '../../../../shared/pagination/pagination';

import { AreaService } from '../../../../core/services/area.service';

import {
  AreaFilterRequest,
  AreaResponse,
  GovernorateLookupResponse,
} from '../../../../core/models/domain.models';

import { extractErrorMessage } from '../../../../core/utils/error-message.util';

import { TranslatePipe } from '@ngx-translate/core';

const PAGE_SIZE = 15;

@Component({
  selector: 'app-admin-shipping-areas-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DataTableComponent,
    PaginationComponent,
    TranslatePipe,
  ],
  templateUrl: './shipping-areas.page.html',
  styleUrl: './shipping-areas.page.css',
})
export class ShippingAreasPage
  implements OnInit
{
  private readonly fb =
    inject(FormBuilder);

  private readonly areaService =
    inject(AreaService);

  readonly areas =
    signal<AreaResponse[]>([]);

  readonly governorates =
    signal<GovernorateLookupResponse[]>([]);

  readonly isLoading =
    signal(true);

  readonly isGovernoratesLoading =
    signal(false);

  readonly totalPages =
    signal(1);

  readonly pageNumber =
    signal(1);

  readonly search =
    signal('');

  readonly governorateId =
    signal<number | null>(null);

  readonly isDeliveryAvailable =
    signal<boolean | null>(null);

  readonly listError =
    signal<string | null>(null);

  readonly isFormOpen =
    signal(false);

  readonly editingArea =
    signal<AreaResponse | null>(null);

  readonly isSubmitting =
    signal(false);

  readonly formError =
    signal<string | null>(null);

 readonly columns:
  DataTableColumn<AreaResponse>[] = [
    {
      key: 'governorate',
      header: 'Governorate',
    },

    {
      key: 'nameAr',
      header: 'Area',
    },

    {
      key: 'shiyakhas',
      header: 'Shiyakhas',
      accessor: (row) =>
        `${row.shiyakhas?.length ?? 0}`,
    },

    {
      key: 'shippingCost',
      header: 'Shipping cost',
      type: 'currency',
      align: 'right',
    },

    {
      key: 'isDeliveryAvailable',
      header: 'Delivery',
      type: 'badge',
      accessor: (row) =>
        row.isDeliveryAvailable
          ? 'Available'
          : 'Unavailable',
    },
  ];
  readonly form =
    this.fb.nonNullable.group({
      shippingCost: [
        0,
        [
          Validators.required,
          Validators.min(0),
        ],
      ],

      isDeliveryAvailable: [
        true,
      ],
    });

  ngOnInit(): void {
    this.loadGovernorates();
    this.load(1);
  }

  onSearch(
    value: string
  ): void {
    this.search.set(
      value
    );

    this.load(1);
  }

  onGovernorateChange(
    value: string
  ): void {
    this.governorateId.set(
      value
        ? Number(value)
        : null
    );

    this.load(1);
  }

  onDeliveryStatusChange(
    value: string
  ): void {
    if (value === '') {
      this.isDeliveryAvailable.set(
        null
      );
    } else {
      this.isDeliveryAvailable.set(
        value === 'true'
      );
    }

    this.load(1);
  }

  clearFilters(): void {
    this.search.set('');
    this.governorateId.set(null);
    this.isDeliveryAvailable.set(null);

    this.load(1);
  }

  onPageChange(
    page: number
  ): void {
    this.load(page);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  openEditForm(
    area: AreaResponse
  ): void {
    this.editingArea.set(
      area
    );

    this.formError.set(
      null
    );

    this.form.patchValue({
      shippingCost:
        area.shippingCost,

      isDeliveryAvailable:
        area.isDeliveryAvailable,
    });

    this.isFormOpen.set(
      true
    );
  }

  closeForm(): void {
    this.isFormOpen.set(
      false
    );

    this.editingArea.set(
      null
    );

    this.formError.set(
      null
    );
  }

  controlHasError(
    name: string,
    error: string
  ): boolean {
    const control =
      this.form.get(name);

    return Boolean(
      control &&
      control.touched &&
      control.hasError(error)
    );
  }

  submit(): void {
    const area =
      this.editingArea();

    if (!area) {
      return;
    }

    if (
      this.form.invalid ||
      this.isSubmitting()
    ) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(
      true
    );

    this.formError.set(
      null
    );

    const value =
      this.form.getRawValue();

    this.areaService
      .updateShipping(
        area.id,
        {
          shippingCost:
            value.shippingCost,

          isDeliveryAvailable:
            value.isDeliveryAvailable,
        }
      )
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(
            false
          );

          if (res.success) {
            this.closeForm();

            this.load(
              this.pageNumber()
            );

            return;
          }

          this.formError.set(
            res.message
          );
        },

        error: (err) => {
          this.isSubmitting.set(
            false
          );

          this.formError.set(
            extractErrorMessage(
              err,
              'Could not save shipping settings.'
            )
          );
        },
      });
  }

  private loadGovernorates(): void {
    this.isGovernoratesLoading.set(
      true
    );

    this.areaService
      .getGovernorates()
      .subscribe({
        next: (res) => {
          this.isGovernoratesLoading.set(
            false
          );

          if (
            res.success &&
            res.data
          ) {
            this.governorates.set(
              res.data
            );

            return;
          }

          this.governorates.set(
            []
          );
        },

        error: () => {
          this.isGovernoratesLoading.set(
            false
          );

          this.governorates.set(
            []
          );
        },
      });
  }

  private load(
    pageNumber: number
  ): void {
    this.isLoading.set(
      true
    );

    this.listError.set(
      null
    );

    this.pageNumber.set(
      pageNumber
    );

    const request:
      AreaFilterRequest = {
      search:
        this.search().trim() ||
        undefined,

      governorateId:
        this.governorateId() ??
        undefined,

      isDeliveryAvailable:
        this.isDeliveryAvailable() ??
        undefined,

      pageNumber,

      pageSize:
        PAGE_SIZE,
    };

    this.areaService
      .getAreas(request)
      .subscribe({
        next: (res) => {
          if (
            res.success &&
            res.data
          ) {
            this.areas.set(
              res.data.items
            );

            this.totalPages.set(
              Math.max(
                1,
                res.data.totalPages
              )
            );
          } else {
            this.areas.set(
              []
            );

            this.totalPages.set(
              1
            );

            this.listError.set(
              res.message
            );
          }

          this.isLoading.set(
            false
          );
        },

        error: (err) => {
          this.isLoading.set(
            false
          );

          this.areas.set(
            []
          );

          this.totalPages.set(
            1
          );

          this.listError.set(
            extractErrorMessage(
              err,
              'Could not load areas.'
            )
          );
        },
      });
  }
}