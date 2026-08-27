import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';


interface AdminNavItem {
  labelKey: string;
  link: string;
  icon: string;
}


@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    TranslateModule,
  ],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css',
})
export class AdminSidebarComponent {

  @Input({ required: true })
  mobileMenuOpen = false;


  @Output()
  closeRequested = new EventEmitter<void>();


  readonly navItems: AdminNavItem[] = [

    {
      labelKey: 'sidebar.dashboard',
      link: '/admin',
      icon: 'grid',
    },

    {
      labelKey: 'sidebar.products',
      link: '/admin/products',
      icon: 'box',
    },
{
  labelKey: 'sidebar.colors',
  link: '/admin/colors',
  icon: 'palette',
},

{
  labelKey: 'sidebar.sizes',
  link: '/admin/sizes',
  icon: 'ruler',
},
    {
      labelKey: 'sidebar.categories',
      link: '/admin/categories',
      icon: 'layers',
    },

    {
      labelKey: 'sidebar.brands',
      link: '/admin/brands',
      icon: 'tag',
    },

    {
      labelKey: 'sidebar.orders',
      link: '/admin/orders',
      icon: 'receipt',
    },

    {
      labelKey: 'sidebar.users',
      link: '/admin/users',
      icon: 'users',
    },

    {
      labelKey: 'sidebar.coupons',
      link: '/admin/coupons',
      icon: 'ticket',
    },

    {
      labelKey: 'sidebar.discounts',
      link: '/admin/discounts',
      icon: 'percent',
    },

    {
      labelKey: 'sidebar.shippingAreas',
      link: '/admin/shipping-areas',
      icon: 'truck',
    },

    {
      labelKey: 'sidebar.banners',
      link: '/admin/banners',
      icon: 'image',
    },

    {
      labelKey: 'sidebar.whatsapp',
      link: '/admin/whatsapp',
      icon: 'whatsapp',
    },

    {
      labelKey: 'sidebar.storeSettings',
      link: '/admin/store-settings',
      icon: 'settings',
    },

  ];


  closeSidebar(): void {
    this.closeRequested.emit();
  }


  @HostListener('window:resize')
  onResize(): void {

    if (
      window.innerWidth > 992 &&
      this.mobileMenuOpen
    ) {
      this.closeSidebar();
    }

  }

}