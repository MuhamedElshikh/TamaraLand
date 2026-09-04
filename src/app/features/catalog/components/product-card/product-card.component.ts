import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

import { ProductCardResponse } from '../../../../core/models/catalog.models';

import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';

import { ToastService } from '../../../../shared/toast/toast.service';

import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe';


@Component({
  selector: 'app-product-card',
  standalone: true,

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  imports: [
    CommonModule,
    RouterLink,
    TranslatePipe,
    LocalizedNamePipe,
  ],

  templateUrl:
    './product-card.component.html',

  styleUrl:
    './product-card.component.css',
})
export class ProductCardComponent
  implements OnInit {

  private readonly cartService =
    inject(CartService);

  private readonly wishlistService =
    inject(WishlistService);

  private readonly router =
    inject(Router);

  private readonly analytics =
    inject(AnalyticsService);

  private readonly toast =
    inject(ToastService);


  @Input({ required: true })
  product!: ProductCardResponse;


  @Input()
  fallbackImage =
    'assets/placeholder-product.jpg';


  @Input()
  variant:
    | 'default'
    | 'compact'
    | 'large'
    | 'wide'
    | 'editorial' = 'default';


  readonly isAdding =
    signal(false);

  readonly isUpdatingCart =
    signal(false);

  readonly isInWishlist =
    signal(false);

  readonly isTogglingWishlist =
    signal(false);


  ngOnInit(): void {
    this.isInWishlist.set(false);
  }


  /* =====================================================
     PRODUCT
     ===================================================== */

  get imageUrl(): string {
    return (
      this.product?.imageUrl ||
      this.fallbackImage
    );
  }


  get finalPrice(): number {
    return Number(
      this.product?.price ??
      this.product?.originalPrice ??
      0
    );
  }


  get originalPrice(): number | null {

    const value =
      this.product?.originalPrice;

    return value !== undefined &&
      value !== null
      ? Number(value)
      : null;
  }


  get hasDiscount(): boolean {

    const original =
      this.originalPrice;

    return (
      original !== null &&
      original > this.finalPrice
    );
  }


  get discountPercent(): number {

    const original =
      this.originalPrice;

    if (
      original === null ||
      original <= this.finalPrice
    ) {
      return 0;
    }

    return Math.round(
      (
        (original - this.finalPrice) /
        original
      ) * 100
    );
  }


  get ratingValue(): number {
    return Number(
      this.product?.rating ?? 0
    );
  }


  get reviewCount(): number {
    return Number(
      this.product?.reviewsCount ?? 0
    );
  }


  /* =====================================================
     VARIANTS
     ===================================================== */

  get hasSingleVariant(): boolean {

    return (
      this.product.variantsCount === 1 &&
      this.product.singleVariantId != null
    );
  }


  get isOutOfStock(): boolean {

    if (
      this.product?.inStock === false
    ) {
      return true;
    }

    if (this.hasSingleVariant) {

      return Number(
        this.product.singleVariantStock ?? 0
      ) <= 0;

    }

    return false;
  }


  /* =====================================================
     CART
     ===================================================== */

  get productCartItems() {

    return (
      this.cartService
        .cart()
        ?.items
        ?.filter(
          item =>
            item.productId ===
            this.product.id
        ) ?? []
    );
  }


  get isInCart(): boolean {
    return (
      this.productCartItems.length > 0
    );
  }


  get hasMultipleCartVariants(): boolean {
    return (
      this.productCartItems.length > 1
    );
  }


  get cartQuantity(): number {

    return this.productCartItems.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );
  }


  get isAtMaxStock(): boolean {

    if (
      this.productCartItems.length !== 1
    ) {
      return false;
    }

    const item =
      this.productCartItems[0];

    return (
      item.quantity >=
      item.availableStock
    );
  }


  /* =====================================================
     WISHLIST
     ===================================================== */

  toggleWishlist(event: Event): void {

    event.preventDefault();
    event.stopPropagation();


    if (
      this.isTogglingWishlist()
    ) {
      return;
    }


    const wasInWishlist =
      this.isInWishlist();


    this.isTogglingWishlist.set(true);

    this.isInWishlist.set(
      !wasInWishlist
    );


    const request$ =
      wasInWishlist
        ? this.wishlistService
            .removeFromWishlist(
              this.product.id
            )
        : this.wishlistService
            .addToWishlist(
              this.product.id
            );


    request$.subscribe({

      next: res => {

        this.isTogglingWishlist.set(
          false
        );


        if (!res.success) {

          this.isInWishlist.set(
            wasInWishlist
          );

          this.toast.error(
            res.message ||
            'Failed to update wishlist'
          );

          return;
        }


        if (wasInWishlist) {

          this.toast.success(
            'Removed from wishlist'
          );

          this.analytics.removeWishlist({
            id:
              this.product.id,

            name:
              this.product.name,

            category:
              this.product.categoryName,

            brand:
              this.product.brandName,

            price:
              this.product.price,

            originalPrice:
              this.product.originalPrice,

            discount:
              Math.max(
                0,
                this.product.originalPrice -
                this.product.price
              ),
          });

        } else {

          this.toast.success(
            'Added to wishlist'
          );

          this.analytics.wishlist({
            id:
              this.product.id,

            name:
              this.product.name,

            category:
              this.product.categoryName,

            brand:
              this.product.brandName,

            price:
              this.product.price,

            originalPrice:
              this.product.originalPrice,

            discount:
              Math.max(
                0,
                this.product.originalPrice -
                this.product.price
              ),
          });

        }

      },


      error: () => {

        this.isTogglingWishlist.set(
          false
        );

        this.isInWishlist.set(
          wasInWishlist
        );

        this.toast.error(
          'An error occurred while updating wishlist'
        );

      },

    });

  }


  /* =====================================================
     OPEN PRODUCT
     ===================================================== */

  openProduct(event: Event): void {

    event.preventDefault();
    event.stopPropagation();

    void this.router.navigate([
      '/products',
      this.product.id,
    ]);
  }


  /* =====================================================
     ADD TO CART
     ===================================================== */

  addToCart(event: Event): void {

    event.preventDefault();
    event.stopPropagation();


    if (this.isOutOfStock) {
      return;
    }


    if (this.hasSingleVariant) {

      this.addSingleVariantToCart();

      return;
    }


    void this.router.navigate([
      '/products',
      this.product.id,
    ]);

  }


  private addSingleVariantToCart(): void {

    if (
      this.isAdding() ||
      this.isOutOfStock ||
      !this.product.singleVariantId
    ) {
      return;
    }


    this.isAdding.set(true);


    this.cartService
      .addItem({
        productVariantId:
          this.product.singleVariantId,

        quantity: 1,
      })
      .subscribe({

        next: () => {

          this.isAdding.set(false);

          this.toast.success(
            'Added to cart'
          );


          this.analytics.addToCart({
            id:
              this.product.id,

            name:
              this.product.name,

            category:
              this.product.categoryName,

            brand:
              this.product.brandName,

            quantity: 1,

            price:
              this.product.price,

            originalPrice:
              this.product.originalPrice,

            discount:
              Math.max(
                0,
                this.product.originalPrice -
                this.product.price
              ),
          });

        },


        error: () => {

          this.isAdding.set(false);

          this.toast.error(
            'Failed to add to cart'
          );

        },

      });

  }


  /* =====================================================
     CART QUANTITY
     ===================================================== */

  increaseCartQuantity(
    event: Event
  ): void {

    event.preventDefault();
    event.stopPropagation();


    if (
      this.isUpdatingCart() ||
      !this.isInCart ||
      this.hasMultipleCartVariants ||
      this.isAtMaxStock
    ) {
      return;
    }


    this.isUpdatingCart.set(true);


    this.cartService
      .increaseProduct(
        this.product.id
      )
      .subscribe({

        next: () => {
          this.isUpdatingCart.set(false);
        },

        error: () => {

          this.isUpdatingCart.set(false);

          this.toast.error(
            'Failed to update cart'
          );

        },

      });

  }


  decreaseCartQuantity(
    event: Event
  ): void {

    event.preventDefault();
    event.stopPropagation();


    if (
      this.isUpdatingCart() ||
      !this.isInCart ||
      this.hasMultipleCartVariants
    ) {
      return;
    }


    this.isUpdatingCart.set(true);


    this.cartService
      .decreaseProduct(
        this.product.id
      )
      .subscribe({

        next: () => {
          this.isUpdatingCart.set(false);
        },

        error: () => {

          this.isUpdatingCart.set(false);

          this.toast.error(
            'Failed to update cart'
          );

        },

      });

  }

}