import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WishlistItemComponent } from '../../components/wishlist-item/wishlist-item.component';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [RouterLink, WishlistItemComponent, TranslatePipe],
  templateUrl: './wishlist.page.html',
  styleUrl: './wishlist.page.css',
})
export class WishlistPage implements OnInit {
  private readonly wishlistService = inject(WishlistService);

  readonly items = this.wishlistService.items;
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.wishlistService.getWishlist().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false),
    });
  }

  onItemRemoved(): void {
    // الـ WishlistService بيحدّث الـ signal لوحده جوه removeFromWishlist، مفيش حاجة إضافية مطلوبة هنا
  }
}