import { Routes } from '@angular/router';
import { productDetailsResolver } from './resolvers/product-details.resolver';
import { ProductCollection } from '../../../app/core/models/catalog.models';

export const CATALOG_ROUTES: Routes = [
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/product-list/product-list.page').then((m) => m.ProductListPage),
    data: {
      title: 'All Products',
      kicker: 'Catalog',
      subtitle: 'Explore curated pieces with refined filters and elegant browsing.',
      collection: ProductCollection.None,
    },
  },

  {
    path: 'new-in',
    loadComponent: () =>
      import('./pages/product-list/product-list.page').then((m) => m.ProductListPage),
    data: {
      title: 'New In',
      kicker: 'Latest Arrivals',
      subtitle: 'Discover the newest pieces added to the Tamara Land collection.',
      collection: ProductCollection.NewArrivals,
    },
  },

  {
    path: 'sale',
    loadComponent: () =>
      import('./pages/product-list/product-list.page').then((m) => m.ProductListPage),
    data: {
      title: 'Sale',
      kicker: 'Exclusive Offers',
      subtitle: 'Shop premium styles at exclusive prices for a limited time.',
      collection: ProductCollection.Offers,
    },
  },

  {
    path: 'products/:id',
    loadComponent: () =>
      import('./pages/product-details/product-details.page').then((m) => m.ProductDetailsPage),
    resolve: { product: productDetailsResolver },
  },

  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/categories-list/categories-list').then((m) => m.CategoriesListPage),
  },
  {
    path: 'categories/:id',
    loadComponent: () =>
      import('./pages/category-products/category-products.page').then((m) => m.CategoryProductsPage),
  },

  {
    path: 'brands',
    loadComponent: () =>
      import('./pages/brands-list/brands-list').then((m) => m.BrandsListPage),
  },
  {
    path: 'brands/:id',
    loadComponent: () =>
      import('./pages/brand-products/brand-products.page').then((m) => m.BrandProductsPage),
  },
];