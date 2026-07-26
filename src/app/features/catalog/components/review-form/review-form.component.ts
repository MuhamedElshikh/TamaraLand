import { Component, Input, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { extractErrorMessage } from '../../../../core/utils/error-message.util'; // عدّل المسار
import { ReviewService } from '../../../../core/services/review.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './review-form.component.html',
  styleUrl: './review-form.component.css',
})
export class ReviewFormComponent {
  private readonly reviewService = inject(ReviewService);
  private readonly auth = inject(AuthService);

  @Input() productId?: number;
  rating = signal(5);
  submitted = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  readonly isLoggedIn = this.auth.isLoggedIn;

  selectRating(value: number): void {
    this.rating.set(value);
  }

  submitReview(event: Event): void {
    event.preventDefault();
    if (!this.productId || this.isSubmitting()) {
      return;
    }

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const comment = String(formData.get('comment') || '').trim();

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.reviewService
      .createReview({ productId: this.productId, rating: this.rating(), comment: comment || undefined })
      .subscribe({
        next: () => {
          this.submitted.set(true);
          this.isSubmitting.set(false);
          form.reset();
          this.rating.set(5);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(extractErrorMessage(err, 'Something went wrong. Please try again.'));
          this.isSubmitting.set(false);
        },
      });
  }
}