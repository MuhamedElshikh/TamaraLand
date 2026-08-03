import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs/operators';

import { StoreSettings } from '../models/domain.models';
import { StoreSettingsService } from '../services/store-settings.service';

export const storeSettingsResolver: ResolveFn<boolean> = () => {
  const service = inject(StoreSettingsService);

  return service.load().pipe(
    map(() => true)
  );
};