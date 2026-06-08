import { query, queryOne, execute } from "../db/pool";
import { VillageContent } from "../types/villageTypes";

const toVillageContent = (row: any): VillageContent => ({
  id: row.id,
  section: row.section,
  title: row.title,
  body: row.body ?? null,
  fileGroupId: row.file_group_id ?? null,
  imageUrl: row.image_url ?? null,
  sortOrder: row.sort_order,
  publishedYn: row.published_yn,
  updatedAt: row.updated_at,
  files: [],
});

const findAllContents = async (): Promise<VillageContent[]> => {
  const rows = await query<any>("village", "findAll");
  return rows.map(toVillageContent);
};

const findContentsBySection = async (
  section: string,
): Promise<VillageContent[]> => {
  const rows = await query<any>("village", "findBySection", { section });
  return rows.map(toVillageContent);
};

const findAllContentsForAdmin = async (): Promise<VillageContent[]> => {
  const rows = await query<any>("village", "findAllForAdmin");
  return rows.map(toVillageContent);
};

const findContentById = async (id: string): Promise<VillageContent | null> => {
  const row = await queryOne<any>("village", "findById", { id });
  return row ? toVillageContent(row) : null;
};

const createContent = async (params: {
  section: string;
  title: string;
  body?: string;
  fileGroupId?: string;
  sortOrder: number;
  publishedYn: string;
}): Promise<VillageContent | null> => {
  const row = await queryOne<any>("village", "create", params);
  return row ? toVillageContent(row) : null;
};

const updateContent = async (params: {
  id: string;
  section?: string;
  title?: string;
  body?: string;
  fileGroupId?: string;
  sortOrder?: number;
  publishedYn?: string;
}): Promise<VillageContent | null> => {
  const row = await queryOne<any>("village", "update", params);
  return row ? toVillageContent(row) : null;
};

const deleteContent = (id: string): Promise<number> =>
  execute("village", "delete", { id });

export default {
  findAllContents,
  findContentsBySection,
  findAllContentsForAdmin,
  findContentById,
  createContent,
  updateContent,
  deleteContent,
};
