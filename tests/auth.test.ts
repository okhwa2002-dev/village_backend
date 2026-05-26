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
import {
  findUserByLoginId,
  findUserById,
  createSession,
  findSessionByToken,
  refreshSession,
  expireSession,
  updateLastLoginAt,
} from "../src/repositories/authRepository";

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
