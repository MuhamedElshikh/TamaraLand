import {
  ApplicationConfig,
  provideZoneChangeDetection,
  inject,
  provideAppInitializer
} from '@angular/core';

import {
  provideRouter,
  withInMemoryScrolling
} from '@angular/router';

import {
  provideHttpClient,
  withFetch,
  withInterceptors
} from '@angular/common/http';

import {
  provideClientHydration,
  withEventReplay
} from '@angular/platform-browser';

import {
  provideTranslateService
} from '@ngx-translate/core';

import { routes } from './app.routes';

import { guestIdInterceptor } from './core/interceptors/guest-id.interceptor';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

import { StoreSettingsService } from './core/services/store-settings.service';
import { LanguageService } from './core/services/language.service';

export const appConfig: ApplicationConfig = {
  providers: [

    provideZoneChangeDetection({
      eventCoalescing: true
    }),

    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),

    provideHttpClient(
       withFetch(),
      withInterceptors([
        guestIdInterceptor,
        jwtInterceptor,
        errorInterceptor
      ])
    ),

    provideTranslateService({
      fallbackLang: 'en'
    }),

    provideAppInitializer(() => {
      const storeSettingsService =
        inject(StoreSettingsService);

      return storeSettingsService.load();
    }),

    provideAppInitializer(() => {
      const languageService =
        inject(LanguageService);

      return languageService.load();
    }),

    provideClientHydration(
      withEventReplay()
    )
  ]
};