import {
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  input,
} from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import {
  AddressResponse,
  CartResponse,
} from '../../../../core/models/domain.models';

@Component({
  selector: 'app-checkout-summary',
  standalone: true,
  imports: [
    DecimalPipe,
    TranslatePipe,
  ],
  templateUrl: './checkout-summary.component.html',
  styleUrl: './checkout-summary.component.css',
})
export class CheckoutSummaryComponent {
  readonly cart =
    input<CartResponse | null>(null);

  readonly selectedAddress =
    input<AddressResponse | null>(null);

  @Input()
  canPlaceOrder = false;

  @Input()
  isSubmitting = false;

  @Input()
  errorMessage: string | null = null;

  @Output()
  placeOrder =
    new EventEmitter<void>();

  readonly paymentMethod = 0;

  readonly shippingCost = computed(
    () =>
      this.selectedAddress()
        ?.shippingCost ?? 0
  );

  readonly estimatedTotal =
    computed(() => {
      const cart =
        this.cart();

      if (!cart) {
        return 0;
      }

      return Math.max(
        0,
        cart.subTotal -
          cart.discount +
          this.shippingCost()
      );
    });

  onPlaceOrder(): void {
    if (
      !this.canPlaceOrder ||
      this.isSubmitting
    ) {
      return;
    }

    this.placeOrder.emit();
  }
}