import {
  Component,
  computed,
  inject,
  signal,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ProductGalleryComponent } from '../../components/product-gallery/product-gallery.component';
import { ProductVariantSelectorComponent } from '../../components/product-variant-selector/product-variant-selector.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ReviewFormComponent } from '../../components/review-form/review-form.component';
import { ReviewListComponent } from '../../components/review-list/review-list.component';
import {
  BreadcrumbsComponent,
  BreadcrumbItem,
} from '../../../../shared/breadcrumbs.component/breadcrumbs.component';

import { ProductDetailsResponse } from '../../../../core/models/catalog.models';
import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';

import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe';
import { LocalizedFieldPipe } from '../../../../shared/pipes/localized-field.pipe';

interface VariantSelection {
  colorId: number;
  colorName: string;
  colorArabicName: string;

  sizeId: number;
  sizeName: string;

  variantId?: number;
  price?: number;
  stock?: number;
}

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LocalizedFieldPipe,
    ProductGalleryComponent,
    ProductVariantSelectorComponent,
    ProductCardComponent,
    ReviewFormComponent,
    ReviewListComponent,
    BreadcrumbsComponent,
    TranslatePipe,
    LocalizedNamePipe,
  ],
  templateUrl: './product-details.page.html',
  styleUrl: './product-details.page.css',
})
export class ProductDetailsPage
  implements AfterViewInit, OnDestroy
{
  private readonly route = inject(ActivatedRoute);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly toast = inject(ToastService);

  @ViewChild('relatedSliderTrack')
  relatedSliderTrack?: ElementRef<HTMLDivElement>;

  readonly canScrollPrev = signal(false);
  readonly canScrollNext = signal(true);
  readonly showStickyBar = signal(false);

  private readonly onWindowScrollBound =
    this.onWindowScroll.bind(this);

  // =========================================================
  // Lifecycle
  // =========================================================

  ngAfterViewInit(): void {
    setTimeout(
      () => this.onRelatedSliderScroll(),
      0
    );

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'scroll',
        this.onWindowScrollBound,
        { passive: true }
      );
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(
        'scroll',
        this.onWindowScrollBound
      );
    }
  }

  private onWindowScroll(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const scrollY =
      window.scrollY ||
      document.documentElement.scrollTop;

    this.showStickyBar.set(scrollY > 450);
  }

  // =========================================================
  // Related products slider
  // =========================================================

  scrollRelatedSlider(
    direction: 1 | -1
  ): void {
    const track =
      this.relatedSliderTrack?.nativeElement;

    if (!track) {
      return;
    }

    const isRtl =
      document.dir === 'rtl' ||
      document.documentElement.dir === 'rtl' ||
      document.body.dir === 'rtl';

    const cardWidth =
      track.querySelector(
        '.slider-item'
      )?.clientWidth ?? 240;

    const gap = 16;

    const scrollAmount =
      (cardWidth + gap) *
      direction *
      (isRtl ? -1 : 1);

    track.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  }

  onRelatedSliderScroll(): void {
    const track =
      this.relatedSliderTrack?.nativeElement;

    if (!track) {
      return;
    }

    const scrollLeft =
      Math.abs(track.scrollLeft);

    const maxScroll =
      track.scrollWidth -
      track.clientWidth;

    this.canScrollPrev.set(
      scrollLeft > 5
    );

    this.canScrollNext.set(
      scrollLeft <
      maxScroll - 5
    );
  }

  // =========================================================
  // Product
  // =========================================================

  readonly product =
    signal<ProductDetailsResponse | null>(
      null
    );

  readonly selectedVariant =
    signal<VariantSelection | null>(
      null
    );

  /**
   * The exact variant selected by
   * Color + Size.
   */
  readonly currentVariant =
    computed(() => {
      const current =
        this.product();

      const selected =
        this.selectedVariant();

      if (!current) {
        return null;
      }

      if (selected?.variantId) {
        return (
          current.variants?.find(
            variant =>
              variant.id ===
              selected.variantId
          ) ?? null
        );
      }

      return (
        current.variants?.[0] ??
        null
      );
    });

  // =========================================================
  // Pricing
  // =========================================================

  readonly finalPrice =
    computed(() => {
      const current =
        this.product();

      const variant =
        this.currentVariant();

      return Number(
        variant?.price ??
        current?.price ??
        0
      );
    });

  readonly originalPrice =
    computed(() => {
      const current =
        this.product();

      const variant =
        this.currentVariant();

      return Number(
        variant?.originalPrice ??
        current?.originalPrice ??
        0
      );
    });

  readonly hasDiscount =
    computed(() => {
      const finalPrice =
        this.finalPrice();

      const originalPrice =
        this.originalPrice();

      return (
        originalPrice > 0 &&
        finalPrice > 0 &&
        finalPrice < originalPrice
      );
    });

  readonly discountPercent =
    computed(() => {
      const originalPrice =
        this.originalPrice();

      const finalPrice =
        this.finalPrice();

      if (
        originalPrice <= 0 ||
        finalPrice >= originalPrice
      ) {
        return 0;
      }

      return Math.round(
        (
          (originalPrice -
            finalPrice) /
          originalPrice
        ) * 100
      );
    });

  readonly priceLabel =
    computed(() => {
      const price =
        this.finalPrice();

      if (
        !this.product() &&
        price === 0
      ) {
        return 'Price available soon';
      }

      return `EGP ${price.toLocaleString()}`;
    });

  // =========================================================
  // Stock
  // =========================================================

  readonly stock =
    computed(() => {
      const current =
        this.product();

      const variant =
        this.currentVariant();

      return Number(
        variant?.stock ??
        (current?.inStock
          ? 1
          : 0)
      );
    });

  readonly rating =
    computed(() =>
      Number(
        this.product()?.rating ??
        0
      )
    );

  // =========================================================
  // Cart
  // =========================================================

  readonly cartItem =
    computed(() => {
      const variant =
        this.currentVariant();

      if (!variant) {
        return null;
      }

      return (
        this.cartService
          .cart()
          ?.items.find(
            item =>
              item.productVariantId ===
              variant.id
          ) ?? null
      );
    });

  readonly isInCart =
    computed(
      () =>
        this.cartItem() !== null
    );

  readonly cartQuantity =
    computed(
      () =>
        this.cartItem()
          ?.quantity ?? 0
    );

  readonly isAtMaxStock =
    computed(() => {
      const item =
        this.cartItem();

      if (!item) {
        return false;
      }

      return (
        item.quantity >=
        item.availableStock
      );
    });

  readonly isAddingToCart =
    signal(false);

  readonly cartMessage =
    signal<string | null>(null);

  readonly isUpdatingQty =
    signal(false);

  // =========================================================
  // Wishlist
  // =========================================================

  readonly isInWishlist =
    signal(false);

  readonly isTogglingWishlist =
    signal(false);

  // =========================================================
  // Breadcrumbs
  // =========================================================

  readonly breadcrumbs =
    computed<BreadcrumbItem[]>(() => {
      const current =
        this.product();

      const items: BreadcrumbItem[] = [
        {
          label: 'Home',
          arabicLabel: 'الرئيسية',
          link: '/',
        },
      ];

      if (current) {
        items.push({
          label:
            current.categoryName,
          arabicLabel:
            current.arabicCategoryName,
        });

        items.push({
          label:
            current.brandName,
          arabicLabel:
            current.arabicBrandName,
        });
      }

      return items;
    });

  // =========================================================
  // Constructor
  // =========================================================

  constructor() {
    this.route.data
      .pipe(takeUntilDestroyed())
      .subscribe(data => {
        const productData =
          data['product'] as
          | ProductDetailsResponse
          | null;

        this.product.set(
          productData
        );

        this.isInWishlist.set(
          Boolean(
            productData?.isInWishlist
          )
        );

        if (productData) {
          this.analyticsService.viewItem({
            id: productData.id,
            name: productData.name,
            category:
              productData.categoryName,
            brand:
              productData.brandName,
            price:
              productData.price,
            originalPrice:
              productData.originalPrice,
            discount:
              productData.originalPrice -
              productData.price,
          });
        }
      });

    // Deep-link / refresh:
    // make sure cart state is available.
    if (!this.cartService.cart()) {
      this.cartService
        .getCart()
        .subscribe();
    }
  }

  // =========================================================
  // Variant selection
  // =========================================================

  onVariantSelected(
    selection: VariantSelection
  ): void {
    this.selectedVariant.set(
      selection
    );
  }

  // =========================================================
  // Add to cart
  // =========================================================

  addToCart(): void {
    const variantId =
      this.selectedVariant()
        ?.variantId;

    if (!variantId) {
      this.cartMessage.set(
        'product.selectVariant'
      );

      this.toast.error(
        'Please select a variant before adding to cart'
      );

      return;
    }

    this.isAddingToCart.set(
      true
    );

    this.cartMessage.set(null);

    this.cartService
      .addItem({
        productVariantId:
          variantId,
        quantity: 1,
      })
      .subscribe({
        next: () => {
          this.isAddingToCart.set(
            false
          );

          this.cartMessage.set(
            'productDetails.successToadd'
          );

          this.toast.success(
            'Product added to cart successfully!'
          );

          const prod =
            this.product();

          if (!prod) {
            return;
          }

          const variant =
            prod.variants.find(
              item =>
                item.id ===
                variantId
            );

          this.analyticsService.addToCart({
            id: prod.id,
            name: prod.name,
            category:
              prod.categoryName,
            brand:
              prod.brandName,

            variant: variant
              ? `${variant.colorName} / ${variant.sizeName}`
              : undefined,

            sku: variant?.sku,

            quantity: 1,

            price:
              variant?.price ??
              prod.price,

            originalPrice:
              variant?.originalPrice ??
              prod.originalPrice,

            discount:
              (
                variant?.originalPrice ??
                prod.originalPrice
              ) -
              (
                variant?.price ??
                prod.price
              ),
          });
        },

        error: () => {
          this.isAddingToCart.set(
            false
          );

          this.cartMessage.set(
            'productDetails.faildToAdd'
          );

          this.toast.error(
            'An error occurred while adding to cart'
          );
        },
      });
  }

  // =========================================================
  // Quantity
  // =========================================================

  increaseQuantity(): void {
    if (
      this.isUpdatingQty() ||
      this.isAtMaxStock()
    ) {
      return;
    }

    const item =
      this.cartItem();

    if (!item) {
      return;
    }

    this.changeQuantity(
      item.quantity + 1
    );
  }

  decreaseQuantity(): void {
    if (
      this.isUpdatingQty()
    ) {
      return;
    }

    const item =
      this.cartItem();

    if (!item) {
      return;
    }

    if (item.quantity <= 1) {
      this.removeFromCart();
      return;
    }

    this.changeQuantity(
      item.quantity - 1
    );
  }

  private changeQuantity(
    quantity: number
  ): void {
    const variantId =
      this.currentVariant()
        ?.id;

    if (!variantId) {
      return;
    }

    this.isUpdatingQty.set(
      true
    );

    this.cartService
      .updateItem({
        productVariantId:
          variantId,
        quantity,
      })
      .subscribe({
        next: () => {
          this.isUpdatingQty.set(
            false
          );
        },

        error: err => {
          this.isUpdatingQty.set(
            false
          );

          this.toast.error(
            extractErrorMessage(
              err,
              'Could not update quantity.'
            )
          );
        },
      });
  }

  private removeFromCart(): void {
    const variantId =
      this.currentVariant()
        ?.id;

    if (!variantId) {
      return;
    }

    this.isUpdatingQty.set(
      true
    );

    this.cartService
      .removeItem(variantId)
      .subscribe({
        next: () => {
          this.isUpdatingQty.set(
            false
          );

          this.toast.success(
            'Item removed from cart'
          );
        },

        error: err => {
          this.isUpdatingQty.set(
            false
          );

          this.toast.error(
            extractErrorMessage(
              err,
              'Could not remove item from cart.'
            )
          );
        },
      });
  }

  // =========================================================
  // Wishlist
  // =========================================================

  toggleWishlist(): void {
    const productId =
      this.product()?.id;

    if (
      !productId ||
      this.isTogglingWishlist()
    ) {
      return;
    }

    this.isTogglingWishlist.set(
      true
    );

    const wasInWishlist =
      this.isInWishlist();

    this.isInWishlist.set(
      !wasInWishlist
    );

    const request$ =
      wasInWishlist
        ? this.wishlistService.removeFromWishlist(
            productId
          )
        : this.wishlistService.addToWishlist(
            productId
          );

    request$.subscribe({
      next: response => {
        this.isTogglingWishlist.set(
          false
        );

        if (response.success) {
          const product =
            this.product();

          if (!product) {
            return;
          }

          if (wasInWishlist) {
            this.toast.success(
              'Removed from wishlist'
            );

            this.analyticsService.removeWishlist({
              id: product.id,
              name: product.name,
              category:
                product.categoryName,
              brand:
                product.brandName,
              price:
                product.price,
              originalPrice:
                product.originalPrice,
              discount:
                product.originalPrice -
                product.price,
            });
          } else {
            this.toast.success(
              'Added to wishlist'
            );

            this.analyticsService.wishlist({
              id: product.id,
              name: product.name,
              category:
                product.categoryName,
              brand:
                product.brandName,
              price:
                product.price,
              originalPrice:
                product.originalPrice,
              discount:
                product.originalPrice -
                product.price,
            });
          }
        } else {
          this.isInWishlist.set(
            wasInWishlist
          );

          this.toast.error(
            response.message ||
            'Failed to update wishlist'
          );
        }
      },

      error: () => {
        this.isInWishlist.set(
          wasInWishlist
        );

        this.isTogglingWishlist.set(
          false
        );

        this.toast.error(
          'An error occurred while updating wishlist'
        );
      },
    });
  }
}