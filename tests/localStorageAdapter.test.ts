import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("fs/promises", () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("fs", () => ({
  existsSync: vi.fn().mockReturnValue(true),
}));

describe("localStorageAdapter", () => {
  afterEach(() => vi.clearAllMocks());

  async function getAdapter() {
    return import("../src/services/storage/localStorageAdapter");
  }

  describe("saveFile", () => {
    it("저장된 파일명은 UUID + 원본 확장자 형식이다", async () => {
      const { saveFile } = await getAdapter();
      const result = await saveFile(Buffer.from("data"), "사과.jpg", "PRODUCT");
      expect(result.storedName).toMatch(/^[0-9a-f-]{36}\.jpg$/);
    });

    it("fileUrl은 /files/{refType소문자}/{storedName} 형식이다", async () => {
      const { saveFile } = await getAdapter();
      const result = await saveFile(Buffer.from("data"), "test.png", "PRODUCT");
      expect(result.fileUrl).toMatch(/^\/files\/product\//);
    });

    it("filePath는 uploads/{refType소문자}/{storedName} 형식이다", async () => {
      const { saveFile } = await getAdapter();
      const result = await saveFile(Buffer.from("data"), "photo.jpg", "FARMER");
      expect(result.filePath).toBe(`uploads/farmer/${result.storedName}`);
    });

    it("확장자가 없으면 .bin을 붙인다", async () => {
      const { saveFile } = await getAdapter();
      const result = await saveFile(Buffer.from("data"), "README", "PRODUCT");
      expect(result.storedName).toMatch(/\.bin$/);
    });

    it("허용되지 않은 확장자는 .bin으로 대체한다", async () => {
      const { saveFile } = await getAdapter();
      const result = await saveFile(Buffer.from("data"), "evil.php", "PRODUCT");
      expect(result.storedName).toMatch(/\.bin$/);
    });

    it("mkdir이 recursive 옵션으로 호출된다", async () => {
      const fsp = await import("fs/promises");
      const { saveFile } = await getAdapter();
      await saveFile(Buffer.from("data"), "test.png", "PRODUCT");
      expect(fsp.mkdir).toHaveBeenCalledWith(
        expect.stringContaining("product"),
        { recursive: true },
      );
    });

    it("writeFile이 올바른 buffer와 wx 플래그로 호출된다", async () => {
      const fsp = await import("fs/promises");
      const { saveFile } = await getAdapter();
      const buf = Buffer.from("hello");
      const result = await saveFile(buf, "x.png", "PRODUCT");
      expect(fsp.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(result.storedName),
        buf,
        { flag: "wx" },
      );
    });

    it("잘못된 refType은 INVALID_REF_TYPE 에러를 던진다", async () => {
      const { saveFile } = await getAdapter();
      await expect(
        saveFile(Buffer.from("data"), "x.jpg", "INVALID" as any),
      ).rejects.toThrow("INVALID_REF_TYPE");
    });
  });

  describe("removeFile", () => {
    it("유효한 경로의 파일을 삭제한다", async () => {
      const fsp = await import("fs/promises");
      const { removeFile } = await getAdapter();
      await removeFile("uploads/product/abc.jpg");
      expect(fsp.unlink).toHaveBeenCalled();
    });

    it("파일이 없으면 에러 없이 종료된다 (ENOENT 무시)", async () => {
      const fsp = await import("fs/promises");
      vi.mocked(fsp.unlink).mockRejectedValueOnce(
        Object.assign(new Error(), { code: "ENOENT" }),
      );
      const { removeFile } = await getAdapter();
      await expect(
        removeFile("uploads/product/missing.jpg"),
      ).resolves.toBeUndefined();
    });

    it("uploads 경로 밖 접근은 INVALID_FILE_PATH 에러를 던진다", async () => {
      const { removeFile } = await getAdapter();
      await expect(removeFile("../../etc/passwd")).rejects.toThrow(
        "INVALID_FILE_PATH",
      );
    });
  });
});
