import { Routes } from '@angular/router';

export const INFO_ROUTES: Routes = [
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact.page').then((m) => m.ContactPage),
  },
  {
    path: 'shipping',
    loadComponent: () =>
      import('./pages/shipping/shipping.page').then((m) => m.ShippingPage),
  },
  {
    path: 'returns',
    loadComponent: () =>
      import('./pages/returns/returns.page').then((m) => m.ReturnsPage),
  },
  {
    path: 'faq',
    loadComponent: () =>
      import('./pages/faq/faq.page').then((m) => m.FaqPage),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./pages/privacy/privacy.page').then((m) => m.PrivacyPage),
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./pages/terms/terms.page').then((m) => m.TermsPage),
  },
];
