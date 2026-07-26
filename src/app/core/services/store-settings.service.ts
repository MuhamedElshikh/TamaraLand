import { Injectable, signal } from '@angular/core';
import { StoreSettings } from '../models/domain.models';

const STORAGE_KEY = 'tmara_store_settings';

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Tmara Land',
  supportEmail: 'support@tmaraland.com',
  supportPhone: '01000000000',
  address: 'Egypt',
  currency: 'EGP',
  currencySymbol: 'ج.م',
  facebookUrl: 'https://facebook.com/tmaraland',
  instagramUrl: 'https://instagram.com/tmaraland',
  whatsAppNumber: '01000000000',
};

@Injectable({ providedIn: 'root' })
export class StoreSettingsService {
  private readonly _settings = signal<StoreSettings>(this.loadSettings());

  readonly settings = this._settings.asReadonly();

  private loadSettings(): StoreSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return DEFAULT_SETTINGS;
  }

  update(settings: Partial<StoreSettings>): void {
    const updated = { ...this._settings(), ...settings };
    this._settings.set(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  reset(): void {
    this._settings.set(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  }
}
