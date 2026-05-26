import { queryOne, execute } from "../db/pool";
import { User } from "../types/userTypes";

export type UserRow = Omit<User, "password">;

export interface SessionRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  login_id: string;
  name: string | null;
  role: string;
  status: string;
}

export const findUserByLoginId = (loginId: string): Promise<User | null> =>
  queryOne<User>("auth", "findUserByLoginId", { loginId });

export const findUserById = (id: string): Promise<UserRow | null> =>
  queryOne<UserRow>("auth", "findById", { id });

export const createUser = (params: {
  loginId: string;
  password: string;
  role: string;
  status: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}): Promise<UserRow | null> => queryOne<UserRow>("auth", "createUser", params);

export const createSession = (params: {
  userId: string;
  token: string;
  expiresAt: Date;
}): Promise<{ token: string } | null> =>
  queryOne<{ token: string }>("auth", "createSession", params);

export const findSessionByToken = (token: string): Promise<SessionRow | null> =>
  queryOne<SessionRow>("auth", "findSessionByToken", { token });

export const refreshSession = (
  token: string,
  expiresAt: Date,
): Promise<number> => execute("auth", "refreshSession", { token, expiresAt });

export const expireSession = (token: string): Promise<number> =>
  execute("auth", "expireSession", { token });

export const updateLastLoginAt = (userId: string): Promise<number> =>
  execute("auth", "updateLastLoginAt", { userId });
