import { ApplicationConfig, provideZoneChangeDetection,inject, provideAppInitializer } from '@angular/core';
import { provideRouter ,withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';

import { guestIdInterceptor } from './core/interceptors/guest-id.interceptor';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

import {
  provideTranslateLoader,
  provideTranslateService
} from '@ngx-translate/core';

import {
  TranslateHttpLoader,
  provideTranslateHttpLoader
} from '@ngx-translate/http-loader';
import { StoreSettingsService } from './core/services/store-settings.service';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true
    }),

    provideRouter(routes,withInMemoryScrolling({
        scrollPositionRestoration: 'top', // يرجع لفوق مع كل navigation
        anchorScrolling: 'enabled' // لو بتستخدم #anchors كمان
      })
    ),

    provideHttpClient(
      withInterceptors([
        guestIdInterceptor,
        jwtInterceptor,
        errorInterceptor
      ])
    ),

    // Configure ngx-translate HTTP loader
    ...provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json'
    }),

    // Configure translate service
    ...provideTranslateService({
      loader: provideTranslateLoader(TranslateHttpLoader),
      fallbackLang: 'en',
      lang: 'en'
    }),
     provideAppInitializer(() => {
      const storeSettingsService = inject(StoreSettingsService);
      return storeSettingsService.load();
    }), provideClientHydration(withEventReplay()),
  ]

  
};