import { Injectable, Optional, Inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ANALYTICS_CONFIG, AnalyticsConfig } from '../config/analytics.config';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export interface AnalyticsItem {
  id: string | number;
  name: string;
  price?: number;
  category?: string;
  quantity?: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private config: AnalyticsConfig;

  constructor(
    @Optional() @Inject(ANALYTICS_CONFIG) customConfig?: AnalyticsConfig
  ) {
    this.config = customConfig || environment.analytics || { enabled: true };
  }

  /**
   * Helper to dispatch standard gtag events safely.
   */
  private sendEvent(eventName: string, params: Record<string, any> = {}): void {
    if (!this.config.enabled || typeof window === 'undefined') return;

    if (window.gtag) {
      window.gtag('event', eventName, params);
    }

    if (window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...params,
      });
    }
  }

  /**
   * Track Page Views
   */
  pageView(params?: { title?: string; location?: string; path?: string }): void {
    this.sendEvent('page_view', {
      page_title: params?.title || (typeof document !== 'undefined' ? document.title : ''),
      page_location: params?.location || (typeof window !== 'undefined' ? window.location.href : ''),
      page_path: params?.path || (typeof window !== 'undefined' ? window.location.pathname : ''),
    });
  }

  /**
   * Track View Item (Product Details Page View)
   */
  viewItem(item: AnalyticsItem): void {
    this.sendEvent('view_item', {
      currency: 'EGP',
      value: item.price || 0,
      items: [
        {
          item_id: String(item.id),
          item_name: item.name,
          price: item.price || 0,
          item_category: item.category,
        },
      ],
    });
  }

  /**
   * Track View Item List (Catalog / Category Browsing)
   */
  viewItemList(items: AnalyticsItem[], listName: string = 'Product List'): void {
    this.sendEvent('view_item_list', {
      item_list_name: listName,
      items: items.map((item) => ({
        item_id: String(item.id),
        item_name: item.name,
        price: item.price || 0,
        item_category: item.category,
      })),
    });
  }

  /**
   * Track Add To Cart
   */
  addToCart(item: AnalyticsItem): void {
    const qty = item.quantity || 1;
    const value = (item.price || 0) * qty;

    this.sendEvent('add_to_cart', {
      currency: 'EGP',
      value: value,
      items: [
        {
          item_id: String(item.id),
          item_name: item.name,
          price: item.price || 0,
          quantity: qty,
        },
      ],
    });

    this.trackAddToCartConversion(value);
  }

  /**
   * Track Remove From Cart
   */
  removeFromCart(item: AnalyticsItem): void {
    const qty = item.quantity || 1;
    this.sendEvent('remove_from_cart', {
      currency: 'EGP',
      value: (item.price || 0) * qty,
      items: [
        {
          item_id: String(item.id),
          item_name: item.name,
          price: item.price || 0,
          quantity: qty,
        },
      ],
    });
  }

  /**
   * Track Begin Checkout
   */
  beginCheckout(items: AnalyticsItem[], totalValue: number): void {
    this.sendEvent('begin_checkout', {
      currency: 'EGP',
      value: totalValue,
      items: items.map((item) => ({
        item_id: String(item.id),
        item_name: item.name,
        price: item.price || 0,
        quantity: item.quantity || 1,
      })),
    });

    this.trackBeginCheckoutConversion(totalValue);
  }

  /**
   * Track Purchase
   */
  purchase(transactionId: string, value: number, items: AnalyticsItem[]): void {
    this.sendEvent('purchase', {
      transaction_id: transactionId,
      currency: 'EGP',
      value: value,
      items: items.map((item) => ({
        item_id: String(item.id),
        item_name: item.name,
        price: item.price || 0,
        quantity: item.quantity || 1,
      })),
    });

    this.trackPurchaseConversion(value);
  }

  /**
   * Track User Login
   */
  login(method: string): void {
    this.sendEvent('login', { method });
  }

  /**
   * Track User Sign Up
   */
  signUp(method: string): void {
    this.sendEvent('sign_up', { method });
    this.trackSignUpConversion(method);
  }

  /**
   * Track Search
   */
  search(searchTerm: string): void {
    this.sendEvent('search', { search_term: searchTerm });
  }

  // ==========================================
  // Google Ads Ready Conversion Events
  // ==========================================

  trackConversion(eventName: string, data: Record<string, any> = {}): void {
    if (this.config.gadsConversionId) {
      this.sendEvent('conversion', {
        send_to: this.config.gadsConversionId,
        event_name: eventName,
        ...data,
      });
    }
  }

  trackPurchaseConversion(value: number, currency: string = 'EGP'): void {
    this.trackConversion('purchase', { value, currency });
  }

  trackAddToCartConversion(value?: number): void {
    this.trackConversion('add_to_cart', { value: value || 0 });
  }

  trackBeginCheckoutConversion(value?: number): void {
    this.trackConversion('begin_checkout', { value: value || 0 });
  }

  trackSignUpConversion(method: string = 'email'): void {
    this.trackConversion('sign_up', { method });
  }

  trackContactConversion(): void {
    this.trackConversion('contact');
  }

  trackWhatsAppClickConversion(): void {
    this.trackConversion('whatsapp_click');
  }

  trackNewsletterSignupConversion(): void {
    this.trackConversion('newsletter_signup');
  }
}
