import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators'; // ✅ ضفنا map
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

  // ✅ الرسائل strings جاهزة من الـ backend (زي ما هو معرّف في CartResponse)
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

  /**
   * الميثود المركزية: تجيب الكارت وتحدّث الـ signals.
   */
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
    return this.http
      .delete<ApiResponse<void>>(
        `APIBASEURL/api/Cart/items/{API_BASE_URL}/api/Cart/items/APIB​ASEU​RL/api/Cart/items/{productVariantId}`,
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
        // بنجيب الكارت الفاضي من السيرفر عشان ناخد messages + totals الصح
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
}
