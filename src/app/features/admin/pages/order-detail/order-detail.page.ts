import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminOrderService } from '../../../../core/services/admin-order.service';
import {
  OrderDetailsResponse,
  orderStatus,
  paymentStatus,
  paymentMethod,
} from '../../../../core/models/domain.models';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { extractErrorMessage } from '../../../../core/utils/error-message.util';
import{AdminOrderLocationMapComponent} from '../../components/admin-order-location-map-component/admin-order-location-map-component'
@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusBadgeComponent,AdminOrderLocationMapComponent],
  templateUrl: './order-detail.page.html',
  styleUrl: './order-detail.page.css',
})
export class AdminOrderDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminOrderService = inject(AdminOrderService);

  readonly orderId = signal<number | null>(null);
  readonly orderDetails = signal<OrderDetailsResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly isUpdatingStatus = signal(false);
  readonly selectedStatus = signal<number>(0);

  readonly orderStatusMap = orderStatus;
  readonly paymentStatusMap = paymentStatus;
  readonly paymentMethodMap = paymentMethod;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.errorMessage.set('Invalid order ID.');
      this.isLoading.set(false);
      return;
    }

    const id = Number(idParam);
    this.orderId.set(id);
    this.loadOrderDetail(id);
  }

  loadOrderDetail(id: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminOrderService.getOrderById(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.orderDetails.set(res.data);
          this.selectedStatus.set(res.data.status);
        } else {
          this.errorMessage.set(res.message || 'Order not found.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'Failed to load order details.'));
      },
    });
  }

  updateStatus(): void {
    const id = this.orderId();
    if (!id) return;

    this.isUpdatingStatus.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.adminOrderService.updateOrderStatus(id, this.selectedStatus()).subscribe({
      next: (res) => {
        this.isUpdatingStatus.set(false);
        if (res.success) {
          this.successMessage.set('Order status updated successfully!');
          this.loadOrderDetail(id);
        } else {
          this.errorMessage.set(res.message || 'Failed to update order status');
        }
      },
      error: (err) => {
        this.isUpdatingStatus.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'Error updating status. Please try again.'));
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/orders']);
  }
}
