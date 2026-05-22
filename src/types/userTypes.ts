import { UserRole, UserStatus } from './commonTypes'

export interface User {
  id: string
  email: string
  password: string
  role: UserRole
  status: UserStatus
  created_at: Date
}

export interface RegisterDto {
  email: string
  password: string
  role: 'farmer' | 'consumer'
}

export interface LoginDto {
  email: string
  password: string
}
