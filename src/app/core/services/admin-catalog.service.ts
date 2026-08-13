import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import {
  PagedResponse,
  ProductFilterRequest,
  CategoryFilterRequest,
  BrandFilterRequest,
  CategoryResponse,
  BrandResponse,
} from '../models/catalog.models';
import {
  CreateProductRequest,
  UpdateProductRequest,
  ProductAdminResponse,
  ProductVariantRequest,
  AdminProductVariantResponse,
  AdminProductImageResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateBrandRequest,
  UpdateBrandRequest,
} from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class AdminCatalogService {
  private readonly productUrl = `${API_BASE_URL}/api/Product`;
  private readonly categoryUrl = `${API_BASE_URL}/api/Categories`;
  private readonly brandUrl = `${API_BASE_URL}/api/Brand`;

  constructor(private http: HttpClient) {}

  // ---- Products ----

  getProducts(filter: ProductFilterRequest = {}): Observable<ApiResponse<PagedResponse<ProductAdminResponse>>> {
    const params: Record<string, string> = {};
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params[k] = String(v);
      }
    });
    return this.http.get<ApiResponse<PagedResponse<ProductAdminResponse>>>(`${this.productUrl}/admin`, { params });
  }
updateProductPublishStatus(
  id: number,
  isPublished: boolean
): Observable<ApiResponse<void>> {
  return this.http.patch<ApiResponse<void>>(
    `${API_BASE_URL}/api/Product/${id}/publish`,
    isPublished
  );
}
  getProductById(id: number): Observable<ApiResponse<ProductAdminResponse>> {
    return this.http.get<ApiResponse<ProductAdminResponse>>(`${this.productUrl}/admin/${id}`);
  }

  createProduct(data: CreateProductRequest): Observable<ApiResponse<ProductAdminResponse>> {
    return this.http.post<ApiResponse<ProductAdminResponse>>(this.productUrl, data);
  }

  updateProduct(id: number, data: UpdateProductRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.productUrl}/${id}`, data);
  }

  deleteProduct(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.productUrl}/${id}`);
  }

  // ---- Product Variants ----

  getVariants(productId: number): Observable<ApiResponse<AdminProductVariantResponse[]>> {
    return this.http.get<ApiResponse<AdminProductVariantResponse[]>>(`${this.productUrl}/${productId}/variants`);
  }

  addVariant(productId: number, data: ProductVariantRequest): Observable<ApiResponse<AdminProductVariantResponse>> {
    return this.http.post<ApiResponse<AdminProductVariantResponse>>(`${this.productUrl}/${productId}/variants`, data);
  }

  updateVariant(variantId: number, data: ProductVariantRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.productUrl}/variants/${variantId}`, data);
  }

  deleteVariant(variantId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.productUrl}/variants/${variantId}`);
  }

  // ---- Product Images ----

  getImages(productId: number): Observable<ApiResponse<AdminProductImageResponse[]>> {
    return this.http.get<ApiResponse<AdminProductImageResponse[]>>(`${this.productUrl}/${productId}/images`);
  }

 uploadImages(productId: number, files: File[], mainImageIndex: number = 0): Observable<ApiResponse<AdminProductImageResponse[]>> {
  const formData = new FormData();
  files.forEach(file => formData.append('Images', file, file.name));
  formData.append('MainImageIndex', String(mainImageIndex));

  return this.http.post<ApiResponse<AdminProductImageResponse[]>>(
    `${this.productUrl}/${productId}/images`,
    formData
  );
}

  deleteImage(imageId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.productUrl}/images/${imageId}`);
  }

  setMainImage(imageId: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.productUrl}/images/${imageId}/main`, {});
  }

  // ---- Categories ----

  getCategories(filter: CategoryFilterRequest = {}): Observable<ApiResponse<PagedResponse<CategoryResponse>>> {
    const params: Record<string, string> = {};
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params[k] = String(v);
      }
    });
    return this.http.get<ApiResponse<PagedResponse<CategoryResponse>>>(this.categoryUrl, { params });
  }
  updatecategoryPublishStatus(
  id: number,
  isPublished: boolean
): Observable<ApiResponse<void>> {
  return this.http.patch<ApiResponse<void>>(
    `${this.categoryUrl}/${id}/publish`,
    isPublished
  );
}

  getCategoryById(id: number): Observable<ApiResponse<CategoryResponse>> {
    return this.http.get<ApiResponse<CategoryResponse>>(`${this.categoryUrl}/${id}`);
  }

  createCategory(data: CreateCategoryRequest, image?: File | null): Observable<ApiResponse<CategoryResponse>> {
    const formData = new FormData();

formData.append('name', data.name);
formData.append('arabicName', data.arabicName);

if (data.description)
    formData.append('description', data.description);

formData.append('isPublished', String(data.isPublished));

if (image)
    formData.append('image', image);
    if (data.description) formData.append('description', data.description);
    if (image) formData.append('image', image);
    return this.http.post<ApiResponse<CategoryResponse>>(this.categoryUrl, formData);
  }

  updateCategory(id: number, data: UpdateCategoryRequest, image?: File | null): Observable<ApiResponse<void>> {
    const formData = new FormData();

formData.append('name', data.name);
formData.append('arabicName', data.arabicName);

if (data.description)
    formData.append('description', data.description);

formData.append('isPublished', String(data.isPublished));

if (image)
    formData.append('image', image);
    if (data.description) formData.append('description', data.description);
    if (image) formData.append('image', image);
    return this.http.put<ApiResponse<void>>(`${this.categoryUrl}/${id}`, formData);
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.categoryUrl}/${id}`);
  }

  // ---- Brands ----

  getBrands(filter: BrandFilterRequest = {}): Observable<ApiResponse<PagedResponse<BrandResponse>>> {
    const params: Record<string, string> = {};
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params[k] = String(v);
      }
    });
    return this.http.get<ApiResponse<PagedResponse<BrandResponse>>>(this.brandUrl, { params });
  }
   updatebrandPublishStatus(
  id: number,
  isPublished: boolean
): Observable<ApiResponse<void>> {
  return this.http.patch<ApiResponse<void>>(
    `${this.brandUrl}/${id}/publish`,
    isPublished
  );
}

  getBrandById(id: number): Observable<ApiResponse<BrandResponse>> {
    return this.http.get<ApiResponse<BrandResponse>>(`${this.brandUrl}/${id}`);
  }

  createBrand(data: CreateBrandRequest, image?: File | null): Observable<ApiResponse<BrandResponse>> {
    const formData = new FormData();

formData.append('name', data.name);
formData.append('arabicName', data.arabicName);

if (data.description)
    formData.append('description', data.description);

formData.append('isPublished', String(data.isPublished));

if (image)
    formData.append('image', image);
    if (data.description) formData.append('description', data.description);
    if (image) formData.append('image', image);
    return this.http.post<ApiResponse<BrandResponse>>(this.brandUrl, formData);
  }

  updateBrand(id: number, data: UpdateBrandRequest, image?: File | null): Observable<ApiResponse<void>> {
   const formData = new FormData();

formData.append('name', data.name);
formData.append('arabicName', data.arabicName);

if (data.description)
    formData.append('description', data.description);

formData.append('isPublished', String(data.isPublished));

if (image)
    formData.append('image', image);

return this.http.put<ApiResponse<void>>(
    `${this.brandUrl}/${id}`,
    formData
);
    return this.http.put<ApiResponse<void>>(`${this.brandUrl}/${id}`, formData);
  }

  deleteBrand(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.brandUrl}/${id}`);
  }
}
