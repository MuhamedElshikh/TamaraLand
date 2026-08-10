import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of, Subscription } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { DataTableComponent, DataTableColumn } from '../../components/data-table/data-table.component';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { DashboardResponse, LatestOrder, orderStatus, TopSellingProduct } from '../../../../core/models/domain.models';
import { DashboardStatCardComponent } from '../../components/dashboard-stat-card/dashboard-stat-card';
import { ChartOptions, DashboardChartComponent } from '../../components/dashboard-chart/dashboard-chart';
import { GoogleAnalyticsService } from '../../../../core/services/google-analytics.service';
import { GoogleAnalyticsDashboardResponse } from '../../../../core/models/domain.models';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

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
  id: number;
  label: string;
  value: number;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DataTableComponent, DashboardStatCardComponent, DashboardChartComponent, TranslatePipe],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly translate = inject(TranslateService);
  private readonly analyticsService = inject(GoogleAnalyticsService);
  readonly analytics = signal<GoogleAnalyticsDashboardResponse | null>(null);
  readonly analyticsLoading = signal(true);
  readonly data = signal<DashboardResponse | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal(false);
  readonly activeTab = signal<'overview' | 'store' | 'analytics'>('overview');
  readonly today = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  ordersColumns: DataTableColumn<LatestOrder>[] = [];
  topProductsColumns: DataTableColumn<TopSellingRow>[] = [];
  mostViewedColumns: DataTableColumn<MostViewedRow>[] = [];
  mostWishlistedColumns: DataTableColumn<MostWishlistedRow>[] = [];
  countriesColumns: DataTableColumn<AnalyticsRow>[] = [];
  devicesColumns: DataTableColumn<AnalyticsRow>[] = [];
  trafficColumns: DataTableColumn<AnalyticsRow>[] = [];
  pagesColumns: DataTableColumn<AnalyticsRow>[] = [];

  private langSub: Subscription | null = null;

  ngOnInit(): void {
    this.setupTranslatedColumns();

    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.setupTranslatedColumns();
      this.updateChartTranslations();
    });

    this.dashboardService
      .getDashboard()
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res?.success && res.data) {
          this.analyticsLoading.set(false);
          this.data.set(res.data);
          this.updateDashboardCharts(res.data);
        } else {
          this.loadError.set(true);
        }
        this.isLoading.set(false);
      });

    this.analyticsService.getDashboard().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.analytics.set(res.data);
          this.updateAnalyticsCharts(res.data);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.langSub) {
      this.langSub.unsubscribe();
      this.langSub = null;
    }
  }

  selectTab(tab: 'overview' | 'store' | 'analytics'): void {
    this.activeTab.set(tab);
  }

  setupTranslatedColumns(): void {
    this.ordersColumns = [
      { key: 'orderNumber', header: this.translate.instant('admin.dashboard.columns.order') },
      { key: 'customerName', header: this.translate.instant('admin.dashboard.columns.customer') },
      {
        key: 'total',
        header: this.translate.instant('admin.dashboard.columns.total'),
        type: 'currency',
        align: 'right'
      },
      {
        key: 'status',
        header: this.translate.instant('admin.dashboard.columns.status'),
        type: 'badge',
        accessor: (row: LatestOrder) => orderStatus[row.status]
      },
      {
        key: 'createdAt',
        header: this.translate.instant('admin.dashboard.columns.date'),
        type: 'date'
      }
    ];

    this.topProductsColumns = [
      { key: 'productName', header: this.translate.instant('admin.dashboard.columns.product') },
      { key: 'totalSold', header: this.translate.instant('admin.dashboard.columns.unitsSold'), align: 'right' },
      {
        key: 'revenue',
        header: this.translate.instant('admin.dashboard.columns.revenue'),
        type: 'currency',
        align: 'right'
      }
    ];

    this.mostViewedColumns = [
      { key: 'productName', header: this.translate.instant('admin.dashboard.columns.product') },
      { key: 'viewsCount', header: this.translate.instant('admin.dashboard.columns.views'), align: 'right' }
    ];

    this.mostWishlistedColumns = [
      { key: 'productName', header: this.translate.instant('admin.dashboard.columns.product') },
      { key: 'wishlistCount', header: this.translate.instant('admin.dashboard.columns.wishlist'), align: 'right' }
    ];

    this.countriesColumns = [
      { key: 'label', header: this.translate.instant('admin.dashboard.columns.country') },
      { key: 'value', header: this.translate.instant('admin.dashboard.columns.users'), align: 'right' }
    ];

    this.devicesColumns = [
      { key: 'label', header: this.translate.instant('admin.dashboard.columns.device') },
      { key: 'value', header: this.translate.instant('admin.dashboard.columns.users'), align: 'right' }
    ];

    this.trafficColumns = [
      { key: 'label', header: this.translate.instant('admin.dashboard.columns.source') },
      { key: 'value', header: this.translate.instant('admin.dashboard.columns.sessions'), align: 'right' }
    ];

    this.pagesColumns = [
      { key: 'label', header: this.translate.instant('admin.dashboard.columns.page') },
      { key: 'value', header: this.translate.instant('admin.dashboard.columns.views'), align: 'right' }
    ];
  }

  updateDashboardCharts(data: DashboardResponse): void {
    this.revenueChart.update((chart) => ({
      ...chart,
      series: [
        {
          name: this.translate.instant('admin.dashboard.metric.revenue'),
          data: data.monthlyRevenue.map((x) => x.value)
        }
      ],
      xaxis: { categories: data.monthlyRevenue.map((x) => x.label) }
    }));

    this.ordersChart.update((chart) => ({
      ...chart,
      series: [
        {
          name: this.translate.instant('admin.dashboard.metric.orders'),
          data: data.monthlyOrders.map((x) => x.value)
        }
      ],
      xaxis: { categories: data.monthlyOrders.map((x) => x.label) }
    }));

    this.brandsChart.update((chart) => ({
      ...chart,
      series: [
        {
          name: this.translate.instant('admin.dashboard.metric.products'),
          data: data.topBrands.map((x) => x.value)
        }
      ],
      xaxis: { categories: data.topBrands.map((x) => x.label) }
    }));

    this.categoriesChart.update((chart) => ({
      ...chart,
      series: data.topCategories.map((x) => x.value),
      labels: data.topCategories.map((x) => x.label)
    }));
  }

  updateAnalyticsCharts(data: GoogleAnalyticsDashboardResponse): void {
    this.usersChart.update((chart) => ({
      ...chart,
      series: [
        {
          name: this.translate.instant('admin.dashboard.metric.activeUsers'),
          data: data.dailyUsers.map((x) => x.value)
        }
      ],
      xaxis: { categories: data.dailyUsers.map((x) => x.label) }
    }));

    this.sessionsChart.update((chart) => ({
      ...chart,
      series: [
        {
          name: this.translate.instant('admin.dashboard.metric.sessions'),
          data: data.dailySessions.map((x) => x.value)
        }
      ],
      xaxis: { categories: data.dailySessions.map((x) => x.label) }
    }));

    this.countriesChart.update((chart) => ({
      ...chart,
      series: [
        {
          name: this.translate.instant('admin.dashboard.columns.users'),
          data: data.topCountries.map((x) => x.value)
        }
      ],
      xaxis: { categories: data.topCountries.map((x) => x.label) }
    }));

    this.devicesChart.update((chart) => ({
      ...chart,
      series: data.topDevices.map((x) => x.value),
      labels: data.topDevices.map((x) => x.label)
    }));

    this.trafficChart.update((chart) => ({
      ...chart,
      series: data.trafficSources.map((x) => x.value),
      labels: data.trafficSources.map((x) => x.label)
    }));
  }

  updateChartTranslations(): void {
    const dashboardData = this.data();
    if (dashboardData) {
      this.updateDashboardCharts(dashboardData);
    }

    const analyticsData = this.analytics();
    if (analyticsData) {
      this.updateAnalyticsCharts(analyticsData);
    }
  }

  get topProductsRows(): TopSellingRow[] {
    return (this.data()?.topSellingProducts ?? []).map((p) => ({ ...p, id: p.productId }));
  }

  get mostViewedRows(): MostViewedRow[] {
    return (this.data()?.mostViewedProducts ?? []).map((x) => ({
      id: x.productId,
      productName: x.productName,
      viewsCount: x.viewsCount
    }));
  }

  get mostWishlistedRows(): MostWishlistedRow[] {
    return (this.data()?.mostWishlistedProducts ?? []).map((x) => ({
      id: x.productId,
      productName: x.productName,
      wishlistCount: x.wishlistCount
    }));
  }

  get countriesRows(): AnalyticsRow[] {
    return (this.analytics()?.topCountries ?? []).map((x, index) => ({
      id: index,
      label: x.label || 'Unknown',
      value: x.value
    }));
  }

  get devicesRows(): AnalyticsRow[] {
    return (this.analytics()?.topDevices ?? []).map((x, index) => ({
      id: index,
      label: x.label,
      value: x.value
    }));
  }

  get trafficRows(): AnalyticsRow[] {
    return (this.analytics()?.trafficSources ?? []).map((x, index) => ({
      id: index,
      label: x.label,
      value: x.value
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
        formatter: (value) => `${value.toFixed(0)}`
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
        opacityFrom: 0.45,
        opacityTo: 0.05
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
        formatter: (value) => `${value} EGP`
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
    colors: ['#C9A24B', '#8B6D3B', '#5E4524', '#D9BF77', '#A98A52']
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
        opacityFrom: 0.45,
        opacityTo: 0.05
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
    colors: ['#C9A24B', '#4F46E5', '#22C55E', '#EF4444']
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
    colors: ['#C9A24B', '#22C55E', '#4F46E5', '#F97316']
  });

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  }
}
