import {
  query,
  queryOne,
  execute,
  withTransaction,
  clientQuery,
  clientExecute,
  clientQueryOne,
} from "../db/pool";
import { FileGroup, FileRecord } from "../types/fileTypes";
import { PoolClient } from "pg";

export const createFileGroup = (params: {
  refType: string;
  createdBy: string;
}): Promise<FileGroup | null> =>
  queryOne<FileGroup>("file", "createGroup", params);

export const findFileGroupById = (id: string): Promise<FileGroup | null> =>
  queryOne<FileGroup>("file", "findGroupById", { id });

export const createFile = (params: {
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
}): Promise<FileRecord | null> =>
  queryOne<FileRecord>("file", "createFile", params);

export const findFilesByGroupId = (
  fileGroupId: string,
): Promise<FileRecord[]> =>
  query<FileRecord>("file", "findFilesByGroupId", { fileGroupId });

export const findFileById = (id: string): Promise<FileRecord | null> =>
  queryOne<FileRecord>("file", "findFileById", { id });

export const promoteMainFile = (
  fileId: string,
  fileGroupId: string,
  updatedBy: string,
): Promise<FileRecord | null> =>
  withTransaction(async (client: PoolClient) => {
    await clientExecute(client, "file", "clearMainYn", { fileGroupId });
    return clientQueryOne<FileRecord>(client, "file", "updateFile", {
      id: fileId,
      isMainYn: "Y",
      updatedBy,
    });
  });

export const updateFile = (params: {
  id: string;
  sortOrder?: number;
  isMainYn?: string;
  updatedBy: string;
}): Promise<FileRecord | null> =>
  queryOne<FileRecord>("file", "updateFile", params);

export const softDeleteFile = (
  id: string,
  deletedBy: string,
): Promise<number> => execute("file", "deleteFile", { id, deletedBy });
