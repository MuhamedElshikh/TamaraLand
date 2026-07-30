// Product Catalog Models

import { ReviewResponse } from "./domain.models";

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface BrandResponse {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface ProductImageResponse {
  id: number;
  imageUrl: string;
  isMain: boolean;
}

export interface ProductVariantResponse {
  id: number;
  color: string;
  size: string;
  originalPrice: number;
  price: number;
  hasDiscount: boolean;
  stock: number;
  sku: string;
  bust: number;
  waist: number;
  hip: number;
  length: number;
}

export interface ProductCardResponse {
  id: number;
  name: string;
  imageUrl?: string;
  viewsCount:number;
  originalPrice: number;
  price: number;
  hasDiscount: boolean;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
}

export interface ProductDetailsResponse extends ProductResponse {
  slug: string;
  isInWishlist: boolean;
  viewsCount:number;
  images: ProductImageResponse[];
  latestReviews: ReviewResponse[];
  relatedProducts: RelatedProductResponse[];
}

export enum ProductCollection {
  None = 0,
  NewArrivals = 1,
  Offers = 2
}

export interface ProductFilterRequest {
  search?: string;
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  collection?: ProductCollection;
  pageIndex?: number;
  pageSize?: number;
  sortBy?: string;
}

export type RelatedProductResponse = ProductCardResponse;

export interface ProductResponse  {
  id:number;
  price:number;
  name:string;
  rating:number;
  inStock:boolean;
  originalPrice:number;
  reviewsCount:number;
  imageUrl:string;
  categoryName: string;
  brandName: string;
  viewsCount:number;
  variants: ProductVariantResponse[];
}

export interface CategoryFilterRequest {
  search?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface BrandFilterRequest {
  search?: string;
  pageIndex?: number;
  pageSize?: number;
}