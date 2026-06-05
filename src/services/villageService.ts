import {
  findAllContents,
  findContentsBySection,
  findAllContentsForAdmin,
  createContent,
  updateContent,
  deleteContent,
} from "../repositories/villageRepository";
import {
  CreateVillageContentDto,
  UpdateVillageContentDto,
} from "../types/villageTypes";

export const getContents = () => findAllContents();

export const getContentsBySection = (section: string) =>
  findContentsBySection(section);

export const getContentsForAdmin = () => findAllContentsForAdmin();

export const createVillageContent = (dto: CreateVillageContentDto) =>
  createContent({
    section: dto.section,
    title: dto.title,
    body: dto.body,
    fileGroupId: dto.fileGroupId,
    sortOrder: dto.sortOrder ?? 0,
    publishedYn: dto.publishedYn ?? "N",
  });

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
  return content;
};

export const deleteVillageContent = async (id: string) => {
  const count = await deleteContent(id);
  if (count === 0) throw new Error("CONTENT_NOT_FOUND");
};
