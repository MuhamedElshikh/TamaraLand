import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  Router,
  RouterLink,
} from '@angular/router';

import {
  CheckoutAddressComponent,
} from '../../components/checkout-address/checkout-address.component';

import {
  CheckoutShippingComponent,
} from '../../components/checkout-shipping/checkout-shipping.component';

import {
  CheckoutSummaryComponent,
} from '../../components/checkout-summary/checkout-summary.component';

import { CartService } from '../../../../core/services/cart.service';
import { OrderService } from '../../../../core/services/order.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';

import {
  AddressResponse,
} from '../../../../core/models/domain.models';

import {
  extractErrorMessage,
} from '../../../../core/utils/error-message.util';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [
    RouterLink,
    CheckoutAddressComponent,
    CheckoutShippingComponent,
    CheckoutSummaryComponent,
    TranslatePipe,
  ],
  templateUrl: './checkout.page.html',
  styleUrl: './checkout.page.css',
})
export class CheckoutPage
  implements OnInit
{
  private readonly cartService =
    inject(CartService);

  private readonly orderService =
    inject(OrderService);

  private readonly router =
    inject(Router);

  private readonly analyticsService =
    inject(AnalyticsService);

  readonly cart =
    this.cartService.cart;

  readonly isLoadingCart =
    signal(true);

  readonly selectedAddress =
    signal<AddressResponse | null>(
      null
    );

  readonly isSubmitting =
    signal(false);

  readonly errorMessage =
    signal<string | null>(null);

  readonly canPlaceOrder =
    computed(() => {
      const address =
        this.selectedAddress();

      const cart =
        this.cart();

      return (
        !!address &&
        address.isPhoneVerified &&
        address.isDeliveryAvailable &&
        !!cart &&
        cart.items.length > 0
      );
    });

  ngOnInit(): void {
    this.cartService
      .getCart()
      .subscribe({
        next: () => {
          this.isLoadingCart.set(
            false
          );

          const cart =
            this.cart();

          if (cart) {
            this.analyticsService.beginCheckout(
              cart.items.map(
                (item) => ({
                  id:
                    item.productVariantId,

                  name:
                    item.productName,

                  category:
                    item.categoryName,

                  brand:
                    item.brandName,

                  sku:
                    item.variantSku,

                  variant:
                    `${item.color} / ${item.size}`,

                  price:
                    item.unitPrice,

                  originalPrice:
                    item.unitPrice /
                    item.quantity,

                  quantity:
                    item.quantity,
                })
              ),
              cart.subTotal
            );
          }
        },

        error: () => {
          this.isLoadingCart.set(
            false
          );
        },
      });
  }

  onAddressSelected(
    address: AddressResponse | null
  ): void {
    this.selectedAddress.set(
      address
    );
  }

  placeOrder(): void {
    const address =
      this.selectedAddress();

    if (
      !address ||
      this.isSubmitting()
    ) {
      return;
    }

    this.isSubmitting.set(
      true
    );

    this.errorMessage.set(
      null
    );

    this.orderService
      .checkout({
        addressId:
          address.id,

        paymentMethod: 0,
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(
            false
          );

          if (
            !res.success ||
            !res.data
          ) {
            this.errorMessage.set(
              res.message
            );

            return;
          }

          const cart =
            this.cart();

          if (cart) {
            this.analyticsService.purchase(
              res.data.toString(),

              cart.subTotal,

              cart.couponCode ??
                null,

              address.shippingCost,

              cart.items.map(
                (item) => ({
                  id:
                    item.productVariantId,

                  name:
                    item.productName,

                  price:
                    item.unitPrice,

                  quantity:
                    item.quantity,

                  category:
                    item.categoryName,

                  brand:
                    item.brandName,

                  variant:
                    `${item.color} / ${item.size}`,

                  sku:
                    item.variantSku,
                })
              )
            );
          }

          this.router.navigate(
            ['/orders', res.data],
            {
              queryParams: {
                placed: '1',
              },
            }
          );
        },

        error: (err) => {
          this.isSubmitting.set(
            false
          );

          this.errorMessage.set(
            extractErrorMessage(
              err,
              'Could not place your order. Please try again.'
            )
          );
        },
      });
  }
}