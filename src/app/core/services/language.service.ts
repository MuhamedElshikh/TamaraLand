import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'en' | 'ar';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly STORAGE_KEY = 'app-language';

  private readonly document = inject(DOCUMENT);
  private readonly translate = inject(TranslateService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    this.translate.addLangs(['en', 'ar']);
    this.translate.setFallbackLang('en');
  }

  get currentLanguage(): AppLanguage {
    return (this.translate.currentLang as AppLanguage) || 'en';
  }

  /**
   * Loads the initial application language.
   *
   * During SSR/prerender:
   * - Always uses English.
   * - Waits until the translation file is fully loaded.
   *
   * In the browser:
   * - Uses the language saved in localStorage.
   * - Falls back to English.
   */
  async load(): Promise<void> {
    const savedLanguage = this.isBrowser
      ? (localStorage.getItem(this.STORAGE_KEY) as AppLanguage | null)
      : null;

    const language: AppLanguage =
      savedLanguage === 'ar' || savedLanguage === 'en'
        ? savedLanguage
        : 'en';

    await this.setLanguage(language, false);
  }

  /**
   * Changes the current language and waits for its translation file
   * to be loaded before continuing.
   */
  async setLanguage(
    lang: AppLanguage,
    persist = true
  ): Promise<void> {
    await this.translate.use(lang).toPromise();

    if (persist && this.isBrowser) {
      localStorage.setItem(this.STORAGE_KEY, lang);
    }

    this.document.documentElement.lang = lang;
    this.document.documentElement.dir =
      lang === 'ar' ? 'rtl' : 'ltr';
  }

  async toggle(): Promise<void> {
    const nextLanguage: AppLanguage =
      this.currentLanguage === 'en' ? 'ar' : 'en';

    await this.setLanguage(nextLanguage);
  }

  isArabic(): boolean {
    return this.currentLanguage === 'ar';
  }
}