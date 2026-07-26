import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import { DiscountResponse, CreateDiscountRequest, UpdateDiscountRequest } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class AdminDiscountService {
  private readonly baseUrl = `${API_BASE_URL}/api/admin/discounts`;

  constructor(private http: HttpClient) {}

  // مفيش pagination ولا فلاتر - endpoint بيرجع الليستة كاملة
  getAll(): Observable<ApiResponse<DiscountResponse[]>> {
    return this.http.get<ApiResponse<DiscountResponse[]>>(this.baseUrl);
  }

  getById(id: number): Observable<ApiResponse<DiscountResponse>> {
    return this.http.get<ApiResponse<DiscountResponse>>(`${this.baseUrl}/${id}`);
  }

  create(data: CreateDiscountRequest): Observable<ApiResponse<DiscountResponse>> {
    return this.http.post<ApiResponse<DiscountResponse>>(this.baseUrl, data);
  }

  update(id: number, data: UpdateDiscountRequest): Observable<ApiResponse<DiscountResponse>> {
    return this.http.put<ApiResponse<DiscountResponse>>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}