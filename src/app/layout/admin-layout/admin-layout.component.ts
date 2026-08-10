import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../../features/admin/components/admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from '../../features/admin/components/admin-header/admin-header.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    AdminSidebarComponent,
    AdminHeaderComponent,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {

  readonly mobileMenuOpen = signal(false);

  openSidebar(): void {
    this.mobileMenuOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeSidebar(): void {
    this.mobileMenuOpen.set(false);
    document.body.style.overflow = '';
  }

  toggleSidebar(): void {
    this.mobileMenuOpen()
      ? this.closeSidebar()
      : this.openSidebar();
  }
}
