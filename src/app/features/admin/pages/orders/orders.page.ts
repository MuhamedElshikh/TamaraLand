import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataTableComponent, DataTableColumn } from '../../components/data-table/data-table.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination';
import { AdminOrderService } from '../../../../core/services/admin-order.service';
import { OrderSummaryResponse, orderStatus, paymentStatus } from '../../../../core/models/domain.models';
import { TranslateModule, TranslatePipe ,TranslateService } from '@ngx-translate/core';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataTableComponent, PaginationComponent, TranslatePipe],
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.css'
})
export class AdminOrdersPage implements OnInit {
  private readonly adminOrderService = inject(AdminOrderService);
  private readonly router = inject(Router);
 
private readonly translate = inject(TranslateService);
readonly newPaymentStatus = signal<number>(0);
readonly isSubmittingPaymentStatus = signal(false);
readonly paymentStatusError = signal<string | null>(null);
  readonly orders = signal<OrderSummaryResponse[]>([]);
  readonly isLoading = signal(true);
  readonly totalPages = signal(1);
  readonly pageIndex = signal(1);
  readonly search = signal('');
  readonly selectedStatusFilter = signal<number | undefined>(undefined);

  // Status Modal State
  readonly showStatusModal = signal(false);
  readonly selectedOrder = signal<OrderSummaryResponse | null>(null);
  readonly newStatus = signal<number>(0);
  readonly isSubmittingStatus = signal(false);
  readonly statusError = signal<string | null>(null);

  readonly orderStatusMap = orderStatus;
  readonly paymentStatusMap = paymentStatus;

  readonly columns: DataTableColumn<OrderSummaryResponse>[] = [
    { key: 'orderNumber', header: 'Order #' },
    {
      key: 'createdAt',
      header: 'Date',
      type: 'date',
    },
    {
      key: 'total',
      header: 'Total Amount',
      type: 'currency',
    },
  {
    key: 'paymentStatus',
    header: 'Payment',
    type: 'badge',
    accessor: (r) => this.getPaymentStatusLabel(r.paymentStatus),
  },
  {
    key: 'status',
    header: 'Order Status',
    type: 'badge',
    accessor: (r) => this.getOrderStatusLabel(r.status),
  },
  ];

  ngOnInit(): void {
    this.load(1);
  }

  onSearchChange(val: string): void {
    this.search.set(val);
    this.load(1);
  }

  onStatusFilterChange(val: string): void {
    const num = val === '' ? undefined : Number(val);
    this.selectedStatusFilter.set(num);
    this.load(1);
  }

  onPageChange(page: number): void {
    this.load(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  viewOrderDetails(order: OrderSummaryResponse): void {
    this.router.navigate(['/admin/order-detail', order.id]);
  }

 openStatusModal(order: OrderSummaryResponse): void {
  this.selectedOrder.set(order);

  this.newStatus.set(order.status);
  this.newPaymentStatus.set(order.paymentStatus);

  this.statusError.set(null);
  this.showStatusModal.set(true);
}
 closeStatusModal(): void {
  this.showStatusModal.set(false);
  this.selectedOrder.set(null);

  this.statusError.set(null);
  this.paymentStatusError.set(null);
}

  updateStatus(): void {
  const order = this.selectedOrder();

  if (!order) return;

  const orderStatusChanged = this.newStatus() !== order.status;
  const paymentStatusChanged =
    this.newPaymentStatus() !== order.paymentStatus;

  if (!orderStatusChanged && !paymentStatusChanged) {
    return;
  }

  this.isSubmittingStatus.set(true);
  this.statusError.set(null);
  this.paymentStatusError.set(null);

  if (orderStatusChanged) {
    this.adminOrderService
      .updateOrderStatus(order.id, this.newStatus())
      .subscribe({
        next: (res) => {
          if (!res.success) {
            this.statusError.set(
              res.message || 'Failed to update order status'
            );

            this.isSubmittingStatus.set(false);
            return;
          }

          this.updatePaymentIfNeeded(
            order,
            paymentStatusChanged
          );
        },

        error: (err) => {
          this.isSubmittingStatus.set(false);

          this.statusError.set(
            err?.error?.message ||
            'Error updating order status. Please try again.'
          );
        },
      });

    return;
  }

  this.updatePaymentIfNeeded(
    order,
    paymentStatusChanged
  );
}
private updatePaymentIfNeeded(
  order: OrderSummaryResponse,
  paymentStatusChanged: boolean
): void {
  if (!paymentStatusChanged) {
    this.isSubmittingStatus.set(false);
    this.closeStatusModal();
    this.load(this.pageIndex());
    return;
  }

  this.adminOrderService
    .updatePaymentStatus(
      order.id,
      this.newPaymentStatus()
    )
    .subscribe({
      next: (res) => {
        this.isSubmittingStatus.set(false);

        if (res.success) {
          this.closeStatusModal();
          this.load(this.pageIndex());
        } else {
          this.paymentStatusError.set(
            res.message ||
            'Failed to update payment status'
          );
        }
      },

      error: (err) => {
        this.isSubmittingStatus.set(false);

        this.paymentStatusError.set(
          err?.error?.message ||
          'Error updating payment status. Please try again.'
        );
      },
    });
}

  private load(page: number): void {
    this.pageIndex.set(page);
    this.isLoading.set(true);

    this.adminOrderService
      .getOrders({
        pageIndex: page,
        pageSize: PAGE_SIZE,
        Status: this.selectedStatusFilter(),
        OrderNumber: this.search() ? this.search().trim() : undefined,
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.orders.set(res.data.items || []);
            this.totalPages.set(res.data.totalPages || 1);
          } else {
            this.orders.set([]);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.orders.set([]);
        },
      });
  }
  private getOrderStatusLabel(status: number): string {
  const keyMap: Record<number, string> = {
    0: 'admin.orders.pending',
    1: 'admin.orders.confirmed',
    2: 'admin.orders.processing',
    3: 'admin.orders.shipped',
    4: 'admin.orders.delivered',
    5: 'admin.orders.cancelled',
  };

  return this.translate.instant(
    keyMap[status] ?? 'admin.orders.pending'
  );
}

private getPaymentStatusLabel(status: number): string {
  const keyMap: Record<number, string> = {
    0: 'admin.orders.paymentPending',
    1: 'admin.orders.paymentPaid',
    2: 'admin.orders.paymentFailed',
    3: 'admin.orders.paymentRefunded',
  };

  return this.translate.instant(
    keyMap[status] ?? 'admin.orders.paymentPending'
  );
}
}
