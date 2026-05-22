import { query, queryOne, execute } from "../db/pool";
import { VillageContent } from "../types/villageTypes";

export const findAllContents = (): Promise<VillageContent[]> =>
  query<VillageContent>("village", "findAll");

export const findContentsBySection = (
  section: string,
): Promise<VillageContent[]> =>
  query<VillageContent>("village", "findBySection", { section });

export const findAllContentsForAdmin = (): Promise<VillageContent[]> =>
  query<VillageContent>("village", "findAllForAdmin");

export const createContent = (params: {
  section: string;
  title: string;
  body?: string;
  imageUrl?: string;
  sortOrder: number;
  published: boolean;
}): Promise<VillageContent | null> =>
  queryOne<VillageContent>("village", "create", params);

export const updateContent = (params: {
  id: string;
  section?: string;
  title?: string;
  body?: string;
  imageUrl?: string;
  sortOrder?: number;
  published?: boolean;
}): Promise<VillageContent | null> =>
  queryOne<VillageContent>("village", "update", params);

export const deleteContent = (id: string): Promise<number> =>
  execute("village", "delete", { id });
