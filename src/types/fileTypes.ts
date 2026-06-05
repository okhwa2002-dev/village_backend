// src/types/fileTypes.ts
export type StorageType = "LOCAL" | "S3";
export type FileRefType = "PRODUCT" | "FARMER" | "VILLAGE" | "BOARD";

export interface FileGroup {
  id: string;
  refType: FileRefType;
  createdAt: Date;
  createdBy: string | null;
}

export interface FileRecord {
  id: string;
  fileGroupId: string;
  originalName: string;
  storedName: string;
  filePath: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  storageType: StorageType;
  sortOrder: number;
  isMainYn: "Y" | "N";
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateFileGroupDto {
  refType: FileRefType;
}

export interface PatchFileDto {
  sortOrder?: number;
  isMainYn?: "Y" | "N";
}
