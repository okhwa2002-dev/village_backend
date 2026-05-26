import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";

vi.mock("fs");

describe("localStorageAdapter", () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
  });

  afterEach(() => vi.clearAllMocks());

  it("저장된 파일명은 UUID + 원본 확장자 형식이다", async () => {
    const { saveFile } =
      await import("../src/services/storage/localStorageAdapter");
    const result = await saveFile(Buffer.from("data"), "사과.jpg", "PRODUCT");
    expect(result.storedName).toMatch(/^[0-9a-f-]{36}\.jpg$/);
  });

  it("fileUrl은 /files/{refType소문자}/{storedName} 형식이다", async () => {
    const { saveFile } =
      await import("../src/services/storage/localStorageAdapter");
    const result = await saveFile(Buffer.from("data"), "test.png", "PRODUCT");
    expect(result.fileUrl).toMatch(/^\/files\/product\//);
  });
});
