import { randomUUID } from "crypto";
import { RegisterDto, LoginDto } from "../types/userTypes";
import { UserRole } from "../types/commonTypes";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  findUserByLoginId,
  createUser,
  createSession,
  expireSession,
  updateLastLoginAt,
} from "../repositories/authRepository";

interface LoginResult {
  token: string;
  user: { id: string; login_id: string; name: string | null; role: UserRole };
}

const getSessionDurationMinutes = (): number => {
  const raw = process.env.SESSION_DURATION_MINUTES;
  const n = raw ? parseInt(raw, 10) : 30;
  return Number.isFinite(n) && n > 0 ? n : 30;
};

const getExpiresAt = (): Date => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + getSessionDurationMinutes());
  return d;
};

export const register = async (dto: RegisterDto) => {
  const existing = await findUserByLoginId(dto.login_id);
  if (existing) throw new Error("LOGIN_ID_EXISTS");

  const hashed = await hashPassword(dto.password);
  const status = dto.role === "farmer" ? "pending" : "active";

  return createUser({
    loginId: dto.login_id,
    password: hashed,
    role: dto.role,
    status,
    name: dto.name ?? null,
    phone: dto.phone ?? null,
    email: dto.email ?? null,
  });
};

export const login = async (dto: LoginDto): Promise<LoginResult> => {
  const user = await findUserByLoginId(dto.login_id);
  if (!user) throw new Error("INVALID_CREDENTIALS");

  const { password: hash, ...safeUser } = user;
  const valid = await comparePassword(dto.password, hash);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  if (safeUser.status !== "active") throw new Error("ACCOUNT_NOT_ACTIVE");

  const token = randomUUID();
  await createSession({
    userId: safeUser.id,
    token,
    expiresAt: getExpiresAt(),
  });
  try {
    await updateLastLoginAt(safeUser.id);
  } catch {
    // best-effort: session already created, don't fail login
  }

  return {
    token,
    user: {
      id: safeUser.id,
      login_id: safeUser.login_id,
      name: safeUser.name ?? null,
      role: safeUser.role,
    },
  };
};

export const logout = async (token: string): Promise<void> => {
  await expireSession(token);
};
