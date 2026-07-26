import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import { CreateReviewRequest, ReviewResponse, UpdateReviewRequest } from '../models/domain.models';

/**
 * Customer review CRUD against backend API.
 * Backend route: [Route("api/[controller]")] على ReviewController → api/Review (مفرد)
 */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly baseUrl = `${API_BASE_URL}/api/Review`;

  private readonly _reviews = signal<ReviewResponse[]>([]);
  readonly reviews = this._reviews.asReadonly();

  constructor(private readonly http: HttpClient) {}

  getProductReviews(productId: number): Observable<ApiResponse<ReviewResponse[]>> {
    return this.http.get<ApiResponse<ReviewResponse[]>>(`${this.baseUrl}/product/${productId}`).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this._reviews.set(response.data);
        }
      })
    );
  }

  createReview(data: CreateReviewRequest): Observable<ApiResponse<ReviewResponse>> {
    return this.http.post<ApiResponse<ReviewResponse>>(this.baseUrl, data);
  }

  updateReview(reviewId: number, data: UpdateReviewRequest): Observable<ApiResponse<ReviewResponse>> {
    return this.http.put<ApiResponse<ReviewResponse>>(`${this.baseUrl}/${reviewId}`, data);
  }

  deleteReview(reviewId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${reviewId}`);
  }
}