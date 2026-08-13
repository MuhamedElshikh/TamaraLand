import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../app/core/constants/api.constants';
import { PagedResponse } from '../../../app/core/models/catalog.models';
import { ApiResponse } from '../../../app/core/models/api-response.model';
import {
  BannerFilterRequest,
  BannerResponse,
  UpsertBannerRequest,
} from '../../../app/core/models/banner.models';

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

  deleteImage(bannerId: number, imageId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}/${bannerId}/images/${imageId}`
    );
  }

 private toFormData(request: UpsertBannerRequest): FormData {
  const formData = new FormData();

  formData.append('Title', request.title);

  if (request.description)
    formData.append('Description', request.description);

  formData.append('Type', request.type.toString());
  formData.append('DisplayOrder', request.displayOrder.toString());
  formData.append('IsActive', String(request.isActive));

  if (request.startDate)
    formData.append('StartDate', request.startDate);

  if (request.endDate)
    formData.append('EndDate', request.endDate);

  request.desktopImages.forEach(img => {
    formData.append('DesktopImages', img.file, img.file.name);
    formData.append('DesktopImageLinks', img.link ?? '');
  });

  request.mobileImages.forEach(img => {
    formData.append('MobileImages', img.file, img.file.name);
    formData.append('MobileImageLinks', img.link ?? '');
  });

  return formData;
}
}