// localized-field.pipe.ts
import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'localizedField', standalone: true, pure: false })
export class LocalizedFieldPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(arabicValue?: string, englishValue?: string): string {
    const isArabic = this.translate.currentLang === 'ar';
    return (isArabic ? arabicValue : englishValue) || arabicValue || englishValue || '';
  }
}