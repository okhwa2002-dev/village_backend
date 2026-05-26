import { randomUUID } from "crypto";
import { RegisterDto, LoginDto } from "../types/userTypes";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  findUserByLoginId,
  createUser,
  createSession,
  expireSession,
  updateLastLoginAt,
} from "../repositories/authRepository";

const getSessionDurationMinutes = () =>
  parseInt(process.env.SESSION_DURATION_MINUTES || "30", 10);

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

export const login = async (dto: LoginDto) => {
  const user = await findUserByLoginId(dto.login_id);
  if (!user) throw new Error("INVALID_CREDENTIALS");
  if (user.status !== "active") throw new Error("ACCOUNT_NOT_ACTIVE");

  const valid = await comparePassword(dto.password, user.password);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  const token = randomUUID();
  await createSession({ userId: user.id, token, expiresAt: getExpiresAt() });
  await updateLastLoginAt(user.id);

  return {
    token,
    user: {
      id: user.id,
      login_id: user.login_id,
      name: user.name ?? null,
      role: user.role,
    },
  };
};

export const logout = async (token: string): Promise<void> => {
  await expireSession(token);
};
