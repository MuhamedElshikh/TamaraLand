import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { StoreSettings } from '../models/domain.models';
import { StoreSettingsService } from '../services/store-settings.service';

/**
 * Preloads store settings before app shell renders.
 */
export const storeSettingsResolver: ResolveFn<StoreSettings> = () => {
  const storeSettingsService = inject(StoreSettingsService);
  return storeSettingsService.settings();
};
