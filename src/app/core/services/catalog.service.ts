  import { Injectable, signal } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { API_BASE_URL } from '../constants/api.constants';
  import { ApiResponse } from '../models/api-response.model';
  import { PagedResponse, CategoryResponse, BrandResponse, ProductCardResponse, ProductDetailsResponse, ProductFilterRequest, CategoryFilterRequest, BrandFilterRequest } from '../models/catalog.models';

  @Injectable({ providedIn: 'root' })
  export class CatalogService {
    private readonly _categories = signal<CategoryResponse[]>([]);
    private readonly _brands = signal<BrandResponse[]>([]);

    readonly categories = this._categories.asReadonly();
    readonly brands = this._brands.asReadonly();

    constructor(private http: HttpClient) {}

    // Categories
    getCategories(filter: CategoryFilterRequest = {}): Observable<ApiResponse<PagedResponse<CategoryResponse>>> {
      const params = this.buildParams(filter);
      return this.http.get<ApiResponse<PagedResponse<CategoryResponse>>>(`${API_BASE_URL}/api/Categories`, { params }).pipe(
        tap(res => { if (res.success && res.data) this._categories.set(res.data.items); })
      );
    }

    getCategoryById(id: number): Observable<ApiResponse<CategoryResponse>> {
      return this.http.get<ApiResponse<CategoryResponse>>(`${API_BASE_URL}/api/Categories/${id}`);
    }

    // Brands
    getBrands(filter: BrandFilterRequest = {}): Observable<ApiResponse<PagedResponse<BrandResponse>>> {
      const params = this.buildParams(filter);
      return this.http.get<ApiResponse<PagedResponse<BrandResponse>>>(`${API_BASE_URL}/api/Brand`, { params }).pipe(
        tap(res => { if (res.success && res.data) this._brands.set(res.data.items); })
      );
    }

    getBrandById(id: number): Observable<ApiResponse<BrandResponse>> {
      return this.http.get<ApiResponse<BrandResponse>>(`${API_BASE_URL}/api/Brand/${id}`);
    }

    // Products
    getProducts(filter: ProductFilterRequest = {}): Observable<ApiResponse<PagedResponse<ProductCardResponse>>> {
      const params = this.buildParams(filter);
      return this.http.get<ApiResponse<PagedResponse<ProductCardResponse>>>(`${API_BASE_URL}/api/Product`, { params });
    }

    getProductById(id: number): Observable<ApiResponse<ProductDetailsResponse>> {
      return this.http.get<ApiResponse<ProductDetailsResponse>>(`${API_BASE_URL}/api/Product/${id}`);
    }

    private buildParams<T extends object>(filter: T): Record<string, string> {
      const params: Record<string, string> = {};
      Object.entries(filter).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params[key] = String(val);
        }
      });
      return params;
    }
  }
