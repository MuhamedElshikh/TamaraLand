import { Pipe, PipeTransform } from '@angular/core';

/** Formats backend-calculated prices for display only. */
@Pipe({ name: 'currencyFormat', standalone: true })
export class CurrencyFormatPipe implements PipeTransform {
  transform(
    value: number | string | null | undefined,
    currencySymbol = 'EGP',
    locale = 'en-US'
  ): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    const numericValue = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(numericValue)) {
      return String(value);
    }

    return `${currencySymbol} ${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
    }).format(numericValue)}`;
  }
}
