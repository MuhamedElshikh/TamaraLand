import { Component, Input, inject, signal } from '@angular/core';
import { CartService } from '../../../../core/services/cart.service';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../../../../shared/toast/toast.service';

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

  private readonly toast = inject(ToastService);

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
          this.toast.success('Coupon applied successfully!');
        } else {
          this.errorMessage.set(res.message);
          this.toast.error(res.message || 'Failed to apply coupon');
          console.log(res.errors)
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMsg = extractErrorMessage(err, 'Could not apply this coupon.');
        this.errorMessage.set(errorMsg);
        this.toast.error(errorMsg);
      },
    });
  }

  removeCoupon(): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.cartService.removeCoupon().subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.toast.success('Coupon removed successfully');
        } else {
          this.errorMessage.set(res.message);
          this.toast.error(res.message || 'Failed to remove coupon');
        }
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toast.error('An error occurred while removing coupon');
      },
    });
  }
}