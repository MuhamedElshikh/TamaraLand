import {
  Component,
  Input,
  OnChanges,
  OnInit,
  Output,
  EventEmitter,
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
import { LocationService } from '../../../../core/services/LocationService.service';

import {
  AddressResponse,
  ResolveLocationResponse,
  CreateAddressRequest,
} from '../../../../core/models/domain.models';

import { extractErrorMessage } from '../../../../core/utils/error-message.util';

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
    TranslatePipe,
    AddressMapPickerComponent,
  ],
  templateUrl: './address-form.component.html',
  styleUrl: './address-form.component.css',
})
export class AddressFormComponent
  implements OnInit, OnChanges
{
  private readonly fb =
    inject(FormBuilder);

  private readonly addressService =
    inject(AddressService);

  private readonly locationService =
    inject(LocationService);

  private readonly destroyRef =
    inject(DestroyRef);

  @Input()
  existingAddress: AddressResponse | null =
    null;

  @Output()
  saved =
    new EventEmitter<void>();

  @Output()
  cancelled =
    new EventEmitter<void>();

  readonly isSubmitting =
    signal(false);

  readonly errorMessage =
    signal<string | null>(null);

  // =========================================================
  // Resolved official location
  // =========================================================

  readonly resolvedLocation =
    signal<ResolveLocationResponse | null>(
      null
    );

  readonly isResolvingLocation =
    signal(false);

  readonly locationError =
    signal<string | null>(null);

  // =========================================================
  // Form
  // =========================================================

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

      street: [
        '',
        Validators.required,
      ],

      building: [
        '',
        Validators.required,
      ],

      floor: [
        '',
      ],

      apartment: [
        '',
        Validators.required,
      ],

      notes: [
        '',
      ],

      isDefault: [
        false,
      ],

      latitude: [
        null as number | null,
        Validators.required,
      ],

      longitude: [
        null as number | null,
        Validators.required,
      ],
    });

  // =========================================================
  // Map
  // =========================================================

  onLocationPicked(
    location: PickedLocation
  ): void {
    this.form.patchValue({
      latitude:
        location.lat,

      longitude:
        location.lng,
    });

    this.locationError.set(null);

    this.resolvedLocation.set(
      null
    );

    // Nominatim is only used as a helper
    // for street/building information.
    if (location.street) {
      this.form.patchValue({
        street:
          location.street,
      });
    }

    if (location.building) {
      this.form.patchValue({
        building:
          location.building,
      });
    }

    this.resolveLocation(
      location.lat,
      location.lng
    );
  }

  private resolveLocation(
    latitude: number,
    longitude: number
  ): void {
    this.isResolvingLocation.set(
      true
    );

    this.locationError.set(
      null
    );

    this.locationService
      .resolve({
        latitude,
        longitude,
      })
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: (response) => {
          this.isResolvingLocation.set(
            false
          );

          if (
            !response.success ||
            !response.data ||
            !response.data.isResolved
          ) {
            this.resolvedLocation.set(
              null
            );

            this.locationError.set(
              response.message ||
              'Could not determine the delivery area for this location.'
            );

            return;
          }

          this.resolvedLocation.set(
            response.data
          );
        },

        error: (error) => {
          this.isResolvingLocation.set(
            false
          );

          this.resolvedLocation.set(
            null
          );

          this.locationError.set(
            extractErrorMessage(
              error,
              'Could not determine the delivery area for this location.'
            )
          );
        },
      });
  }

  // =========================================================
  // Lifecycle
  // =========================================================

  ngOnInit(): void {
    this.patchFormFromExisting();
  }

  ngOnChanges(): void {
    this.patchFormFromExisting();
  }

  private patchFormFromExisting(): void {
    if (this.existingAddress) {
      this.form.patchValue({
        fullName:
          this.existingAddress.fullName,

        phoneNumber:
          this.existingAddress.phoneNumber,

        street:
          this.existingAddress.street,

        building:
          this.existingAddress.building ??
          '',

        floor:
          this.existingAddress.floor ??
          '',

        apartment:
          this.existingAddress.apartment ??
          '',

        notes:
          this.existingAddress.notes ??
          '',

        latitude:
          this.existingAddress.latitude,

        longitude:
          this.existingAddress.longitude,

        isDefault:
          this.existingAddress.isDefault,
      });

      // Existing address is already resolved
      // by the backend.
      this.resolvedLocation.set({
        isResolved: true,

        isDeliveryAvailable:
          this.existingAddress
            .isDeliveryAvailable,

        areaId:
          this.existingAddress.areaId,

        areaNameAr:
          this.existingAddress.area,

        areaNameEn:
          this.existingAddress.area,

        shiyakhaId:
          this.existingAddress.shiyakhaId,

        shiyakhaNameAr:
          this.existingAddress.shiyakha,

        shiyakhaNameEn:
          this.existingAddress.shiyakha,

        governorateId: 0,

        governorateNameAr:
          this.existingAddress.governorate,

        governorateNameEn:
          this.existingAddress.governorate,

        shippingCost:
          this.existingAddress
            .shippingCost,

        status:
          this.existingAddress
            .isDeliveryAvailable
            ? 'Available'
            : 'DeliveryUnavailable',
      });

      this.locationError.set(
        null
      );

      return;
    }

    this.resolvedLocation.set(
      null
    );

    this.locationError.set(
      null
    );

    this.form.reset({
      fullName: '',
      phoneNumber: '',
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

  // =========================================================
  // Validation
  // =========================================================

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

  // =========================================================
  // Submit
  // =========================================================

  submit(): void {
    if (
      this.form.invalid ||
      this.isSubmitting()
    ) {
      this.form.markAllAsTouched();

      return;
    }

    if (
      this.isResolvingLocation()
    ) {
      return;
    }

    const location =
      this.resolvedLocation();

    if (
      !location ||
      !location.isResolved
    ) {
      this.locationError.set(
        'Please select a valid location on the map.'
      );

      return;
    }

    const raw =
      this.form.getRawValue();

    if (
      raw.latitude === null ||
      raw.longitude === null
    ) {
      this.locationError.set(
        'Please select a location on the map.'
      );

      return;
    }

    this.isSubmitting.set(
      true
    );

    this.errorMessage.set(
      null
    );

    const payload: CreateAddressRequest = {
      fullName:
        raw.fullName,

      phoneNumber:
        raw.phoneNumber,

      street:
        raw.street,

      building:
        raw.building || null,

      floor:
        raw.floor || null,

      apartment:
        raw.apartment || null,

      notes:
        raw.notes || null,

      latitude:
        raw.latitude,

      longitude:
        raw.longitude,

      isDefault:
        raw.isDefault,
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
        next: (response) => {
          this.isSubmitting.set(
            false
          );

          if (response.success) {
            this.saved.emit();
            return;
          }

          this.errorMessage.set(
            response.message
          );
        },

        error: (error) => {
          this.isSubmitting.set(
            false
          );

          this.errorMessage.set(
            extractErrorMessage(
              error,
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