// Cart, Wishlist, Order, Address, Review, Shipping Models

// ---- Cart ----
export interface CartItemResponse {
  productVariantId: number;
  productId: number;
productName: string;
arabicName: string;
brandName: string;
arabicBrandName: string;
categoryName: string;
arabicCategoryName: string;  variantSku?: string;
  color?: string;
  size?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface CartResponse {
  items: CartItemResponse[];
  couponCode?: string;
  discount: number;
  subTotal: number;
  totalItems: number;
  messages?: string[];
}

export interface AddToCartRequest {
  productVariantId: number;
  quantity: number;
  guestId?: string;
}

export interface UpdateCartItemRequest {
  productVariantId: number;
  quantity: number;
  guestId?: string;
}

export interface ApplyCouponRequest {
  code: string;
  guestId?: string;
}

// ---- Wishlist ----
export interface WishlistItemResponse {
  id: number;
  name: string;
  arabicName: string;
brandName: string;
arabicBrandName: string;
categoryName: string;
arabicCategoryName: string;
  imageUrl?: string;
  price: number;
  originalPrice: number;
  rating: number;
  hasDiscount: boolean;
  inStock: boolean;
  reviewsCount: number;
}

// ---- Address ----
export interface AddressResponse {
  id: number;
  fullName: string;
  phoneNumber: string;
  governorate: string;
  area: string;
  street: string;
  building?: string;
  floor?: string;
  apartment?: string;
  notes?: string;
  isDefault: boolean;
  isPhoneVerified: boolean;
  latitude?: number;
  longitude?: number;
}


export interface CreateAddressRequest {
  fullName: string;
  phoneNumber: string;
  governorate: string;
  area: string;
  street: string;
  building?: string;
  floor?: string;
  apartment?: string;
  notes?: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

export type UpdateAddressRequest = CreateAddressRequest;

// ---- Shipping ----
export interface ShippingAreaResponse {
  id: number;
  governorate: string;
  areaName: string;
  shippingCost: number;
}

export interface ShippingAreaItem {
  id: number;
  name: string;
  shippingCost: number;
}

export interface ShippingLookupResponse {
  governorate: string;
  areas: ShippingAreaItem[];
}

// ---- Orders ----
export type OrderStatusName =
  | 'orders.status.pending'
  | 'orders.status.confirmed'
  | 'orders.status.processing'
  | 'orders.status.shipped'
  | 'orders.status.delivered'
  | 'orders.status.cancelled';
  
export const orderStatus: Record<number, OrderStatusName> = {
  0: 'orders.status.pending',
  1: 'orders.status.confirmed',
  2: 'orders.status.processing',
  3: 'orders.status.shipped',
  4: 'orders.status.delivered',
  5: 'orders.status.cancelled',
};
export type PaymentMethodName =
  | 'Cash'
  | 'Visa'
  | 'Wallet';

export const paymentMethod: Record<number, PaymentMethodName> = {
  0: 'Cash',
  1: 'Visa',
  2: 'Wallet',
};

export type PaymentStatusName =
  | 'Pending'
  | 'Paid'
  | 'Refunded'
  | 'Failed';

export const paymentStatus: Record<number, PaymentStatusName> = {
  0: 'Pending',
  1: 'Paid',
  2: 'Refunded',
  3: 'Failed',
};

export interface CheckoutRequest {
  addressId: number;
  shippingAreaId: number;
  paymentMethod: number; // 0=Cash
}

export interface CheckoutSummaryResponse {
  subTotal: number;
  discount: number;
  shippingCost: number;
  total: number;
}

export interface OrderItemResponse {
  productVariantId: number;
  productName: string;
productArabicName: string;
brandName: string;
arabicBrandName: string;
categoryName: string;
arabicCategoryName: string;
imageUrl:string,
color: string;
size: string;
sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
export interface OrderResponse {
  id: number;
  orderNumber: string;
  total: number;
  message: string;
}
export interface OrderSummaryResponse {
  id: number;
  orderNumber: string;
  status: number;
  paymentStatus: number;
  total: number;
  createdAt: string;
}

export interface OrderDetailsResponse {
  id: number;
  orderNumber: string;
  status: number;
  paymentMethod: number;
  paymentStatus: number;
  subTotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  couponCode?: string;
  createdAt: string;
  shippingAreaName: string;
  fullName: string;
  phoneNumber: string;
  governorate: string;
  area: string;
  street: string;
  building?: string;
  floor?: string;
  apartment?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  items: OrderItemResponse[];
}

export interface OrderFilterRequest {
  status?: OrderStatusName;
  pageNumber?: number;
  pageSize?: number;
}

// ---- Reviews ----
export interface ReviewResponse {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  productId: number;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating: number;
  comment?: string;
}

// ---- Admin ----
export interface AdminOrderFilterRequest {
  Status?: number;
  OrderNumber?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface UpdateOrderStatusRequest {
  status: number;
}


export interface DashboardResponse {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayRevenue: number;

  lowStockProducts: number;
  activeCoupons: number;
  activeDiscounts: number;

  wishlistItems: number;
  totalReviews: number;

  totalCategories: number;
  totalBrands: number;

  outOfStockProducts: number;
  deliveredOrders: number;
  cancelledOrders: number;

  monthRevenue: number;
  yearRevenue: number;

  latestOrders: LatestOrder[];
  topSellingProducts: TopSellingProduct[];

  mostViewedProducts: MostViewedProduct[];
  mostWishlistedProducts: MostWishlistedProduct[];

  monthlyRevenue: MonthlyChartItem[];
  monthlyOrders: MonthlyChartItem[];

  topCategories: DashboardChartPoint[];
  topBrands: DashboardChartPoint[];
}

export interface TopSellingProduct {
  productId: number;
  productName: string;
  totalSold: number;
  revenue: number;
}

export interface LatestOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  total: number;
  status: keyof typeof orderStatus;
  createdAt: string;
}

export interface MostViewedProduct {
  productId: number;
  productName: string;
  viewsCount: number;
}

export interface MostWishlistedProduct {
  productId: number;
  productName: string;
  wishlistCount: number;
}
export interface MonthlyChartItem {
  label: string;
  value: number;
}
export interface DashboardChartPoint {
  label: string;
  value: number;
}

// ---- Discounts ----
export interface DiscountResponse {
  id: number;
  name: string;
  discountType: number; // 0=Percentage, 1=Fixed
  discountValue: number;
  maximumDiscount: number;
  target: number; // 0=Product, 1=Category, 2=Brand
  targetId: number;
  priority: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
 
export interface CreateDiscountRequest {
  name: string;
  discountType: number;
  discountValue: number;
  maximumDiscount: number;
  target: number;
  targetId: number;
  priority: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
 
export type UpdateDiscountRequest = CreateDiscountRequest;

// ---- Coupons ----
export interface CouponResponse {
  id: number;

  code: string;

  discountType: number;

  discountValue: number;

  minimumOrder: number;

  maximumDiscount?: number;

  startDate: string;

  endDate: string;

  usageLimit: number;

  usedCount: number;

  userUsageLimit: number;

  isActive: boolean;
}

export interface CreateCouponRequest {

  code: string;

  discountType: number;

  discountValue: number;

  minimumOrder: number;

  maximumDiscount?: number;

  startDate: string;

  endDate: string;

  usageLimit: number;

  userUsageLimit: number;

  isActive: boolean;

}

export type UpdateCouponRequest = CreateCouponRequest;


// ---- Create/Update for Admin catalog ----
export interface CreateCategoryRequest {
  name: string;
  arabicName: string;
  description?: string;
  image?: string;
    isPublished:boolean;

}

export interface UpdateCategoryRequest {
  name: string;
  arabicName: string;
  description?: string;
  image?: string;
  isPublished:boolean;

}

export interface CategoryUpsertResponse {
  id: number;
  name: string;
  arabicName: string;
  description?: string;
  imageUrl?: string;
    isPublished:boolean;
}

export interface CreateBrandRequest {
  name: string;
  arabicName: string;
  description?: string;
  image?: string;
 isPublished:boolean;

}

export interface UpdateBrandRequest {
  name: string;
  arabicName: string;
  description?: string;
  image?: string;
    isPublished:boolean;
}

export interface BrandUpsertResponse {
  id: number;
  name: string;
  arabicName: string;
  description?: string;
  imageUrl?: string;
    isPublished:boolean;

}
export interface CreateProductVariantRequest {
  color?: string;
  size?: string;
  price: number;
  stock: number;
  sku: string;
  bust: number;
  waist: number;
  hip: number;
  length: number;
}

export interface CreateProductRequest {
  name: string;
  arabicName:string;
  description?: string;
  categoryId: number;
  brandId: number;
  variants: CreateProductVariantRequest[];
}

export interface UpdateProductVariantRequest {
  id?: number;
  color?: string;
  size?: string;
  costPrice?: number;
  compareAtPrice?: number;
  price: number;
  stock: number;
  bust: number;
  waist: number;
  hip: number;
  length: number;
  sku: string;
}

export interface UpdateProductRequest {
  name: string;
  arabicName?: string;
  description?: string;
  slug?: string;
  categoryId: number;
  brandId: number;
  isPublished: boolean;
  variants: UpdateProductVariantRequest[];
}

export interface ProductVariantRequest {
  sku: string;
  color?: string;
  size?: string;
  stock: number;
  price: number;
  bust: number;
  waist: number;
  hip: number;
  length: number;
    isPublished:boolean;
}

export interface AdminProductVariantResponse {
   id: number;
  productId?: number;
  sku: string;
  color?: string;
  size?: string;
  costPrice?: number;
  compareAtPrice?: number;
  price: number;
  originalPrice?: number;
  finalPrice?: number;
  stock: number;
  bust: number;
  waist: number;
  hip: number;
  length: number;
  isActive: boolean;
  discountPercentage?: number;
}

export interface ProductImageRequest {
  imageUrl: string;
  isMain: boolean;
}

export interface AdminProductImageResponse {
  id: number;
  productId: number;
  imageUrl: string;
  isMain: boolean;
}

export interface ProductAdminResponse {
 id: number;
  name: string;
  description?: string;
  slug?: string;
  categoryId: number;
  categoryName?: string;
  brandId: number;
  brandName?: string;
  isActive: boolean;
  isPublished: boolean;
  averageRating?: number;
  totalReviews?: number;
  mainImageUrl?: string;
  variants?: AdminProductVariantResponse[];
  images?: AdminProductImageResponse[];
}

export interface ShippingAreaAdminResponse {
  id: number;
  governorate: string;
  area: string;
  shippingCost: number;
  isActive: boolean;
}

export interface CreateShippingAreaRequest {
  governorate: string;
  area: string;
  shippingCost: number;
  isActive: boolean;
}

export type UpdateShippingAreaRequest = CreateShippingAreaRequest;

// ⚠️ افتراض - عدّل حسب شكل ShippingAreaFilterRequest الحقيقي لو مختلف
export interface ShippingAreaFilterRequest {
  governorate?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}
// ---- Admin Users ----
export interface AdminUserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  roles: string[];
}



export interface AdminOrderDetailsResponse extends OrderDetailsResponse {
  customerId?: number;
  customerEmail?: string;
}
// ---- Store Settings ----
export interface StoreSettings {
  storeName: string;
  storeArabicName: string;
  logoUrl?: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  currency: string;
  currencySymbol: string;
  facebookUrl?: string;
  instagramUrl?: string;
  whatsAppNumber?: string;
}

export interface StoreSettingsRequest {
  storeName: string;
  storeArabicName: string;
  logoUrl?: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  currency: string;
  currencySymbol: string;
  facebookUrl?: string;
  instagramUrl?: string;
  whatsAppNumber?: string;
}

export interface StoreSettingsResponse extends StoreSettings { }

export type UpdateStoreSettingsRequest = StoreSettingsRequest;

export interface GoogleAnalyticsDashboardResponse {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  views: number;

  bounceRate: number;
  engagementRate: number;
  averageSessionDuration: number;

  dailyUsers: AnalyticsChartPoint[];
  dailySessions: AnalyticsChartPoint[];

  topCountries: AnalyticsChartPoint[];
  topDevices: AnalyticsChartPoint[];
topPages: AnalyticsPage[];
  trafficSources: AnalyticsChartPoint[];
}

export interface AnalyticsChartPoint {
  label: string;
  value: number;
}
export interface AnalyticsPage {
    path: string;
    label: string;
    value: number;
}