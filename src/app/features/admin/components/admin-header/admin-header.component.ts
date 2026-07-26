import { Component, computed, EventEmitter, inject, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css',
})
export class AdminHeaderComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  @Output() menuClick = new EventEmitter<void>();

  readonly profile = this.auth.profile;

  readonly fullName = computed(() => {
    const p = this.profile();
    return p ? `${p.firstName} ${p.lastName}` : 'Admin';
  });

  logout(): void {
    this.auth.logout();
  }

  openMenu(): void {
    this.menuClick.emit();
  }
}