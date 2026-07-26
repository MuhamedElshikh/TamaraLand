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
import { WishlistService } from '../../../../core/services/wishlist.service'; // ⚠️ افتراض - عدّل حسب الشكل الحقيقي

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
  ],
  templateUrl: './product-details.page.html',
  styleUrl: './product-details.page.css',
})
export class ProductDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);

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
    if (current?.categoryName) {
      items.push({ label: current.categoryName });
    }

    items.push({ label: current?.name || 'Product' });
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

  readonly stockLabel = computed(() => {
    const current = this.product();
    const selected = this.selectedVariant();
    const variant = current?.variants?.find((item) => item.id === selected?.variantId) ?? current?.variants?.[0];
    const stock = variant?.stock ?? (current?.inStock ? 1 : 0);

    if (!current && !variant) {
      return 'Availability pending';
    }

    return stock > 0 ? `${stock} in stock` : 'Out of stock';
  });

  readonly ratingLabel = computed(() => {
    const current = this.product();
    const rating = current?.rating ?? current?.rating ?? 0;
    return `${Number(rating || 0).toFixed(1)}/5`;
  });

  constructor() {
    this.route.data.subscribe((data) => {
      const productData = data['product'] as ProductDetailsResponse | null;
      this.product.set(productData);
      this.isInWishlist.set(Boolean(productData?.isInWishlist));
    });
  }

  onVariantSelected(selection: { color: string; size: string; variantId?: number; price?: number }): void {
    this.selectedVariant.set(selection);
  }

  addToCart(): void {
    const variantId = this.selectedVariant()?.variantId;
    if (!variantId) {
      this.cartMessage.set('Please choose a valid variant first.');
      return;
    }

    this.isAddingToCart.set(true);
    this.cartMessage.set(null);
    this.cartService.addItem({ productVariantId: variantId, quantity: 1 }).subscribe((response) => {
      this.isAddingToCart.set(false);
      this.cartMessage.set(response.success ? 'Added to cart successfully.' : 'Could not add to cart right now.');
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
        if (!response.success) this.isInWishlist.set(wasInWishlist); // رجّع الحالة لو فشل
        this.isTogglingWishlist.set(false);
      },
      error: () => {
        this.isInWishlist.set(wasInWishlist);
        this.isTogglingWishlist.set(false);
      },
    });
  }
}