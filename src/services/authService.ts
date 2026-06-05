import { randomBytes, createHash, randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { RegisterDto, LoginDto } from "../types/userTypes";
import { UserRole } from "../types/commonTypes";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  findUserByLoginId,
  createUser,
  updateLastLoginAt,
  saveRefreshToken,
  findRefreshToken,
  revokeToken,
  revokeFamily,
} from "../repositories/authRepository";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_DAYS = parseInt(
  process.env.REFRESH_TOKEN_EXPIRES_DAYS || "7",
  10,
);

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; loginId: string; name: string | null; role: UserRole };
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const generateAccessToken = (userId: string): string =>
  jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);

const generateRefreshToken = (): { raw: string; hash: string } => {
  const raw = randomBytes(48).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
};

const getRefreshExpiresAt = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_EXPIRES_DAYS);
  return d;
};

export const register = async (dto: RegisterDto) => {
  const existing = await findUserByLoginId(dto.loginId);
  if (existing) throw new Error("LOGIN_ID_EXISTS");

  const hashed = await hashPassword(dto.password);
  const status = dto.role === "FARMER" ? "PENDING" : "ACTIVE";

  return createUser({
    loginId: dto.loginId,
    password: hashed,
    role: dto.role,
    status,
    name: dto.name ?? null,
    phone: dto.phone ?? null,
    email: dto.email ?? null,
  });
};

export const login = async (dto: LoginDto): Promise<LoginResult> => {
  const user = await findUserByLoginId(dto.loginId);
  if (!user) throw new Error("INVALID_CREDENTIALS");

  const { password: hash, ...safeUser } = user;
  const valid = await comparePassword(dto.password, hash);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  if (safeUser.status !== "ACTIVE") throw new Error("ACCOUNT_NOT_ACTIVE");

  try {
    await updateLastLoginAt(safeUser.id);
  } catch {
    // best-effort
  }

  const accessToken = generateAccessToken(safeUser.id);
  const { raw: refreshToken, hash: tokenHash } = generateRefreshToken();
  const familyId = randomUUID();

  await saveRefreshToken({
    userId: safeUser.id,
    tokenHash,
    familyId,
    expiresAt: getRefreshExpiresAt(),
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: safeUser.id,
      loginId: safeUser.loginId,
      name: safeUser.name ?? null,
      role: safeUser.role,
    },
  };
};

export const refresh = async (rawToken: string): Promise<TokenPair> => {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const existing = await findRefreshToken(tokenHash);

  if (!existing) throw new Error("INVALID_REFRESH_TOKEN");

  // Reuse detection: 이미 폐기된 토큰 재사용 → 해당 family 전체 폐기
  if (existing.revokedAt !== null) {
    await revokeFamily(existing.familyId);
    throw new Error("REFRESH_TOKEN_REUSE");
  }

  if (existing.expiresAt < new Date()) throw new Error("REFRESH_TOKEN_EXPIRED");
  if (existing.status !== "ACTIVE") throw new Error("ACCOUNT_NOT_ACTIVE");

  await revokeToken(tokenHash);

  const accessToken = generateAccessToken(existing.userId);
  const { raw: newRefreshToken, hash: newTokenHash } = generateRefreshToken();

  await saveRefreshToken({
    userId: existing.userId,
    tokenHash: newTokenHash,
    familyId: existing.familyId,
    expiresAt: getRefreshExpiresAt(),
  });

  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (rawToken: string): Promise<void> => {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const existing = await findRefreshToken(tokenHash);
  if (existing) {
    await revokeFamily(existing.familyId);
  }
};
