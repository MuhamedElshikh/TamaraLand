import { Injectable } from '@angular/core';
import { GoogleTagManagerService } from './google-tag-manager.service';
import { AnalyticsItem } from '../models/catalog.models';


@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(
    private readonly gtm: GoogleTagManagerService
  ) {}

  pageView(title?: string): void {

    this.gtm.push({

      event: 'page_view',

      page_title: title

    });

  }

  viewItem(item: AnalyticsItem): void {

    this.gtm.push({

      event: 'view_item',

      ecommerce: {

        currency: 'EGP',

        value: item.price ?? 0,

        items: [
  {
    item_id: String(item.id),

    item_name: item.name,

    item_brand: item.brand,

    item_category: item.category,

    item_variant: item.variant,

    item_sku: item.sku,

    price: item.price ?? 0,

    discount: item.discount ?? 0
  }
]

      }

    });

  }

  viewItemList(items: AnalyticsItem[], listName = 'Products'): void {

    this.gtm.push({

      event: 'view_item_list',

      ecommerce: {

        item_list_name: listName,

        items: items.map(x => ({
    item_id: String(x.id),
    item_name: x.name,
    item_brand: x.brand,
    item_category: x.category,
    item_variant: x.variant,
    item_sku: x.sku,
    price: x.price ?? 0,
    discount: x.discount ?? 0
}))

      }

    });

  }
  

  addToCart(item: AnalyticsItem): void {

    this.gtm.push({

      event: 'add_to_cart',

      ecommerce: {

        currency: 'EGP',

        value: (item.price ?? 0) * (item.quantity ?? 1),

        items: [
  {
  item_id: String(item.id),
  item_name: item.name,
  item_brand: item.brand,
  item_category: item.category,
  item_variant: item.variant,
  item_sku: item.sku,
  quantity: item.quantity ?? 1,
  price: item.price ?? 0,
  discount: item.discount ?? 0
}
]

      }

    });

  }

  removeFromCart(item: AnalyticsItem): void {

    this.gtm.push({

      event: 'remove_from_cart',

      ecommerce: {

        currency: 'EGP',

        value: (item.price ?? 0) * (item.quantity ?? 1),

        items: [
  {
    item_id: String(item.id),

    item_name: item.name,

    item_brand: item.brand,

    item_category: item.category,

    item_variant: item.variant,

    item_sku: item.sku,
    quantity: item.quantity ?? 1,
    price: item.price ?? 0,

    discount: item.discount ?? 0
  }

        ]

      }

    });

  }

  beginCheckout(items: AnalyticsItem[], total: number): void {

    this.gtm.push({

      event: 'begin_checkout',

      ecommerce: {

        currency: 'EGP',

        value: total,

       items: items.map(x => ({
    item_id: String(x.id),
    item_name: x.name,
    item_brand: x.brand,
    item_category: x.category,
    item_variant: x.variant,
    item_sku: x.sku,
    quantity: x.quantity ?? 1,
    price: x.price ?? 0,
    discount: x.discount ?? 0
}))

      }

    });

  }

purchase(
  transactionId: string,
  total: number,
  coupon: string | null,
  shipping: number,
  items: AnalyticsItem[]
): void {
    this.gtm.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: transactionId,
    currency: 'EGP',
    value: total,
    coupon: coupon ?? '',
    shipping,
    tax: 0,

    items: items.map(x => ({
      item_id: String(x.id),
      item_name: x.name,
      item_brand: x.brand,
      item_category: x.category,
      item_variant: x.variant,
      item_sku: x.sku,
      quantity: x.quantity ?? 1,
      price: x.price ?? 0,
      discount: x.discount ?? 0
    }))
  }
});

  }

  login(method = 'email'): void {

    this.gtm.push({

      event: 'login',

      method

    });

  }

  signUp(method = 'email'): void {

    this.gtm.push({

      event: 'sign_up',

      method

    });

  }

  search(term: string): void {

    this.gtm.push({

      event: 'search',

      search_term: term

    });

  }

  wishlist(item: AnalyticsItem): void {

    this.gtm.push({

      event: 'add_to_wishlist',

      ecommerce: {

        currency: 'EGP',

        value: item.price ?? 0,

        items: [
          {
 item_id: String(item.id),
 item_name: item.name,
 item_brand: item.brand,
 item_category: item.category,
 item_variant: item.variant,
 item_sku: item.sku,
 price: item.price ?? 0,
 discount: item.discount ?? 0
}

        ]

      }

    });   

  }
  removeWishlist(item: AnalyticsItem): void {

  this.gtm.push({

    event: 'remove_from_wishlist',

    ecommerce: {

      currency: 'EGP',

      value: item.price ?? 0,

      items: [
{
 item_id: String(item.id),
 item_name: item.name,
 item_brand: item.brand,
 item_category: item.category,
 item_variant: item.variant,
 item_sku: item.sku,
 price: item.price ?? 0,
 discount: item.discount ?? 0
}
      ]

    }

  });

}
trackEvent(event: string, data: Record<string, any> = {}): void {
  this.gtm.push({
    event,
    ...data
  });
}
setUser(userId: string): void {
  this.gtm.push({
    user_id: userId
  });
}
setUserProperties(properties: Record<string, any>): void {

  this.gtm.push({

    event: 'set_user_properties',

    user_properties: properties

  });

}

clearUser(): void {
  this.gtm.push({
    user_id: null
  });
}
}