import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/constants/api.constants';
import { ApiResponse } from '../../core/models/api-response.model';
import { DashboardResponse } from '../../core/models/domain.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  getDashboard(): Observable<ApiResponse<DashboardResponse>> {
    return this.http.get<ApiResponse<DashboardResponse>>(`${API_BASE_URL}/api/admin/dashboard`);
  }
}