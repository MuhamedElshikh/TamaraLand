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
import { HttpClient } from '@angular/common/http';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AddressService } from '../../../../core/services/address.service';
import { LocationService } from '../../../../core/services/LocationService.service';
import { AreaService } from '../../../../core/services/area.service';

import {
  AddressResponse,
  ResolveLocationResponse,
  CreateAddressRequest,
  GovernorateLookupResponse,
  AreaResponse,
  AreaShiyakhaResponse,
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

  private readonly areaService =
    inject(AreaService);

  private readonly http =
    inject(HttpClient);

  private readonly destroyRef =
    inject(DestroyRef);

  @Input()
  existingAddress: AddressResponse | null =
    null;

  @Input()
  isModal = false;

  @Input()
  showTitle = true;

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
  // Automatic Location Detection
  // =========================================================

  readonly isDetectingLocation =
    signal(false);

  readonly manualNotice =
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
  // Manual mode
  // =========================================================

  readonly isManualMode =
    signal(false);

  readonly governorates =
    signal<GovernorateLookupResponse[]>([]);

  readonly areas =
    signal<AreaResponse[]>([]);

  readonly shiyakhas =
    signal<AreaShiyakhaResponse[]>([]);

  readonly selectedGovernorateId =
    signal<number | null>(null);

  readonly selectedAreaId =
    signal<number | null>(null);

  readonly selectedShiyakhaId =
    signal<number | null>(null);

  readonly isLoadingGovernorates =
    signal(false);

  readonly isLoadingAreas =
    signal(false);

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
      ],

      longitude: [
        null as number | null,
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
  // Automatic Location Detection & Mode Handling
  // =========================================================

  private detectLocationAutomatically(): void {
    if (this.existingAddress) {
      if (!this.existingAddress.latitude || !this.existingAddress.longitude) {
        this.switchToManual();
      }
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      this.switchToManual('المتصفح لا يدعم تحديد الموقع الجغرافي. تم التبديل للاختيار اليدوي.');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'denied') {
            this.switchToManual('تم التحويل للاختيار اليدوي لعدم منح صلاحية الموقع.');
            return;
          }
          this.requestGeolocation();
        })
        .catch(() => {
          this.requestGeolocation();
        });
    } else {
      this.requestGeolocation();
    }
  }

  private requestGeolocation(): void {
    this.isDetectingLocation.set(true);
    this.locationError.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.isDetectingLocation.set(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.form.patchValue({
          latitude: lat,
          longitude: lng,
        });

        this.resolveLocation(lat, lng);
        this.reverseGeocode(lat, lng);
      },
      (error) => {
        this.isDetectingLocation.set(false);
        const reason =
          error.code === error.PERMISSION_DENIED
            ? 'تم التحويل للاختيار اليدوي لعدم منح صلاحية الموقع.'
            : 'تم التحويل للاختيار اليدوي لتعذر تحديد موقعك بدقة.';
        this.switchToManual(reason);
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 60000,
      }
    );
  }

  private reverseGeocode(lat: number, lng: number): void {
    this.http
      .get<{
        display_name: string;
        address?: { road?: string; house_number?: string };
      }>('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: lat.toString(),
          lon: lng.toString(),
          format: 'json',
          addressdetails: '1',
          'accept-language': 'ar',
        },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.address?.road && !this.form.get('street')?.value) {
            this.form.patchValue({ street: res.address.road });
          }
          if (res.address?.house_number && !this.form.get('building')?.value) {
            this.form.patchValue({ building: res.address.house_number });
          }
        },
        error: () => {},
      });
  }

  switchToManual(notice?: string): void {
    this.isDetectingLocation.set(false);
    this.isManualMode.set(true);

    if (notice) {
      this.manualNotice.set(notice);
    }

    if (!this.selectedShiyakhaId()) {
      this.form.patchValue({
        latitude: null,
        longitude: null,
      });
      this.resolvedLocation.set(null);
    }

    if (this.governorates().length === 0) {
      this.loadGovernorates();
    }
  }

  retryMapMode(): void {
    this.isManualMode.set(false);
    this.manualNotice.set(null);
    this.selectedGovernorateId.set(null);
    this.selectedAreaId.set(null);
    this.selectedShiyakhaId.set(null);
    this.areas.set([]);
    this.shiyakhas.set([]);
    this.resolvedLocation.set(null);
    this.requestGeolocation();
  }

  private loadGovernorates(): void {
    this.isLoadingGovernorates.set(true);

    this.areaService
      .getGovernorates()
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.isLoadingGovernorates.set(false);

          if (
            response.success &&
            response.data
          ) {
            this.governorates.set(
              response.data
            );
          }
        },

        error: () => {
          this.isLoadingGovernorates.set(false);
        },
      });
  }

  onGovernorateChange(
    event: Event
  ): void {
    const value =
      (event.target as HTMLSelectElement).value;

    const govId =
      value ? Number(value) : null;

    this.selectedGovernorateId.set(govId);
    this.selectedAreaId.set(null);
    this.selectedShiyakhaId.set(null);
    this.areas.set([]);
    this.shiyakhas.set([]);
    this.resolvedLocation.set(null);
    this.locationError.set(null);

    if (govId) {
      this.loadAreas(govId);
    }
  }

  private loadAreas(
    governorateId: number
  ): void {
    this.isLoadingAreas.set(true);

    this.areaService
      .getAreas({
        governorateId,
        pageSize: 200,
        isDeliveryAvailable: true,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.isLoadingAreas.set(false);

          if (
            response.success &&
            response.data
          ) {
            this.areas.set(
              response.data.items
            );
          }
        },

        error: () => {
          this.isLoadingAreas.set(false);
        },
      });
  }

  onAreaChange(
    event: Event
  ): void {
    const value =
      (event.target as HTMLSelectElement).value;

    const areaId =
      value ? Number(value) : null;

    this.selectedAreaId.set(areaId);
    this.selectedShiyakhaId.set(null);
    this.resolvedLocation.set(null);
    this.locationError.set(null);

    if (areaId) {
      const area =
        this.areas().find(
          (a) => a.id === areaId
        );

      if (area) {
        this.shiyakhas.set(
          area.shiyakhas ?? []
        );
      }
    } else {
      this.shiyakhas.set([]);
    }
  }

  onShiyakhaChange(
    event: Event
  ): void {
    const value =
      (event.target as HTMLSelectElement).value;

    const shiyakhaId =
      value ? Number(value) : null;

    this.selectedShiyakhaId.set(shiyakhaId);
    this.locationError.set(null);

    if (shiyakhaId) {
      this.buildManualResolvedLocation();
    } else {
      this.resolvedLocation.set(null);
    }
  }

  private buildManualResolvedLocation(): void {
    const areaId = this.selectedAreaId();
    const shiyakhaId = this.selectedShiyakhaId();

    if (!areaId || !shiyakhaId) {
      return;
    }

    const area =
      this.areas().find(
        (a) => a.id === areaId
      );

    const shiyakha =
      this.shiyakhas().find(
        (s) => s.id === shiyakhaId
      );

    const governorate =
      this.governorates().find(
        (g) =>
          g.id === area?.governorateId
      );

    if (!area || !shiyakha) {
      return;
    }

    this.resolvedLocation.set({
      isResolved: true,

      isDeliveryAvailable:
        area.isDeliveryAvailable,

      areaId: area.id,
      areaNameAr: area.nameAr,
      areaNameEn: area.nameEn,

      shiyakhaId: shiyakha.id,
      shiyakhaNameAr: shiyakha.nameAr,
      shiyakhaNameEn: shiyakha.nameEn,

      governorateId:
        area.governorateId,

      governorateNameAr:
        governorate?.nameAr ?? '',

      governorateNameEn:
        governorate?.nameEn ?? '',

      shippingCost:
        area.shippingCost,

      status:
        area.isDeliveryAvailable
          ? 'Available'
          : 'DeliveryUnavailable',
    });

    // Set center coordinates from shiyakha
    this.form.patchValue({
      latitude:
        shiyakha.centerLatitude || null,
      longitude:
        shiyakha.centerLongitude || null,
    });
  }

  // =========================================================
  // Lifecycle
  // =========================================================

  ngOnInit(): void {
    this.patchFormFromExisting();
    this.detectLocationAutomatically();
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
        this.isManualMode()
          ? 'يرجى اختيار المحافظة والمنطقة والحي.'
          : 'Please select a valid location on the map.'
      );

      return;
    }

    const raw =
      this.form.getRawValue();

    // In manual mode, lat/lng can be null (we use center coords)
    // In map mode, lat/lng are required
    if (
      !this.isManualMode() &&
      (raw.latitude === null ||
      raw.longitude === null)
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
        raw.latitude ?? 0,

      longitude:
        raw.longitude ?? 0,

      isDefault:
        raw.isDefault,
    };

    // Include manual area/shiyakha selection
    if (this.isManualMode()) {
      payload.areaId =
        this.selectedAreaId();
      payload.shiyakhaId =
        this.selectedShiyakhaId();
    }

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