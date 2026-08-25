import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';

import {
  AddressResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
  AreaLookupResponse,
} from '../models/domain.models';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private readonly _addresses =
    signal<AddressResponse[]>([]);

  private readonly _areaLookup =
    signal<AreaLookupResponse[]>([]);

  readonly addresses =
    this._addresses.asReadonly();

  readonly areaLookup =
    this._areaLookup.asReadonly();

  constructor(
    private readonly http: HttpClient
  ) {}

  getAddresses(): Observable<
    ApiResponse<AddressResponse[]>
  > {
    return this.http
      .get<ApiResponse<AddressResponse[]>>(
        `${API_BASE_URL}/api/Address`
      )
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this._addresses.set(res.data);
          }
        })
      );
  }

  createAddress(
    data: CreateAddressRequest
  ): Observable<
    ApiResponse<AddressResponse>
  > {
    return this.http
      .post<ApiResponse<AddressResponse>>(
        `${API_BASE_URL}/api/Address`,
        data
      )
      .pipe(
        tap(() => {
          this.getAddresses().subscribe();
        })
      );
  }

  updateAddress(
    id: number,
    data: UpdateAddressRequest
  ): Observable<
    ApiResponse<AddressResponse>
  > {
    return this.http
      .put<ApiResponse<AddressResponse>>(
        `${API_BASE_URL}/api/Address/${id}`,
        data
      )
      .pipe(
        tap(() => {
          this.getAddresses().subscribe();
        })
      );
  }

  deleteAddress(
    id: number
  ): Observable<ApiResponse<void>> {
    return this.http
      .delete<ApiResponse<void>>(
        `${API_BASE_URL}/api/Address/${id}`
      )
      .pipe(
        tap(() => {
          this._addresses.update(
            (addresses) =>
              addresses.filter(
                (address) =>
                  address.id !== id
              )
          );
        })
      );
  }

  setDefault(
    id: number
  ): Observable<ApiResponse<void>> {
    return this.http
      .patch<ApiResponse<void>>(
        `${API_BASE_URL}/api/Address/${id}/default`,
        {}
      )
      .pipe(
        tap(() => {
          this.getAddresses().subscribe();
        })
      );
  }

  getAreaLookup(): Observable<
    ApiResponse<AreaLookupResponse[]>
  > {
    return this.http
      .get<ApiResponse<AreaLookupResponse[]>>(
        `${API_BASE_URL}/api/Area/lookup`
      )
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this._areaLookup.set(
              res.data
            );
          }
        })
      );
  }
}