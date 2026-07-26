import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserResponse } from '../../../../../../core/models/user.models';

@Component({
  selector: 'app-confirm-user-status-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-user-status-dialog.component.html',
  styleUrl: './confirm-user-status-dialog.component.css',
})
export class ConfirmUserStatusDialogComponent {

  open = input(false);

  user = input<UserResponse | null>(null);

  close = output<void>();

  confirm = output<UserResponse>();

  submit(): void {

    const currentUser = this.user();

    if (!currentUser) {
      return;
    }

    this.confirm.emit(currentUser);

  }

}