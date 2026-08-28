import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'localizedField', standalone: true, pure: false })
export class LocalizedFieldPipe implements PipeTransform, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  private lastArabic?: string;
  private lastEnglish?: string;
  private lastLang: string = '';
  private cachedResult: string = '';
  private readonly langSub: Subscription;

  constructor() {
    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.lastLang = '';
      this.cdr.markForCheck();
    });
  }

  transform(arabicValue?: string, englishValue?: string): string {
    const currentLang = this.translate.currentLang || 'en';
    if (
      this.lastArabic === arabicValue &&
      this.lastEnglish === englishValue &&
      this.lastLang === currentLang
    ) {
      return this.cachedResult;
    }

    this.lastArabic = arabicValue;
    this.lastEnglish = englishValue;
    this.lastLang = currentLang;

    const isArabic = currentLang === 'ar';
    this.cachedResult = (isArabic ? arabicValue : englishValue) || arabicValue || englishValue || '';
    return this.cachedResult;
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
  }
}