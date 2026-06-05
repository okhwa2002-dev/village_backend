import path from "path";

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

const normalizePrefix = (value: string) => {
  const trimmed = trimSlashes(value);
  return trimmed ? `/${trimmed}/` : "/";
};

export const uploadRoot = path.resolve(
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"),
);

export const uploadPathPrefix = trimSlashes(
  process.env.UPLOAD_PATH_PREFIX ?? "uploads",
);

export const fileUrlPrefix = normalizePrefix(
  process.env.FILE_URL_PREFIX ?? "/files",
);

export const multipartFileSizeLimit = Number(
  process.env.MULTIPART_FILE_SIZE_LIMIT_BYTES ?? 10 * 1024 * 1024,
);

export const multipartFilesLimit = Number(
  process.env.MULTIPART_FILES_LIMIT ?? 10,
);

export const toStoredRelativePath = (...segments: string[]) =>
  [uploadPathPrefix, ...segments].filter(Boolean).join("/");

export const toFileUrl = (...segments: string[]) =>
  `${fileUrlPrefix}${segments.map(trimSlashes).filter(Boolean).join("/")}`;

export const toUploadRootRelativePath = (filePath: string) => {
  const normalized = filePath.replace(/\\/g, "/");
  const prefix = uploadPathPrefix ? `${uploadPathPrefix}/` : "";

  return prefix && normalized.startsWith(prefix)
    ? normalized.slice(prefix.length)
    : normalized;
};
