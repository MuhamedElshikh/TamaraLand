import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface AdminNavItem {
  label: string;
  link: string;
  icon: string;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css',
})
export class AdminSidebarComponent {

  @Input({ required: true })
  mobileMenuOpen = false;

  @Output()
  closeRequested = new EventEmitter<void>();

  readonly navItems: AdminNavItem[] = [
    { label: 'Dashboard', link: '/admin', icon: 'grid' },
    { label: 'Products', link: '/admin/products', icon: 'box' },
    { label: 'Categories', link: '/admin/categories', icon: 'layers' },
    { label: 'Brands', link: '/admin/brands', icon: 'tag' },
    { label: 'Orders', link: '/admin/orders', icon: 'receipt' },
    {label: 'Users',link: '/admin/users',icon: 'users'},
    { label: 'Coupons', link: '/admin/coupons', icon: 'ticket' },
    { label: 'Discounts', link: '/admin/discounts', icon: 'percent' },
    { label: 'Shipping Areas', link: '/admin/shipping-areas', icon: 'truck' },
    { label: 'Banners', link: '/admin/banners', icon: 'image' },
    { label: 'WhatsApp', link: '/admin/whatsapp', icon: 'whatsapp' },
  ];

  closeSidebar(): void {
    this.closeRequested.emit();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 992 && this.mobileMenuOpen) {
      this.closeSidebar();
    }
  }
}