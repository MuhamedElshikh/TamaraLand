import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import { PagedResponse } from '../models/catalog.models';
import {
  ShippingAreaAdminResponse, CreateShippingAreaRequest,
  UpdateShippingAreaRequest, ShippingAreaFilterRequest
} from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class AdminShippingAreaService {
  private readonly baseUrl = `${API_BASE_URL}/api/admin/shipping-areas`;

  constructor(private http: HttpClient) {}

  getAll(filter: ShippingAreaFilterRequest = {}): Observable<ApiResponse<PagedResponse<ShippingAreaAdminResponse>>> {
    const params: Record<string, string> = {};
    Object.entries(filter).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params[k] = String(v); });
    return this.http.get<ApiResponse<PagedResponse<ShippingAreaAdminResponse>>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<ShippingAreaAdminResponse>> {
    return this.http.get<ApiResponse<ShippingAreaAdminResponse>>(`${this.baseUrl}/${id}`);
  }

  create(data: CreateShippingAreaRequest): Observable<ApiResponse<ShippingAreaAdminResponse>> {
    return this.http.post<ApiResponse<ShippingAreaAdminResponse>>(this.baseUrl, data);
  }

  update(id: number, data: UpdateShippingAreaRequest): Observable<ApiResponse<ShippingAreaAdminResponse>> {
    return this.http.put<ApiResponse<ShippingAreaAdminResponse>>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}