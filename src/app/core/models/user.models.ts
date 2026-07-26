export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: 'Admin' | 'Customer';
  isActive: boolean;
  createdAt: string;
}

export interface UserFilterRequest {
  search?: string;
  role?: string;
  isActive?: boolean;

  pageNumber?: number;
  pageSize?: number;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}