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
import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../shared/breadcrumbs.component/breadcrumbs.component';
import { ProductDetailsResponse } from '../../../../core/models/catalog.models';
import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe';
import { LocalizedFieldPipe } from '../../../../shared/pipes/localized-field.pipe';

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
export class ProductDetailsPage implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly toast = inject(ToastService);

  @ViewChild('relatedSliderTrack') relatedSliderTrack?: ElementRef<HTMLDivElement>;

  readonly canScrollPrev = signal(false);
  readonly canScrollNext = signal(true);
  readonly showStickyBar = signal(false);

  private readonly onWindowScrollBound = this.onWindowScroll.bind(this);

  ngAfterViewInit(): void {
    setTimeout(() => this.onRelatedSliderScroll(), 0);
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onWindowScrollBound, { passive: true });
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onWindowScrollBound);
    }
  }

  private onWindowScroll(): void {
    if (typeof window === 'undefined') return;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    this.showStickyBar.set(scrollY > 450);
  }

  scrollRelatedSlider(direction: 1 | -1): void {
    const track = this.relatedSliderTrack?.nativeElement;
    if (!track) return;

    const isRtl =
      document.dir === 'rtl' ||
      document.documentElement.dir === 'rtl' ||
      document.body.dir === 'rtl';
    const cardWidth = track.querySelector('.slider-item')?.clientWidth ?? 240;
    const gap = 16;
    const scrollAmount = (cardWidth + gap) * direction * (isRtl ? -1 : 1);

    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  onRelatedSliderScroll(): void {
    const track = this.relatedSliderTrack?.nativeElement;
    if (!track) return;

    const scrollLeft = Math.abs(track.scrollLeft);
    const maxScroll = track.scrollWidth - track.clientWidth;
    this.canScrollPrev.set(scrollLeft > 5);
    this.canScrollNext.set(scrollLeft < maxScroll - 5);
  }

  readonly product = signal<ProductDetailsResponse | null>(null);
  readonly selectedVariant = signal<{ color: string; size: string; variantId?: number; price?: number } | null>(null);

  readonly currentVariant = computed(() => {
    const current = this.product();
    const selected = this.selectedVariant();
    return (
      current?.variants?.find(item => item.id === selected?.variantId) ??
      current?.variants?.[0] ??
      null
    );
  });

  readonly finalPrice = computed(() => {
    const current = this.product();
    const variant = this.currentVariant();
    return Number(variant?.price ?? current?.price ?? 0);
  });

  readonly originalPrice = computed(() => {
    const current = this.product();
    const variant = this.currentVariant();
    return Number(variant?.originalPrice ?? current?.originalPrice ?? 0);
  });

  readonly hasDiscount = computed(() => {
    const finalPrice = this.finalPrice();
    const originalPrice = this.originalPrice();
    return originalPrice > 0 && finalPrice > 0 && finalPrice < originalPrice;
  });

  readonly discountPercent = computed(() => {
    const originalPrice = this.originalPrice();
    const finalPrice = this.finalPrice();
    if (originalPrice <= 0 || finalPrice >= originalPrice) return 0;
    return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
  });

  readonly isAddingToCart = signal(false);
  readonly cartMessage = signal<string | null>(null);

  // ✅ جديد: Stepper state — منفصل عن isAddingToCart عشان الـ Add الأول
  // (لما لسه مفيش سطر في الكارت) يفضل ليه الـ Loading الخاص بيه
  readonly isUpdatingQty = signal(false);

  readonly isInWishlist = signal(false);
  readonly isTogglingWishlist = signal(false);

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const current = this.product();
    const items: BreadcrumbItem[] = [{ label: 'Home', arabicLabel: 'الرئيسية', link: '/' }];
    if (current) {
      items.push({ label: current.categoryName, arabicLabel: current.arabicCategoryName });
      items.push({ label: current.brandName, arabicLabel: current.arabicBrandName });
    }
    return items;
  });

  readonly priceLabel = computed(() => {
    const price = this.finalPrice();
    if (!this.product() && price === 0) return 'Price available soon';
    return `EGP ${price.toLocaleString()}`;
  });

  readonly stock = computed(() => {
    const current = this.product();
    const variant = this.currentVariant();
    return Number(variant?.stock ?? (current?.inStock ? 1 : 0));
  });

  readonly rating = computed(() => Number(this.product()?.rating ?? 0));

  // ✅ جديد: بيدور على الـ Variant الحالي المختار جوا الكارت الفعلي (لو موجود)
  readonly cartItem = computed(() => {
    const variant = this.currentVariant();
    if (!variant) return null;

    return (
      this.cartService.cart()?.items.find(
        item => item.productVariantId === variant.id,
      ) ?? null
    );
  });

  // ✅ لو الـ Variant المختار موجود بالفعل في الكارت → نعرض Stepper بدل زرار Add
  readonly isInCart = computed(() => this.cartItem() !== null);

  readonly cartQuantity = computed(() => this.cartItem()?.quantity ?? 0);

  readonly isAtMaxStock = computed(() => {
    const item = this.cartItem();
    if (!item) return false;
    return item.quantity >= item.availableStock;
  });

  constructor() {
    this.route.data
      .pipe(takeUntilDestroyed())
      .subscribe(data => {
        const productData = data['product'] as ProductDetailsResponse | null;
        this.product.set(productData);
        this.isInWishlist.set(Boolean(productData?.isInWishlist));

        if (productData) {
          this.analyticsService.viewItem({
            id: productData.id,
            name: productData.name,
            category: productData.categoryName,
            brand: productData.brandName,
            price: productData.price,
            originalPrice: productData.originalPrice,
            discount: productData.originalPrice - productData.price,
          });
        }
      });

    // ✅ لو الكارت لسه متجابش (زي Deep-link أو Refresh على صفحة المنتج مباشرة)
    // نجيبه عشان الـ Stepper يقدر يعرف الحالة الصح من أول لحظة
    if (!this.cartService.cart()) {
      this.cartService.getCart().subscribe();
    }
  }

  onVariantSelected(selection: { color: string; size: string; variantId?: number; price?: number }): void {
    this.selectedVariant.set(selection);
  }

  addToCart(): void {
    const variantId = this.selectedVariant()?.variantId;
    if (!variantId) {
      this.cartMessage.set('product.selectVariant');
      this.toast.error('Please select a variant before adding to cart');
      return;
    }

    this.isAddingToCart.set(true);
    this.cartMessage.set(null);

    this.cartService.addItem({ productVariantId: variantId, quantity: 1 }).subscribe({
      next: () => {
        this.isAddingToCart.set(false);
        this.cartMessage.set('productDetails.successToadd');
        this.toast.success('Product added to cart successfully!');

        const prod = this.product()!;
        const variant = prod.variants.find(x => x.id === variantId);

        this.analyticsService.addToCart({
          id: prod.id,
          name: prod.name,
          category: prod.categoryName,
          brand: prod.brandName,
          variant: `variant?.color/{variant?.color} /variant?.color/{variant?.size}`,
          sku: variant?.sku,
          quantity: 1,
          price: this.selectedVariant()?.price ?? prod.price,
          originalPrice: variant?.originalPrice ?? prod.originalPrice,
          discount:
            (variant?.originalPrice ?? prod.originalPrice) -
            (this.selectedVariant()?.price ?? prod.price),
        });
      },
      error: () => {
        this.isAddingToCart.set(false);
        this.cartMessage.set('productDetails.faildToAdd');
        this.toast.error('An error occurred while adding to cart');
      },
    });
  }

  // ✅ جديد: زيادة الكمية — بنفس منطق cart-item.component
  increaseQuantity(): void {
    if (this.isUpdatingQty() || this.isAtMaxStock()) return;

    const item = this.cartItem();
    if (!item) return;

    this.changeQuantity(item.quantity + 1);
  }

  // ✅ جديد: تقليل الكمية — لو وصلت لصفر بيتشال من الكارت زي الـ Cart Item بالظبط
  decreaseQuantity(): void {
    if (this.isUpdatingQty()) return;

    const item = this.cartItem();
    if (!item) return;

    if (item.quantity <= 1) {
      this.removeFromCart();
      return;
    }

    this.changeQuantity(item.quantity - 1);
  }

  private changeQuantity(quantity: number): void {
    const variantId = this.currentVariant()?.id;
    if (!variantId) return;

    this.isUpdatingQty.set(true);

    this.cartService.updateItem({ productVariantId: variantId, quantity }).subscribe({
      next: () => {
        this.isUpdatingQty.set(false);
      },
      error: err => {
        this.isUpdatingQty.set(false);
        this.toast.error(extractErrorMessage(err, 'Could not update quantity.'));
      },
    });
  }

  private removeFromCart(): void {
    const variantId = this.currentVariant()?.id;
    if (!variantId) return;

    this.isUpdatingQty.set(true);

    this.cartService.removeItem(variantId).subscribe({
      next: () => {
        this.isUpdatingQty.set(false);
        this.toast.success('Item removed from cart');
      },
      error: err => {
        this.isUpdatingQty.set(false);
        this.toast.error(extractErrorMessage(err, 'Could not remove item from cart.'));
      },
    });
  }

  toggleWishlist(): void {
    const productId = this.product()?.id;
    if (!productId || this.isTogglingWishlist()) return;

    this.isTogglingWishlist.set(true);
    const wasInWishlist = this.isInWishlist();
    this.isInWishlist.set(!wasInWishlist);

    const request$ = wasInWishlist
      ? this.wishlistService.removeFromWishlist(productId)
      : this.wishlistService.addToWishlist(productId);

    request$.subscribe({
      next: response => {
        this.isTogglingWishlist.set(false);
        if (response.success) {
          const product = this.product();
          if (!product) return;

          if (wasInWishlist) {
            this.toast.success('Removed from wishlist');
            this.analyticsService.removeWishlist({
              id: product.id,
              name: product.name,
              category: product.categoryName,
              brand: product.brandName,
              price: product.price,
              originalPrice: product.originalPrice,
              discount: product.originalPrice - product.price,
            });
          } else {
            this.toast.success('Added to wishlist');
            this.analyticsService.wishlist({
              id: product.id,
              name: product.name,
              category: product.categoryName,
              brand: product.brandName,
              price: product.price,
              originalPrice: product.originalPrice,
              discount: product.originalPrice - product.price,
            });
          }
        } else {
          this.isInWishlist.set(wasInWishlist);
          this.toast.error(response.message || 'Failed to update wishlist');
        }
      },
      error: () => {
        this.isInWishlist.set(wasInWishlist);
        this.isTogglingWishlist.set(false);
        this.toast.error('An error occurred while updating wishlist');
      },
    });
  }
}