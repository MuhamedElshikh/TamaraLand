import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import { CartResponse, AddToCartRequest, UpdateCartItemRequest, ApplyCouponRequest } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _cart = signal<CartResponse | null>(null);
  readonly cart = this._cart.asReadonly();

  constructor(private http: HttpClient) {}

  getCart(): Observable<ApiResponse<CartResponse>> {
    return this.http.get<ApiResponse<CartResponse>>(`${API_BASE_URL}/api/Cart`).pipe(
      tap(res => { if (res.success) this._cart.set(res.data); })
    );
  }

  addItem(data: AddToCartRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API_BASE_URL}/api/Cart/items`, data).pipe(
      tap(() => this.getCart().subscribe())
    );
  }

  updateItem(data: UpdateCartItemRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API_BASE_URL}/api/Cart/items`, data).pipe(
      tap(() => this.getCart().subscribe())
    );
  }

  removeItem(productVariantId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API_BASE_URL}/api/Cart/items/${productVariantId}`).pipe(
      tap(() => this.getCart().subscribe())
    );
  }

  clearCart(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API_BASE_URL}/api/Cart`).pipe(
      tap(() => this._cart.set(null))
    );
  }

  applyCoupon(data: ApplyCouponRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API_BASE_URL}/api/Cart/apply-coupon`, data).pipe(
      tap(() => this.getCart().subscribe())
    );
  }

  removeCoupon(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API_BASE_URL}/api/Cart/coupon`).pipe(
      tap(() => this.getCart().subscribe())
    );
  }
}
