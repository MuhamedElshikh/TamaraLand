import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { catchError, of } from 'rxjs';
import { OrderStatusComponent } from '../../components/order-status/order-status.component';
import { OrderItemsComponent } from '../../components/order-items/order-items.component';
import { OrderService } from '../../../../core/services/order.service';
import { OrderDetailsResponse } from '../../../../core/models/domain.models';
import {orderStatus,paymentStatus,paymentMethod} from '../../../../core/models/domain.models';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-order-details-page',
  standalone: true,
  imports: [OrderStatusComponent, OrderItemsComponent, DatePipe, DecimalPipe,TranslatePipe],
  templateUrl: './order-details.page.html',
  styleUrl: './order-details.page.css',
})
export class OrderDetailsPage implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly route = inject(ActivatedRoute);
  readonly orderStatus = orderStatus;
readonly paymentMethod = paymentMethod;
readonly paymentStatus = paymentStatus;

  readonly order = signal<OrderDetailsResponse | null>(null);
  readonly isLoading = signal(true);
  readonly notFound = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.notFound.set(true);
      this.isLoading.set(false);
      return;
    }

    this.orderService
      .getOrderById(id)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res?.success && res.data) {
          this.order.set(res.data);
        } else {
          this.notFound.set(true);
        }
        this.isLoading.set(false);
      });
  }
}