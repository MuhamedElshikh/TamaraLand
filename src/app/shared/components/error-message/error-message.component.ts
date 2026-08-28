import { Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Renders backend-facing or validation errors. */
@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './error-message.component.html',
  styleUrl: './error-message.component.css'
})
export class ErrorMessageComponent {
  @Input() title = 'Something went wrong';
  @Input() message = 'The server returned an error response.';
  @Input() details = '';
}
