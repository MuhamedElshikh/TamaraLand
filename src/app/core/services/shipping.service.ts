import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import { ShippingAreaResponse, ShippingLookupResponse } from '../models/domain.models';

/**
 * Loads governorates/areas shipping lookup from backend.
 */
@Injectable({ providedIn: 'root' })
export class ShippingService {
  private readonly _areas = signal<ShippingAreaResponse[]>([]);
  private readonly _lookup = signal<ShippingLookupResponse[]>([]);

  readonly areas = this._areas.asReadonly();
  readonly lookup = this._lookup.asReadonly();

  constructor(private readonly http: HttpClient) {}

  getShippingAreas(): Observable<ApiResponse<ShippingAreaResponse[]>> {
    return this.http.get<ApiResponse<ShippingAreaResponse[]>>(`${API_BASE_URL}/api/ShippingAreas`).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this._areas.set(response.data);
        }
      })
    );
  }

  getShippingLookup(): Observable<ApiResponse<ShippingLookupResponse[]>> {
    return this.http
      .get<ApiResponse<ShippingLookupResponse[]>>(`${API_BASE_URL}/api/ShippingAreas/lookup`)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this._lookup.set(response.data);
          }
        })
      );
  }
}
