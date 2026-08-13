import { PagedResponse } from './catalog.models';

export enum BannerType {
  HeroSlider = 1,
  HomeBanner = 2,
  OfferBanner = 3,
  CategoryBanner = 4,
}

export interface BannerImageResponse {
  id: number;
  imageUrl: string;
  link?: string;
  isMobile: boolean;
  displayOrder: number;
}

export interface BannerResponse {
  id: number;
  title: string;
  description?: string;
  type: BannerType;
  displayOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  images: BannerImageResponse[];
}

export interface BannerFilterRequest {
  type?: BannerType;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

// صورة جديدة هتتضاف مع الـ request (لسه مارفعتش)
export interface BannerImageUpload {
  file: File;
  link?: string;
}

export interface UpsertBannerRequest {
  title: string;
  description?: string;

  desktopImages: BannerImageUpload[];
  mobileImages: BannerImageUpload[];

  type: BannerType;
  displayOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export type BannerPagedResponse = PagedResponse<BannerResponse>;