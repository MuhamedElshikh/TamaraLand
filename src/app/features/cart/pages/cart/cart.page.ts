import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItemComponent } from '../../components/cart-item/cart-item.component';
import { CartSummaryComponent } from '../../components/cart-summary/cart-summary.component';
import { CouponFormComponent } from '../../components/coupon-form/coupon-form.component';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [RouterLink, CartItemComponent, CartSummaryComponent, CouponFormComponent],
  templateUrl: './cart.page.html',
  styleUrl: './cart.page.css',
})
export class CartPage implements OnInit {
  private readonly cartService = inject(CartService);

  readonly cart = this.cartService.cart;
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.cartService.getCart().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false),
    });
  }
}