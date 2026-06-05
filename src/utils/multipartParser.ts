import { FastifyRequest } from "fastify";
import "@fastify/multipart";

export type MultipartFieldMap = Record<string, string>;

export type UploadedMultipartFile = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  fileSize: number;
};

export type ParsedMultipartWithFiles = {
  fields: MultipartFieldMap;
  files: UploadedMultipartFile[];
};

export const isMultipartRequest = (req: FastifyRequest) =>
  req.headers["content-type"]?.includes("multipart/form-data") ?? false;

export const toOptionalNumber = (value: string | undefined) => {
  if (value === undefined || value === "") return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const toNumberOrDefault = (
  value: string | undefined,
  defaultValue: number,
) => toOptionalNumber(value) ?? defaultValue;

export const parseMultipartWithFiles = async (
  req: FastifyRequest,
  allowedFileFields: ReadonlySet<string> = new Set(["file", "files"]),
): Promise<ParsedMultipartWithFiles> => {
  const fields: MultipartFieldMap = {};
  const files: UploadedMultipartFile[] = [];

  for await (const part of req.parts()) {
    if (part.type === "file") {
      if (!allowedFileFields.has(part.fieldname)) {
        continue;
      }

      const buffer = await part.toBuffer();
      files.push({
        buffer,
        originalName: part.filename,
        mimeType: part.mimetype,
        fileSize: buffer.length,
      });
      continue;
    }

    fields[part.fieldname] = String(part.value ?? "");
  }

  return { fields, files };
};
