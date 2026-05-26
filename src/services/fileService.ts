import {
  createFileGroup,
  findFileGroupById,
  createFile,
  findFilesByGroupId,
  findFileById,
  clearMainYn,
  updateFile,
  softDeleteFile,
} from "../repositories/fileRepository";
import { saveFile, removeFile } from "./storage/localStorageAdapter";
import { FileRefType } from "../types/fileTypes";

export const createGroup = async (refType: FileRefType, userId: string) => {
  const group = await createFileGroup({ refType, createdBy: userId });
  if (!group) throw new Error("FILE_GROUP_CREATE_FAILED");
  return group;
};

export const uploadFile = async (params: {
  fileGroupId: string;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  fileSize: number;
  isMainYn: "Y" | "N";
  sortOrder: number;
  userId: string;
}) => {
  const group = await findFileGroupById(params.fileGroupId);
  if (!group) throw new Error("FILE_GROUP_NOT_FOUND");

  const saved = await saveFile(
    params.buffer,
    params.originalName,
    group.ref_type,
  );

  if (params.isMainYn === "Y") {
    await clearMainYn(params.fileGroupId);
  }

  const file = await createFile({
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
  if (!file) throw new Error("FILE_CREATE_FAILED");
  return file;
};

export const getFilesByGroup = (fileGroupId: string) =>
  findFilesByGroupId(fileGroupId);

export const patchFile = async (params: {
  id: string;
  sortOrder?: number;
  isMainYn?: "Y" | "N";
  userId: string;
}) => {
  const file = await findFileById(params.id);
  if (!file) throw new Error("FILE_NOT_FOUND");

  if (params.isMainYn === "Y") {
    await clearMainYn(file.file_group_id);
  }

  const updated = await updateFile({
    id: params.id,
    sortOrder: params.sortOrder,
    isMainYn: params.isMainYn,
    updatedBy: params.userId,
  });
  if (!updated) throw new Error("FILE_NOT_FOUND");
  return updated;
};

export const removeFileById = async (id: string, userId: string) => {
  const file = await findFileById(id);
  if (!file) throw new Error("FILE_NOT_FOUND");

  const count = await softDeleteFile(id, userId);
  if (count === 0) throw new Error("FILE_NOT_FOUND");

  try {
    await removeFile(file.file_path);
  } catch {
    // 물리 파일 삭제 실패는 무시 (별도 배치로 정리)
  }
};
