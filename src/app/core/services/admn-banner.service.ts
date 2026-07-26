import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../app/core/constants/api.constants';
import {PagedResponse } from '../../../app/core/models/catalog.models';
import {ApiResponse}from '../../../app/core/models/api-response.model';
import {BannerFilterRequest,BannerResponse,UpsertBannerRequest} from '../../../app/core/models/banner.models';

@Injectable({
  providedIn: 'root',
})
export class AdminBannerService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${API_BASE_URL}/api/admin/banners`;

  getAll(
    request: BannerFilterRequest
  ): Observable<ApiResponse<PagedResponse<BannerResponse>>> {
    let params = new HttpParams();

    if (request.type != null)
      params = params.set('type', request.type);

    if (request.isActive != null)
      params = params.set('isActive', request.isActive);

    params = params
      .set('pageNumber', request.pageNumber ?? 1)
      .set('pageSize', request.pageSize ?? 10);

    return this.http.get<ApiResponse<PagedResponse<BannerResponse>>>(
      this.baseUrl,
      { params }
    );
  }

  getById(id: number): Observable<ApiResponse<BannerResponse>> {
    return this.http.get<ApiResponse<BannerResponse>>(
      `${this.baseUrl}/${id}`
    );
  }

  create(request: UpsertBannerRequest): Observable<ApiResponse<BannerResponse>> {
    return this.http.post<ApiResponse<BannerResponse>>(
      this.baseUrl,
      this.toFormData(request)
    );
  }

  update(
    id: number,
    request: UpsertBannerRequest
  ): Observable<ApiResponse<BannerResponse>> {
    return this.http.put<ApiResponse<BannerResponse>>(
      `${this.baseUrl}/${id}`,
      this.toFormData(request)
    );
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}/${id}`
    );
  }

  private toFormData(request: UpsertBannerRequest): FormData {
    const formData = new FormData();

    formData.append('title', request.title);

    if (request.description)
      formData.append('description', request.description);

    if (request.image)
      formData.append('image', request.image);

    if (request.mobileImage)
      formData.append('mobileImage', request.mobileImage);

    if (request.link)
      formData.append('link', request.link);

    formData.append('type', request.type.toString());

    formData.append(
      'displayOrder',
      request.displayOrder.toString()
    );

    formData.append(
      'isActive',
      String(request.isActive)
    );

    if (request.startDate)
      formData.append('startDate', request.startDate);

    if (request.endDate)
      formData.append('endDate', request.endDate);

    return formData;
  }
}