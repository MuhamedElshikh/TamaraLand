import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';

import { ApiResponse } from '../models/api-response.model';
import { PagedResponse } from '../models/catalog.models';

import {
  UserFilterRequest,
  UserResponse,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
} from '../models/user.models';

@Injectable({
  providedIn: 'root',
})
export class AdminUserService {

  private readonly url =
    `${API_BASE_URL}/api/admin/users`;

  constructor(
    private http: HttpClient,
  ) {}

  getUsers(
    filter: UserFilterRequest = {},
  ): Observable<ApiResponse<PagedResponse<UserResponse>>> {

    const params: Record<string, string> = {};

    Object.entries(filter).forEach(([k, v]) => {

      if (
        v !== undefined &&
        v !== null &&
        v !== ''
      ) {
        params[k] = String(v);
      }

    });

    return this.http.get<ApiResponse<PagedResponse<UserResponse>>>(
      this.url,
      {
        params,
      },
    );
  }

  getUser(
    id: number,
  ) {
    return this.http.get<ApiResponse<UserResponse>>(
      `${this.url}/${id}`,
    );
  }

  updateRole(
    id: number,
    request: UpdateUserRoleRequest,
  ) {

    return this.http.put<ApiResponse<void>>(
      `${this.url}/${id}/role`,
      request,
    );

  }

  updateStatus(
    id: number,
    request: UpdateUserStatusRequest,
  ) {

    return this.http.put<ApiResponse<void>>(
      `${this.url}/${id}/status`,
      request,
    );

  }

}