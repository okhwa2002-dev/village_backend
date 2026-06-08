import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";

vi.mock("../src/db/pool", () => ({
  pool: { query: vi.fn() },
  query: vi.fn(),
  queryOne: vi.fn(),
  execute: vi.fn(),
  withTransaction: vi.fn(),
  clientQuery: vi.fn(),
  clientQueryOne: vi.fn(),
  clientExecute: vi.fn(),
}));

vi.mock("../src/utils/hash", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-pw"),
  comparePassword: vi.fn(),
}));

vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("crypto")>();
  return {
    ...actual,
    randomBytes: vi.fn().mockReturnValue(Buffer.alloc(32, 0x42)),
  };
});

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mock-access-token"),
    verify: vi.fn(),
  },
}));

import * as pool from "../src/db/pool";
import authRepo from "../src/repositories/authRepository";
import * as hash from "../src/utils/hash";
import authService from "../src/services/authService";
import buildApp from "../src/app";
import { FastifyInstance } from "fastify";

const makeRefreshTokenRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  user_id: "1",
  token_hash: "abc-hash",
  family_id: "fam-uuid-1",
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  revoked_at: null,
  login_id: "admin01",
  name: "관리자",
  role: "ADMIN",
  status: "ACTIVE",
  ...overrides,
});

describe("authRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("findUserByLoginId — pool.queryOne을 올바른 인수로 호출한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null);
    await authRepo.findUserByLoginId("admin01");
    expect(pool.queryOne).toHaveBeenCalledWith("auth", "findUserByLoginId", {
      loginId: "admin01",
    });
  });

  it("findUserById — pool.queryOne을 올바른 인수로 호출한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null);
    await authRepo.findUserById("1");
    expect(pool.queryOne).toHaveBeenCalledWith("auth", "findById", { id: "1" });
  });

  it("saveRefreshToken — pool.execute를 올바른 인수로 호출한다", async () => {
    const expiresAt = new Date();
    vi.mocked(pool.execute).mockResolvedValueOnce(1);
    await authRepo.saveRefreshToken({
      userId: "1",
      tokenHash: "hash-abc",
      familyId: "fam-uuid-1",
      expiresAt,
    });
    expect(pool.execute).toHaveBeenCalledWith("auth", "saveRefreshToken", {
      userId: "1",
      tokenHash: "hash-abc",
      familyId: "fam-uuid-1",
      expiresAt,
    });
  });

  it("findRefreshToken — 행을 올바르게 매핑한다", async () => {
    const row = makeRefreshTokenRow();
    vi.mocked(pool.queryOne).mockResolvedValueOnce(row);
    const result = await authRepo.findRefreshToken("some-hash");
    expect(result?.userId).toBe("1");
    expect(result?.familyId).toBe("fam-uuid-1");
    expect(result?.revokedAt).toBeNull();
    expect(result?.status).toBe("ACTIVE");
  });

  it("revokeToken — pool.execute를 올바른 인수로 호출한다", async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce(1);
    await authRepo.revokeToken("hash-abc");
    expect(pool.execute).toHaveBeenCalledWith("auth", "revokeToken", {
      tokenHash: "hash-abc",
    });
  });

  it("revokeFamily — pool.execute를 올바른 인수로 호출한다", async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce(1);
    await authRepo.revokeFamily("fam-uuid-1");
    expect(pool.execute).toHaveBeenCalledWith("auth", "revokeFamily", {
      familyId: "fam-uuid-1",
    });
  });

  it("updateLastLoginAt — pool.execute를 올바른 인수로 호출한다", async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce(1);
    await authRepo.updateLastLoginAt("1");
    expect(pool.execute).toHaveBeenCalledWith("auth", "updateLastLoginAt", {
      userId: "1",
    });
  });
});

describe("authService.register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loginId 중복이면 LOGIN_ID_EXISTS를 throw한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({
      id: "1",
      login_id: "admin01",
    });
    await expect(
      authService.register({
        loginId: "admin01",
        password: "pw",
        role: "CONSUMER",
      }),
    ).rejects.toThrow("LOGIN_ID_EXISTS");
  });

  it("farmer 가입 시 status=pending으로 생성된다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "1",
      login_id: "farmer01",
      role: "FARMER",
      status: "PENDING",
      created_at: new Date(),
    });

    const result = await authService.register({
      loginId: "farmer01",
      password: "pw",
      role: "FARMER",
    });

    expect(pool.queryOne).toHaveBeenNthCalledWith(
      2,
      "auth",
      "createUser",
      expect.objectContaining({
        loginId: "farmer01",
        password: "hashed-pw",
        role: "FARMER",
        status: "PENDING",
      }),
    );
    expect(result?.status).toBe("PENDING");
  });

  it("consumer 가입 시 status=active로 생성된다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "2",
      login_id: "consumer01",
      role: "CONSUMER",
      status: "ACTIVE",
      created_at: new Date(),
    });

    const result = await authService.register({
      loginId: "consumer01",
      password: "pw",
      role: "CONSUMER",
    });
    expect(result?.status).toBe("ACTIVE");
  });
});

describe("authService.login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loginId가 없으면 INVALID_CREDENTIALS를 throw한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null);
    await expect(
      authService.login({ loginId: "nobody", password: "pw" }),
    ).rejects.toThrow("INVALID_CREDENTIALS");
  });

  it("비밀번호가 틀리면 INVALID_CREDENTIALS를 throw한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({
      id: "1",
      login_id: "admin01",
      password: "hashed",
      status: "ACTIVE",
      role: "ADMIN",
    });
    vi.mocked(hash.comparePassword).mockResolvedValueOnce(false);
    await expect(
      authService.login({ loginId: "admin01", password: "wrong" }),
    ).rejects.toThrow("INVALID_CREDENTIALS");
  });

  it("status가 active가 아니면 ACCOUNT_NOT_ACTIVE를 throw한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({
      id: "1",
      login_id: "farmer01",
      password: "hashed",
      status: "PENDING",
      role: "FARMER",
    });
    vi.mocked(hash.comparePassword).mockResolvedValueOnce(true);
    await expect(
      authService.login({ loginId: "farmer01", password: "pw" }),
    ).rejects.toThrow("ACCOUNT_NOT_ACTIVE");
  });

  it("성공 시 accessToken, refreshToken, user를 반환한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({
      id: "1",
      login_id: "admin01",
      password: "hashed",
      status: "ACTIVE",
      role: "ADMIN",
      name: "관리자",
    });
    vi.mocked(pool.execute)
      .mockResolvedValueOnce(1) // updateLastLoginAt
      .mockResolvedValueOnce(1); // saveRefreshToken
    vi.mocked(hash.comparePassword).mockResolvedValueOnce(true);

    const result = await authService.login({
      loginId: "admin01",
      password: "pw",
    });

    expect(result.accessToken).toBe("mock-access-token");
    expect(result.refreshToken).toMatch(/^[0-9a-f]+$/);
    expect(result.user.loginId).toBe("admin01");
    expect(result.user.role).toBe("ADMIN");
  });
});

describe("authService.refresh", () => {
  beforeEach(() => vi.clearAllMocks());

  it("토큰이 없으면 INVALID_REFRESH_TOKEN을 throw한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null);
    await expect(authService.refresh("unknown-token")).rejects.toThrow(
      "INVALID_REFRESH_TOKEN",
    );
  });

  it("이미 폐기된 토큰이면 REFRESH_TOKEN_REUSE를 throw하고 패밀리를 폐기한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(
      makeRefreshTokenRow({ revoked_at: new Date() }),
    );
    vi.mocked(pool.execute).mockResolvedValueOnce(1); // revokeFamily

    await expect(authService.refresh("revoked-token")).rejects.toThrow(
      "REFRESH_TOKEN_REUSE",
    );
    expect(pool.execute).toHaveBeenCalledWith("auth", "revokeFamily", {
      familyId: "fam-uuid-1",
    });
  });

  it("만료된 토큰이면 REFRESH_TOKEN_EXPIRED를 throw한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(
      makeRefreshTokenRow({ expires_at: new Date(Date.now() - 1000) }),
    );
    await expect(authService.refresh("expired-token")).rejects.toThrow(
      "REFRESH_TOKEN_EXPIRED",
    );
  });

  it("비활성 계정이면 ACCOUNT_NOT_ACTIVE를 throw한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(
      makeRefreshTokenRow({ status: "PENDING" }),
    );
    await expect(authService.refresh("inactive-token")).rejects.toThrow(
      "ACCOUNT_NOT_ACTIVE",
    );
  });

  it("성공 시 새 토큰 쌍을 반환한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(makeRefreshTokenRow());
    vi.mocked(pool.execute)
      .mockResolvedValueOnce(1) // revokeToken
      .mockResolvedValueOnce(1); // saveRefreshToken

    const result = await authService.refresh("valid-raw-token");

    expect(result.accessToken).toBe("mock-access-token");
    expect(result.refreshToken).toMatch(/^[0-9a-f]+$/);
    expect(pool.execute).toHaveBeenCalledWith(
      "auth",
      "revokeToken",
      expect.objectContaining({ tokenHash: expect.any(String) }),
    );
  });
});

describe("authService.logout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("토큰이 존재하면 패밀리 전체를 폐기한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(makeRefreshTokenRow());
    vi.mocked(pool.execute).mockResolvedValueOnce(1);

    await authService.logout("valid-raw-token");

    expect(pool.execute).toHaveBeenCalledWith("auth", "revokeFamily", {
      familyId: "fam-uuid-1",
    });
  });

  it("토큰이 존재하지 않으면 아무것도 하지 않는다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null);
    await authService.logout("nonexistent-token");
    expect(pool.execute).not.toHaveBeenCalled();
  });
});

describe("auth routes (integration)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /api/auth/register", () => {
    beforeEach(() => vi.clearAllMocks());

    it("farmer 가입 시 201과 status=pending을 반환한다", async () => {
      vi.mocked(pool.queryOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: "1",
          login_id: "farmer01",
          role: "FARMER",
          status: "PENDING",
          created_at: new Date(),
        });

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          loginId: "farmer01",
          password: "password123",
          role: "FARMER",
          name: "김농부",
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("PENDING");
    });

    it("loginId 중복 시 409를 반환한다", async () => {
      vi.mocked(pool.queryOne).mockResolvedValueOnce({
        id: "1",
        login_id: "farmer01",
      });

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          loginId: "farmer01",
          password: "password123",
          role: "FARMER",
        },
      });

      expect(res.statusCode).toBe(409);
    });

    it("role이 유효하지 않으면 400을 반환한다", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          loginId: "admin01",
          password: "password123",
          role: "ADMIN",
        },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(() => vi.clearAllMocks());

    it("성공 시 200과 accessToken, refreshToken을 반환한다", async () => {
      vi.mocked(pool.queryOne).mockResolvedValueOnce({
        id: "1",
        login_id: "admin01",
        password: "hashed",
        status: "ACTIVE",
        role: "ADMIN",
        name: "관리자",
      });
      vi.mocked(pool.execute)
        .mockResolvedValueOnce(1) // updateLastLoginAt
        .mockResolvedValueOnce(1); // saveRefreshToken
      vi.mocked(hash.comparePassword).mockResolvedValueOnce(true);

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { loginId: "admin01", password: "password123" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
      expect(body.data.user.loginId).toBe("admin01");
    });

    it("loginId가 없으면 401을 반환한다", async () => {
      vi.mocked(pool.queryOne).mockResolvedValueOnce(null);

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { loginId: "nobody", password: "password123" },
      });

      expect(res.statusCode).toBe(401);
    });

    it("비활성 계정이면 403을 반환한다", async () => {
      vi.mocked(pool.queryOne).mockResolvedValueOnce({
        id: "1",
        login_id: "farmer01",
        password: "hashed",
        status: "PENDING",
        role: "FARMER",
      });
      vi.mocked(hash.comparePassword).mockResolvedValueOnce(true);

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { loginId: "farmer01", password: "password123" },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("POST /api/auth/refresh", () => {
    beforeEach(() => vi.clearAllMocks());

    it("유효한 refreshToken으로 새 토큰 쌍을 반환한다", async () => {
      vi.mocked(pool.queryOne).mockResolvedValueOnce(makeRefreshTokenRow());
      vi.mocked(pool.execute)
        .mockResolvedValueOnce(1) // revokeToken
        .mockResolvedValueOnce(1); // saveRefreshToken

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/refresh",
        payload: { refreshToken: "valid-raw-token" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
    });

    it("유효하지 않은 refreshToken이면 401을 반환한다", async () => {
      vi.mocked(pool.queryOne).mockResolvedValueOnce(null);

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/refresh",
        payload: { refreshToken: "invalid-token" },
      });

      expect(res.statusCode).toBe(401);
    });

    it("이미 폐기된 토큰 재사용 시 401을 반환한다", async () => {
      vi.mocked(pool.queryOne).mockResolvedValueOnce(
        makeRefreshTokenRow({ revoked_at: new Date() }),
      );
      vi.mocked(pool.execute).mockResolvedValueOnce(1); // revokeFamily

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/refresh",
        payload: { refreshToken: "reused-token" },
      });

      expect(res.statusCode).toBe(401);
    });

    it("refreshToken 필드가 없으면 400을 반환한다", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/refresh",
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /api/auth/logout", () => {
    beforeEach(() => vi.clearAllMocks());

    it("refreshToken으로 로그아웃하면 200을 반환한다", async () => {
      vi.mocked(pool.queryOne).mockResolvedValueOnce(makeRefreshTokenRow());
      vi.mocked(pool.execute).mockResolvedValueOnce(1); // revokeFamily

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/logout",
        payload: { refreshToken: "valid-raw-token" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
    });

    it("존재하지 않는 refreshToken으로 로그아웃해도 200을 반환한다", async () => {
      vi.mocked(pool.queryOne).mockResolvedValueOnce(null);

      const res = await app.inject({
        method: "POST",
        url: "/api/auth/logout",
        payload: { refreshToken: "unknown-token" },
      });

      expect(res.statusCode).toBe(200);
    });

    it("refreshToken 필드가 없으면 400을 반환한다", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/logout",
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });
  });
});
