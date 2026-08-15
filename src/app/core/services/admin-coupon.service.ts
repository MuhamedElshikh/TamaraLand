import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import { PagedResponse } from '../models/catalog.models';
import { CouponResponse, CreateCouponRequest, UpdateCouponRequest } from '../models/domain.models';

// ⚠️ شكل الفلتر مش مؤكد من الباك إند - افتراض منطقي، عدّله لو مختلف
export interface CouponFilterRequest {
  search?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminCouponService {
  private readonly baseUrl = `${API_BASE_URL}/api/Coupon`;

  constructor(private http: HttpClient) {}

  getAll(filter: CouponFilterRequest = {}): Observable<ApiResponse<PagedResponse<CouponResponse>>> {
    const params: Record<string, string> = {};
    Object.entries(filter).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params[k] = String(v); });
    return this.http.get<ApiResponse<PagedResponse<CouponResponse>>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<CouponResponse>> {
    return this.http.get<ApiResponse<CouponResponse>>(`${this.baseUrl}/${id}`);
  }

  create(data: CreateCouponRequest): Observable<ApiResponse<CouponResponse>> {
    return this.http.post<ApiResponse<CouponResponse>>(this.baseUrl, data);
  }

  update(id: number, data: UpdateCouponRequest): Observable<ApiResponse<CouponResponse>> {
    return this.http.put<ApiResponse<CouponResponse>>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}