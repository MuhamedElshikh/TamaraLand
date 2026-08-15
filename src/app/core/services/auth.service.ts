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
import { AnalyticsService } from './analytics.service';
import { ClarityService } from './clarity.service';
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
private readonly clarity: ClarityService = new ClarityService();
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

  constructor(private http: HttpClient, private router: Router ,  private analytics: AnalyticsService) {}

 login(
  data: LoginRequest
): Observable<ApiResponse<AuthResponse>> {
  return this.http
    .post<ApiResponse<AuthResponse>>(
      `${API_BASE_URL}/api/Auth/login`,
      data
    )
    .pipe(
      tap(res => {
        if (
          res.success &&
          res.data?.accessToken
        ) {
          this.saveToken(
            res.data.accessToken
          );
        }
      })
    );
}



  loginWithFacebook(accessToken: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${API_BASE_URL}/api/Auth/facebook`, { accessToken }).pipe(
      tap(res => {
        if (res.success && res.data) {
         const token = res.data.accessToken;

this._token.set(token);
localStorage.setItem('usertoken', token);

this.setupAnalytics(token);
this.analytics.login('facebook');        }
      })
    );
  }

register(
  data: RegisterRequest
): Observable<ApiResponse<AuthResponse>> {
  return this.http
    .post<ApiResponse<AuthResponse>>(
      `${API_BASE_URL}/api/Auth/register`,
      data
    )
    .pipe(
      tap(res => {
        if (
          res.success &&
          res.data?.accessToken
        ) {
          this.saveToken(
            res.data.accessToken
          );

          this.analytics.signUp();
        }
      })
    );
}
completeGoogleLogin(
  response: AuthResponse
): void {

  if (!response?.accessToken) {
    return;
  }

  this._token.set(
    response.accessToken
  );

  localStorage.setItem(
    'usertoken',
    response.accessToken
  );

  this.setupAnalytics(
    response.accessToken
  );

  this.analytics.login(
    'google'
  );
}
loginWithGoogle(
  idToken: string
): Observable<ApiResponse<AuthResponse>> {

  return this.http
    .post<ApiResponse<AuthResponse>>(
      `${API_BASE_URL}/api/Auth/google`,
      {
        idToken
      }
    )
    .pipe(

      tap(res => {

        if (
          res.success &&
          res.data
        ) {

          this.setToken(
            res.data.accessToken
          );

          this.analytics.login(
            'google'
          );
        }

      })
    );
}
  logout(): void {
   this.analytics.trackEvent('logout');
this.analytics.clearUser();
this.clarity.clearUser();
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
  private getUserIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    return (
      payload.sub ??
      payload.nameid ??
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier"] ??
      null
    );
  } catch {
    return null;
  }
}

private setupAnalytics(token: string): void {
  const userId = this.getUserIdFromToken(token);

  if (userId) {
    this.analytics.setUser(userId);
this.clarity.setUser(userId);
  }
}
private saveToken(
  token: string,
  provider?: string
): void {
  this._token.set(token);

  localStorage.setItem(
    'usertoken',
    token
  );

  this.setupAnalytics(token);

  if (provider) {
    this.analytics.login(provider);
  }
}
setToken(token: string): void {

  this._token.set(token);

  localStorage.setItem(
    'usertoken',
    token
  );

  this.setupAnalytics(token);
}
}
