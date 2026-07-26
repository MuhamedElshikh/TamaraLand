import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import { WishlistItemResponse } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly _items = signal<WishlistItemResponse[]>([]);
  readonly items = this._items.asReadonly();

  constructor(private http: HttpClient) {}

  getWishlist(): Observable<ApiResponse<WishlistItemResponse[]>> {
    return this.http.get<ApiResponse<WishlistItemResponse[]>>(`${API_BASE_URL}/api/wishlist`).pipe(
      tap(res => { if (res.success && res.data) this._items.set(res.data); })
    );
  }

  addToWishlist(productId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API_BASE_URL}/api/wishlist/${productId}`, {}).pipe(
      tap(() => this.getWishlist().subscribe())
    );
  }

  removeFromWishlist(productId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API_BASE_URL}/api/wishlist/${productId}`).pipe(
      tap(() => this._items.update(items => items.filter(i => i.id !== productId)))
    );
  }
}
