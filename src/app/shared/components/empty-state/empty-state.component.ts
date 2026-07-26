import { Component, Input } from '@angular/core';

/** Displays an empty state message and optional action button. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css'
})
export class EmptyStateComponent {
  @Input() eyebrow = 'Nothing here yet';
  @Input() title = 'No records found';
  @Input() description = 'Once data is available it will appear in this area.';
  @Input() actionLabel = '';
}
