import {
  findAllContents,
  findContentsBySection,
  findAllContentsForAdmin,
  findContentById,
  createContent,
  updateContent,
  deleteContent,
} from "../repositories/villageRepository";
import { createGroup, getFilesByGroupMap, uploadFiles } from "./fileService";
import {
  CreateVillageContentDto,
  UpdateVillageContentDto,
  VillageContent,
} from "../types/villageTypes";

type UploadableFile = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  fileSize: number;
};

type VillageContentFileOptions = {
  files?: UploadableFile[];
  mainIndex?: number;
  sortStartOrder?: number;
  userId: string;
};

const attachFilesToContents = async <T extends VillageContent>(
  contents: T[],
) => {
  const fileGroupIds = contents
    .map((content) => content.fileGroupId)
    .filter((fileGroupId): fileGroupId is string => !!fileGroupId);
  const fileMap = await getFilesByGroupMap(fileGroupIds);

  return contents.map((content) => ({
    ...content,
    files: content.fileGroupId ? (fileMap.get(content.fileGroupId) ?? []) : [],
  }));
};

const attachFilesToContent = async <T extends VillageContent | null>(
  content: T,
) => {
  if (!content) return content;
  const [contentWithFiles] = await attachFilesToContents([content]);
  return contentWithFiles;
};

export const getContents = async () =>
  attachFilesToContents(await findAllContents());

export const getContentsBySection = async (section: string) =>
  attachFilesToContents(await findContentsBySection(section));

export const getContentsForAdmin = async () =>
  attachFilesToContents(await findAllContentsForAdmin());

export const createVillageContent = (dto: CreateVillageContentDto) =>
  createContent({
    section: dto.section,
    title: dto.title,
    body: dto.body,
    fileGroupId: dto.fileGroupId,
    sortOrder: dto.sortOrder ?? 0,
    publishedYn: dto.publishedYn ?? "N",
  }).then(attachFilesToContent);

export const createVillageContentWithFiles = async (
  dto: CreateVillageContentDto,
  options: VillageContentFileOptions,
) => {
  let fileGroupId = dto.fileGroupId;

  if (options.files?.length) {
    if (!fileGroupId) {
      const group = await createGroup("VILLAGE", options.userId);
      fileGroupId = group.id;
    }

    const uploaded = await uploadFiles({
      fileGroupId,
      files: options.files,
      mainIndex: options.mainIndex ?? 0,
      sortStartOrder: options.sortStartOrder ?? 0,
      userId: options.userId,
    });
  }

  const content = await createContent({
    section: dto.section,
    title: dto.title,
    body: dto.body,
    fileGroupId,
    sortOrder: dto.sortOrder ?? 0,
    publishedYn: dto.publishedYn ?? "N",
  });

  if (!content) throw new Error("CONTENT_CREATE_FAILED");
  return attachFilesToContent(content);
};

export const updateVillageContent = async (
  id: string,
  dto: UpdateVillageContentDto,
) => {
  const content = await updateContent({
    id,
    section: dto.section,
    title: dto.title,
    body: dto.body,
    fileGroupId: dto.fileGroupId,
    sortOrder: dto.sortOrder,
    publishedYn: dto.publishedYn,
  });
  if (!content) throw new Error("CONTENT_NOT_FOUND");
  return attachFilesToContent(content);
};

export const updateVillageContentWithFiles = async (
  id: string,
  dto: UpdateVillageContentDto,
  options: VillageContentFileOptions,
) => {
  const existing = await findContentById(id);
  if (!existing) throw new Error("CONTENT_NOT_FOUND");

  let fileGroupId = dto.fileGroupId ?? existing.fileGroupId ?? undefined;

  if (options.files?.length) {
    const hadFileGroup = !!fileGroupId;

    if (!fileGroupId) {
      const group = await createGroup("VILLAGE", options.userId);
      fileGroupId = group.id;
    }

    const uploaded = await uploadFiles({
      fileGroupId,
      files: options.files,
      mainIndex: options.mainIndex ?? (hadFileGroup ? undefined : 0),
      sortStartOrder: options.sortStartOrder ?? 0,
      userId: options.userId,
    });
  }

  const content = await updateContent({
    id,
    section: dto.section,
    title: dto.title,
    body: dto.body,
    fileGroupId,
    sortOrder: dto.sortOrder,
    publishedYn: dto.publishedYn,
  });
  if (!content) throw new Error("CONTENT_NOT_FOUND");

  return attachFilesToContent(content);
};

export const deleteVillageContent = async (id: string) => {
  const count = await deleteContent(id);
  if (count === 0) throw new Error("CONTENT_NOT_FOUND");
};
