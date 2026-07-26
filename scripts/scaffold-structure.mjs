import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const root = join(process.cwd(), 'src/app');

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function write(path, content) {
  ensureDir(dirname(path));
  writeFileSync(path, content, 'utf8');
}

function component(path, selector, className, desc, extra = '') {
  write(
    path,
    `import { Component } from '@angular/core';
${extra}
/**
 * ${desc}
 * @see .ai/STRUCTURE.md
 */
@Component({
  selector: '${selector}',
  standalone: true,
  template: '<!-- ${className} - scaffold -->',
})
export class ${className} {}
`
  );
}

function page(path, selector, className, desc) {
  component(path, selector, className, desc);
}

function service(path, className, desc) {
  write(
    path,
    `import { Injectable } from '@angular/core';

/**
 * ${desc}
 * @see .ai/STRUCTURE.md
 */
@Injectable({ providedIn: 'root' })
export class ${className} {
  // TODO: implement
}
`
  );
}

function routes(path, exportName, routeEntries) {
  const lines = routeEntries.map((r) => `  ${r}`).join(',\n');
  write(
    path,
    `import { Routes } from '@angular/router';

/** Feature routes - lazy-loaded from app.routes.ts */
export const ${exportName}: Routes = [
${lines}
];
`
  );
}

function resolver(path, className, desc) {
  write(
    path,
    `import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

/**
 * ${desc}
 * @see .ai/STRUCTURE.md
 */
export const ${className}: ResolveFn<unknown> = (route, state) => {
  // TODO: resolve data before route activation
  return null;
};
`
  );
}

function pipe(path, className, desc) {
  write(
    path,
    `import { Pipe, PipeTransform } from '@angular/core';

/**
 * ${desc}
 * @see .ai/STRUCTURE.md
 */
@Pipe({ name: '${className.replace(/Pipe$/, '').replace(/([A-Z])/g, (_, c, i) => (i ? '-' : '') + c.toLowerCase())}', standalone: true })
export class ${className} implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return value;
  }
}
`
  );
}

function directive(path, className, selector, desc) {
  write(
    path,
    `import { Directive } from '@angular/core';

/**
 * ${desc}
 * @see .ai/STRUCTURE.md
 */
@Directive({ selector: '${selector}', standalone: true })
export class ${className} {}
`
  );
}

function interceptor(path, name, desc) {
  write(
    path,
    `import { HttpInterceptorFn } from '@angular/common/http';

/**
 * ${desc}
 * @see .ai/STRUCTURE.md
 */
export const ${name}: HttpInterceptorFn = (req, next) => {
  // TODO: implement
  return next(req);
};
`
  );
}

// ---- Layout ----
component(
  join(root, 'layout/customer-layout/customer-layout.component.ts'),
  'app-customer-layout',
  'CustomerLayoutComponent',
  'Shell layout for customer-facing pages (header, main, footer).',
  `import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';
import { FooterComponent } from '../components/footer/footer.component';
`
);
write(
  join(root, 'layout/customer-layout/customer-layout.component.ts'),
  `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';
import { FooterComponent } from '../components/footer/footer.component';

/**
 * Shell layout for customer-facing pages (header, main, footer).
 * @see .ai/STRUCTURE.md
 */
@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: \`
    <app-header />
    <main class="main-content"><router-outlet /></main>
    <app-footer />
  \`,
})
export class CustomerLayoutComponent {}
`
);

write(
  join(root, 'layout/admin-layout/admin-layout.component.ts'),
  `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../../features/admin/components/admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from '../../features/admin/components/admin-header/admin-header.component';

/**
 * Shell layout for admin panel pages.
 * @see .ai/STRUCTURE.md
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent, AdminHeaderComponent],
  template: \`
    <div class="admin-shell">
      <app-admin-sidebar />
      <div class="admin-main">
        <app-admin-header />
        <main><router-outlet /></main>
      </div>
    </div>
  \`,
})
export class AdminLayoutComponent {}
`
);

component(join(root, 'layout/components/header/header.component.ts'), 'app-header', 'HeaderComponent', 'Site header with nav, cart, wishlist, auth links.');
component(join(root, 'layout/components/footer/footer.component.ts'), 'app-footer', 'FooterComponent', 'Site footer with store info from StoreSettings.');
component(join(root, 'layout/components/navbar/navbar.component.ts'), 'app-navbar', 'NavbarComponent', 'Primary navigation links and mobile menu.');

// ---- Shared ----
const sharedComponents = [
  ['loading-spinner', 'LoadingSpinnerComponent', 'Loading indicator for async operations.'],
  ['empty-state', 'EmptyStateComponent', 'Placeholder when lists or data are empty.'],
  ['error-message', 'ErrorMessageComponent', 'Displays backend validation or API error messages.'],
  ['page-header', 'PageHeaderComponent', 'Reusable page title and breadcrumb area.'],
  ['confirm-dialog', 'ConfirmDialogComponent', 'Confirmation dialog for destructive actions.'],
  ['price-display', 'PriceDisplayComponent', 'Displays backend-calculated prices (never computes discounts).'],
  ['rating-stars', 'RatingStarsComponent', 'Read-only or interactive star rating display.'],
];
for (const [folder, className, desc] of sharedComponents) {
  component(
    join(root, `shared/components/${folder}/${folder}.component.ts`),
    `app-${folder}`,
    className,
    desc
  );
}
pipe(join(root, 'shared/pipes/currency-format.pipe.ts'), 'CurrencyFormatPipe', 'Formats currency values for display.');
directive(join(root, 'shared/directives/img-fallback.directive.ts'), 'ImgFallbackDirective', '[appImgFallback]', 'Fallback image when product image fails to load.');

write(
  join(root, 'shared/index.ts'),
  `/** Barrel exports for shared UI building blocks */
export { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
export { EmptyStateComponent } from './components/empty-state/empty-state.component';
export { ErrorMessageComponent } from './components/error-message/error-message.component';
export { PageHeaderComponent } from './components/page-header/page-header.component';
export { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
export { PriceDisplayComponent } from './components/price-display/price-display.component';
export { RatingStarsComponent } from './components/rating-stars/rating-stars.component';
export { CurrencyFormatPipe } from './pipes/currency-format.pipe';
export { ImgFallbackDirective } from './directives/img-fallback.directive';
`
);

// ---- Core scaffolds ----
interceptor(join(root, 'core/interceptors/error.interceptor.ts'), 'errorInterceptor', 'Maps API errors to user-visible messages.');
resolver(join(root, 'core/resolvers/store-settings.resolver.ts'), 'storeSettingsResolver', 'Preloads store settings before app shell renders.');
service(join(root, 'core/services/review.service.ts'), 'ReviewService', 'Customer review CRUD against backend API.');
service(join(root, 'core/services/shipping.service.ts'), 'ShippingService', 'Loads governorates/areas shipping lookup from backend.');

// ---- Home feature ----
page(join(root, 'features/home/pages/home/home.page.ts'), 'app-home-page', 'HomePage', 'Landing page with hero and featured products.');
component(join(root, 'features/home/components/hero-banner/hero-banner.component.ts'), 'app-hero-banner', 'HeroBannerComponent', 'Homepage hero section.');
component(join(root, 'features/home/components/featured-products/featured-products.component.ts'), 'app-featured-products', 'FeaturedProductsComponent', 'Featured or latest products grid.');
routes(join(root, 'features/home/home.routes.ts'), 'HOME_ROUTES', [
  `{ path: '', loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage) }`,
]);

// ---- Auth feature ----
const authPages = [
  ['login', 'LoginPage', 'User login form.'],
  ['register', 'RegisterPage', 'User registration form.'],
  ['forgot-password', 'ForgotPasswordPage', 'Request password reset email.'],
  ['reset-password', 'ResetPasswordPage', 'Reset password with token from email.'],
  ['profile', 'ProfilePage', 'View and update user profile (authGuard).'],
];
for (const [folder, className, desc] of authPages) {
  page(join(root, `features/auth/pages/${folder}/${folder}.page.ts`), `app-${folder}-page`, className, desc);
}
component(join(root, 'features/auth/components/auth-form-shell/auth-form-shell.component.ts'), 'app-auth-form-shell', 'AuthFormShellComponent', 'Shared wrapper for auth page forms.');
routes(join(root, 'features/auth/auth.routes.ts'), 'AUTH_ROUTES', [
  `{ path: 'login', loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage) }`,
  `{ path: 'register', loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage) }`,
  `{ path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage) }`,
  `{ path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password.page').then(m => m.ResetPasswordPage) }`,
  `{ path: 'profile', canActivate: [authGuard], loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage) }`,
]);

// ---- Catalog feature ----
const catalogPages = [
  ['product-list', 'ProductListPage', 'Browse all products with filters.'],
  ['product-details', 'ProductDetailsPage', 'Single product with variants, images, reviews.'],
  ['category-products', 'CategoryProductsPage', 'Products filtered by category.'],
  ['brand-products', 'BrandProductsPage', 'Products filtered by brand.'],
];
for (const [folder, className, desc] of catalogPages) {
  page(join(root, `features/catalog/pages/${folder}/${folder}.page.ts`), `app-${folder.replace(/-/g, '-')}-page`, className, desc);
}
const catalogComponents = [
  ['product-card', 'ProductCardComponent', 'Product summary card for grids.'],
  ['product-gallery', 'ProductGalleryComponent', 'Product image gallery.'],
  ['product-filters', 'ProductFiltersComponent', 'Category, brand, price filters UI.'],
  ['product-variant-selector', 'ProductVariantSelectorComponent', 'Color/size variant picker.'],
  ['review-list', 'ReviewListComponent', 'Latest product reviews list.'],
  ['review-form', 'ReviewFormComponent', 'Create/edit product review form.'],
];
for (const [folder, className, desc] of catalogComponents) {
  component(join(root, `features/catalog/components/${folder}/${folder}.component.ts`), `app-${folder}`, className, desc);
}
resolver(join(root, 'features/catalog/resolvers/product-details.resolver.ts'), 'productDetailsResolver', 'Preloads product details before ProductDetailsPage.');
routes(join(root, 'features/catalog/catalog.routes.ts'), 'CATALOG_ROUTES', [
  `{ path: 'products', loadComponent: () => import('./pages/product-list/product-list.page').then(m => m.ProductListPage) }`,
  `{ path: 'products/:id', resolve: { product: productDetailsResolver }, loadComponent: () => import('./pages/product-details/product-details.page').then(m => m.ProductDetailsPage) }`,
  `{ path: 'categories/:id', loadComponent: () => import('./pages/category-products/category-products.page').then(m => m.CategoryProductsPage) }`,
  `{ path: 'brands/:id', loadComponent: () => import('./pages/brand-products/brand-products.page').then(m => m.BrandProductsPage) }`,
]);

// ---- Cart feature ----
page(join(root, 'features/cart/pages/cart/cart.page.ts'), 'app-cart-page', 'CartPage', 'Shopping cart with items, coupon, subtotal.');
component(join(root, 'features/cart/components/cart-item/cart-item.component.ts'), 'app-cart-item', 'CartItemComponent', 'Single cart line item.');
component(join(root, 'features/cart/components/cart-summary/cart-summary.component.ts'), 'app-cart-summary', 'CartSummaryComponent', 'Cart totals from backend (subtotal, discount).');
component(join(root, 'features/cart/components/coupon-form/coupon-form.component.ts'), 'app-coupon-form', 'CouponFormComponent', 'Apply/remove coupon form.');
routes(join(root, 'features/cart/cart.routes.ts'), 'CART_ROUTES', [
  `{ path: '', canActivate: [authGuard], loadComponent: () => import('./pages/cart/cart.page').then(m => m.CartPage) }`,
]);

// ---- Checkout feature ----
page(join(root, 'features/checkout/pages/checkout/checkout.page.ts'), 'app-checkout-page', 'CheckoutPage', 'Checkout flow: address, shipping, payment.');
component(join(root, 'features/checkout/components/checkout-address/checkout-address.component.ts'), 'app-checkout-address', 'CheckoutAddressComponent', 'Select or add delivery address.');
component(join(root, 'features/checkout/components/checkout-shipping/checkout-shipping.component.ts'), 'app-checkout-shipping', 'CheckoutShippingComponent', 'Governorate/area dropdowns from shipping lookup.');
component(join(root, 'features/checkout/components/checkout-summary/checkout-summary.component.ts'), 'app-checkout-summary', 'CheckoutSummaryComponent', 'Order summary with backend-calculated totals.');
routes(join(root, 'features/checkout/checkout.routes.ts'), 'CHECKOUT_ROUTES', [
  `{ path: '', canActivate: [authGuard], loadComponent: () => import('./pages/checkout/checkout.page').then(m => m.CheckoutPage) }`,
]);

// ---- Orders feature ----
page(join(root, 'features/orders/pages/order-list/order-list.page.ts'), 'app-order-list-page', 'OrderListPage', 'Customer order history.');
page(join(root, 'features/orders/pages/order-details/order-details.page.ts'), 'app-order-details-page', 'OrderDetailsPage', 'Single order with items, shipping, status.');
component(join(root, 'features/orders/components/order-card/order-card.component.ts'), 'app-order-card', 'OrderCardComponent', 'Order summary card for list view.');
component(join(root, 'features/orders/components/order-items/order-items.component.ts'), 'app-order-items', 'OrderItemsComponent', 'Order line items table.');
component(join(root, 'features/orders/components/order-status/order-status.component.ts'), 'app-order-status', 'OrderStatusComponent', 'Order status badge/stepper.');
routes(join(root, 'features/orders/orders.routes.ts'), 'ORDERS_ROUTES', [
  `{ path: '', canActivate: [authGuard], loadComponent: () => import('./pages/order-list/order-list.page').then(m => m.OrderListPage) }`,
  `{ path: ':id', canActivate: [authGuard], loadComponent: () => import('./pages/order-details/order-details.page').then(m => m.OrderDetailsPage) }`,
]);

// ---- Wishlist feature ----
page(join(root, 'features/wishlist/pages/wishlist/wishlist.page.ts'), 'app-wishlist-page', 'WishlistPage', 'Customer wishlist.');
component(join(root, 'features/wishlist/components/wishlist-item/wishlist-item.component.ts'), 'app-wishlist-item', 'WishlistItemComponent', 'Single wishlist product row.');
routes(join(root, 'features/wishlist/wishlist.routes.ts'), 'WISHLIST_ROUTES', [
  `{ path: '', canActivate: [authGuard], loadComponent: () => import('./pages/wishlist/wishlist.page').then(m => m.WishlistPage) }`,
]);

// ---- Addresses feature ----
page(join(root, 'features/addresses/pages/address-list/address-list.page.ts'), 'app-address-list-page', 'AddressListPage', 'Manage saved delivery addresses.');
component(join(root, 'features/addresses/components/address-form/address-form.component.ts'), 'app-address-form', 'AddressFormComponent', 'Add/edit address with governorate/area dropdowns.');
component(join(root, 'features/addresses/components/address-card/address-card.component.ts'), 'app-address-card', 'AddressCardComponent', 'Display single saved address.');
routes(join(root, 'features/addresses/addresses.routes.ts'), 'ADDRESSES_ROUTES', [
  `{ path: '', canActivate: [authGuard], loadComponent: () => import('./pages/address-list/address-list.page').then(m => m.AddressListPage) }`,
]);

// ---- Admin feature ----
const adminPages = [
  ['dashboard', 'AdminDashboardPage', 'Admin overview and quick stats.'],
  ['categories', 'AdminCategoriesPage', 'CRUD categories.'],
  ['brands', 'AdminBrandsPage', 'CRUD brands.'],
  ['products', 'AdminProductsPage', 'List and manage products.'],
  ['product-form', 'AdminProductFormPage', 'Create/edit product.'],
  ['discounts', 'AdminDiscountsPage', 'Manage product/category/brand discounts.'],
  ['coupons', 'AdminCouponsPage', 'Manage coupons.'],
  ['shipping-areas', 'AdminShippingAreasPage', 'Manage shipping areas and costs.'],
  ['store-settings', 'AdminStoreSettingsPage', 'Edit store settings.'],
  ['orders', 'AdminOrdersPage', 'List all orders.'],
  ['order-detail', 'AdminOrderDetailPage', 'View/update order status workflow.'],
];
for (const [folder, className, desc] of adminPages) {
  page(join(root, `features/admin/pages/${folder}/${folder}.page.ts`), `app-admin-${folder}-page`, className, desc);
}
const adminComponents = [
  ['admin-sidebar', 'AdminSidebarComponent', 'Admin navigation sidebar.'],
  ['admin-header', 'AdminHeaderComponent', 'Admin top bar.'],
  ['data-table', 'DataTableComponent', 'Reusable admin data table.'],
  ['status-badge', 'StatusBadgeComponent', 'Order/status badge for admin views.'],
];
for (const [folder, className, desc] of adminComponents) {
  component(join(root, `features/admin/components/${folder}/${folder}.component.ts`), `app-${folder}`, className, desc);
}
routes(join(root, 'features/admin/admin.routes.ts'), 'ADMIN_ROUTES', [
  `{ path: '', pathMatch: 'full', redirectTo: 'dashboard' }`,
  `{ path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.AdminDashboardPage) }`,
  `{ path: 'categories', loadComponent: () => import('./pages/categories/categories.page').then(m => m.AdminCategoriesPage) }`,
  `{ path: 'brands', loadComponent: () => import('./pages/brands/brands.page').then(m => m.AdminBrandsPage) }`,
  `{ path: 'products', loadComponent: () => import('./pages/products/products.page').then(m => m.AdminProductsPage) }`,
  `{ path: 'products/new', loadComponent: () => import('./pages/product-form/product-form.page').then(m => m.AdminProductFormPage) }`,
  `{ path: 'products/:id/edit', loadComponent: () => import('./pages/product-form/product-form.page').then(m => m.AdminProductFormPage) }`,
  `{ path: 'discounts', loadComponent: () => import('./pages/discounts/discounts.page').then(m => m.AdminDiscountsPage) }`,
  `{ path: 'coupons', loadComponent: () => import('./pages/coupons/coupons.page').then(m => m.AdminCouponsPage) }`,
  `{ path: 'shipping-areas', loadComponent: () => import('./pages/shipping-areas/shipping-areas.page').then(m => m.AdminShippingAreasPage) }`,
  `{ path: 'store-settings', loadComponent: () => import('./pages/store-settings/store-settings.page').then(m => m.AdminStoreSettingsPage) }`,
  `{ path: 'orders', loadComponent: () => import('./pages/orders/orders.page').then(m => m.AdminOrdersPage) }`,
  `{ path: 'orders/:id', loadComponent: () => import('./pages/order-detail/order-detail.page').then(m => m.AdminOrderDetailPage) }`,
]);

// Fix route files that need imports
const catalogRoutesContent = `import { Routes } from '@angular/router';
import { productDetailsResolver } from './resolvers/product-details.resolver';

/** Feature routes - lazy-loaded from app.routes.ts */
export const CATALOG_ROUTES: Routes = [
  { path: 'products', loadComponent: () => import('./pages/product-list/product-list.page').then(m => m.ProductListPage) },
  { path: 'products/:id', resolve: { product: productDetailsResolver }, loadComponent: () => import('./pages/product-details/product-details.page').then(m => m.ProductDetailsPage) },
  { path: 'categories/:id', loadComponent: () => import('./pages/category-products/category-products.page').then(m => m.CategoryProductsPage) },
  { path: 'brands/:id', loadComponent: () => import('./pages/brand-products/brand-products.page').then(m => m.BrandProductsPage) },
];
`;
write(join(root, 'features/catalog/catalog.routes.ts'), catalogRoutesContent);

const authRoutesContent = `import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

/** Feature routes - lazy-loaded from app.routes.ts */
export const AUTH_ROUTES: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage) },
  { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage) },
  { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password.page').then(m => m.ResetPasswordPage) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage) },
];
`;
write(join(root, 'features/auth/auth.routes.ts'), authRoutesContent);

for (const [file, guardImport] of [
  ['features/cart/cart.routes.ts', 'CART_ROUTES'],
  ['features/checkout/checkout.routes.ts', 'CHECKOUT_ROUTES'],
  ['features/orders/orders.routes.ts', 'ORDERS_ROUTES'],
  ['features/wishlist/wishlist.routes.ts', 'WISHLIST_ROUTES'],
  ['features/addresses/addresses.routes.ts', 'ADDRESSES_ROUTES'],
]) {
  const name = guardImport;
  const pathSuffix = file.split('/')[1].replace('.routes.ts', '');
  const pageMap = {
    cart: "''",
    checkout: "''",
    orders: "''",
    wishlist: "''",
    addresses: "''",
  };
  const extra = pathSuffix === 'orders' ? `\n  { path: ':id', canActivate: [authGuard], loadComponent: () => import('./pages/order-details/order-details.page').then(m => m.OrderDetailsPage) },` : '';
  write(
    join(root, file),
    `import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const ${name}: Routes = [
  { path: ${pageMap[pathSuffix]}, canActivate: [authGuard], loadComponent: () => import('./pages/${pathSuffix === 'orders' ? 'order-list/order-list' : pathSuffix}/${pathSuffix === 'orders' ? 'order-list' : pathSuffix}.page').then(m => m.${pathSuffix === 'cart' ? 'CartPage' : pathSuffix === 'checkout' ? 'CheckoutPage' : pathSuffix === 'orders' ? 'OrderListPage' : pathSuffix === 'wishlist' ? 'WishlistPage' : 'AddressListPage'}) },${extra}
];
`
  );
}

console.log('Scaffold structure generated successfully.');
