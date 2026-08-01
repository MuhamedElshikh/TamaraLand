import { Component, Input, Output, EventEmitter, computed, input } from '@angular/core';
import { CartResponse, ShippingAreaItem } from '../../../../core/models/domain.models';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-checkout-summary',
  standalone: true,
    imports:[DecimalPipe,TranslatePipe],
  templateUrl: './checkout-summary.component.html',
  styleUrl: './checkout-summary.component.css',
})
export class CheckoutSummaryComponent {
  // بقوا signal-based inputs عشان الـ computed() تحت تقدر تتابعهم صح
  cart = input<CartResponse | null>(null);
  shippingArea = input<ShippingAreaItem | null>(null);

  @Input() canPlaceOrder = false;
  @Input() isSubmitting = false;
  @Input() errorMessage: string | null = null;

  @Output() placeOrder = new EventEmitter<void>();

  // 0 = Cash، باقي الطرق مش شغالة لسه (متاحة مستقبلًا)
  readonly paymentMethod = 0;

  readonly estimatedTotal = computed(() => {
    const c = this.cart();
    if (!c) return 0;
    const shippingCost = this.shippingArea()?.shippingCost ?? 0;
    return Math.max(0, c.subTotal - c.discount + shippingCost);
  });

  onPlaceOrder(): void {
    if (!this.canPlaceOrder || this.isSubmitting) return;
    this.placeOrder.emit();
  }
}