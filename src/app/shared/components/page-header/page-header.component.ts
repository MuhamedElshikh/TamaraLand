import { Component, Input } from '@angular/core';

/** Reusable page heading for customer and admin pages. */
@Component({
  selector: 'app-page-header',
  standalone: true,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css'
})
export class PageHeaderComponent {
  @Input() eyebrow = 'TmaraLand';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() ctaLabel = '';
}
