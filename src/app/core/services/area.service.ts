import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';

import {
  AreaResponse,
  AreaLookupResponse,
  GovernorateLookupResponse,
} from '../models/domain.models';

@Injectable({
  providedIn: 'root',
})
export class AreaService {
  private readonly _areas =
    signal<AreaResponse[]>([]);

  private readonly _lookup =
    signal<AreaLookupResponse[]>([]);

  readonly areas =
    this._areas.asReadonly();

  readonly lookup =
    this._lookup.asReadonly();

  constructor(
    private readonly http: HttpClient
  ) {}

  getAreas(
    params?: {
      pageNumber?: number;
      pageSize?: number;
      search?: string;
      governorateId?: number;
      isDeliveryAvailable?: boolean;
    }
  ): Observable<
    ApiResponse<{
      items: AreaResponse[];
      pageNumber: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    }>
  > {
    const httpParams: Record<string, string> = {};

    if (params?.pageNumber != null) {
      httpParams['pageNumber'] =
        String(params.pageNumber);
    }

    if (params?.pageSize != null) {
      httpParams['pageSize'] =
        String(params.pageSize);
    }

    if (
      params?.search != null &&
      params.search.trim().length > 0
    ) {
      httpParams['search'] =
        params.search.trim();
    }

    if (params?.governorateId != null) {
      httpParams['governorateId'] =
        String(params.governorateId);
    }

    if (
      params?.isDeliveryAvailable != null
    ) {
      httpParams['isDeliveryAvailable'] =
        String(
          params.isDeliveryAvailable
        );
    }

    return this.http
      .get<
        ApiResponse<{
          items: AreaResponse[];
          pageNumber: number;
          pageSize: number;
          totalCount: number;
          totalPages: number;
          hasPreviousPage: boolean;
          hasNextPage: boolean;
        }>
      >(
        `${API_BASE_URL}/api/Area`,
        {
          params: httpParams,
        }
      )
      .pipe(
        tap((response) => {
          if (
            response.success &&
            response.data
          ) {
            this._areas.set(
              response.data.items
            );
          }
        })
      );
  }

  getArea(
    id: number
  ): Observable<
    ApiResponse<AreaResponse>
  > {
    return this.http.get<
      ApiResponse<AreaResponse>
    >(
      `${API_BASE_URL}/api/Area/${id}`
    );
  }

  updateShipping(
    id: number,
    payload: {
      shippingCost: number;
      isDeliveryAvailable: boolean;
    }
  ): Observable<
    ApiResponse<AreaResponse>
  > {
    return this.http.put<
      ApiResponse<AreaResponse>
    >(
      `${API_BASE_URL}/api/Area/${id}/shipping`,
      payload
    );
  }

  getLookup(): Observable<
    ApiResponse<AreaLookupResponse[]>
  > {
    return this.http
      .get<
        ApiResponse<AreaLookupResponse[]>
      >(
        `${API_BASE_URL}/api/Area/lookup`
      )
      .pipe(
        tap((response) => {
          if (
            response.success &&
            response.data
          ) {
            this._lookup.set(
              response.data
            );
          }
        })
      );
  }

  getGovernorates(): Observable<
    ApiResponse<GovernorateLookupResponse[]>
  > {
    return this.http.get<
      ApiResponse<GovernorateLookupResponse[]>
    >(
      `${API_BASE_URL}/api/Area/governorates`
    );
  }
}