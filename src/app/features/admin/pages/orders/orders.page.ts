import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataTableComponent, DataTableColumn } from '../../components/data-table/data-table.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination';
import { AdminOrderService } from '../../../../core/services/admin-order.service';
import { OrderSummaryResponse, orderStatus, paymentStatus } from '../../../../core/models/domain.models';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataTableComponent, PaginationComponent],
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.css'
})
export class AdminOrdersPage implements OnInit {
  private readonly adminOrderService = inject(AdminOrderService);
  private readonly router = inject(Router);

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
      accessor: (r) => this.paymentStatusMap[r.paymentStatus] || 'Pending',
    },
    {
      key: 'status',
      header: 'Order Status',
      type: 'badge',
      accessor: (r) => this.orderStatusMap[r.status] || 'Pending',
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
    this.statusError.set(null);
    this.showStatusModal.set(true);
  }

  closeStatusModal(): void {
    this.showStatusModal.set(false);
    this.selectedOrder.set(null);
    this.statusError.set(null);
  }

  updateStatus(): void {
    const order = this.selectedOrder();
    if (!order) return;

    this.isSubmittingStatus.set(true);
    this.statusError.set(null);

    this.adminOrderService.updateOrderStatus(order.id, this.newStatus()).subscribe({
      next: (res) => {
        this.isSubmittingStatus.set(false);
        if (res.success) {
          this.closeStatusModal();
          this.load(this.pageIndex());
        } else {
          this.statusError.set(res.message || 'Failed to update order status');
        }
      },
      error: (err) => {
        this.isSubmittingStatus.set(false);
        this.statusError.set(err?.error?.message || 'Error updating order status. Please try again.');
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
}