import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import {
  StoreSettings,
  UpdateStoreSettingsRequest
} from '../models/domain.models';

@Injectable({
  providedIn: 'root'
})
export class StoreSettingsService {

  private readonly _settings = signal<StoreSettings | null>(null);

  readonly settings = this._settings.asReadonly();

  constructor(
    private readonly http: HttpClient
  ) {}

  load(): Observable<ApiResponse<StoreSettings>> {
    return this.http
      .get<ApiResponse<StoreSettings>>(
        `${API_BASE_URL}/api/store-settings`
      )
      .pipe(
        tap(res => {
          if (res.success && res.data) {
            this._settings.set(res.data);
          }
        })
      );
  }

  update(
    request: UpdateStoreSettingsRequest
  ): Observable<ApiResponse<StoreSettings>> {

    return this.http
      .put<ApiResponse<StoreSettings>>(
        `${API_BASE_URL}/api/store-settings`,
        request
      )
      .pipe(
        tap(res => {
          if (res.success && res.data) {
            this._settings.set(res.data);
          }
        })
      );
  }

  current(): StoreSettings | null {
    return this._settings();
  }

  clear(): void {
    this._settings.set(null);
  }

  refresh(): void {
    this.load().subscribe();
  }
}