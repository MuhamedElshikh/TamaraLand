import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-shipping',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './shipping.page.html',
  styleUrl: './shipping.page.css',
})
export class ShippingPage {}
