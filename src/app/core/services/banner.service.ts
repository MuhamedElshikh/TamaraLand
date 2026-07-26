import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import {
  BannerFilterRequest,
  BannerPagedResponse,
  BannerResponse,
  BannerType,
} from '../models/banner.models';

@Injectable({
  providedIn: 'root',
})
export class BannerService {
  private readonly http = inject(HttpClient);

  private readonly api = `${API_BASE_URL}/api`;

  getHeroBanners(type: BannerType) {
    return this.http.get<ApiResponse<BannerResponse[]>>(
      `${this.api}/banners`,
      {
        params: new HttpParams().set('type', type),
      }
    );
  }

  getAll(request: BannerFilterRequest) {
    let params = new HttpParams();

    if (request.type != null)
      params = params.set('type', request.type);

    if (request.isActive != null)
      params = params.set('isActive', request.isActive);

    if (request.pageNumber)
      params = params.set('pageNumber', request.pageNumber);

    if (request.pageSize)
      params = params.set('pageSize', request.pageSize);

    return this.http.get<ApiResponse<BannerPagedResponse>>(
      `${this.api}/admin/banners`,
      { params }
    );
  }
}