// Cart, Wishlist, Order, Address, Review, Shipping Models

// ---- Cart ----
export interface CartItemResponse {
  productVariantId: number;
  productId: number;
  productName: string;
  variantSku?: string;
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
}

export interface UpdateCartItemRequest {
  productVariantId: number;
  quantity: number;
}

export interface ApplyCouponRequest {
  code: string;
}

// ---- Wishlist ----
export interface WishlistItemResponse {
  id: number;
  name: string;
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
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export const orderStatus: Record<number, OrderStatusName> = {
  0: 'Pending',
  1: 'Confirmed',
  2: 'Processing',
  3: 'Shipped',
  4: 'Delivered',
  5: 'Cancelled',
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
  items: OrderItemResponse[];
}

export interface OrderFilterRequest {
  status?: OrderStatusName;
  pageIndex?: number;
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
  pageIndex?: number;
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
  latestOrders: LatestOrder[];
  topSellingProducts: TopSellingProduct[];
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
  maximumDiscount: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
  startDate:string;
  endDate:string;
}

export interface CreateCouponRequest {
  code: string;
  discountType: number;
  discountValue: number;
  minimumOrder: number;
  maximumDiscount: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  isActive: boolean;
}

export type UpdateCouponRequest = CreateCouponRequest;

// ---- Store Settings ----
export interface StoreSettings {
  storeName: string;
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

// ---- Create/Update for Admin catalog ----
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  image?: string;

}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  image?: string;

}

export interface CategoryUpsertResponse {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface CreateBrandRequest {
  name: string;
  description?: string;
  image?: string;

}

export interface UpdateBrandRequest {
  name: string;
  description?: string;
  image?: string;
}

export interface BrandUpsertResponse {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface CreateProductVariantRequest {
  color?: string;
  size?: string;
  price: number;
  stock: number;
  sku: string;
  weight?: number;
  height?: number;
  width?: number;
}

export interface CreateProductRequest {
  name: string;
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
  weight?: number;
  height?: number;
  width?: number;
  sku: string;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  name: string;
  description?: string;
  slug?: string;
  categoryId: number;
  brandId: number;
  isActive: boolean;
  variants: UpdateProductVariantRequest[];
}

export interface ProductVariantRequest {
  sku: string;
  color?: string;
  size?: string;
  stock: number;
  price: number;
  weight?: number;
  height?: number;
  width?: number;
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
  weight?: number;
  height?: number;
  width?: number;
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
  pageIndex?: number;
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
