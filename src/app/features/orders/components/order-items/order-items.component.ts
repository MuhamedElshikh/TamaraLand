import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { OrderItemResponse } from '../../../../core/models/domain.models';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-order-items',
  standalone: true,
  imports: [DecimalPipe,TranslatePipe],
  templateUrl: './order-items.component.html',
  styleUrl: './order-items.component.css',
})
export class OrderItemsComponent {
  items = input.required<OrderItemResponse[]>();
  readonly fallbackImage = 'assets/placeholder-product.jpg';
}