import { Component, Input } from '@angular/core';

/** Simple confirm-dialog shell for future Material dialog integration. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {
  @Input() eyebrow = 'Please confirm';
  @Input() title = 'Are you sure?';
  @Input() message = 'This action cannot be easily undone.';
  @Input() cancelLabel = 'Cancel';
  @Input() confirmLabel = 'Confirm';
}
