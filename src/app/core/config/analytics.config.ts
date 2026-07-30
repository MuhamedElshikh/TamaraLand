import { InjectionToken } from '@angular/core';

export interface AnalyticsConfig {
  enabled: boolean;
  gaMeasurementId?: string;
  gadsConversionId?: string;
  gtmId?: string;
}

export const ANALYTICS_CONFIG = new InjectionToken<AnalyticsConfig>('ANALYTICS_CONFIG');
