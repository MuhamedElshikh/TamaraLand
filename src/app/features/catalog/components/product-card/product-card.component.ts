import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductCardResponse } from '../../../../core/models/catalog.models';
import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe';
import { AnalyticsService } from '../../../../core/services/analytics.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink,TranslatePipe,LocalizedNamePipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCardComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);

  @Input({ required: true }) product!: ProductCardResponse;
  @Input() fallbackImage = 'assets/placeholder-product.jpg';

  readonly isAdding = signal(false);
  readonly addState = signal<'idle' | 'added' | 'error'>('idle');

  readonly isInWishlist = signal(false);
  readonly isTogglingWishlist = signal(false);

  ngOnInit(): void {
    this.isInWishlist.set(false);
  }

  get imageUrl(): string {
    return this.product?.imageUrl || this.fallbackImage;
  }

  get finalPrice(): number {
    return Number(this.product?.price ?? this.product?.originalPrice ?? 0);
  }

  get originalPrice(): number | null {
    const original = this.product?.originalPrice;
    return original !== undefined ? Number(original) : null;
  }

  get hasDiscount(): boolean {
    const original = this.originalPrice;
    return Boolean(original !== null && original > this.finalPrice);
  }

  get discountPercent(): number {
    const original = this.originalPrice;
    if (original === null || original <= this.finalPrice) {
      return 0;
    }

    return Math.round(((original - this.finalPrice) / original) * 100);
  }

  get ratingValue(): number {
    return Number(this.product?.rating ?? 0);
  }

  get reviewCount(): number {
    return Number(this.product?.reviewsCount ?? 0);
  }

  // ---- Wishlist ----

  toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.isTogglingWishlist()) return;

    const wasInWishlist = this.isInWishlist();
    this.isTogglingWishlist.set(true);
    this.isInWishlist.set(!wasInWishlist);

    const request$ = wasInWishlist
      ? this.wishlistService.removeFromWishlist(this.product.id)
      : this.wishlistService.addToWishlist(this.product.id);

    request$.subscribe({
    next: (res) => {
  this.isTogglingWishlist.set(false);

  if (res.success) {

    if (wasInWishlist) {
      this.analytics.removeWishlist({
        id: this.product.id,
        name: this.product.name,
        category: this.product.categoryName,
        brand: this.product.brandName,
        price: this.product.price,
        originalPrice: this.product.originalPrice,
        discount: Math.max(0,this.product.originalPrice - this.product.price
)
      });
    } else {
      this.analytics.wishlist({
        id: this.product.id,
        name: this.product.name,
        category: this.product.categoryName,
        brand: this.product.brandName,
        price: this.product.price,
        originalPrice: this.product.originalPrice,
        discount:Math.max(0,this.product.originalPrice - this.product.price
)
      });
    }

  } else {

    this.isInWishlist.set(wasInWishlist);

  }
},
      error: () => {
        this.isTogglingWishlist.set(false);
        this.isInWishlist.set(wasInWishlist);
      },
    });
  }

  // ---- Add to cart ----

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    // Navigate to Product Details page to select options & trigger Product Details view strictly on the details page
    void this.router.navigate(['/products', this.product.id]);
  }
}