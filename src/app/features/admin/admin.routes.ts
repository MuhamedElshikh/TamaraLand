import { Routes } from '@angular/router';

/** @see .ai/STRUCTURE.md */
export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/categories/categories.page').then((m) => m.AdminCategoriesPage),
  },
  {
    path: 'brands',
    loadComponent: () => import('./pages/brands/brands.page').then((m) => m.AdminBrandsPage),
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products.page').then((m) => m.ProductsPage),
  },
  {
    path: 'product-form',
    loadComponent: () =>
      import('./pages/product-form/product-form.page').then((m) => m.AdminProductFormPage),
  },
  {
    path: 'product-form/:id',
    loadComponent: () =>
      import('./pages/product-form/product-form.page').then((m) => m.AdminProductFormPage),
  },
  {
    path: 'discounts',
    loadComponent: () =>
      import('./pages/discounts/discounts.page').then((m) => m.DiscountsPage),
  },
  {
    path: 'coupons',
    loadComponent: () => import('./pages/coupons/coupons.page').then((m) => m.CouponsPage),
  },
  {
    path: 'shipping-areas',
    loadComponent: () =>
      import('./pages/shipping-areas/shipping-areas.page').then((m) => m.ShippingAreasPage),
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/orders.page').then((m) => m.AdminOrdersPage),
  },
  {
    path: 'order-detail/:id',
    loadComponent: () =>
      import('./pages/order-detail/order-detail.page').then((m) => m.AdminOrderDetailPage),
  },
  {
  path: 'users',
  loadComponent: () =>
    import('./pages/user/pages/users.page/users.page')
      .then(m => m.UsersPage),
},
  {
  path: 'banners',
  loadComponent: () =>
    import('./pages/banners.page/banners.page').then(
      (m) => m.BannersPage
    ),
},
{
  path: 'banner-form',
  loadComponent: () =>
    import('./components/banner-form/banner-form.component').then(
      (m) => m.BannerFormComponent
    ),
},
{
  path: 'banner-form/:id',
  loadComponent: () =>
    import('./components/banner-form/banner-form.component').then(
      (m) => m.BannerFormComponent
    ),
},
 {
    path: 'whatsapp',
    loadComponent: () => import('./pages/whatsapp/whatsapp.page/whatsapp.page').then((m) => m.WhatsAppPage),
  },
  {
    path: 'store-settings',
    loadComponent: () => import('./pages/store-settings/store-settings.page').then((m) => m.AdminStoreSettingsPage),
  }
];
