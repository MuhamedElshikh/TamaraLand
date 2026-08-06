import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiResponse } from '../models/api-response.model';
import { GoogleAnalyticsDashboardResponse } from '../models/domain.models';
import { environment } from '../../../environments/environment';
import { API_BASE_URL} from '../constants/api.constants'

@Injectable({
  providedIn: 'root'
})
export class GoogleAnalyticsService {

  private readonly http = inject(HttpClient);
private readonly basurl = API_BASE_URL
  getDashboard(): Observable<ApiResponse<GoogleAnalyticsDashboardResponse>> {

   return this.http.get<ApiResponse<GoogleAnalyticsDashboardResponse>>(
  `${this.basurl}/api/admin/analytics`
);
    

  }

}