import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Pipe({
  name: 'localizedName',
  standalone: true,
  pure: false
})
export class LocalizedNamePipe implements PipeTransform {

  private languageService = inject(LanguageService);

  transform(value: { name?: string; arabicName?: string } | null | undefined): string {
    if (!value) return '';

    return this.languageService.isArabic()
      ? (value.arabicName || value.name || '')
      : (value.name || value.arabicName || '');
  }
}