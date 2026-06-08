import fileRepo from "../repositories/fileRepository";
import { saveFile, removeFile } from "./storage/localStorageAdapter";
import { FileRecord, FileRefType } from "../types/fileTypes";
import { Errors } from "../utils/errors";

const fileService = {
  async createGroup(refType: FileRefType, userId: string) {
    const group = await fileRepo.createFileGroup({
      refType,
      createdBy: userId,
    });
    if (!group) throw Errors.internal("파일 그룹 생성에 실패했습니다");
    return group;
  },

  async uploadFile(params: {
    fileGroupId: string;
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    fileSize: number;
    isMainYn: "Y" | "N";
    sortOrder: number;
    userId: string;
  }) {
    const group = await fileRepo.findFileGroupById(params.fileGroupId);
    if (!group) throw Errors.notFound("파일 그룹을 찾을 수 없습니다");

    const saved = await saveFile(
      params.buffer,
      params.originalName,
      group.refType,
    );

    if (params.isMainYn === "Y") {
      await fileRepo.clearMainYn(params.fileGroupId);
    }

    const file = await fileRepo.createFile({
      fileGroupId: params.fileGroupId,
      originalName: params.originalName,
      storedName: saved.storedName,
      filePath: saved.filePath,
      fileUrl: saved.fileUrl,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      storageType: "LOCAL",
      sortOrder: params.sortOrder,
      isMainYn: params.isMainYn,
      createdBy: params.userId,
    });
    if (!file) throw Errors.internal("파일 저장에 실패했습니다");
    return file;
  },

  async uploadFiles(params: {
    fileGroupId: string;
    files: Array<{
      buffer: Buffer;
      originalName: string;
      mimeType: string;
      fileSize: number;
    }>;
    mainIndex?: number;
    sortStartOrder: number;
    userId: string;
  }) {
    const group = await fileRepo.findFileGroupById(params.fileGroupId);
    if (!group) throw Errors.notFound("파일 그룹을 찾을 수 없습니다");
    if (params.files.length === 0) throw Errors.badRequest("파일이 없습니다");

    if (
      params.mainIndex !== undefined &&
      (params.mainIndex < 0 || params.mainIndex >= params.files.length)
    ) {
      throw Errors.badRequest("mainIndex가 잘못되었습니다");
    }

    if (params.mainIndex !== undefined) {
      await fileRepo.clearMainYn(params.fileGroupId);
    }

    const uploadedFiles = [];
    for (const [index, multipartFile] of params.files.entries()) {
      const saved = await saveFile(
        multipartFile.buffer,
        multipartFile.originalName,
        group.refType,
      );

      const file = await fileRepo.createFile({
        fileGroupId: params.fileGroupId,
        originalName: multipartFile.originalName,
        storedName: saved.storedName,
        filePath: saved.filePath,
        fileUrl: saved.fileUrl,
        mimeType: multipartFile.mimeType,
        fileSize: multipartFile.fileSize,
        storageType: "LOCAL",
        sortOrder: params.sortStartOrder + index,
        isMainYn: params.mainIndex === index ? "Y" : "N",
        createdBy: params.userId,
      });
      if (!file) throw Errors.internal("파일 저장에 실패했습니다");
      uploadedFiles.push(file);
    }

    return { fileGroupId: params.fileGroupId, files: uploadedFiles };
  },

  getFilesByGroup(fileGroupId: string) {
    return fileRepo.findFilesByGroupId(fileGroupId);
  },

  async getFilesByGroupMap(fileGroupIds: string[]) {
    const uniqueGroupIds = Array.from(new Set(fileGroupIds.filter(Boolean)));
    const entries: Array<[string, FileRecord[]]> = await Promise.all(
      uniqueGroupIds.map(
        async (fileGroupId) =>
          [fileGroupId, await fileRepo.findFilesByGroupId(fileGroupId)] as [
            string,
            FileRecord[],
          ],
      ),
    );
    return new Map(entries);
  },

  async patchFile(params: {
    id: string;
    sortOrder?: number;
    isMainYn?: "Y" | "N";
    userId: string;
  }) {
    const file = await fileRepo.findFileById(params.id);
    if (!file) throw Errors.notFound("파일을 찾을 수 없습니다");

    if (params.isMainYn === "Y") {
      await fileRepo.clearMainYn(file.fileGroupId);
    }

    const updated = await fileRepo.updateFile({
      id: params.id,
      sortOrder: params.sortOrder,
      isMainYn: params.isMainYn,
      updatedBy: params.userId,
    });
    if (!updated) throw Errors.notFound("파일을 찾을 수 없습니다");
    return updated;
  },

  async removeFileById(id: string, userId: string) {
    const file = await fileRepo.findFileById(id);
    if (!file) throw Errors.notFound("파일을 찾을 수 없습니다");

    const count = await fileRepo.softDeleteFile(id, userId);
    if (count === 0) throw Errors.notFound("파일을 찾을 수 없습니다");

    try {
      await removeFile(file.filePath);
    } catch {
      // 물리 파일 삭제 실패는 무시 (별도 배치로 정리)
    }
  },
};
export default fileService;
