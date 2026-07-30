import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import {
  LoginRequest, RegisterRequest, AuthResponse,
  ProfileResponse, UpdateProfileRequest, ChangePasswordRequest,
  ForgotPasswordRequest, ResetPasswordRequest
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser(): ProfileResponse | null {
    return this._profile();
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  private readonly _profile = signal<ProfileResponse | null>(null);
  private readonly _token = signal<string | null>(localStorage.getItem('usertoken'));

  readonly profile = this._profile.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isAdmin = computed(() => {
    const t = this._token();
    if (!t) return false;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      const role = payload['role'] ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes('Admin');
    } catch { return false; }
  });

  constructor(private http: HttpClient, private router: Router) {}

  login(data: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${API_BASE_URL}/api/Auth/login`, data).pipe(
      tap(res => {
        if (res.success && res.data) {
          this._token.set(res.data.accessToken);
          localStorage.setItem('usertoken', res.data.accessToken);
        }
      })
    );
  }

  loginWithGoogle(idToken: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${API_BASE_URL}/api/Auth/google`, { idToken }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this._token.set(res.data.accessToken);
          localStorage.setItem('usertoken', res.data.accessToken);
        }
      })
    );
  }

  loginWithFacebook(accessToken: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${API_BASE_URL}/api/Auth/facebook`, { accessToken }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this._token.set(res.data.accessToken);
          localStorage.setItem('usertoken', res.data.accessToken);
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${API_BASE_URL}/api/Auth/register`, data).pipe(
      tap(res => {
        if (res.success && res.data) {
          this._token.set(res.data.accessToken);
          localStorage.setItem('usertoken', res.data.accessToken);
        }
      })
    );
  }

  logout(): void {
    this._token.set(null);
    this._profile.set(null);
    localStorage.removeItem('usertoken');
    this.router.navigate(['/login']);
  }

  getProfile(): Observable<ApiResponse<ProfileResponse>> {
    return this.http.get<ApiResponse<ProfileResponse>>(`${API_BASE_URL}/api/Account/me`).pipe(
      tap(res => { if (res.success && res.data) this._profile.set(res.data); })
    );
  }

  updateProfile(data: UpdateProfileRequest): Observable<ApiResponse<ProfileResponse>> {
    return this.http.put<ApiResponse<ProfileResponse>>(`${API_BASE_URL}/api/Account/me`, data).pipe(
      tap(res => { if (res.success && res.data) this._profile.set(res.data); })
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API_BASE_URL}/api/Account/change-password`, data);
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API_BASE_URL}/api/Account/forgot-password`, data);
  }

  resetPassword(data: ResetPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API_BASE_URL}/api/Account/reset-password`, data);
  }
}
