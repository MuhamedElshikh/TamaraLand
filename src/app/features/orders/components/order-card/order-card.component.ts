import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { OrderResponse } from '../../../../core/models/domain.models';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe,TranslatePipe],
  templateUrl: './order-card.component.html',
  styleUrl: './order-card.component.css',
})
export class OrderCardComponent {
  order = input.required<OrderResponse>();

}