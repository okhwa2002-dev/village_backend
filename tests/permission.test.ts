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

import * as pool from "../src/db/pool";
import { getUserMenuPermissions } from "../src/repositories/permissionRepository";

describe("permissionRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("사용자의 메뉴 권한 목록을 반환한다", async () => {
    const mockPerms = [
      { menu_code: "ADMIN_FARMER", can_edit: true, can_delete: false },
      { menu_code: "ADMIN_ORDER", can_edit: false, can_delete: false },
    ];
    vi.mocked(pool.query).mockResolvedValueOnce(mockPerms);

    const result = await getUserMenuPermissions("1");

    expect(pool.query).toHaveBeenCalledWith(
      "permission",
      "getUserMenuPermissions",
      { userId: "1" },
    );
    expect(result).toEqual(mockPerms);
  });

  it("권한이 없는 사용자는 빈 배열을 반환한다", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce([]);

    const result = await getUserMenuPermissions("999");

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

  const TEST_TOKEN = "test-session-uuid-1234";

  const mockSession = {
    id: "10",
    user_id: "1",
    token: TEST_TOKEN,
    expires_at: new Date(Date.now() + 60_000),
    login_id: "admin01",
    name: "관리자",
    role: "admin",
    status: "active",
  };

  it("메뉴 권한이 없으면 403을 반환한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(mockSession); // findSessionByToken
    vi.mocked(pool.execute).mockResolvedValueOnce(1); // refreshSession
    vi.mocked(pool.query).mockResolvedValueOnce([]); // getUserMenuPermissions

    const res = await app.inject({
      method: "GET",
      url: "/api/admin/farmers",
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it("읽기 권한이 있으면 admin/farmers GET에 200을 반환한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(mockSession); // findSessionByToken
    vi.mocked(pool.execute).mockResolvedValueOnce(1); // refreshSession
    vi.mocked(pool.query)
      .mockResolvedValueOnce([
        { menu_code: "ADMIN_FARMER", can_edit: false, can_delete: false },
      ]) // getUserMenuPermissions
      .mockResolvedValueOnce([]); // findAllFarmersForAdmin

    const res = await app.inject({
      method: "GET",
      url: "/api/admin/farmers",
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
    });

    expect(res.statusCode).toBe(200);
  });

  it("edit 권한이 없으면 PATCH 라우트에 403을 반환한다", async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(mockSession); // findSessionByToken
    vi.mocked(pool.execute).mockResolvedValueOnce(1); // refreshSession
    vi.mocked(pool.query).mockResolvedValueOnce([
      { menu_code: "ADMIN_FARMER", can_edit: false, can_delete: false },
    ]); // getUserMenuPermissions

    const res = await app.inject({
      method: "PATCH",
      url: "/api/admin/farmers/1/approve",
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
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
