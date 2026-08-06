import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { DecimalPipe ,DatePipe } from '@angular/common';
import { DataTableComponent, DataTableColumn } from '../../components/data-table/data-table.component';
import { DashboardService } from '../../../../core/services/dashboard.service'; // عدّل المسار
import { DashboardResponse, LatestOrder, orderStatus , TopSellingProduct } from '../../../../core/models/domain.models';
import { DashboardStatCardComponent } from "../../components/dashboard-stat-card/dashboard-stat-card";
import { ChartOptions, DashboardChartComponent } from '../../components/dashboard-chart/dashboard-chart';
import { GoogleAnalyticsService } from '../../../../core/services/google-analytics.service';
import { GoogleAnalyticsDashboardResponse } from '../../../../core/models/domain.models';


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

interface AnalyticsRow {

    id:number;

    label:string;

    value:number;

}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DataTableComponent, DashboardStatCardComponent,DashboardChartComponent,DatePipe ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage implements OnInit {
  private readonly dashboardService = inject(DashboardService);
private readonly analyticsService = inject(GoogleAnalyticsService);
readonly analytics =signal<GoogleAnalyticsDashboardResponse | null>(null);
readonly analyticsLoading = signal(true);
  readonly data = signal<DashboardResponse | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal(false);
readonly activeTab = signal<'overview' | 'store' | 'analytics'>('overview');
readonly today = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
}).format(new Date());selectTab(tab: 'overview' | 'store' | 'analytics') {this.activeTab.set(tab);
}
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

readonly countriesColumns: DataTableColumn<AnalyticsRow>[] = [

    {
        key:'label',
        header:'Country'
    },

    {
        key:'value',
        header:'Users',
        align:'right'
    }

];

readonly devicesColumns: DataTableColumn<AnalyticsRow>[] = [

    {
        key:'label',
        header:'Device'
    },

    {
        key:'value',
        header:'Users',
        align:'right'
    }

];
readonly trafficColumns: DataTableColumn<AnalyticsRow>[] = [

    {
        key:'label',
        header:'Source'
    },

    {
        key:'value',
        header:'Sessions',
        align:'right'
    }

];

readonly pagesColumns: DataTableColumn<AnalyticsRow>[] = [

    {
        key:'label',
        header:'Page'
    },

    {
        key:'value',
        header:'Views',
        align:'right'
    }

];
  ngOnInit(): void {
    this.dashboardService
      .getDashboard()
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        
        if (res?.success && res.data) {
        this.analyticsLoading.set(false);
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
this.categoriesChart.update(chart => ({
  ...chart,

  series: res.data.topCategories.map(x => x.value),

  labels: res.data.topCategories.map(x => x.label)
}));


        } else {
          this.loadError.set(true);
        }
        this.isLoading.set(false);
      });
      this.analyticsService
    .getDashboard()
    .subscribe({

        next: res => {

            if(res.success && res.data){

                this.analytics.set(res.data);
                this.usersChart.update(chart => ({
  ...chart,

  series: [
    {
      name: 'Visitors',
      data: res.data.dailyUsers.map(x => x.value)
    }
  ],

  xaxis: {
    categories: res.data.dailyUsers.map(x => x.label)
  }
}));
this.sessionsChart.update(chart => ({
  ...chart,

  series: [
    {
      name: 'Sessions',
      data: res.data.dailySessions.map(x => x.value)
    }
  ],

  xaxis: {
    categories: res.data.dailySessions.map(x => x.label)
  }
}));
this.countriesChart.update(chart => ({
  ...chart,

  series: [
    {
      name: 'Users',
      data: res.data.topCountries.map(x => x.value)
    }
  ],

  xaxis: {
    categories: res.data.topCountries.map(x => x.label)
  }
}));
this.devicesChart.update(chart => ({
  ...chart,

  series: res.data.topDevices.map(x => x.value),

  labels: res.data.topDevices.map(x => x.label)
}));
this.trafficChart.update(chart => ({
  ...chart,

  series: res.data.trafficSources.map(x => x.value),

  labels: res.data.trafficSources.map(x => x.label)
}));
                console.log(this.analytics());

            }

        }

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

get countriesRows():AnalyticsRow[]{

    return (this.analytics()?.topCountries ?? []).map((x,index)=>({

        id:index,

        label:x.label || 'Unknown',

        value:x.value

    }));

}

get devicesRows():AnalyticsRow[]{

    return (this.analytics()?.topDevices ?? []).map((x,index)=>({

        id:index,

        label:x.label,

        value:x.value

    }));

}
get trafficRows():AnalyticsRow[]{

    return (this.analytics()?.trafficSources ?? []).map((x,index)=>({

        id:index,

        label:x.label,

        value:x.value

    }));

}

get pagesRows(): AnalyticsRow[] {

    return (this.analytics()?.topPages ?? []).map((x, index) => ({

        id: index,

        label: x.label,

        value: x.value

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
readonly usersChart = signal<ChartOptions>({
  series: [],
  chart: {
    type: 'area',
    height: 320,
    toolbar: {
      show: false
    }
  },

  xaxis: {
    categories: []
  },

  stroke: {
    curve: 'smooth',
    width: 3
  },

  dataLabels: {
    enabled: false
  },

  fill: {
    type: 'gradient',
    gradient: {
      opacityFrom: .45,
      opacityTo: .05
    }
  },

  colors: ['#4F46E5']
});
readonly sessionsChart = signal<ChartOptions>({
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

  plotOptions: {
    bar: {
      borderRadius: 6,
      columnWidth: '45%'
    }
  },

  dataLabels: {
    enabled: false
  },

  colors: ['#22C55E']
});
readonly countriesChart = signal<ChartOptions>({
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

  dataLabels: {
    enabled: false
  },

  colors: ['#3B82F6']
});
readonly devicesChart = signal<ChartOptions>({
  series: [],

  chart: {
    type: 'donut',
    height: 320
  },

  labels: [],

  dataLabels: {
    enabled: true
  },

  colors: [
    '#C9A24B',
    '#4F46E5',
    '#22C55E',
    '#EF4444'
  ]
});
readonly trafficChart = signal<ChartOptions>({
  series: [],

  chart: {
    type: 'donut',
    height: 320
  },

  labels: [],

  dataLabels: {
    enabled: true
  },

  colors: [
    '#C9A24B',
    '#22C55E',
    '#4F46E5',
    '#F97316'
  ]
});
formatDuration(seconds: number): string {

    const mins = Math.floor(seconds / 60);

    const secs = Math.floor(seconds % 60);

    return `${mins}m ${secs}s`;

}

}