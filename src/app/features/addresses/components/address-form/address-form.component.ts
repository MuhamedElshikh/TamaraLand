import {
  Component,
  Input,
  OnChanges,
  OnInit,
  Output,
  EventEmitter,
  computed,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AddressService } from '../../../../core/services/address.service';

import {
  AddressResponse,
  AreaLookupItem,
} from '../../../../core/models/domain.models';

import { extractErrorMessage } from '../../../../core/utils/error-message.util';

import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import {
  PickedLocation,
  AddressMapPickerComponent,
} from '../address-map-picker.component/address-map-picker.component';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    TranslatePipe,
    AddressMapPickerComponent,
  ],
  templateUrl: './address-form.component.html',
  styleUrl: './address-form.component.css',
})
export class AddressFormComponent
  implements OnInit, OnChanges
{
  private readonly fb = inject(FormBuilder);
  private readonly addressService = inject(AddressService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() existingAddress: AddressResponse | null = null;

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly isSubmitting =
    signal(false);

  readonly errorMessage =
    signal<string | null>(null);

  // =========================
  // Area Lookup
  // =========================

  readonly areaLookup =
    this.addressService.areaLookup;

  readonly governorates = computed(() =>
    this.areaLookup().map(
      x => x.governorate
    )
  );

  readonly selectedGovernorate =
    signal('');

  readonly areasForSelectedGovernorate =
    computed(() =>
      this.areaLookup().find(
        x =>
          x.governorate ===
          this.selectedGovernorate()
      )?.areas ?? []
    );

  // =========================
  // Form
  // =========================

  readonly form =
    this.fb.nonNullable.group({
      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
        ],
      ],

      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^[0-9+\s-]{8,15}$/
          ),
        ],
      ],

      governorate: [
        '',
        Validators.required,
      ],

      areaId: [
        0,
        [
          Validators.required,
          Validators.min(1),
        ],
      ],

      street: [
        '',
        Validators.required,
      ],

      building: [
        '',
        Validators.required,
      ],

      floor: [''],

      apartment: [
        '',
        Validators.required,
      ],

      notes: [''],

      isDefault: [false],

      latitude: [
        null as number | null,
        Validators.required,
      ],

      longitude: [
        null as number | null,
        Validators.required,
      ],
    });

  // =========================
  // Map
  // =========================

  onLocationPicked(
    location: PickedLocation
  ): void {
    this.form.patchValue({
      latitude: location.lat,
      longitude: location.lng,
    });

    if (location.governorate) {
      this.setGovernorateFromLocation(
        location.governorate
      );
    }

    if (location.street) {
      this.form.patchValue({
        street: location.street,
      });
    }

    if (location.building) {
      this.form.patchValue({
        building: location.building,
      });
    }

    if (location.area) {
      this.setAreaFromLocation(
        location.area
      );
    }
  }

  private normalizeLocationName(
    value: string
  ): string {
    return value
      .trim()
      .replace(/^محافظة\s+/u, '')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private setGovernorateFromLocation(
    governorate: string
  ): void {
    const normalized =
      this.normalizeLocationName(
        governorate
      );

    const match =
      this.governorates().find(
        gov =>
          this.normalizeLocationName(
            gov
          ) === normalized
      );

    if (!match) {
      return;
    }

    this.form
      .get('governorate')
      ?.setValue(match);

    this.selectedGovernorate.set(
      match
    );

    this.form
      .get('areaId')
      ?.setValue(0);
  }

  private setAreaFromLocation(
    areaName: string
  ): void {
    const areas =
      this.areasForSelectedGovernorate();

    const normalized =
      this.normalizeLocationName(
        areaName
      );

    const match = areas.find(
      (area: AreaLookupItem) =>
        this.normalizeLocationName(
          area.name
        ) === normalized
    );

    if (!match) {
      return;
    }

    this.form
      .get('areaId')
      ?.setValue(match.id);
  }

  // =========================
  // Lifecycle
  // =========================

  ngOnInit(): void {
    if (
      this.areaLookup().length === 0
    ) {
      this.addressService
        .getAreaLookup()
        .pipe(
          takeUntilDestroyed(
            this.destroyRef
          )
        )
        .subscribe();
    }

    this.form
      .get('governorate')
      ?.valueChanges
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        governorate => {
          this.selectedGovernorate.set(
            governorate
          );

          this.form
            .get('areaId')
            ?.setValue(0);
        }
      );

    this.patchFormFromExisting();
  }

  ngOnChanges(): void {
    this.patchFormFromExisting();
  }

  private patchFormFromExisting(): void {
    if (this.existingAddress) {
      const governorate =
        this.existingAddress.governorate;

      this.form
        .get('governorate')
        ?.setValue(
          governorate,
          {
            emitEvent: false,
          }
        );

      this.selectedGovernorate.set(
        governorate
      );

      this.form.patchValue({
        fullName:
          this.existingAddress.fullName,

        phoneNumber:
          this.existingAddress.phoneNumber,

        areaId:
          this.existingAddress.areaId,

        street:
          this.existingAddress.street,

        building:
          this.existingAddress.building ?? '',

        floor:
          this.existingAddress.floor ?? '',

        apartment:
          this.existingAddress.apartment ?? '',

        notes:
          this.existingAddress.notes ?? '',

        latitude:
          this.existingAddress.latitude,

        longitude:
          this.existingAddress.longitude,

        isDefault:
          this.existingAddress.isDefault,
      });

      return;
    }

    this.selectedGovernorate.set('');

    this.form.reset({
      fullName: '',
      phoneNumber: '',
      governorate: '',
      areaId: 0,
      street: '',
      building: '',
      floor: '',
      apartment: '',
      notes: '',
      isDefault: false,
      latitude: null,
      longitude: null,
    });
  }

  // =========================
  // Validation
  // =========================

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

  // =========================
  // Submit
  // =========================

  submit(): void {
    if (
      this.form.invalid ||
      this.isSubmitting()
    ) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const raw =
      this.form.getRawValue();

    const payload = {
      fullName: raw.fullName,
      phoneNumber: raw.phoneNumber,
      areaId: raw.areaId,
      street: raw.street,
      building: raw.building,
      floor: raw.floor,
      apartment: raw.apartment,
      notes: raw.notes,
      latitude:
        raw.latitude ?? undefined,
      longitude:
        raw.longitude ?? undefined,
      isDefault: raw.isDefault,
    };

    const request$ =
      this.existingAddress
        ? this.addressService.updateAddress(
            this.existingAddress.id,
            payload
          )
        : this.addressService.createAddress(
            payload
          );

    request$
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: res => {
          this.isSubmitting.set(false);

          if (res.success) {
            this.saved.emit();
          } else {
            this.errorMessage.set(
              res.message
            );
          }
        },

        error: err => {
          this.isSubmitting.set(false);

          this.errorMessage.set(
            extractErrorMessage(
              err,
              'Could not save this address.'
            )
          );
        },
      });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}