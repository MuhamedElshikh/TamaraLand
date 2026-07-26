import { Component, Input } from '@angular/core';

/** Shows a lightweight loading indicator. */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.css'
})
export class LoadingSpinnerComponent {
  @Input() label = 'Loading';
  @Input() description = 'Please wait while we fetch the latest data.';
}
