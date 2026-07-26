import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import { WhatsAppConfigurationResponse, SendWhatsAppMessageRequest } from '../../core/models/whatsapp.models'; // عدّل المسار

@Injectable({ providedIn: 'root' })
export class AdminWhatsAppService {
  private readonly baseUrl = `${API_BASE_URL}/api/admin/whatsapp`;

  constructor(private http: HttpClient) {}

  connect(): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/connect`, {});
  }

  refresh(): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/refresh`, {});
  }

  logout(): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/logout`, {});
  }

  getConfiguration(): Observable<ApiResponse<WhatsAppConfigurationResponse>> {
    return this.http.get<ApiResponse<WhatsAppConfigurationResponse>>(this.baseUrl);
  }

  sendMessage(data: SendWhatsAppMessageRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/send`, data);
  }

  // مختلفة عن باقي الـ calls - الـ endpoint ده بيرجع صورة PNG خام مش JSON
  getQrImage(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/qr`, { responseType: 'blob' });
  }
}