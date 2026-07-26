import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/constants/api.constants';
import { ApiResponse } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class PhoneVerificationService {
  private readonly baseUrl = `${API_BASE_URL}/api/phone-verification`;

  constructor(private http: HttpClient) {}

  sendCode(phoneNumber: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/send-code`, { phoneNumber });
  }

  verifyCode(phoneNumber: string, code: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/verify`, { phoneNumber, code });
  }

  getStatus(phoneNumber: string): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.baseUrl}/status`, { params: { phoneNumber } });
  }
}