import { Component, Input, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { CartItemResponse } from '../../../../core/models/domain.models';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslatePipe, LocalizedNamePipe],
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.css',
})
export class CartItemComponent {
  private readonly cartService = inject(CartService);
  private readonly toast = inject(ToastService);
  private readonly analytics = inject(AnalyticsService);

  @Input({ required: true }) item!: CartItemResponse;

  readonly isUpdating = signal(false);
  readonly isRemoving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly fallbackImage = './../../../../../assets/placeholder-product.jpg';

  // ✅ جديد: بيتحسب من الـ Input مباشرة، بيتحدث تلقائيًا كل مرة الكارت يتعمله refresh
  get isAtMaxStock(): boolean {
    return this.item.quantity >= this.item.availableStock;
  }

  increase(): void {
    // ✅ حماية إضافية على مستوى الفرونت — بلوك قبل ما نبعت الـ Request أصلًا
    if (this.isAtMaxStock) return;
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

    // ✅ الـ next معناه إن الكمية اتحدثت + الكارت اتعمل له refresh
    this.cartService.updateItem({ productVariantId: this.item.productVariantId, quantity }).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.toast.success('Quantity updated');
      },
      error: (err) => {
        this.isUpdating.set(false);
        const errorMsg = extractErrorMessage(err, 'Could not update quantity.');
        this.errorMessage.set(errorMsg);
        this.toast.error(errorMsg);
      },
    });
  }

  remove(): void {
    if (this.isRemoving()) return;

    this.isRemoving.set(true);

    this.cartService.removeItem(this.item.productVariantId).subscribe({
      next: () => {
        this.isRemoving.set(false);
        this.toast.success('Item removed from cart');
        this.analytics.removeFromCart({
          id: this.item.productId,
          name: this.item.productName,
          price: this.item.unitPrice,
          quantity: this.item.quantity,
        });
      },
      error: (err) => {
        this.isRemoving.set(false);
        const errorMsg = extractErrorMessage(err, 'Could not remove item from cart.');
        this.toast.error(errorMsg);
      },
    });
  }
}