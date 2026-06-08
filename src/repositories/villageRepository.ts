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

const villageRepo = {
  async findAllContents(): Promise<VillageContent[]> {
    const rows = await query<any>("village", "findAll");
    return rows.map(toVillageContent);
  },

  async findContentsBySection(section: string): Promise<VillageContent[]> {
    const rows = await query<any>("village", "findBySection", { section });
    return rows.map(toVillageContent);
  },

  async findAllContentsForAdmin(): Promise<VillageContent[]> {
    const rows = await query<any>("village", "findAllForAdmin");
    return rows.map(toVillageContent);
  },

  async findContentById(id: string): Promise<VillageContent | null> {
    const row = await queryOne<any>("village", "findById", { id });
    return row ? toVillageContent(row) : null;
  },

  async createContent(params: {
    section: string;
    title: string;
    body?: string;
    fileGroupId?: string;
    sortOrder: number;
    publishedYn: string;
  }): Promise<VillageContent | null> {
    const row = await queryOne<any>("village", "create", params);
    return row ? toVillageContent(row) : null;
  },

  async updateContent(params: {
    id: string;
    section?: string;
    title?: string;
    body?: string;
    fileGroupId?: string;
    sortOrder?: number;
    publishedYn?: string;
  }): Promise<VillageContent | null> {
    const row = await queryOne<any>("village", "update", params);
    return row ? toVillageContent(row) : null;
  },

  deleteContent(id: string): Promise<number> {
    return execute("village", "delete", { id });
  },
};
export default villageRepo;
