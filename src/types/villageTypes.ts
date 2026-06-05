export interface VillageContent {
  id: string;
  section: string;
  title: string;
  body: string | null;
  fileGroupId: string | null;
  imageUrl: string | null;
  sortOrder: number;
  publishedYn: string;
  updatedAt: Date;
}

export interface CreateVillageContentDto {
  section: string;
  title: string;
  body?: string;
  fileGroupId?: string;
  sortOrder?: number;
  publishedYn?: string;
}

export interface UpdateVillageContentDto {
  section?: string;
  title?: string;
  body?: string;
  fileGroupId?: string;
  sortOrder?: number;
  publishedYn?: string;
}
