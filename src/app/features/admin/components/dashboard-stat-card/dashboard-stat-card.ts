import {
  Component,
  input,
} from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';


@Component({
  selector: 'app-dashboard-stat-card',
  standalone: true,

  imports: [
    TranslatePipe,
  ],

  templateUrl: './dashboard-stat-card.html',
  styleUrl: './dashboard-stat-card.css',
})
export class DashboardStatCardComponent {

  iconClass(): string {
    const icons: Record<string, string> = {
      payments: 'fa-solid fa-money-bill-wave',
      shopping_bag: 'fa-solid fa-bag-shopping',
      groups: 'fa-solid fa-users',
      inventory_2: 'fa-solid fa-boxes-stacked',
      analytics: 'fa-solid fa-chart-line',
      visibility: 'fa-solid fa-eye',
      trending_down: 'fa-solid fa-arrow-trend-down',
      today: 'fa-solid fa-calendar-day',
      calendar_month: 'fa-solid fa-calendar-days',
      event: 'fa-solid fa-calendar-check',
      hourglass_top: 'fa-solid fa-hourglass-half',
      task_alt: 'fa-solid fa-circle-check',
      cancel: 'fa-solid fa-circle-xmark',
      sell: 'fa-solid fa-tag',
      category: 'fa-solid fa-folder-tree',
      local_offer: 'fa-solid fa-tags',
      warning: 'fa-solid fa-triangle-exclamation',
      remove_shopping_cart: 'fa-solid fa-cart-arrow-down',
      confirmation_number: 'fa-solid fa-ticket',
      favorite: 'fa-solid fa-heart',
      star: 'fa-solid fa-star',
      person_add: 'fa-solid fa-user-plus',
      monitoring: 'fa-solid fa-chart-simple',
      schedule: 'fa-solid fa-clock',
    };

    return icons[ this.icon() ] ?? 'fa-solid fa-chart-column';
  }

  title =
    input.required<string>();


  value =
    input.required<string | number>();


  icon =
    input<string>('chart');


  accent =
    input(false);


  warning =
    input(false);

}