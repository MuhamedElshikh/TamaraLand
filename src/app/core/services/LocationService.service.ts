import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import {
  ResolveLocationRequest,
  ResolveLocationResponse,
} from '../models/domain.models';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly http = inject(HttpClient);

  resolve(
    request: ResolveLocationRequest
  ): Observable<
    ApiResponse<ResolveLocationResponse | null>
  > {
    return this.http.post<
      ApiResponse<ResolveLocationResponse | null>
    >(
      `${API_BASE_URL}/api/Location/resolve`,
      request
    );
  }
}