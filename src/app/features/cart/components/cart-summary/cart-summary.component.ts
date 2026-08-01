import { Component, Input, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartResponse } from '../../../../core/models/domain.models';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  imports: [RouterLink ,DecimalPipe,TranslatePipe],
  templateUrl: './cart-summary.component.html',
  styleUrl: './cart-summary.component.css',
})
export class CartSummaryComponent {
  cart = input<CartResponse | null>(null);

  readonly estimatedTotal = computed(() => {
    const c = this.cart();
    if (!c) return 0;
    return Math.max(0, c.subTotal - c.discount);
  });

  get isEmpty(): boolean {
    return !this.cart() || this.cart()!.totalItems === 0;
  }

  onCheckoutClick(event: Event): void {
    if (this.isEmpty) event.preventDefault();
  }
}