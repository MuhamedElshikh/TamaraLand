import { Component, inject, signal, computed, OnInit,OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReviewService } from '../../../../core/services/review.service';
import { FeaturedReviewResponse } from '../../../../core/models/domain.models';


@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './testimonials-component.html',
  styleUrl: './testimonials-component.css',
})
export class TestimonialsComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);

  protected readonly loading = signal(true);
  protected readonly reviews = signal<FeaturedReviewResponse[]>([]);

  protected readonly stars = computed(() =>
    this.reviews().map((r) => ({
      ...r,
      starsArray: Array(5).fill(0).map((_, i) => i < r.rating),
    }))
  );

  ngOnInit(): void {
    this.reviewService.getFeaturedReviews(6).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.reviews.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
  ngOnDestroy(): void {
  this.stopAutoplay();
}
 activeReviewIndex = signal(0);

private autoplayInterval?: ReturnType<typeof setInterval>;

private readonly autoplayDelay = 4500;


/* =========================================================
   Carousel Position
   ========================================================= */

getPosition(index: number): 'left' | 'center' | 'right' | 'hidden' {

  const count = this.stars().length;

  if (count === 0) {
    return 'hidden';
  }

  const active = this.activeReviewIndex();

  /*
   * Current card
   */
  if (index === active) {
    return 'center';
  }

  /*
   * Previous card
   */
  const previous =
    (active - 1 + count) % count;

  if (index === previous) {
    return 'left';
  }

  /*
   * Next card
   */
  const next =
    (active + 1) % count;

  if (index === next) {
    return 'right';
  }

  return 'hidden';
}


/* =========================================================
   Navigation
   ========================================================= */

nextReview(): void {

  const count = this.stars().length;

  if (count <= 1) {
    return;
  }

  this.activeReviewIndex.update(index =>
    (index + 1) % count
  );

  this.restartAutoplay();
}


previousReview(): void {

  const count = this.stars().length;

  if (count <= 1) {
    return;
  }

  this.activeReviewIndex.update(index =>
    (index - 1 + count) % count
  );

  this.restartAutoplay();
}


goToReview(index: number): void {

  this.activeReviewIndex.set(index);

  this.restartAutoplay();
}


/* =========================================================
   Autoplay
   ========================================================= */

startAutoplay(): void {

  this.stopAutoplay();

  if (this.stars().length <= 1) {
    return;
  }

  this.autoplayInterval = setInterval(() => {

    this.activeReviewIndex.update(index =>
      (index + 1) % this.stars().length
    );

  }, this.autoplayDelay);
}


stopAutoplay(): void {

  if (this.autoplayInterval) {
    clearInterval(this.autoplayInterval);
    this.autoplayInterval = undefined;
  }
}


pauseTestimonials(): void {
  this.stopAutoplay();
}


resumeTestimonials(): void {
  this.startAutoplay();
}


restartAutoplay(): void {
  this.startAutoplay();
}
}