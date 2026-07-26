import { Component, Input } from '@angular/core';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

/** Displays backend-calculated prices only. */
@Component({
  selector: 'app-price-display',
  standalone: true,
  imports: [CurrencyFormatPipe],
  templateUrl: './price-display.component.html',
  styleUrl: './price-display.component.css'
})
export class PriceDisplayComponent {
  @Input() value = 0;
  @Input() originalValue: number | null = null;
  @Input() currencySymbol = 'EGP';
}
