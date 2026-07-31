import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'en' | 'ar';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly STORAGE_KEY = 'app-language';

  private document = inject(DOCUMENT);
  private translate = inject(TranslateService);

  constructor() {
    const saved = (localStorage.getItem(this.STORAGE_KEY) as AppLanguage) ?? 'en';

    this.translate.addLangs(['en', 'ar']);
    this.translate.setFallbackLang('en');

    this.setLanguage(saved);
  }

  get currentLanguage(): AppLanguage {
    return (this.translate.currentLang as AppLanguage) || 'en';
  }

  setLanguage(lang: AppLanguage): void {
    this.translate.use(lang);

    localStorage.setItem(this.STORAGE_KEY, lang);

    this.document.documentElement.lang = lang;
    this.document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  toggle(): void {
    this.setLanguage(this.currentLanguage === 'en' ? 'ar' : 'en');
  }

  isArabic(): boolean {
    return this.currentLanguage === 'ar';
  }
}