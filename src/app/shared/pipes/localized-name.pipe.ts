import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';

@Pipe({
  name: 'localizedName',
  standalone: true,
  pure: false,
})
export class LocalizedNamePipe implements PipeTransform, OnDestroy {
  private readonly languageService = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  private lastValue: any = null;
  private lastLang: string = '';
  private cachedResult: string = '';
  private readonly langSub: Subscription;

  constructor() {
    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.lastLang = '';
      this.cdr.markForCheck();
    });
  }

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

    const currentLang = this.languageService.currentLanguage;
    if (this.lastValue === value && this.lastLang === currentLang) {
      return this.cachedResult;
    }

    this.lastValue = value;
    this.lastLang = currentLang;

    const english =
      value.name ??
      value.productName ??
      '';

    const arabic =
      value.arabicName ??
      value.productArabicName ??
      '';

    this.cachedResult = this.languageService.isArabic()
      ? (arabic || english)
      : (english || arabic);

    return this.cachedResult;
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
  }
}