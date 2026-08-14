import { Component, Input, OnChanges, OnInit, Output, EventEmitter, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AddressService } from '../../../../core/services/address.service';
import { AddressResponse } from '../../../../core/models/domain.models';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { PickedLocation, AddressMapPickerComponent } from '../address-map-picker.component/address-map-picker.component';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, TranslatePipe, AddressMapPickerComponent],
  templateUrl: './address-form.component.html',
  styleUrl: './address-form.component.css',
})
export class AddressFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly addressService = inject(AddressService);

  /** لو موجود، الفورم بيشتغل في وضع التعديل. لو null، وضع الإضافة */
  @Input() existingAddress: AddressResponse | null = null;

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly shippingLookup = this.addressService.shippingLookup;

  readonly governorates = computed(() => this.shippingLookup().map((g) => g.governorate));

  // بنتابع المحافظة المختارة بـ signal منفصل، مش بقراءة form.value جوه computed
  // لأن computed() بيتبع signals بس، مش تغييرات الـ Reactive Forms
  readonly selectedGovernorate = signal('');

  readonly areasForSelectedGovernorate = computed(() => {
    return this.shippingLookup().find((g) => g.governorate === this.selectedGovernorate())?.areas ?? [];
  });

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\s-]{8,15}$/)]],
    governorate: ['', Validators.required],
    area: ['', Validators.required],
    street: ['', Validators.required],
   building: ['', Validators.required],
    floor: [''],
    apartment: ['', Validators.required],
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
 onLocationPicked(location: PickedLocation): void {

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
    // بعد تحديد المحافظة، الـ computed
    // هيكون شايف areas الجديدة
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
        this.normalizeLocationName(gov) ===
        normalized
    );

  if (!match) {
    return;
  }

  this.form
    .get('governorate')
    ?.setValue(match);

  this.selectedGovernorate.set(match);

  this.form
    .get('area')
    ?.setValue('');
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

  const match =
    areas.find(
      area =>
        this.normalizeLocationName(
          area.name
        ) === normalized
    );

  if (!match) {
    return;
  }

  this.form
    .get('area')
    ?.setValue(match.name);
}

  ngOnInit(): void {
    if (this.shippingLookup().length === 0) {
      this.addressService.getShippingLookup().subscribe();
    }

    // كل ما تتغيّر المحافظة، نحدّث الـ signal ونصفّر المنطقة عشان مايفضلش قيمة من محافظة تانية
    this.form.get('governorate')?.valueChanges.subscribe((gov) => {
      this.selectedGovernorate.set(gov);
      this.form.get('area')?.setValue('');
    });

    this.patchFormFromExisting();
  }

  ngOnChanges(): void {
    this.patchFormFromExisting();
  }

  private patchFormFromExisting(): void {
    if (this.existingAddress) {
      // بنحدّث المحافظة الأول من غير ما نطلق valueChanges، عشان الـ subscription
      // اللي بيصفّر المنطقة مايمسحش المنطقة المحفوظة فعلاً وقت التعديل
      this.form.get('governorate')?.setValue(this.existingAddress.governorate, { emitEvent: false });
      this.selectedGovernorate.set(this.existingAddress.governorate);

      this.form.patchValue({
        fullName: this.existingAddress.fullName,
        phoneNumber: this.existingAddress.phoneNumber,
        area: this.existingAddress.area,
        street: this.existingAddress.street,
        building: this.existingAddress.building || '',
        floor: this.existingAddress.floor || '',
        apartment: this.existingAddress.apartment || '',
        notes: this.existingAddress.notes || '',
        latitude:
  this.existingAddress.latitude,

longitude:
  this.existingAddress.longitude,
        isDefault: this.existingAddress.isDefault,
      });
    } else {
      this.selectedGovernorate.set('');
      this.form.reset({
        fullName: '',
        phoneNumber: '',
        governorate: '',
        area: '',
        street: '',
        building: '',
        floor: '',
        apartment: '',
        notes: '',
        isDefault: false,
      });
    }
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
  this.errorMessage.set(null);

  const raw = this.form.getRawValue();
  const payload = {
    ...raw,
    latitude: raw.latitude ?? undefined,
    longitude: raw.longitude ?? undefined,
  };

  const request$ = this.existingAddress
    ? this.addressService.updateAddress(this.existingAddress.id, payload)
    : this.addressService.createAddress(payload);

  request$.subscribe({
    next: (res) => {
      this.isSubmitting.set(false);
      if (res.success) {
        this.saved.emit();
      } else {
        this.errorMessage.set(res.message);
      }
    },
    error: (err) => {
      this.isSubmitting.set(false);
      this.errorMessage.set(extractErrorMessage(err, 'Could not save this address.'));
    },
  });
}

  cancel(): void {
    this.cancelled.emit();
  }
}