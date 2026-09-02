import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  inject,
  PLATFORM_ID
} from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import enTranslations from '../../../assets/i18n/en.json';
import arTranslations from '../../../assets/i18n/ar.json';

export type AppLanguage = 'en' | 'ar';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly STORAGE_KEY = 'app-language';

  private readonly document = inject(DOCUMENT);
  private readonly translate = inject(TranslateService);

  private readonly isBrowser = isPlatformBrowser(
    inject(PLATFORM_ID)
  );

  constructor() {
    this.translate.addLangs(['en', 'ar']);

    // الترجمات موجودة بالفعل داخل الـ bundle
    // فلا يوجد أي HTTP request أثناء prerender
    this.translate.setTranslation(
      'en',
      enTranslations,
      true
    );

    this.translate.setTranslation(
      'ar',
      arTranslations,
      true
    );

    this.translate.setFallbackLang('en');
  }

  get currentLanguage(): AppLanguage {
    const current = this.translate.currentLang;

    return current === 'ar'
      ? 'ar'
      : 'en';
  }

  async load(): Promise<void> {
    let language: AppLanguage = 'en';

    if (this.isBrowser) {
      const saved =
        localStorage.getItem(this.STORAGE_KEY);

      if (saved === 'en' || saved === 'ar') {
        language = saved;
      }
    }

    await this.applyLanguage(
      language,
      false
    );
  }

  async setLanguage(
    lang: AppLanguage
  ): Promise<void> {
    await this.applyLanguage(
      lang,
      true
    );
  }

  async toggle(): Promise<void> {
    const nextLanguage: AppLanguage =
      this.currentLanguage === 'en'
        ? 'ar'
        : 'en';

    await this.setLanguage(nextLanguage);
  }

  isArabic(): boolean {
    return this.currentLanguage === 'ar';
  }

  private async applyLanguage(
    lang: AppLanguage,
    persist: boolean
  ): Promise<void> {

    await firstValueFrom(
      this.translate.use(lang)
    );

    this.document.documentElement.lang =
      lang;

    this.document.documentElement.dir =
      lang === 'ar'
        ? 'rtl'
        : 'ltr';

    if (
      persist &&
      this.isBrowser
    ) {
      localStorage.setItem(
        this.STORAGE_KEY,
        lang
      );
    }
  }
}