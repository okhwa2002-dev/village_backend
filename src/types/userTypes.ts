import { UserRole, UserStatus } from "./commonTypes";

export interface User {
  id: string;
  login_id: string;
  email: string | null;
  password: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  last_login_at: Date | null;
  password_changed_at: Date | null;
  created_at: Date;
}

export interface RegisterDto {
  login_id: string;
  password: string;
  role: "farmer" | "consumer";
  name?: string;
  phone?: string;
  email?: string;
}

export interface LoginDto {
  login_id: string;
  password: string;
}
