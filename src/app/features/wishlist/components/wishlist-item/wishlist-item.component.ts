import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { WishlistItemResponse } from '../../../../core/models/domain.models';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-wishlist-item',
  standalone: true,
  imports: [RouterLink,DecimalPipe,TranslatePipe,LocalizedNamePipe],
  templateUrl: './wishlist-item.component.html',
  styleUrl: './wishlist-item.component.css',
})
export class WishlistItemComponent {
  private readonly wishlistService = inject(WishlistService);
  private readonly toast = inject(ToastService);
private readonly analytics = inject(AnalyticsService);
  @Input({ required: true }) item!: WishlistItemResponse;
  @Output() removed = new EventEmitter<number>();

  readonly isRemoving = signal(false);
  readonly fallbackImage = 'assets/placeholder-product.jpg';
  

  remove(): void {
    if (this.isRemoving()) return;

    this.isRemoving.set(true);
    this.wishlistService.removeFromWishlist(this.item.id).subscribe({
      next: (res) => {
        this.isRemoving.set(false);
       if (res.success) {
          this.toast.success('Item removed from wishlist');
          this.analytics.removeWishlist({
            id: this.item.id,
            name: this.item.name,
            category: this.item.categoryName,
            brand: this.item.brandName,
            price: this.item.price,
            originalPrice: this.item.originalPrice,
            discount: Math.max(
                0,
                this.item.originalPrice - this.item.price
            )
          });
          this.removed.emit(this.item.id);
       } else {
          this.toast.error(res.message || 'Failed to remove item');
       }
      },
      error: (err) => {
        this.isRemoving.set(false);
        this.toast.error('An error occurred while removing item');
      },
    });
  }
}