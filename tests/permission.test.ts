import { describe, it, expect, vi, beforeEach } from "vitest";

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

    expect(result).toHaveLength(0);
  });
});
