import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductCardResponse } from '../../../../core/models/catalog.models';
import { CatalogService } from '../../../../core/services/catalog.service';
import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCardComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  private readonly router = inject(Router);

  @Input({ required: true }) product!: ProductCardResponse;
  @Input() fallbackImage = 'assets/placeholder-product.jpg';

  readonly isAdding = signal(false);
  // 'idle' | 'added' | 'error'
  readonly addState = signal<'idle' | 'added' | 'error'>('idle');

  readonly isInWishlist = signal(false);
  readonly isTogglingWishlist = signal(false);

  ngOnInit(): void {
    // ⚠️ ProductCardResponse الحقيقي معندوش isInWishlist خالص (بس ProductDetailsResponse)،
    // فمفيش طريقة نعرف حالة الويش ليست الأولية من هنا - بتبدأ false دايمًا لحد ما الباك إند يضيفها
    this.isInWishlist.set(false);
  }

  get imageUrl(): string {
    return this.product?.imageUrl || this.product?.imageUrl || this.fallbackImage;
  }

  get finalPrice(): number {
    return Number(this.product?.price ?? this.product?.originalPrice ?? 0);
  }

  get originalPrice(): number | null {
    const original = this.product?.originalPrice ?? this.product?.originalPrice;
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
    return Number(this.product?.rating ?? this.product?.rating ?? 0);
  }

  get reviewCount(): number {
    return Number(this.product?.rating ?? this.product?.reviewsCount ?? 0);
  }

  // ---- Wishlist ----

  toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.isTogglingWishlist()) return;

    const wasInWishlist = this.isInWishlist();
    this.isTogglingWishlist.set(true);
    this.isInWishlist.set(!wasInWishlist); // تحديث متفائل

    const request$ = wasInWishlist
      ? this.wishlistService.removeFromWishlist(this.product.id)
      : this.wishlistService.addToWishlist(this.product.id);

    request$.subscribe({
      next: (res) => {
        this.isTogglingWishlist.set(false);
        if (!res.success) this.isInWishlist.set(wasInWishlist); // رجّع الحالة لو فشل
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

    if (this.isAdding()) return;

    this.isAdding.set(true);
    this.addState.set('idle');

    // الكارد مفيهوش الـ variants، فلازم نجيب تفاصيل المنتج الأول عشان نعرف نضيف variant إيه
    this.catalogService.getProductById(this.product.id).subscribe({
      next: (res) => {
        const variants = res.data?.variants ?? [];
        const availableVariants = variants.filter((v) => v.stock > 0);

        if (availableVariants.length === 1) {
          // variant واحد متاح بس، نضيفه فورًا من غير ما نسيب الصفحة
          this.cartService.addItem({ productVariantId: availableVariants[0].id, quantity: 1 }).subscribe({
            next: (cartRes) => {
              this.isAdding.set(false);
              this.addState.set(cartRes.success ? 'added' : 'error');
              if (cartRes.success) setTimeout(() => this.addState.set('idle'), 1800);
            },
            error: () => {
              this.isAdding.set(false);
              this.addState.set('error');
            },
          });
        } else {
          // أكتر من variant متاح (ألوان/مقاسات مختلفة) أو مفيش حاجة متاحة أصلاً
          // نودّي المستخدم لصفحة المنتج يختار بنفسه
          this.isAdding.set(false);
          this.router.navigate(['/products', this.product.id]);
        }
      },
      error: () => {
        this.isAdding.set(false);
        this.addState.set('error');
      },
    });
  }
}