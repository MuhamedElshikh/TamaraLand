import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import {
  AddressResponse, CreateAddressRequest, UpdateAddressRequest,
  ShippingLookupResponse
} from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private readonly _addresses = signal<AddressResponse[]>([]);
  private readonly _shippingLookup = signal<ShippingLookupResponse[]>([]);

  readonly addresses = this._addresses.asReadonly();
  readonly shippingLookup = this._shippingLookup.asReadonly();

  constructor(private http: HttpClient) {}

  getAddresses(): Observable<ApiResponse<AddressResponse[]>> {
    return this.http.get<ApiResponse<AddressResponse[]>>(`${API_BASE_URL}/api/Address`).pipe(
      tap(res => { if (res.success && res.data) this._addresses.set(res.data); })
    );
  }

  createAddress(data: CreateAddressRequest): Observable<ApiResponse<AddressResponse>> {
    return this.http.post<ApiResponse<AddressResponse>>(`${API_BASE_URL}/api/Address`, data).pipe(
      tap(() => this.getAddresses().subscribe())
    );
  }

  updateAddress(id: number, data: UpdateAddressRequest): Observable<ApiResponse<AddressResponse>> {
    return this.http.put<ApiResponse<AddressResponse>>(`${API_BASE_URL}/api/Address/${id}`, data).pipe(
      tap(() => this.getAddresses().subscribe())
    );
  }

  deleteAddress(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API_BASE_URL}/api/Address/${id}`).pipe(
      tap(() => this._addresses.update(a => a.filter(x => x.id !== id)))
    );
  }

  setDefault(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${API_BASE_URL}/api/Address/${id}/default`, {}).pipe(
      tap(() => this.getAddresses().subscribe())
    );
  }

  getShippingLookup(): Observable<ApiResponse<ShippingLookupResponse[]>> {
    return this.http.get<ApiResponse<ShippingLookupResponse[]>>(`${API_BASE_URL}/api/admin/shipping-areas/lookup`).pipe(
      tap(res => { if (res.success && res.data) this._shippingLookup.set(res.data); })
    );
  }
}
