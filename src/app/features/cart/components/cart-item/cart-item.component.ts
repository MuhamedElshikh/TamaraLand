import { Component, Input, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { CartItemResponse } from '../../../../core/models/domain.models';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AnalyticsService } from '../../../../core/services/analytics.service';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [RouterLink ,DecimalPipe,TranslatePipe],
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.css',
})
export class CartItemComponent {
  private readonly cartService = inject(CartService);

  @Input({ required: true }) item!: CartItemResponse;

  readonly isUpdating = signal(false);
  readonly isRemoving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly fallbackImage = 'assets/placeholder-product.jpg';
private readonly analytics = inject(AnalyticsService);
  increase(): void {
    this.updateQuantity(this.item.quantity + 1);
  }

  decrease(): void {
    if (this.item.quantity <= 1) return;
    this.updateQuantity(this.item.quantity - 1);
  }

  private updateQuantity(quantity: number): void {
    if (this.isUpdating()) return;

    this.isUpdating.set(true);
    this.errorMessage.set(null);

    this.cartService.updateItem({ productVariantId: this.item.productVariantId, quantity }).subscribe({
      next: (res) => {
        this.isUpdating.set(false);
        if (!res.success) this.errorMessage.set(res.message);
      },
      error: (err) => {
        this.isUpdating.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'Could not update quantity.'));
      },
    });
  }

  remove(): void {
  if (this.isRemoving()) return;

  this.isRemoving.set(true);

  this.cartService.removeItem(this.item.productVariantId).subscribe({
    next: (res) => {
      this.isRemoving.set(false);

      if (res.success) {
        this.analytics.removeFromCart({
          id: this.item.productId,
          name: this.item.productName,
          price: this.item.unitPrice,
          quantity: this.item.quantity
        });
      }
    },
    error: () => this.isRemoving.set(false),
  });
}
}