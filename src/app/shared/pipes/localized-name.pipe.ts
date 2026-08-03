import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Pipe({
  name: 'localizedName',
  standalone: true,
  pure: false
})
export class LocalizedNamePipe implements PipeTransform {

  private readonly languageService = inject(LanguageService);

  transform(
    value:
      | {
          name?: string;
          arabicName?: string;

          productName?: string;
          productArabicName?: string;
        }
      | null
      | undefined
  ): string {

    if (!value) return '';

    const english =
      value.name ??
      value.productName ??
      '';

    const arabic =
      value.arabicName ??
      value.productArabicName ??
      '';

    return this.languageService.isArabic()
      ? (arabic || english)
      : (english || arabic);
  }
}