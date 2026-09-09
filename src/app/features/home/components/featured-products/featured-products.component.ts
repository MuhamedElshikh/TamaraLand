import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { CatalogService } from '../../../../core/services/catalog.service';
import { ProductCardResponse } from '../../../../core/models/catalog.models';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe';

import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { ToastService } from '../../../../shared/toast/toast.service';

type SlideDirection = 'next' | 'prev';
type ProductSlot =
  | 'arch-1'
  | 'arch-2'
  | 'arch-3'
  | 'square-1'
  | 'square-2'
  | 'square-3'
  | 'square-4'
  | 'offstage';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslatePipe,
    DecimalPipe,
    ScrollRevealDirective,
    LocalizedNamePipe,
  ],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.css',
})
export class FeaturedProductsComponent implements OnInit, OnDestroy {
  private readonly catalog = inject(CatalogService);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  private readonly analytics = inject(AnalyticsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly products = signal<ProductCardResponse[]>([]);
  readonly loading = signal(true);
  readonly windowStart = signal(0);
  readonly isTransitioning = signal(false);
  readonly transitionDirection = signal<SlideDirection>('next');

  readonly canSlide = computed(() => this.products().length > 3);

  /* Tracks which product ids are currently being added to the cart,
     so the hero "add to bag" button can show its own loading state
     without a signal per product. */
  private readonly addingProductIds = signal<ReadonlySet<number>>(new Set());

  /*
   * Wishlist state is tracked per product because this component renders
   * several product nodes from the same component instance.
   */
  private readonly wishlistProductIds =
    signal<ReadonlySet<number>>(new Set());

  private readonly togglingWishlistIds =
    signal<ReadonlySet<number>>(new Set());

  @ViewChildren('productNode', { read: ElementRef })
  private productNodes!: QueryList<ElementRef<HTMLElement>>;

  private finishTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    if (!this.cartService.cart()) {
      this.cartService.getCart().subscribe();
    }

    this.catalog.getFeaturedProducts().subscribe({
      next: (res) => {
        this.products.set(
          res.success && res.data ? [...res.data] : []
        );
        this.windowStart.set(0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    if (this.finishTimer) clearTimeout(this.finishTimer);
  }

  nextHero(): void {
    this.slide('next');
  }

  prevHero(): void {
    this.slide('prev');
  }

  /*
   * Real shared-element / FLIP motion:
   * the SAME product DOM node changes slot.
   *
   * Before:
   * P4 = square-1
   *
   * After:
   * P4 = arch-3
   *
   * We measure both rectangles and animate the existing node
   * from its old physical position to the new one.
   */
  private slide(direction: SlideDirection): void {
    const list = this.products();
    const total = list.length;

    if (this.isTransitioning() || total <= 3) return;

    const first = this.captureRects();

    this.transitionDirection.set(direction);
    this.isTransitioning.set(true);

    const nextStart =
      direction === 'next'
        ? (this.windowStart() + 1) % total
        : (this.windowStart() - 1 + total) % total;

    this.windowStart.set(nextStart);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const last = this.captureRects();
        this.playFlip(first, last);

        this.finishTimer = setTimeout(() => {
          this.isTransitioning.set(false);
        }, 680);
      });
    });
  }

  private captureRects(): Map<string, DOMRect> {
    const rects = new Map<string, DOMRect>();

    this.productNodes?.forEach((ref) => {
      const node = ref.nativeElement;
      const id = node.dataset['productId'];

      if (id) {
        rects.set(id, node.getBoundingClientRect());
      }
    });

    return rects;
  }

  private playFlip(
    first: Map<string, DOMRect>,
    last: Map<string, DOMRect>
  ): void {
    this.productNodes?.forEach((ref) => {
      const node = ref.nativeElement;
      const id = node.dataset['productId'];

      if (!id) return;

      const from = first.get(id);
      const to = last.get(id);

      if (!to) return;

      /*
       * Existing visible product:
       * First -> Last
       */
      if (from && from.width > 2 && from.height > 2) {
        const dx = from.left - to.left;
        const dy = from.top - to.top;
        const sx = from.width / Math.max(to.width, 1);
        const sy = from.height / Math.max(to.height, 1);

        node.animate(
          [
            {
              transform: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`,
              opacity: 1,
              offset: 0,
            },
            {
              transform: `translate3d(${dx * 0.16}px, ${dy * 0.16}px, 0) scale(${1 + (sx - 1) * 0.16}, ${1 + (sy - 1) * 0.16})`,
              opacity: 1,
              offset: 0.76,
            },
            {
              transform: 'translate3d(0,0,0) scale(1,1)',
              opacity: 1,
              offset: 1,
            },
          ],
          {
            duration: 640,
            easing: 'cubic-bezier(.16,1,.3,1)',
            fill: 'none',
          }
        );
      } else {
        /*
         * Newly entering product:
         * start just outside the side it comes from, then land
         * in the new slot. It never pops in from opacity:0.
         */
        const direction = this.transitionDirection() === 'next' ? 1 : -1;
        const x = direction * Math.max(to.width * 0.9, 90);

        node.animate(
          [
            {
              transform: `translate3d(${x}px,0,0) scale(.92)`,
              opacity: 0.15,
              offset: 0,
            },
            {
              transform: 'translate3d(0,0,0) scale(1)',
              opacity: 1,
              offset: 1,
            },
          ],
          {
            duration: 560,
            delay: 40,
            easing: 'cubic-bezier(.16,1,.3,1)',
            fill: 'none',
          }
        );
      }
    });
  }

  slotFor(product: ProductCardResponse): ProductSlot {
    const list = this.products();

    if (!list.length) return 'offstage';

    const index = list.findIndex((item) => item.id === product.id);
    if (index < 0) return 'offstage';

    const total = list.length;
    const relative = (index - this.windowStart() + total) % total;

    if (relative === 0) return 'arch-1';
    if (relative === 1) return 'arch-2';
    if (relative === 2) return 'arch-3';
    if (relative === 3) return 'square-1';
    if (relative === 4) return 'square-2';
    if (relative === 5) return 'square-3';
    if (relative === 6) return 'square-4';

    return 'offstage';
  }

  slotClass(product: ProductCardResponse): string {
    return `is-${this.slotFor(product)}`;
  }

  isVisible(product: ProductCardResponse): boolean {
    return this.slotFor(product) !== 'offstage';
  }

  /* =====================================================
     ADD TO CART
     Same rules as ProductCardComponent:
     - single-variant products are added directly
     - multi-variant products navigate to the PDP so the
       shopper can pick a variant
     - out-of-stock products can't be added
     ===================================================== */

  hasSingleVariant(product: ProductCardResponse): boolean {
    return (
      product.variantsCount === 1 &&
      product.singleVariantId != null
    );
  }

  isOutOfStock(product: ProductCardResponse): boolean {
    if (product.inStock === false) {
      return true;
    }

    if (this.hasSingleVariant(product)) {
      return Number(product.singleVariantStock ?? 0) <= 0;
    }

    return false;
  }

  isAddingProduct(productId: number): boolean {
    return this.addingProductIds().has(productId);
  }

  private setAdding(productId: number, value: boolean): void {
    this.addingProductIds.update((prev) => {
      const next = new Set(prev);
      if (value) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      return next;
    });
  }

  cartItem(product: ProductCardResponse) {
    if (!product.singleVariantId) {
      return null;
    }

    return (
      this.cartService
        .cart()
        ?.items.find(
          item => item.productVariantId === product.singleVariantId
        ) ?? null
    );
  }

  cartQuantity(product: ProductCardResponse): number {
    return this.cartItem(product)?.quantity ?? 0;
  }

  isAtMaxStock(product: ProductCardResponse): boolean {
    const item = this.cartItem(product);

    if (!item) {
      return false;
    }

    return item.quantity >= item.availableStock;
  }

  addToCart(event: Event, product: ProductCardResponse): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.isOutOfStock(product)) {
      return;
    }

    if (this.hasSingleVariant(product)) {
      this.addSingleVariantToCart(product);
      return;
    }

    void this.router.navigate(['/products', product.id]);
  }

  private addSingleVariantToCart(product: ProductCardResponse): void {
    if (
      this.isAddingProduct(product.id) ||
      this.isOutOfStock(product) ||
      this.isAtMaxStock(product) ||
      !product.singleVariantId
    ) {
      return;
    }

    this.setAdding(product.id, true);

    this.cartService
      .addItem({
        productVariantId: product.singleVariantId,
        quantity: 1,
      })
      .subscribe({
        next: () => {
          this.setAdding(product.id, false);
          this.toast.success('Added to cart');

          this.analytics.addToCart({
            id: product.id,
            name: product.name,
            category: product.categoryName,
            brand: product.brandName,
            quantity: 1,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: Math.max(
              0,
              product.originalPrice - product.price
            ),
          });
        },
        error: () => {
          this.setAdding(product.id, false);
          this.toast.error('Failed to add to cart');
        },
      });
  }
  increaseCartQuantity(
    event: Event,
    product: ProductCardResponse
  ): void {
    event.preventDefault();
    event.stopPropagation();

    const item = this.cartItem(product);

    if (
      !item ||
      !product.singleVariantId ||
      this.isAddingProduct(product.id) ||
      item.quantity >= item.availableStock
    ) {
      return;
    }

    this.setAdding(product.id, true);

    this.cartService
      .updateItem({
        productVariantId: product.singleVariantId,
        quantity: item.quantity + 1,
      })
      .subscribe({
        next: () => this.setAdding(product.id, false),
        error: () => {
          this.setAdding(product.id, false);
          this.toast.error('Failed to update cart');
        },
      });
  }

  decreaseCartQuantity(
    event: Event,
    product: ProductCardResponse
  ): void {
    event.preventDefault();
    event.stopPropagation();

    const item = this.cartItem(product);

    if (
      !item ||
      !product.singleVariantId ||
      this.isAddingProduct(product.id)
    ) {
      return;
    }

    this.setAdding(product.id, true);

    const request$ =
      item.quantity <= 1
        ? this.cartService.removeItem(product.singleVariantId)
        : this.cartService.updateItem({
            productVariantId: product.singleVariantId,
            quantity: item.quantity - 1,
          });

    request$.subscribe({
      next: () => this.setAdding(product.id, false),
      error: () => {
        this.setAdding(product.id, false);
        this.toast.error('Failed to update cart');
      },
    });
  }


  /* =====================================================
     WISHLIST
     Same optimistic add/remove behaviour as ProductCardComponent.
     State is tracked per product id because this component
     renders multiple cards at the same time.
     ===================================================== */

  isInWishlist(productId: number): boolean {
    return this.wishlistProductIds().has(productId);
  }

  isTogglingWishlist(productId: number): boolean {
    return this.togglingWishlistIds().has(productId);
  }

  private setWishlistProduct(productId: number, value: boolean): void {
    this.wishlistProductIds.update((prev) => {
      const next = new Set(prev);

      if (value) {
        next.add(productId);
      } else {
        next.delete(productId);
      }

      return next;
    });
  }

  private setTogglingWishlist(productId: number, value: boolean): void {
    this.togglingWishlistIds.update((prev) => {
      const next = new Set(prev);

      if (value) {
        next.add(productId);
      } else {
        next.delete(productId);
      }

      return next;
    });
  }

  toggleWishlist(
    event: Event,
    product: ProductCardResponse
  ): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.isTogglingWishlist(product.id)) {
      return;
    }

    const wasInWishlist =
      this.isInWishlist(product.id);

    this.setTogglingWishlist(product.id, true);

    /* Optimistic update — same behaviour as ProductCardComponent. */
    this.setWishlistProduct(
      product.id,
      !wasInWishlist
    );

    const request$ =
      wasInWishlist
        ? this.wishlistService.removeFromWishlist(product.id)
        : this.wishlistService.addToWishlist(product.id);

    request$.subscribe({
      next: (res) => {
        this.setTogglingWishlist(product.id, false);

        if (!res.success) {
          this.setWishlistProduct(
            product.id,
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
            id: product.id,
            name: product.name,
            category: product.categoryName,
            brand: product.brandName,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: Math.max(
              0,
              product.originalPrice - product.price
            ),
          });
        } else {
          this.toast.success(
            'Added to wishlist'
          );

          this.analytics.wishlist({
            id: product.id,
            name: product.name,
            category: product.categoryName,
            brand: product.brandName,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: Math.max(
              0,
              product.originalPrice - product.price
            ),
          });
        }
      },

      error: () => {
        this.setTogglingWishlist(product.id, false);

        this.setWishlistProduct(
          product.id,
          wasInWishlist
        );

        this.toast.error(
          'An error occurred while updating wishlist'
        );
      },
    });
  }


}