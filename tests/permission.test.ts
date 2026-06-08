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

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn().mockImplementation(() => {
      throw new Error("invalid token");
    }),
  },
}));

import * as pool from "../src/db/pool";
import jwt from "jsonwebtoken";
import permissionRepo from "../src/repositories/permissionRepository";

describe("permissionRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("사용자의 메뉴 권한 목록을 반환한다", async () => {
    const mockPerms = [
      { menu_code: "ADMIN_FARMERS", can_edit: true, can_delete: false },
      { menu_code: "ADMIN_ORDER", can_edit: false, can_delete: false },
    ];
    vi.mocked(pool.query).mockResolvedValueOnce(mockPerms);

    const result = await permissionRepo.getUserMenuPermissions("1");

    expect(pool.query).toHaveBeenCalledWith(
      "permission",
      "getUserMenuPermissions",
      { userId: "1" },
    );
    expect(result).toEqual(mockPerms);
  });

  it("권한이 없는 사용자는 빈 배열을 반환한다", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce([]);

    const result = await permissionRepo.getUserMenuPermissions("999");

    expect(pool.query).toHaveBeenCalledWith(
      "permission",
      "getUserMenuPermissions",
      { userId: "999" },
    );
    expect(result).toHaveLength(0);
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

describe("checkMenuPermission 미들웨어", () => {
  beforeEach(() => vi.clearAllMocks());

  const mockUser = {
    id: "1",
    login_id: "admin01",
    name: "관리자",
    role: "ADMIN",
    status: "ACTIVE",
    created_at: new Date(),
  };

  it("메뉴 권한이 없으면 403을 반환한다", async () => {
    vi.mocked(jwt.verify).mockReturnValueOnce({ userId: "1" } as never);
    vi.mocked(pool.queryOne).mockResolvedValueOnce(mockUser);
    vi.mocked(pool.query).mockResolvedValueOnce([]);

    const res = await app.inject({
      method: "GET",
      url: "/api/admin/farmers",
      headers: { authorization: "Bearer some-jwt-token" },
    });

    expect(res.statusCode).toBe(403);
  });

  it("읽기 권한이 있으면 admin/farmers GET에 200을 반환한다", async () => {
    vi.mocked(jwt.verify).mockReturnValueOnce({ userId: "1" } as never);
    vi.mocked(pool.queryOne).mockResolvedValueOnce(mockUser);
    vi.mocked(pool.query)
      .mockResolvedValueOnce([
        { menu_code: "ADMIN_FARMERS", can_edit: false, can_delete: false },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: "0" }]);

    const res = await app.inject({
      method: "GET",
      url: "/api/admin/farmers",
      headers: { authorization: "Bearer some-jwt-token" },
    });

    expect(res.statusCode).toBe(200);
  });

  it("edit 권한이 없으면 PATCH 라우트에 403을 반환한다", async () => {
    vi.mocked(jwt.verify).mockReturnValueOnce({ userId: "1" } as never);
    vi.mocked(pool.queryOne).mockResolvedValueOnce(mockUser);
    vi.mocked(pool.query).mockResolvedValueOnce([
      { menu_code: "ADMIN_FARMERS", can_edit: false, can_delete: false },
    ]);

    const res = await app.inject({
      method: "PATCH",
      url: "/api/admin/farmers/1/approve",
      headers: { authorization: "Bearer some-jwt-token" },
    });

    expect(res.statusCode).toBe(403);
  });

  it("인증 없이 접근하면 401을 반환한다", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/farmers",
    });

    expect(res.statusCode).toBe(401);
  });
});
