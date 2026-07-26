import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import { PagedResponse } from '../models/catalog.models';
import {
  CheckoutRequest, CheckoutSummaryResponse,
  OrderResponse, OrderDetailsResponse, OrderFilterRequest
} from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly _orders = signal<OrderResponse[]>([]);
  readonly orders = this._orders.asReadonly();

  constructor(private http: HttpClient) {}

  checkout(data: CheckoutRequest): Observable<ApiResponse<CheckoutSummaryResponse>> {
    return this.http.post<ApiResponse<CheckoutSummaryResponse>>(`${API_BASE_URL}/api/Order/checkout`, data);
  }

  getMyOrders(filter: OrderFilterRequest = {}): Observable<ApiResponse<PagedResponse<OrderResponse>>> {
    const params: Record<string, string> = {};
    Object.entries(filter).forEach(([k, v]) => { if (v !== undefined && v !== null) params[k] = String(v); });
    return this.http.get<ApiResponse<PagedResponse<OrderResponse>>>(`${API_BASE_URL}/api/Order`, { params }).pipe(
      tap(res => { if (res.success && res.data) this._orders.set(res.data.items); })
    );
  }

  getOrderById(id: number): Observable<ApiResponse<OrderDetailsResponse>> {
    return this.http.get<ApiResponse<OrderDetailsResponse>>(`${API_BASE_URL}/api/Order/${id}`);
  }
}
