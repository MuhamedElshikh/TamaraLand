import { Component, Input, signal } from '@angular/core';
import { CartService } from '../../../../core/services/cart.service';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-coupon-form',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './coupon-form.component.html',
  styleUrl: './coupon-form.component.css',
})
export class CouponFormComponent {
  @Input() appliedCouponCode: string | null | undefined = null;

  readonly code = signal('');
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor(private readonly cartService: CartService) {}

  apply(): void {
    const trimmed = this.code().trim();
    if (!trimmed || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.cartService.applyCoupon({ code: trimmed }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.code.set('');
        } else {
          this.errorMessage.set(res.message);
          console.log(res.errors)
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'Could not apply this coupon.'));
            extractErrorMessage(err, 'Could not apply this coupon.')

      },
    });
  }

  removeCoupon(): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);

    this.cartService.removeCoupon().subscribe({
      next: () => this.isSubmitting.set(false),
      error: () => this.isSubmitting.set(false),
    });
  }
}