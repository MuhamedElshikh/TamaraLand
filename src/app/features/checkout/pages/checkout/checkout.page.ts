import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CheckoutAddressComponent } from '../../components/checkout-address/checkout-address.component';
import { CheckoutShippingComponent } from '../../components/checkout-shipping/checkout-shipping.component';
import { CheckoutSummaryComponent } from '../../components/checkout-summary/checkout-summary.component';
import { CartService } from '../../../../core/services/cart.service';
import { OrderService } from '../../../../core/services/order.service';
import { AddressResponse, ShippingAreaItem } from '../../../../core/models/domain.models';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';
import { TranslatePipe } from '@ngx-translate/core';
import { AnalyticsService } from '../../../../core/services/analytics.service';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [RouterLink, CheckoutAddressComponent, CheckoutShippingComponent, CheckoutSummaryComponent,TranslatePipe],
  templateUrl: './checkout.page.html',
  styleUrl: './checkout.page.css',
})
export class CheckoutPage implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
private readonly analyticsService = inject(AnalyticsService);
  readonly cart = this.cartService.cart;
  readonly isLoadingCart = signal(true);

  readonly selectedAddress = signal<AddressResponse | null>(null);
  readonly selectedShippingArea = signal<ShippingAreaItem | null>(null);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly canPlaceOrder = computed(() => {
    return (
      !!this.selectedAddress() &&
      this.selectedAddress()!.isPhoneVerified &&
      !!this.selectedShippingArea() &&
      !!this.cart() &&
      this.cart()!.items.length > 0
    );
  });

  ngOnInit(): void {
    this.cartService.getCart().subscribe({
     next: () => {
  this.isLoadingCart.set(false);

  const cart = this.cart();

  if (cart) {
   this.analyticsService.beginCheckout(
  cart.items.map(item => ({
    id: item.productVariantId,
    name: item.productName,
    category: item.categoryName,
    brand: item.brandName,
    sku: item.variantSku,
    variant: `${item.color} / ${item.size}`,
    price: item.unitPrice,
    originalPrice: item.unitPrice / item.quantity,
    quantity: item.quantity
  })),
  cart.subTotal
);
  }
},

      error: () => this.isLoadingCart.set(false),
    });
  }

  onAddressSelected(address: AddressResponse | null): void {
    this.selectedAddress.set(address);
  }

  onAreaSelected(area: ShippingAreaItem | null): void {
    this.selectedShippingArea.set(area);
  }

  placeOrder(): void {
    const address = this.selectedAddress();
    const area = this.selectedShippingArea();
    if (!address || !area || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.orderService
      .checkout({
        addressId: address.id,
        shippingAreaId: area.id,
        paymentMethod: 0, // Cash — الطريقة الوحيدة المتاحة حاليًا
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
              const cart = this.cart();
 if (cart) {

      this.analyticsService.purchase(

        res.data.toString(),

        cart.subTotal,
        cart.couponCode ?? null,
        this.selectedShippingArea()!.shippingCost,
        cart.items.map(item => ({
          id: item.productVariantId,
          name: item.productName,
          price: item.unitPrice,
          quantity: item.quantity,
          category: item.categoryName,
          brand: item.brandName,
          variant: `${item.color} / ${item.size}`,
          sku: item.variantSku
        }))
      );

    }
          if (res.success && res.data) {
            this.router.navigate(['/orders', res.data], { queryParams: { placed: '1' } });
          } else {
            this.errorMessage.set(res.message);
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(extractErrorMessage(err, 'Could not place your order. Please try again.'));
        },
      });
  }
}