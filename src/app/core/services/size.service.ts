import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ApiResponse,
  SizeResponse,
  CreateSizeRequest,
  UpdateSizeRequest,
} from '../models';
import { API_BASE_URL } from '../constants/api.constants';

@Injectable({
  providedIn: 'root',
})
export class SizeService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${API_BASE_URL}/api/size`;

  getAll(): Observable<ApiResponse<SizeResponse[]>> {
    return this.http.get<ApiResponse<SizeResponse[]>>(
      this.apiUrl
    );
  }

  getById(
    id: number
  ): Observable<ApiResponse<SizeResponse>> {
    return this.http.get<ApiResponse<SizeResponse>>(
      `${this.apiUrl}/${id}`
    );
  }

  create(
    request: CreateSizeRequest
  ): Observable<ApiResponse<SizeResponse>> {
    return this.http.post<ApiResponse<SizeResponse>>(
      this.apiUrl,
      request
    );
  }

  update(
    id: number,
    request: UpdateSizeRequest
  ): Observable<ApiResponse<SizeResponse>> {
    return this.http.put<ApiResponse<SizeResponse>>(
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