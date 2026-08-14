import {
  Component,
  Output,
  EventEmitter,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

import { AddressService } from '../../../../core/services/address.service';
import {
  AddressResponse,
  ShippingAreaItem,
} from '../../../../core/models/domain.models';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-checkout-shipping',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    TranslatePipe,
  ],
  templateUrl: './checkout-shipping.component.html',
  styleUrl: './checkout-shipping.component.css',
})
export class CheckoutShippingComponent {
  private readonly addressService = inject(AddressService);

  selectedAddress = input<AddressResponse | null>(null);

  @Output() areaSelected =
    new EventEmitter<ShippingAreaItem | null>();

  readonly shippingLookup =
    this.addressService.shippingLookup;

  // =========================
  // Governorate
  // =========================

  readonly governorate = computed(() =>
    this.selectedAddress()?.governorate ?? ''
  );

  readonly matchedGovernorateGroup = computed(() => {
    return (
      this.shippingLookup().find(
        g => g.governorate === this.governorate()
      ) ?? null
    );
  });

  // =========================
  // Area from selected address
  // =========================

  readonly area = computed(() =>
    this.selectedAddress()?.area ?? ''
  );

  readonly matchedArea = computed(() => {
    const areas = this.matchedGovernorateGroup()?.areas ?? [];
    const selectedArea = this.area().trim();

    if (!selectedArea) {
      return null;
    }

    return (
      areas.find(
        x => x.name.trim() === selectedArea
      ) ?? null
    );
  });

  readonly selectedAreaId = computed(() =>
    this.matchedArea()?.id ?? null
  );

  // =========================
  // Shipping
  // =========================

  readonly areasForGovernorate = computed(() =>
    this.matchedGovernorateGroup()?.areas ?? []
  );

  readonly noShippingAvailable = computed(() => {
    return (
      !!this.governorate() &&
      this.shippingLookup().length > 0 &&
      !this.matchedGovernorateGroup()
    );
  });

  readonly areaNotAvailable = computed(() => {
    return (
      !!this.governorate() &&
      !!this.area() &&
      this.shippingLookup().length > 0 &&
      !!this.matchedGovernorateGroup() &&
      !this.matchedArea()
    );
  });

  constructor() {
    if (this.shippingLookup().length === 0) {
      this.addressService.getShippingLookup().subscribe();
    }

    // لما العنوان أو بيانات الشحن تتغير،
    // نحدد الـ Shipping Area تلقائيًا.
    effect(() => {
      const area = this.matchedArea();

      this.areaSelected.emit(area);
    });
  }
}