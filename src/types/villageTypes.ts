export interface VillageContent {
  id: string;
  section: string;
  title: string;
  body: string | null;
  image_url: string | null;
  sort_order: number;
  published: boolean;
  updated_at: Date;
}

export interface CreateVillageContentDto {
  section: string;
  title: string;
  body?: string;
  image_url?: string;
  sort_order?: number;
  published?: boolean;
}

export interface UpdateVillageContentDto {
  section?: string;
  title?: string;
  body?: string;
  image_url?: string;
  sort_order?: number;
  published?: boolean;
}
