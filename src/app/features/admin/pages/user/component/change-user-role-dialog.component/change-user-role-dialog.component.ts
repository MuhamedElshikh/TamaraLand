import { Component, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserResponse } from '../../../../../../core/models/user.models';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-change-user-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './change-user-role-dialog.component.html',
  styleUrl: './change-user-role-dialog.component.css',
})
export class ChangeUserRoleDialogComponent {

  open = input(false);

  user = input<UserResponse | null>(null);

  close = output<void>();

  save = output<{
    id: number;
    role: string;
  }>();

  readonly role = signal('Customer');

  constructor() {

    effect(() => {

      const currentUser = this.user();

      if (currentUser) {
        this.role.set(currentUser.role);
      }

    });

  }

  submit(): void {

    const currentUser = this.user();

    if (!currentUser) {
      return;
    }

    this.save.emit({
      id: currentUser.id,
      role: this.role(),
    });

  }

}