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
  private readonly cartService = inject(CartService);

  apply(): void {
    const trimmed = this.code().trim();
    if (!trimmed || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    // ✅ الـ next معناه إن الكوبون اتطبق + الكارت اتعمل له refresh
    this.cartService.applyCoupon({ code: trimmed }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.code.set('');
        this.toast.success('Coupon applied successfully!');
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
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success('Coupon removed successfully');
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toast.error('An error occurred while removing coupon');
      },
    });
  }
}
