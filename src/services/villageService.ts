import villageRepo from "../repositories/villageRepository";
import fileService from "./fileService";
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
  const fileMap = await fileService.getFilesByGroupMap(fileGroupIds);

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

const getContents = async () =>
  attachFilesToContents(await villageRepo.findAllContents());

const getContentsBySection = async (section: string) =>
  attachFilesToContents(await villageRepo.findContentsBySection(section));

const getContentsForAdmin = async () =>
  attachFilesToContents(await villageRepo.findAllContentsForAdmin());

const createVillageContent = (dto: CreateVillageContentDto) =>
  villageRepo
    .createContent({
      section: dto.section,
      title: dto.title,
      body: dto.body,
      fileGroupId: dto.fileGroupId,
      sortOrder: dto.sortOrder ?? 0,
      publishedYn: dto.publishedYn ?? "N",
    })
    .then(attachFilesToContent);

const createVillageContentWithFiles = async (
  dto: CreateVillageContentDto,
  options: VillageContentFileOptions,
) => {
  let fileGroupId = dto.fileGroupId;

  if (options.files?.length) {
    if (!fileGroupId) {
      const group = await fileService.createGroup("VILLAGE", options.userId);
      fileGroupId = group.id;
    }

    await fileService.uploadFiles({
      fileGroupId,
      files: options.files,
      mainIndex: options.mainIndex ?? 0,
      sortStartOrder: options.sortStartOrder ?? 0,
      userId: options.userId,
    });
  }

  const content = await villageRepo.createContent({
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

const updateVillageContent = async (
  id: string,
  dto: UpdateVillageContentDto,
) => {
  const content = await villageRepo.updateContent({
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

const updateVillageContentWithFiles = async (
  id: string,
  dto: UpdateVillageContentDto,
  options: VillageContentFileOptions,
) => {
  const existing = await villageRepo.findContentById(id);
  if (!existing) throw new Error("CONTENT_NOT_FOUND");

  let fileGroupId = dto.fileGroupId ?? existing.fileGroupId ?? undefined;

  if (options.files?.length) {
    const hadFileGroup = !!fileGroupId;

    if (!fileGroupId) {
      const group = await fileService.createGroup("VILLAGE", options.userId);
      fileGroupId = group.id;
    }

    await fileService.uploadFiles({
      fileGroupId,
      files: options.files,
      mainIndex: options.mainIndex ?? (hadFileGroup ? undefined : 0),
      sortStartOrder: options.sortStartOrder ?? 0,
      userId: options.userId,
    });
  }

  const content = await villageRepo.updateContent({
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

const deleteVillageContent = async (id: string) => {
  const count = await villageRepo.deleteContent(id);
  if (count === 0) throw new Error("CONTENT_NOT_FOUND");
};

export default {
  getContents,
  getContentsBySection,
  getContentsForAdmin,
  createVillageContent,
  createVillageContentWithFiles,
  updateVillageContent,
  updateVillageContentWithFiles,
  deleteVillageContent,
};
