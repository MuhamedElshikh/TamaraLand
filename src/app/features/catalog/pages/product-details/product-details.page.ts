import { Component, computed, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductGalleryComponent } from '../../components/product-gallery/product-gallery.component';
import { ProductVariantSelectorComponent } from '../../components/product-variant-selector/product-variant-selector.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ReviewFormComponent } from '../../components/review-form/review-form.component';
import { ReviewListComponent } from '../../components/review-list/review-list.component';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../../../shared/breadcrumbs.component/breadcrumbs.component'; // عدّل المسار
import { ProductDetailsResponse } from '../../../../core/models/catalog.models';
import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { ToastService } from '../../../../shared/toast/toast.service';
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
    LocalizedNamePipe
  ],
  templateUrl: './product-details.page.html',
  styleUrl: './product-details.page.css',
})
export class ProductDetailsPage implements AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly toast = inject(ToastService);

  @ViewChild('relatedSliderTrack') relatedSliderTrack?: ElementRef<HTMLDivElement>;

  readonly canScrollPrev = signal(false);
  readonly canScrollNext = signal(true);
  readonly showStickyBar = signal(false);

  ngAfterViewInit(): void {
    setTimeout(() => this.onRelatedSliderScroll(), 0);
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onWindowScroll.bind(this), { passive: true });
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

    const isRtl = document.dir === 'rtl' || document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';
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
  readonly isAddingToCart = signal(false);
  readonly cartMessage = signal<string | null>(null);

  readonly isInWishlist = signal(false);
  readonly isTogglingWishlist = signal(false);

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const current = this.product();
  const items: BreadcrumbItem[] = [
    { label: 'Home', arabicLabel: 'الرئيسية', link: '/' }
  ];

  if (current) {
    items.push({
      label: current.categoryName,
      arabicLabel: current.arabicCategoryName
    });

    items.push({
      label: current.brandName,
      arabicLabel: current.arabicBrandName
    });
  }

  return items;
});
  readonly priceLabel = computed(() => {
    const current = this.product();
    const selected = this.selectedVariant();
    const variant = current?.variants?.find((item) => item.id === selected?.variantId) ?? current?.variants?.[0];
    const price = variant?.price ?? current?.price ?? current?.originalPrice ?? 0;

    if (!current && !variant) {
      return 'Price available soon';
    }

    return `EGP ${Number(price || 0).toLocaleString()}`;
  });

  readonly stock = computed(() => {
  const current = this.product();
  const selected = this.selectedVariant();

  const variant =
    current?.variants?.find(item => item.id === selected?.variantId)
    ?? current?.variants?.[0];

  return Number(variant?.stock ?? (current?.inStock ? 1 : 0));
});

  readonly rating = computed(() =>

Number(this.product()?.rating ?? 0)

);
  constructor() {
    this.route.data.subscribe((data) => {
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

  discount:
    productData.originalPrice - productData.price
});
      }
    });
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
    this.cartService.addItem({ productVariantId: variantId, quantity: 1 }).subscribe((response) => {
      this.isAddingToCart.set(false);
      if (response.success) {
        this.cartMessage.set('productDetails.successToadd');
        this.toast.success('Product added to cart successfully!');
        const prod = this.product()!;
        const variant = prod.variants.find(
    x => x.id === variantId
);

this.analyticsService.addToCart({

    id: prod.id,

    name: prod.name,

    category: prod.categoryName,

    brand: prod.brandName,

    variant:
        `${variant?.color} / ${variant?.size}`,

    sku: variant?.sku,

    quantity: 1,

    price:
        this.selectedVariant()?.price ??
        prod.price,

    originalPrice:
        variant?.originalPrice ??
        prod.originalPrice,

    discount:
        (variant?.originalPrice ?? prod.originalPrice) -
        (this.selectedVariant()?.price ?? prod.price)

});
      } else {
        this.cartMessage.set('productDetails.faildToAdd');
        this.toast.error(response.message || 'Failed to add product to cart');
      }
    }, (err) => {
      this.isAddingToCart.set(false);
      this.toast.error('An error occurred while adding to cart');
    });
  }

  toggleWishlist(): void {
    const productId = this.product()?.id;
    if (!productId || this.isTogglingWishlist()) return;

    this.isTogglingWishlist.set(true);
    const wasInWishlist = this.isInWishlist();
    // تحديث متفائل (optimistic) عشان الزرار يستجيب فورًا
    this.isInWishlist.set(!wasInWishlist);

    const request$ = wasInWishlist
      ? this.wishlistService.removeFromWishlist(productId)
      : this.wishlistService.addToWishlist(productId);

    request$.subscribe({
      next: (response) => {
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
              discount: product.originalPrice - product.price
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
              discount: product.originalPrice - product.price
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