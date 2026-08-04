import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { DataTableComponent, DataTableColumn } from '../../components/data-table/data-table.component';
import { DashboardService } from '../../../../core/services/dashboard.service'; // عدّل المسار
import { DashboardResponse, LatestOrder, orderStatus , TopSellingProduct } from '../../../../core/models/domain.models';
import { DashboardStatCardComponent } from "../../components/dashboard-stat-card/dashboard-stat-card";
import { ChartOptions, DashboardChartComponent } from '../../components/dashboard-chart/dashboard-chart';

interface TopSellingRow extends TopSellingProduct {
  id: number;
}
interface MostViewedRow {
  id: number;
  productName: string;
  viewsCount: number;
}

interface MostWishlistedRow {
  id: number;
  productName: string;
  wishlistCount: number;
}


@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DataTableComponent, DashboardStatCardComponent,DashboardChartComponent],
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
  readonly mostViewedColumns: DataTableColumn<MostViewedRow>[] = [
  {
    key: 'productName',
    header: 'Product'
  },
  {
    key: 'viewsCount',
    header: 'Views',
    align: 'right'
  }
];

readonly mostWishlistedColumns: DataTableColumn<MostWishlistedRow>[] = [
  {
    key: 'productName',
    header: 'Product'
  },
  {
    key: 'wishlistCount',
    header: 'Wishlist',
    align: 'right'
  }
];

  ngOnInit(): void {
    this.dashboardService
      .getDashboard()
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        
        if (res?.success && res.data) {
          console.log(res.data);
          this.data.set(res.data);
          this.revenueChart.update(chart => ({
  ...chart,

  series: [
    {
      name: 'Revenue',
      data: res.data.monthlyRevenue.map(x => x.value)
    }
  ],

  xaxis: {
    categories: res.data.monthlyRevenue.map(x => x.label)
  }
}));
this.ordersChart.update(chart => ({
  ...chart,

  series: [
    {
      name: 'Orders',
      data: res.data.monthlyOrders.map(x => x.value)
    }
  ],

  xaxis: {
    categories: res.data.monthlyOrders.map(x => x.label)
  }
}));
this.brandsChart.update(chart => ({
  ...chart,

  series: [
    {
      name: 'Sold',

      data: res.data.topBrands.map(x => x.value)
    }
  ],

  xaxis: {
    categories: res.data.topBrands.map(x => x.label)
  }
}));

        } else {
          this.loadError.set(true);
        }
        this.isLoading.set(false);
      });
  }

  get topProductsRows(): TopSellingRow[] {
    return (this.data()?.topSellingProducts ?? []).map((p) => ({ ...p, id: p.productId }));
  }
  get mostViewedRows(): MostViewedRow[] {
  return (this.data()?.mostViewedProducts ?? []).map(x => ({
    id: x.productId,
    productName: x.productName,
    viewsCount: x.viewsCount
  }));
}

get mostWishlistedRows(): MostWishlistedRow[] {
  return (this.data()?.mostWishlistedProducts ?? []).map(x => ({
    id: x.productId,
    productName: x.productName,
    wishlistCount: x.wishlistCount
  }));
}
readonly revenueChart = signal<ChartOptions>({
  series: [],
  chart: {
    type: 'area',
    height: 320,
    toolbar: {
      show: false
    },
    zoom: {
      enabled: false
    }
  },

  xaxis: {
    categories: []
  },

  yaxis: {
    labels: {
      formatter: value => `${value.toFixed(0)}`
    }
  },

  stroke: {
    curve: 'smooth',
    width: 3
  },

  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: .45,
      opacityTo: .05
    }
  },

  grid: {
    borderColor: '#2f2f2f'
  },

  dataLabels: {
    enabled: false
  },

  tooltip: {
    y: {
      formatter: value => `${value} EGP`
    }
  },

  colors: ['#C9A24B']
});
readonly ordersChart = signal<ChartOptions>({
  series: [],
  chart: {
    type: 'bar',
    height: 320,
    toolbar: {
      show: false
    }
  },

  xaxis: {
    categories: []
  },

  yaxis: {},

  dataLabels: {
    enabled: false
  },

  grid: {
    borderColor: '#2f2f2f'
  },

  tooltip: {},

  plotOptions: {
    bar: {
      borderRadius: 6,
      columnWidth: '45%'
    }
  },

  colors: ['#7B61FF']
});
readonly categoriesChart = signal<ChartOptions>({
  series: [],

  chart: {
    type: 'donut',
    height: 320
  },

  labels: [],

  tooltip: {},

  dataLabels: {
    enabled: true
  },

  colors: [
    '#C9A24B',
    '#8B6D3B',
    '#5E4524',
    '#D9BF77',
    '#A98A52'
  ]
});
readonly brandsChart = signal<ChartOptions>({
  series: [],

  chart: {
    type: 'bar',
    height: 320,
    toolbar: {
      show: false
    }
  },

  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 6
    }
  },

  xaxis: {
    categories: []
  },

  tooltip: {},

  dataLabels: {
    enabled: false
  },

  grid: {
    borderColor: '#2f2f2f'
  },

  colors: ['#C9A24B']
});
}