import {
  query,
  queryOne,
  execute,
  withTransaction,
  clientExecute,
  clientQueryOne,
} from "../db/pool";
import { FileGroup, FileRecord } from "../types/fileTypes";
import { PoolClient } from "pg";

const toFileGroup = (row: any): FileGroup => ({
  id: row.id,
  refType: row.ref_type,
  createdAt: row.created_at,
  createdBy: row.created_by ?? null,
});

const toFileRecord = (row: any): FileRecord => ({
  id: row.id,
  fileGroupId: row.file_group_id,
  originalName: row.original_name,
  storedName: row.stored_name,
  filePath: row.file_path,
  fileUrl: row.file_url,
  mimeType: row.mime_type,
  fileSize: row.file_size,
  storageType: row.storage_type,
  sortOrder: row.sort_order,
  isMainYn: row.is_main_yn,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? null,
});

const fileRepo = {
  async createFileGroup(params: {
    refType: string;
    createdBy: string;
  }): Promise<FileGroup | null> {
    const row = await queryOne<any>("file", "createGroup", params);
    return row ? toFileGroup(row) : null;
  },

  async findFileGroupById(id: string): Promise<FileGroup | null> {
    const row = await queryOne<any>("file", "findGroupById", { id });
    return row ? toFileGroup(row) : null;
  },

  async createFile(params: {
    fileGroupId: string;
    originalName: string;
    storedName: string;
    filePath: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    storageType: string;
    sortOrder: number;
    isMainYn: string;
    createdBy: string;
  }): Promise<FileRecord | null> {
    const row = await queryOne<any>("file", "createFile", params);
    return row ? toFileRecord(row) : null;
  },

  async findFilesByGroupId(fileGroupId: string): Promise<FileRecord[]> {
    const rows = await query<any>("file", "findFilesByGroupId", {
      fileGroupId,
    });
    return rows.map(toFileRecord);
  },

  async findFileById(id: string): Promise<FileRecord | null> {
    const row = await queryOne<any>("file", "findFileById", { id });
    return row ? toFileRecord(row) : null;
  },

  clearMainYn(fileGroupId: string): Promise<number> {
    return execute("file", "clearMainYn", { fileGroupId });
  },

  promoteMainFile(
    fileId: string,
    fileGroupId: string,
    updatedBy: string,
  ): Promise<FileRecord | null> {
    return withTransaction(async (client: PoolClient) => {
      await clientExecute(client, "file", "clearMainYn", { fileGroupId });
      const row = await clientQueryOne<any>(client, "file", "updateFile", {
        id: fileId,
        isMainYn: "Y",
        updatedBy,
      });
      return row ? toFileRecord(row) : null;
    });
  },

  async updateFile(params: {
    id: string;
    sortOrder?: number;
    isMainYn?: string;
    updatedBy: string;
  }): Promise<FileRecord | null> {
    const row = await queryOne<any>("file", "updateFile", params);
    return row ? toFileRecord(row) : null;
  },

  softDeleteFile(id: string, deletedBy: string): Promise<number> {
    return execute("file", "deleteFile", { id, deletedBy });
  },
};
export default fileRepo;
