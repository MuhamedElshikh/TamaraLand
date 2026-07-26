import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import { PagedResponse } from '../models/catalog.models';
import {
  AdminOrderFilterRequest,
  OrderDetailsResponse,
  UpdateOrderStatusRequest,
} from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class AdminOrderService {
  private readonly baseUrl = `${API_BASE_URL}/api/admin/orders`;

  constructor(private http: HttpClient) {}

  getOrders(filter: AdminOrderFilterRequest = {}): Observable<ApiResponse<PagedResponse<OrderDetailsResponse>>> {
    const params: Record<string, string> = {};
    if (filter.Status !== undefined && filter.Status !== null) {
      params['status'] = String(filter.Status);
    }
    if (filter.OrderNumber && filter.OrderNumber.trim()) {
      params['orderNumber'] = filter.OrderNumber.trim();
    }
    if (filter.search && filter.search.trim()) {
      params['search'] = filter.search.trim();
    }
    if (filter.pageIndex) {
      params['pageIndex'] = String(filter.pageIndex);
    }
    if (filter.pageSize) {
      params['pageSize'] = String(filter.pageSize);
    }
    return this.http.get<ApiResponse<PagedResponse<OrderDetailsResponse>>>(this.baseUrl, { params });
  }

  getOrderById(id: number): Observable<ApiResponse<OrderDetailsResponse>> {
    return this.http.get<ApiResponse<OrderDetailsResponse>>(`${this.baseUrl}/${id}`);
  }

  updateOrderStatus(id: number, status: number): Observable<ApiResponse<void>> {
    const body: UpdateOrderStatusRequest = { status };
    return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/${id}/status`, body);
  }
}