import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { FileRefType } from "../../types/fileTypes";
import {
  uploadRoot,
  toStoredRelativePath,
  toFileUrl,
  toUploadRootRelativePath,
} from "../../config/uploadConfig";

const ALLOWED_REF_TYPES: ReadonlySet<string> = new Set([
  "PRODUCT",
  "FARMER",
  "VILLAGE",
  "BOARD",
]);

const ALLOWED_EXT: ReadonlySet<string> = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
]);

export interface SavedFile {
  storedName: string;
  filePath: string;
  fileUrl: string;
}

export const saveFile = async (
  buffer: Buffer,
  originalName: string,
  refType: FileRefType,
): Promise<SavedFile> => {
  if (!ALLOWED_REF_TYPES.has(refType)) {
    throw new Error("INVALID_REF_TYPE");
  }

  const rawExt = path.extname(originalName).toLowerCase();
  const ext = ALLOWED_EXT.has(rawExt) ? rawExt : ".bin";
  const storedName = `${uuidv4()}${ext}`;
  const subDir = path.join(uploadRoot, refType.toLowerCase());

  try {
    await mkdir(subDir, { recursive: true });
    const absolutePath = path.join(subDir, storedName);
    await writeFile(absolutePath, buffer, { flag: "wx" });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOSPC") throw new Error("STORAGE_DISK_FULL");
    if (code === "EACCES" || code === "EROFS")
      throw new Error("STORAGE_PERMISSION_DENIED");
    throw new Error("STORAGE_WRITE_FAILED");
  }

  return {
    storedName,
    filePath: toStoredRelativePath(refType.toLowerCase(), storedName),
    fileUrl: toFileUrl(refType.toLowerCase(), storedName),
  };
};

export const removeFile = async (filePath: string): Promise<void> => {
  const absolutePath = path.resolve(
    uploadRoot,
    toUploadRootRelativePath(filePath),
  );
  if (!absolutePath.startsWith(uploadRoot + path.sep)) {
    throw new Error("INVALID_FILE_PATH");
  }
  try {
    await unlink(absolutePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
};
