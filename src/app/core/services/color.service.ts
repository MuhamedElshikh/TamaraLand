import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ApiResponse,
  ColorResponse,
  CreateColorRequest,
  UpdateColorRequest,
} from '../models';
import { API_BASE_URL } from '../constants/api.constants';

@Injectable({
  providedIn: 'root',
})
export class ColorService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${API_BASE_URL}/api/Color`;

  getAll(): Observable<ApiResponse<ColorResponse[]>> {
    return this.http.get<ApiResponse<ColorResponse[]>>(
      this.apiUrl
    );
  }

  getById(
    id: number
  ): Observable<ApiResponse<ColorResponse>> {
    return this.http.get<ApiResponse<ColorResponse>>(
      `${this.apiUrl}/${id}`
    );
  }

  create(
    request: CreateColorRequest
  ): Observable<ApiResponse<ColorResponse>> {
    return this.http.post<ApiResponse<ColorResponse>>(
      this.apiUrl,
      request
    );
  }

  update(
    id: number,
    request: UpdateColorRequest
  ): Observable<ApiResponse<ColorResponse>> {
    return this.http.put<ApiResponse<ColorResponse>>(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  delete(
    id: number
  ): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(
      `${this.apiUrl}/${id}`
    );
  }
}