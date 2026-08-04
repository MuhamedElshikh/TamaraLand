import { Component, Input } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexStroke,
  ApexDataLabels,
  ApexGrid,
  ApexTooltip,
  ApexYAxis,
  ApexLegend,
  ApexFill,
  ApexMarkers,
  ApexPlotOptions,
  NgApexchartsModule,
  ApexNonAxisChartSeries
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  labels?: string[];
  xaxis?: ApexXAxis;
  yaxis?: ApexYAxis;

  stroke?: ApexStroke;
  dataLabels?: ApexDataLabels;
  grid?: ApexGrid;
  tooltip?: ApexTooltip;

  legend?: ApexLegend;
  fill?: ApexFill;
  markers?: ApexMarkers;
  plotOptions?: ApexPlotOptions;

  colors?: string[];
};

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  imports: [NgApexchartsModule,],
  templateUrl: './dashboard-chart.html',
  styleUrl: './dashboard-chart.css'
})
export class DashboardChartComponent {

  @Input({ required: true })
  chartOptions!: ChartOptions;

}