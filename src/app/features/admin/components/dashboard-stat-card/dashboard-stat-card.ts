import {
  Component,
  input,
} from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';


@Component({
  selector: 'app-dashboard-stat-card',
  standalone: true,

  imports: [
    TranslatePipe,
  ],

  templateUrl: './dashboard-stat-card.html',
  styleUrl: './dashboard-stat-card.css',
})
export class DashboardStatCardComponent {

  title =
    input.required<string>();


  value =
    input.required<string | number>();


  icon =
    input<string>('📊');


  accent =
    input(false);


  warning =
    input(false);

}