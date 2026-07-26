import { Component, Input } from '@angular/core';

/** Renders a five-star rating preview. */
@Component({
  selector: 'app-rating-stars',
  standalone: true,
  templateUrl: './rating-stars.component.html',
  styleUrl: './rating-stars.component.css'
})
export class RatingStarsComponent {
  @Input() rating = 0;
  @Input() reviewCount = 0;
  @Input() showCount = true;

  readonly stars = [1, 2, 3, 4, 5];

  get normalizedRating(): number {
    return Math.max(0, Math.min(5, Math.round(this.rating)));
  }

  get ariaLabel(): string {
    return `${this.rating.toFixed(1)} out of 5 stars`;
  }
}
