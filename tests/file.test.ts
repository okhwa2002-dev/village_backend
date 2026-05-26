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

vi.mock("../src/services/storage/localStorageAdapter", () => ({
  saveFile: vi.fn().mockResolvedValue({
    storedName: "abc-uuid.jpg",
    filePath: "uploads/product/abc-uuid.jpg",
    fileUrl: "/files/product/abc-uuid.jpg",
  }),
  removeFile: vi.fn().mockResolvedValue(undefined),
}));

import * as pool from "../src/db/pool";
import {
  createGroup,
  uploadFile,
  getFilesByGroup,
  patchFile,
  removeFileById,
} from "../src/services/fileService";

describe("fileService", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("createGroup", () => {
    it("파일 그룹을 생성하고 반환한다", async () => {
      const mockGroup = {
        id: "1",
        ref_type: "PRODUCT",
        created_at: new Date(),
      };
      vi.mocked(pool.queryOne).mockResolvedValueOnce(mockGroup);

      const result = await createGroup("PRODUCT", "10");

      expect(pool.queryOne).toHaveBeenCalledWith("file", "createGroup", {
        refType: "PRODUCT",
        createdBy: "10",
      });
      expect(result).toEqual(mockGroup);
    });

    it("생성 실패 시 FILE_GROUP_CREATE_FAILED 에러를 던진다", async () => {
      vi.mocked(pool.queryOne).mockResolvedValueOnce(null);

      await expect(createGroup("PRODUCT", "10")).rejects.toThrow(
        "FILE_GROUP_CREATE_FAILED",
      );
    });
  });

  describe("uploadFile", () => {
    it("그룹이 없으면 FILE_GROUP_NOT_FOUND 에러를 던진다", async () => {
      vi.mocked(pool.queryOne).mockResolvedValueOnce(null);

      await expect(
        uploadFile({
          fileGroupId: "999",
          buffer: Buffer.from("data"),
          originalName: "test.jpg",
          mimeType: "image/jpeg",
          fileSize: 100,
          isMainYn: "N",
          sortOrder: 0,
          userId: "1",
        }),
      ).rejects.toThrow("FILE_GROUP_NOT_FOUND");
    });

    it("is_main_yn=Y이면 clearMainYn을 먼저 호출한다", async () => {
      const mockGroup = {
        id: "1",
        ref_type: "PRODUCT",
        created_at: new Date(),
      };
      const mockFile = {
        id: "10",
        file_group_id: "1",
        original_name: "test.jpg",
      };
      vi.mocked(pool.queryOne)
        .mockResolvedValueOnce(mockGroup)
        .mockResolvedValueOnce(mockFile);
      vi.mocked(pool.execute).mockResolvedValueOnce(1);

      await uploadFile({
        fileGroupId: "1",
        buffer: Buffer.from("data"),
        originalName: "test.jpg",
        mimeType: "image/jpeg",
        fileSize: 100,
        isMainYn: "Y",
        sortOrder: 1,
        userId: "1",
      });

      expect(pool.execute).toHaveBeenCalledWith("file", "clearMainYn", {
        fileGroupId: "1",
      });
    });
  });

  describe("patchFile", () => {
    it("파일이 없으면 FILE_NOT_FOUND 에러를 던진다", async () => {
      vi.mocked(pool.queryOne).mockResolvedValueOnce(null);

      await expect(patchFile({ id: "999", userId: "1" })).rejects.toThrow(
        "FILE_NOT_FOUND",
      );
    });
  });
});
