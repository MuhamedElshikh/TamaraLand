import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import { CartResponse, AddToCartRequest, UpdateCartItemRequest, ApplyCouponRequest } from '../models/domain.models';
import { GuestSessionService } from './guest-session.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly guestSessionService = inject(GuestSessionService);

  private readonly _cart = signal<CartResponse | null>(null);
  readonly cart = this._cart.asReadonly();

  private getGuestIdParams(): { params: HttpParams } {
    const guestId = this.guestSessionService.getGuestId();
    return { params: new HttpParams().set('guestId', guestId) };
  }

  getCart(): Observable<ApiResponse<CartResponse>> {
    return this.http.get<ApiResponse<CartResponse>>(`${API_BASE_URL}/api/Cart`, this.getGuestIdParams()).pipe(
      tap(res => { if (res.success) this._cart.set(res.data); })
    );
  }

  addItem(data: AddToCartRequest): Observable<ApiResponse<void>> {
    const payload: AddToCartRequest = {
      ...data,
      guestId: data.guestId || this.guestSessionService.getGuestId()
    };
    return this.http.post<ApiResponse<void>>(`${API_BASE_URL}/api/Cart/items`, payload).pipe(
      tap(() => this.getCart().subscribe())
    );
  }

  updateItem(data: UpdateCartItemRequest): Observable<ApiResponse<void>> {
    const payload: UpdateCartItemRequest = {
      ...data,
      guestId: data.guestId || this.guestSessionService.getGuestId()
    };
    return this.http.put<ApiResponse<void>>(`${API_BASE_URL}/api/Cart/items`, payload).pipe(
      tap(() => this.getCart().subscribe())
    );
  }

  removeItem(productVariantId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API_BASE_URL}/api/Cart/items/${productVariantId}`, this.getGuestIdParams()).pipe(
      tap(() => this.getCart().subscribe())
    );
  }

  clearCart(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API_BASE_URL}/api/Cart`, this.getGuestIdParams()).pipe(
      tap(() => this._cart.set(null))
    );
  }

  applyCoupon(data: ApplyCouponRequest): Observable<ApiResponse<void>> {
    const payload: ApplyCouponRequest = {
      ...data,
      guestId: data.guestId || this.guestSessionService.getGuestId()
    };
    return this.http.post<ApiResponse<void>>(`${API_BASE_URL}/api/Cart/coupon`, payload).pipe(
      tap(() => this.getCart().subscribe())
    );
  }

  removeCoupon(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API_BASE_URL}/api/Cart/coupon`, this.getGuestIdParams()).pipe(
      tap(() => this.getCart().subscribe())
    );
  }
}
