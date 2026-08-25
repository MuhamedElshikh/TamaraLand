import {
  Component,
  computed,
  input,
} from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { AddressResponse } from '../../../../core/models/domain.models';

@Component({
  selector: 'app-checkout-shipping',
  standalone: true,
  imports: [
    DecimalPipe,
    TranslatePipe,
  ],
  templateUrl: './checkout-shipping.component.html',
  styleUrl: './checkout-shipping.component.css',
})
export class CheckoutShippingComponent {
  readonly selectedAddress =
    input<AddressResponse | null>(null);

  readonly governorate = computed(
    () =>
      this.selectedAddress()
        ?.governorate ?? ''
  );

  readonly area = computed(
    () =>
      this.selectedAddress()
        ?.area ?? ''
  );

  readonly areaId = computed(
    () =>
      this.selectedAddress()
        ?.areaId ?? null
  );

  readonly shippingCost = computed(
    () =>
      this.selectedAddress()
        ?.shippingCost ?? 0
  );

  readonly isDeliveryAvailable =
    computed(
      () =>
        this.selectedAddress()
          ?.isDeliveryAvailable ??
        false
    );

  readonly noAddressSelected =
    computed(
      () =>
        !this.selectedAddress()
    );

  readonly deliveryNotAvailable =
    computed(
      () =>
        !!this.selectedAddress() &&
        !this.isDeliveryAvailable()
    );
}