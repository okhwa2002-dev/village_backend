export type UserRole = "admin" | "farmer" | "consumer";
export type UserStatus = "pending" | "active" | "inactive";
export type ProductStatus = "active" | "hidden" | "soldout";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface SessionUser {
  id: string;
  login_id: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
