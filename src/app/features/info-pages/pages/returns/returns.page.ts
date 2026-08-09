import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './returns.page.html',
  styleUrl: './returns.page.css',
})
export class ReturnsPage {}
