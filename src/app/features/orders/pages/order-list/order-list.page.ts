import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderCardComponent } from '../../components/order-card/order-card.component';
import { PaginationComponent } from '../../../../../app/shared/pagination/pagination'; // عدّل المسار
import { OrderService } from '../../../../core/services/order.service';
import {OrderResponse,OrderStatusName,orderStatus,} from '../../../../core/models/domain.models';
const PAGE_SIZE = 10;
const STATUS_OPTIONS: OrderStatusName[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

@Component({
  selector: 'app-order-list-page',
  standalone: true,
  imports: [OrderCardComponent, PaginationComponent],
  templateUrl: './order-list.page.html',
  styleUrl: './order-list.page.css',
})
export class OrderListPage implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly route = inject(ActivatedRoute);

  readonly orders = signal<OrderResponse[]>([]);
  readonly isLoading = signal(true);
  readonly totalPages = signal(1);
  readonly pageIndex = signal(1);

  readonly statusOptions = STATUS_OPTIONS;
readonly selectedStatus = signal<OrderStatusName | ''>('');
  readonly justPlaced = signal(false);
  ngOnInit(): void {
    this.justPlaced.set(this.route.snapshot.queryParamMap.get('placed') === '1');
    this.load();
  }

  onStatusChange(status: string): void {
this.selectedStatus.set(status as OrderStatusName | '');
    this.load(1);
  }

  onPageChange(page: number): void {
    this.load(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private load(pageIndex = 1): void {
    this.isLoading.set(true);
    this.pageIndex.set(pageIndex);

    this.orderService
      .getMyOrders({
        status: this.selectedStatus() || undefined,
        pageIndex,
        pageSize: PAGE_SIZE,
      })
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.orders.set(res.data.items);
            this.totalPages.set(res.data.totalPages || 1);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }
}