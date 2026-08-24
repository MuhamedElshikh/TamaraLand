import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators';
import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import {
  CartResponse,
  AddToCartRequest,
  UpdateCartItemRequest,
  ApplyCouponRequest,
} from '../models/domain.models';
import { GuestSessionService } from './guest-session.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly guestSessionService = inject(GuestSessionService);

  private readonly _cart = signal<CartResponse | null>(null);
  readonly cart = this._cart.asReadonly();

  private readonly _messages = signal<string[]>([]);
  readonly messages = this._messages.asReadonly();

  private getGuestIdParams(): { params: HttpParams } {
    const guestId = this.guestSessionService.getGuestId();
    return { params: new HttpParams().set('guestId', guestId ?? '') };
  }

  private withGuestId<T extends { guestId?: string }>(data: T): T {
    return {
      ...data,
      guestId: data.guestId || this.guestSessionService.getGuestId() || undefined,
    };
  }

  private fetchCart(): Observable<CartResponse> {
    return this.http
      .get<ApiResponse<CartResponse>>(`${API_BASE_URL}/api/Cart`, this.getGuestIdParams())
      .pipe(
        tap(res => {
          if (res.success && res.data) {
            this._cart.set(res.data);
            this._messages.set(res.data.messages ?? []);
          }
        }),
        map(res => res.data as CartResponse),
      );
  }

  getCart(): Observable<ApiResponse<CartResponse>> {
    return this.http
      .get<ApiResponse<CartResponse>>(`${API_BASE_URL}/api/Cart`, this.getGuestIdParams())
      .pipe(
        tap(res => {
          if (res.success && res.data) {
            this._cart.set(res.data);
            this._messages.set(res.data.messages ?? []);
          }
        }),
      );
  }

  addItem(data: AddToCartRequest): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${API_BASE_URL}/api/Cart/items`, this.withGuestId(data))
      .pipe(
        switchMap(() => this.fetchCart()),
        map(() => void 0),
      );
  }

  updateItem(data: UpdateCartItemRequest): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${API_BASE_URL}/api/Cart/items`, this.withGuestId(data))
      .pipe(
        switchMap(() => this.fetchCart()),
        map(() => void 0),
      );
  }

  removeItem(productVariantId: number): Observable<void> {
    // ✅ اتصلحت — كانت فيها URL متقطعة/متكررة بالغلط
    return this.http
      .delete<ApiResponse<void>>(
        `${API_BASE_URL}/api/Cart/items/${productVariantId}`,
        this.getGuestIdParams(),
      )
      .pipe(
        switchMap(() => this.fetchCart()),
        map(() => void 0),
      );
  }

  clearCart(): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${API_BASE_URL}/api/Cart`, this.getGuestIdParams())
      .pipe(
        switchMap(() => this.fetchCart()),
        map(() => void 0),
      );
  }

  applyCoupon(data: ApplyCouponRequest): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${API_BASE_URL}/api/Cart/coupon`, this.withGuestId(data))
      .pipe(
        switchMap(() => this.fetchCart()),
        map(() => void 0),
      );
  }

  removeCoupon(): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${API_BASE_URL}/api/Cart/coupon`, this.getGuestIdParams())
      .pipe(
        switchMap(() => this.fetchCart()),
        map(() => void 0),
      );
  }
  increaseProduct(productId: number): Observable<void> {
  const items = this._cart()?.items.filter(
    item => item.productId === productId
  ) ?? [];

  // لو مفيش Variant للمنتج، مفيش حاجة نعملها
  if (items.length === 0) {
    return of(void 0);
  }

  // لو فيه أكتر من Variant، الـ Product Card مش هيعدل الكمية
  // لأننا مش عارفين المستخدم يقصد أنهي Variant
  if (items.length > 1) {
    return of(void 0);
  }

  const item = items[0];

  return this.updateItem({
    productVariantId: item.productVariantId,
    quantity: item.quantity + 1,
  });
}

decreaseProduct(productId: number): Observable<void> {
  const items = this._cart()?.items.filter(
    item => item.productId === productId
  ) ?? [];

  if (items.length === 0) {
    return of(void 0);
  }

  // أكثر من Variant → Product Card مش هيعدل
  if (items.length > 1) {
    return of(void 0);
  }

  const item = items[0];

  if (item.quantity > 1) {
    return this.updateItem({
      productVariantId: item.productVariantId,
      quantity: item.quantity - 1,
    });
  }

  // quantity === 1
  return this.removeItem(item.productVariantId);
}
}