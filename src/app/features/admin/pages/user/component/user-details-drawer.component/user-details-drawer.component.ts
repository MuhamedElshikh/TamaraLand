import { Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { UserResponse } from '../../../../../../core/models/user.models';
import { StatusBadgeComponent } from '../../../../components/status-badge/status-badge.component';

@Component({
  selector: 'app-user-details-drawer',
  standalone: true,
  imports: [CommonModule, DatePipe, StatusBadgeComponent],
  templateUrl: './user-details-drawer.component.html',
  styleUrl: './user-details-drawer.component.css',
})
export class UserDetailsDrawerComponent {

  user = input<UserResponse | null>(null);

  open = input(false);

  close = output<void>();

  changeRole = output<UserResponse>();

  toggleStatus = output<UserResponse>();

}