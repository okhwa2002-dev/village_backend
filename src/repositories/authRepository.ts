import { queryOne, execute } from "../db/pool";
import { User } from "../types/userTypes";
import { UserRole, UserStatus } from "../types/commonTypes";

export type UserRow = Omit<User, "password">;

export interface RefreshToken {
  id: number;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  loginId: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
}

const toUser = (row: any): User => ({
  id: row.id,
  loginId: row.login_id,
  email: row.email,
  password: row.password,
  name: row.name,
  phone: row.phone,
  role: row.role,
  status: row.status,
  lastLoginAt: row.last_login_at ?? null,
  passwordChangedAt: row.password_changed_at ?? null,
  createdAt: row.created_at,
});

const toUserRow = (row: any): UserRow => ({
  id: row.id,
  loginId: row.login_id,
  email: row.email,
  name: row.name,
  phone: row.phone ?? null,
  role: row.role,
  status: row.status,
  lastLoginAt: row.last_login_at ?? null,
  passwordChangedAt: row.password_changed_at ?? null,
  createdAt: row.created_at,
});

const toRefreshToken = (row: any): RefreshToken => ({
  id: row.id,
  userId: String(row.user_id),
  tokenHash: row.token_hash,
  familyId: row.family_id,
  expiresAt: row.expires_at,
  revokedAt: row.revoked_at ?? null,
  loginId: row.login_id,
  name: row.name,
  role: row.role,
  status: row.status,
});

const findUserByLoginId = async (loginId: string): Promise<User | null> => {
  const row = await queryOne<any>("auth", "findUserByLoginId", { loginId });
  return row ? toUser(row) : null;
};

const findUserById = async (id: string): Promise<UserRow | null> => {
  const row = await queryOne<any>("auth", "findById", { id });
  return row ? toUserRow(row) : null;
};

const createUser = async (params: {
  loginId: string;
  password: string;
  role: string;
  status: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}): Promise<UserRow | null> => {
  const row = await queryOne<any>("auth", "createUser", params);
  return row ? toUserRow(row) : null;
};

const updateLastLoginAt = (userId: string): Promise<number> =>
  execute("auth", "updateLastLoginAt", { userId });

const saveRefreshToken = (params: {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
}): Promise<number> => execute("auth", "saveRefreshToken", params);

const findRefreshToken = async (
  tokenHash: string,
): Promise<RefreshToken | null> => {
  const row = await queryOne<any>("auth", "findRefreshToken", { tokenHash });
  return row ? toRefreshToken(row) : null;
};

const revokeToken = (tokenHash: string): Promise<number> =>
  execute("auth", "revokeToken", { tokenHash });

const revokeFamily = (familyId: string): Promise<number> =>
  execute("auth", "revokeFamily", { familyId });

const revokeAllUserTokens = (userId: string): Promise<number> =>
  execute("auth", "revokeAllUserTokens", { userId });

export default {
  findUserByLoginId,
  findUserById,
  createUser,
  updateLastLoginAt,
  saveRefreshToken,
  findRefreshToken,
  revokeToken,
  revokeFamily,
  revokeAllUserTokens,
};
