import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { DataTableComponent, DataTableColumn } from '../../components/data-table/data-table.component';
import { DashboardService } from '../../../../core/services/dashboard.service'; // عدّل المسار
import { DashboardResponse, LatestOrder, orderStatus , TopSellingProduct } from '../../../../core/models/domain.models';

interface TopSellingRow extends TopSellingProduct {
  id: number;
}


@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DataTableComponent],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly data = signal<DashboardResponse | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal(false);

  readonly ordersColumns: DataTableColumn<LatestOrder>[] = [
    { key: 'orderNumber', header: 'Order' },
    { key: 'customerName', header: 'Customer' },
    { key: 'total', header: 'Total', type: 'currency', align: 'right' },
    {key: 'status',header: 'Status',type: 'badge',accessor: (row) => orderStatus[row.status]}, 
       { key: 'createdAt', header: 'Date', type: 'date' },
  ];

  readonly topProductsColumns: DataTableColumn<TopSellingRow>[] = [
    { key: 'productName', header: 'Product' },
    { key: 'totalSold', header: 'Units sold', align: 'right' },
    { key: 'revenue', header: 'Revenue', type: 'currency', align: 'right' },
  ];

  ngOnInit(): void {
    this.dashboardService
      .getDashboard()
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res?.success && res.data) {
          this.data.set(res.data);
        } else {
          this.loadError.set(true);
        }
        this.isLoading.set(false);
      });
  }

  get topProductsRows(): TopSellingRow[] {
    return (this.data()?.topSellingProducts ?? []).map((p) => ({ ...p, id: p.productId }));
  }
}