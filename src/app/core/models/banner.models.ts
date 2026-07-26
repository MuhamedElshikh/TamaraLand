import { PagedResponse } from './catalog.models';

export enum BannerType {
  HeroSlider = 1,
  HomeBanner = 2,
  OfferBanner = 3,
  CategoryBanner = 4,
}

export interface BannerResponse {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  link?: string;
  type: BannerType;
  displayOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface BannerFilterRequest {
  type?: BannerType;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
}
export interface UpsertBannerRequest {
  title: string;
  description?: string;

  image?: File;

  mobileImage?: File;

  link?: string;

  type: BannerType;

  displayOrder: number;

  isActive: boolean;

  startDate?: string;

  endDate?: string;
}

export type BannerPagedResponse = PagedResponse<BannerResponse>;