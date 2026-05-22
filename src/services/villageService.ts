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
    imageUrl: dto.image_url,
    sortOrder: dto.sort_order ?? 0,
    published: dto.published ?? false,
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
    imageUrl: dto.image_url,
    sortOrder: dto.sort_order,
    published: dto.published,
  });
  if (!content) throw new Error("CONTENT_NOT_FOUND");
  return content;
};

export const deleteVillageContent = async (id: string) => {
  const count = await deleteContent(id);
  if (count === 0) throw new Error("CONTENT_NOT_FOUND");
};
