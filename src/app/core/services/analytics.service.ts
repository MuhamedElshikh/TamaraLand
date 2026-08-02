import { Injectable } from '@angular/core';
import { GoogleTagManagerService } from './google-tag-manager.service';

export interface AnalyticsItem {
  id: string | number;
  name: string;
  price?: number;
  category?: string;
  quantity?: number;
}

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

            item_category: item.category,

            price: item.price ?? 0

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

          item_category: x.category,

          price: x.price ?? 0

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

            quantity: item.quantity ?? 1,

            price: item.price ?? 0

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

            quantity: item.quantity ?? 1,

            price: item.price ?? 0

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

          quantity: x.quantity ?? 1,

          price: x.price ?? 0

        }))

      }

    });

  }

  purchase(transactionId: string, total: number, items: AnalyticsItem[]): void {

    this.gtm.push({

      event: 'purchase',

      ecommerce: {

        transaction_id: transactionId,

        currency: 'EGP',

        value: total,

        items: items.map(x => ({

          item_id: String(x.id),

          item_name: x.name,

          quantity: x.quantity ?? 1,

          price: x.price ?? 0

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

            price: item.price ?? 0

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

          price: item.price ?? 0

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
}