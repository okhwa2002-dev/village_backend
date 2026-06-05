export type UserRole = "ADMIN" | "FARMER" | "CONSUMER";
export type UserStatus = "PENDING" | "ACTIVE" | "INACTIVE";
export type ProductStatus = "ACTIVE" | "HIDDEN" | "SOLDOUT";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface SessionUser {
  id: string;
  loginId: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
