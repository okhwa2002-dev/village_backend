import villageRepo from "../repositories/villageRepository";
import fileService from "./fileService";
import {
  CreateVillageContentDto,
  UpdateVillageContentDto,
  VillageContent,
} from "../types/villageTypes";
import { Errors } from "../utils/errors";

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

const villageService = {
  async getContents() {
    return attachFilesToContents(await villageRepo.findAllContents());
  },

  async getContentsBySection(section: string) {
    return attachFilesToContents(
      await villageRepo.findContentsBySection(section),
    );
  },

  async getContentsForAdmin() {
    return attachFilesToContents(await villageRepo.findAllContentsForAdmin());
  },

  createVillageContent(dto: CreateVillageContentDto) {
    return villageRepo
      .createContent({
        section: dto.section,
        title: dto.title,
        body: dto.body,
        fileGroupId: dto.fileGroupId,
        sortOrder: dto.sortOrder ?? 0,
        publishedYn: dto.publishedYn ?? "N",
      })
      .then(attachFilesToContent);
  },

  async createVillageContentWithFiles(
    dto: CreateVillageContentDto,
    options: VillageContentFileOptions,
  ) {
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

    if (!content) throw Errors.internal("콘텐츠 생성에 실패했습니다");
    return attachFilesToContent(content);
  },

  async updateVillageContent(id: string, dto: UpdateVillageContentDto) {
    const content = await villageRepo.updateContent({
      id,
      section: dto.section,
      title: dto.title,
      body: dto.body,
      fileGroupId: dto.fileGroupId,
      sortOrder: dto.sortOrder,
      publishedYn: dto.publishedYn,
    });
    if (!content) throw Errors.notFound("콘텐츠를 찾을 수 없습니다");
    return attachFilesToContent(content);
  },

  async updateVillageContentWithFiles(
    id: string,
    dto: UpdateVillageContentDto,
    options: VillageContentFileOptions,
  ) {
    const existing = await villageRepo.findContentById(id);
    if (!existing) throw Errors.notFound("콘텐츠를 찾을 수 없습니다");

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
    if (!content) throw Errors.notFound("콘텐츠를 찾을 수 없습니다");

    return attachFilesToContent(content);
  },

  async deleteVillageContent(id: string) {
    const count = await villageRepo.deleteContent(id);
    if (count === 0) throw Errors.notFound("콘텐츠를 찾을 수 없습니다");
  },
};
export default villageService;
