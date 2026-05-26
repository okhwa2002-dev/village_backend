// src/types/fileTypes.ts
export type StorageType = "LOCAL" | "S3";
export type FileRefType = "PRODUCT" | "FARMER" | "VILLAGE" | "BOARD";

export interface FileGroup {
  id: string;
  ref_type: FileRefType;
  created_at: Date;
  created_by: string | null;
}

export interface FileRecord {
  id: string;
  file_group_id: string;
  original_name: string;
  stored_name: string;
  file_path: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  storage_type: StorageType;
  sort_order: number;
  is_main_yn: "Y" | "N";
  created_at: Date;
  updated_at: Date | null;
}

export interface CreateFileGroupDto {
  refType: FileRefType;
}

export interface PatchFileDto {
  sortOrder?: number;
  isMainYn?: "Y" | "N";
}
