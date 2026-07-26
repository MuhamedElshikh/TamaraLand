import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { ReviewService } from '../../../../core/services/review.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ReviewResponse } from '../../../../core/models/domain.models';

@Component({
  selector: 'app-review-list',
  standalone: true,
  templateUrl: './review-list.component.html',
  styleUrl: './review-list.component.css',
})
export class ReviewListComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);
  private readonly auth = inject(AuthService);

  @Input() productId?: number;

  readonly reviews = signal<ReviewResponse[]>([]);
  readonly isLoading = signal(true);

  readonly editingReviewId = signal<number | null>(null);
  readonly editRating = signal(5);
  readonly editComment = signal('');
  readonly isSaving = signal(false);

  readonly currentUserId = computed(() => this.auth.profile()?.id ?? null);

  readonly totalReviews = computed(() => this.reviews().length);

  readonly averageRating = computed(() => {
    const items = this.reviews();
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, r) => acc + r.rating, 0);
    return sum / items.length;
  });

  readonly roundedAverage = computed(() => Math.round(this.averageRating()));

  // نسبة كل تقييم (5 نجوم، 4 نجوم...) من إجمالي الريفيوهات، لعرض الـ distribution bar
  readonly ratingDistribution = computed(() => {
    const items = this.reviews();
    const total = items.length || 1;
    return [5, 4, 3, 2, 1].map((star) => {
      const count = items.filter((r) => r.rating === star).length;
      return { star, count, percent: Math.round((count / total) * 100) };
    });
  });

  ngOnInit(): void {
    if (this.productId) {
      this.reviewService.getProductReviews(this.productId).subscribe((response) => {
        if (response.success && response.data) {
          this.reviews.set(response.data);
        }
        this.isLoading.set(false);
      });
    } else {
      this.isLoading.set(false);
    }
  }

  isOwnReview(review: ReviewResponse): boolean {
    return this.currentUserId() !== null && review.userId === this.currentUserId();
  }

  startEdit(review: ReviewResponse): void {
    this.editingReviewId.set(review.id);
    this.editRating.set(review.rating);
    this.editComment.set(review.comment || '');
  }

  cancelEdit(): void {
    this.editingReviewId.set(null);
  }

  saveEdit(review: ReviewResponse): void {
    this.isSaving.set(true);
    this.reviewService
      .updateReview(review.id, { rating: this.editRating(), comment: this.editComment() || undefined })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.reviews.update((items) =>
              items.map((r) => (r.id === review.id ? { ...r, rating: this.editRating(), comment: this.editComment() } : r))
            );
            this.editingReviewId.set(null);
          }
          this.isSaving.set(false);
        },
        error: () => this.isSaving.set(false),
      });
  }

  deleteReview(review: ReviewResponse): void {
    if (!confirm('Delete this review? This cannot be undone.')) return;

    this.reviewService.deleteReview(review.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.reviews.update((items) => items.filter((r) => r.id !== review.id));
        }
      },
    });
  }
}