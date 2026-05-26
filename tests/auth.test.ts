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
    randomUUID: vi.fn().mockReturnValue("test-uuid-1234"),
  };
});

import * as pool from "../src/db/pool";
import {
  findUserByLoginId,
  findUserById,
  createSession,
  findSessionByToken,
  refreshSession,
  expireSession,
  updateLastLoginAt,
} from "../src/repositories/authRepository";
import * as hash from "../src/utils/hash";
import { register, login, logout } from "../src/services/authService";

describe("authRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("findUserByLoginId — pool.queryOne을 올바른 인수로 호출한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null);
    await findUserByLoginId("admin01");
    expect(pool.queryOne).toHaveBeenCalledWith("auth", "findUserByLoginId", {
      loginId: "admin01",
    });
  });

  it("findUserById — pool.queryOne을 올바른 인수로 호출한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null);
    await findUserById("1");
    expect(pool.queryOne).toHaveBeenCalledWith("auth", "findById", { id: "1" });
  });

  it("createSession — pool.queryOne을 올바른 인수로 호출한다", async () => {
    const expiresAt = new Date();
    vi.mocked(pool.queryOne).mockResolvedValueOnce({ token: "uuid-123" });
    await createSession({ userId: "1", token: "uuid-123", expiresAt });
    expect(pool.queryOne).toHaveBeenCalledWith("auth", "createSession", {
      userId: "1",
      token: "uuid-123",
      expiresAt,
    });
  });

  it("findSessionByToken — pool.queryOne을 올바른 인수로 호출한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null);
    await findSessionByToken("uuid-token");
    expect(pool.queryOne).toHaveBeenCalledWith("auth", "findSessionByToken", {
      token: "uuid-token",
    });
  });

  it("refreshSession — pool.execute를 올바른 인수로 호출한다", async () => {
    const expiresAt = new Date();
    vi.mocked(pool.execute).mockResolvedValueOnce(1);
    await refreshSession("uuid-token", expiresAt);
    expect(pool.execute).toHaveBeenCalledWith("auth", "refreshSession", {
      token: "uuid-token",
      expiresAt,
    });
  });

  it("expireSession — pool.execute를 올바른 인수로 호출한다", async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce(1);
    await expireSession("uuid-token");
    expect(pool.execute).toHaveBeenCalledWith("auth", "expireSession", {
      token: "uuid-token",
    });
  });

  it("updateLastLoginAt — pool.execute를 올바른 인수로 호출한다", async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce(1);
    await updateLastLoginAt("1");
    expect(pool.execute).toHaveBeenCalledWith("auth", "updateLastLoginAt", {
      userId: "1",
    });
  });
});

describe("authService.register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("login_id 중복이면 LOGIN_ID_EXISTS를 throw한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({
      id: "1",
      login_id: "admin01",
    });
    await expect(
      register({
        login_id: "admin01",
        password: "pw",
        role: "consumer",
      }),
    ).rejects.toThrow("LOGIN_ID_EXISTS");
  });

  it("farmer 가입 시 status=pending으로 생성된다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "1",
      login_id: "farmer01",
      role: "farmer",
      status: "pending",
      created_at: new Date(),
    });

    const result = await register({
      login_id: "farmer01",
      password: "pw",
      role: "farmer",
    });

    expect(pool.queryOne).toHaveBeenNthCalledWith(
      2,
      "auth",
      "createUser",
      expect.objectContaining({
        loginId: "farmer01",
        password: "hashed-pw",
        role: "farmer",
        status: "pending",
      }),
    );
    expect(result?.status).toBe("pending");
  });

  it("consumer 가입 시 status=active로 생성된다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "2",
      login_id: "consumer01",
      role: "consumer",
      status: "active",
      created_at: new Date(),
    });

    const result = await register({
      login_id: "consumer01",
      password: "pw",
      role: "consumer",
    });
    expect(result?.status).toBe("active");
  });
});

describe("authService.login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("login_id가 없으면 INVALID_CREDENTIALS를 throw한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null);
    await expect(login({ login_id: "nobody", password: "pw" })).rejects.toThrow(
      "INVALID_CREDENTIALS",
    );
  });

  it("비밀번호가 틀리면 INVALID_CREDENTIALS를 throw한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({
      id: "1",
      login_id: "admin01",
      password: "hashed",
      status: "active",
      role: "admin",
    });
    vi.mocked(hash.comparePassword).mockResolvedValueOnce(false);
    await expect(
      login({ login_id: "admin01", password: "wrong" }),
    ).rejects.toThrow("INVALID_CREDENTIALS");
  });

  it("status가 active가 아니면 ACCOUNT_NOT_ACTIVE를 throw한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({
      id: "1",
      login_id: "farmer01",
      password: "hashed",
      status: "pending",
      role: "farmer",
    });
    vi.mocked(hash.comparePassword).mockResolvedValueOnce(true);
    await expect(
      login({ login_id: "farmer01", password: "pw" }),
    ).rejects.toThrow("ACCOUNT_NOT_ACTIVE");
  });

  it("성공 시 token과 user를 반환한다", async () => {
    vi.mocked(pool.queryOne)
      .mockResolvedValueOnce({
        id: "1",
        login_id: "admin01",
        password: "hashed",
        status: "active",
        role: "admin",
        name: "관리자",
      })
      .mockResolvedValueOnce({ token: "test-uuid-1234" });
    vi.mocked(pool.execute).mockResolvedValueOnce(1);
    vi.mocked(hash.comparePassword).mockResolvedValueOnce(true);

    const result = await login({ login_id: "admin01", password: "pw" });

    expect(result.token).toBe("test-uuid-1234");
    expect(result.user.login_id).toBe("admin01");
    expect(result.user.role).toBe("admin");
  });
});

describe("authService.logout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("expireSession을 호출한다", async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce(1);
    await logout("uuid-token");
    expect(pool.execute).toHaveBeenCalledWith("auth", "expireSession", {
      token: "uuid-token",
    });
  });
});

import buildApp from "../src/app";
import { FastifyInstance } from "fastify";

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
      .mockResolvedValueOnce(null) // findUserByLoginId — 중복 없음
      .mockResolvedValueOnce({
        id: "1",
        login_id: "farmer01",
        role: "farmer",
        status: "pending",
        created_at: new Date(),
      });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        login_id: "farmer01",
        password: "password123",
        role: "farmer",
        name: "김농부",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("pending");
  });

  it("login_id 중복 시 409를 반환한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({
      id: "1",
      login_id: "farmer01",
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        login_id: "farmer01",
        password: "password123",
        role: "farmer",
      },
    });

    expect(res.statusCode).toBe(409);
  });

  it("role이 유효하지 않으면 400을 반환한다", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { login_id: "admin01", password: "password123", role: "admin" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("성공 시 200과 token을 반환한다", async () => {
    vi.mocked(pool.queryOne)
      .mockResolvedValueOnce({
        id: "1",
        login_id: "admin01",
        password: "hashed",
        status: "active",
        role: "admin",
        name: "관리자",
      })
      .mockResolvedValueOnce({ token: "test-uuid-1234" }); // createSession
    vi.mocked(pool.execute).mockResolvedValueOnce(1); // updateLastLoginAt
    vi.mocked(hash.comparePassword).mockResolvedValueOnce(true);

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { login_id: "admin01", password: "password123" },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
  });

  it("login_id가 없으면 401을 반환한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null);

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { login_id: "nobody", password: "password123" },
    });

    expect(res.statusCode).toBe(401);
  });

  it("비활성 계정이면 403을 반환한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({
      id: "1",
      login_id: "farmer01",
      password: "hashed",
      status: "pending",
      role: "farmer",
    });
    vi.mocked(hash.comparePassword).mockResolvedValueOnce(true);

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { login_id: "farmer01", password: "password123" },
    });

    expect(res.statusCode).toBe(403);
  });
});

describe("POST /api/auth/logout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("인증 없이 접근하면 401을 반환한다", async () => {
    const res = await app.inject({ method: "POST", url: "/api/auth/logout" });
    expect(res.statusCode).toBe(401);
  });

  it("유효한 토큰으로 로그아웃하면 200을 반환한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({
      id: "10",
      user_id: "1",
      token: "uuid-abc",
      expires_at: new Date(Date.now() + 60_000),
      login_id: "admin01",
      name: "관리자",
      role: "admin",
      status: "active",
    });
    vi.mocked(pool.execute)
      .mockResolvedValueOnce(1) // refreshSession (in authenticate)
      .mockResolvedValueOnce(1); // expireSession (in logout)

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: { authorization: "Bearer uuid-abc" },
    });

    expect(res.statusCode).toBe(200);
  });
});
