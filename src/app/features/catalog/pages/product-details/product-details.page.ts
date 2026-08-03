import { Component, computed, inject, signal } from '@angular/core';
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
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedNamePipe } from '../../../../shared/pipes/localized-name.pipe';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
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
export class ProductDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  private readonly analyticsService = inject(AnalyticsService);

  readonly product = signal<ProductDetailsResponse | null>(null);
  readonly selectedVariant = signal<{ color: string; size: string; variantId?: number; price?: number } | null>(null);
  readonly isAddingToCart = signal(false);
  readonly cartMessage = signal<string | null>(null);

  readonly isInWishlist = signal(false);
  readonly isTogglingWishlist = signal(false);

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const current = this.product();
    const items: BreadcrumbItem[] = [{ label: 'Home', link: '/' }];

    // ⚠️ مفيش categoryId في الموديل الجديد، فمينفعش نعمل لينك للفئة، بس نعرض اسمها كنص

  if (current) {
    items.push({
      label: current.arabicCategoryName || current.categoryName
    });

    items.push({
      label: current.arabicBrandName || current.brandName
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
      return;
    }

    this.isAddingToCart.set(true);
    this.cartMessage.set(null);
    this.cartService.addItem({ productVariantId: variantId, quantity: 1 }).subscribe((response) => {
      this.isAddingToCart.set(false);
      this.cartMessage.set(response.success ? 'productDetails.successToadd' : 'productDetails.faildToAdd');
      if (response.success && this.product()) {
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
      }
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
        if (response.success){
     const product = this.product();

if (!product) return;

this.analyticsService.wishlist({
  id: product.id,
  name: product.name,

  category: product.categoryName,
  brand: product.brandName,

  price: product.price,
  originalPrice: product.originalPrice,

  discount: product.originalPrice - product.price
});
this.isInWishlist.set(wasInWishlist); // رجّع الحالة لو فشل
        } 
        this.isTogglingWishlist.set(false);
      },
      error: () => {
        this.isInWishlist.set(wasInWishlist);
        this.isTogglingWishlist.set(false);
      },
    });
  }
}