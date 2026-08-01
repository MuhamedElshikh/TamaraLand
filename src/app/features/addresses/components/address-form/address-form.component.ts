import { Component, Input, OnChanges, OnInit, Output, EventEmitter, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AddressService } from '../../../../core/services/address.service';
import { AddressResponse } from '../../../../core/models/domain.models';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [ReactiveFormsModule ,DecimalPipe,TranslatePipe],
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
    building: [''],
    floor: [''],
    apartment: [''],
    notes: [''],
    isDefault: [false],
  });

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

    const payload = this.form.getRawValue();
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