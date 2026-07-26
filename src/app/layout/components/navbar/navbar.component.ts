import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { RouterLink , RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service'; // عدّل المسار
import { ThemeService } from '../../../core/theme/theme.service';
import { SearchOverlayComponent } from "../../../features/home/components/search-overlay.component/search-overlay.component";

type ThemeMode = 'dark' | 'light';

/** Primary navigation links for the storefront shell. */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SearchOverlayComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
   private auth = inject(AuthService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private themeService = inject(ThemeService);

  theme = this.themeService.theme;
  toggleTheme(): void {
    this.themeService.toggle();
  }

  menuOpen = signal(false);
  accountMenuOpen = signal(false);
  scrolled = signal(false);
  searchOpen = signal(false);

  toggleSearch(): void {
    this.searchOpen.update((v) => !v);
  }

  closeSearch(): void {
    this.searchOpen.set(false);
  }

  isLoggedIn = this.auth.isLoggedIn;
  profile = this.auth.profile;
  firstName = computed(() => this.profile()?.firstName ?? '');

  cart = this.cartService.cart;
  cartItemsCount = computed(() => this.cart()?.totalItems ?? 0);

  wishlistItems = this.wishlistService.items;
  wishlistCount = computed(() => this.wishlistItems().length);
  private wishlistFetched = signal(false);

  constructor() {
    // لو فيه توكن (مسجل دخول) بس البروفايل لسه معملوش fetch (زي بعد ريفريش للصفحة)، هاته
    effect(() => {
      if (this.isLoggedIn() && !this.profile()) {
        this.auth.getProfile().subscribe();
      }
    });

    // نفس الفكرة للكارت: هاته أول ما يبقى فيه توكن، وبعد كده بيتحدّث لوحده
    // تلقائيًا لأن كل عمليات إضافة/تعديل/حذف في CartService بتعمل refetch داخليًا
    effect(() => {
      if (this.isLoggedIn() && !this.cart()) {
        this.cartService.getCart().subscribe();
      }
    });

    // ونفسها بالظبط للويش ليست (بنستخدم flag منفصل مش .length===0،
    // عشان لو الويش ليست فاضية فعلاً هتفضل .length صفر وهيكرر النداء للأبد لو اعتمدنا عليه بس)
    effect(() => {
      if (this.isLoggedIn() && !this.wishlistFetched()) {
        this.wishlistFetched.set(true);
        this.wishlistService.getWishlist().subscribe();
      }
    });
  }

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  toggleAccountMenu() {
    this.accountMenuOpen.update((v) => !v);
  }

  closeAccountMenu() {
    this.accountMenuOpen.set(false);
  }

  logout() {
    this.closeAccountMenu();
    this.closeMenu();
    this.auth.logout(); // بيعمل navigate لـ /login لوحده
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 12);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.account-menu')) {
      this.closeAccountMenu();
    }
  }
}
