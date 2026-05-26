import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export interface SavedFile {
  storedName: string;
  filePath: string;
  fileUrl: string;
}

export const saveFile = async (
  buffer: Buffer,
  originalName: string,
  refType: string,
): Promise<SavedFile> => {
  const ext = path.extname(originalName) || ".bin";
  const storedName = `${uuidv4()}${ext}`;
  const subDir = path.join(UPLOAD_DIR, refType.toLowerCase());

  if (!fs.existsSync(subDir)) {
    fs.mkdirSync(subDir, { recursive: true });
  }

  const absolutePath = path.join(subDir, storedName);
  fs.writeFileSync(absolutePath, buffer);

  return {
    storedName,
    filePath: `uploads/${refType.toLowerCase()}/${storedName}`,
    fileUrl: `/files/${refType.toLowerCase()}/${storedName}`,
  };
};

export const removeFile = (filePath: string): void => {
  const absolutePath = path.join(process.cwd(), filePath);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};
