import { UserRole, UserStatus } from "./commonTypes";

export interface User {
  id: string;
  loginId: string;
  email: string | null;
  password: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
  createdAt: Date;
}

export interface RegisterDto {
  loginId: string;
  password: string;
  role: "FARMER" | "CONSUMER";
  name?: string;
  phone?: string;
  email?: string;
}

export interface LoginDto {
  loginId: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}
