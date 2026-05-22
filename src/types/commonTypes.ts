export type UserRole = 'admin' | 'farmer' | 'consumer'
export type UserStatus = 'pending' | 'active' | 'inactive'
export type ProductStatus = 'active' | 'hidden' | 'soldout'
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface JwtPayload {
  id: string
  email: string
  role: UserRole
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}
