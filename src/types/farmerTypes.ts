export interface FarmerProfile {
  id: string;
  user_id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  farm_description: string | null;
  email: string;
  status?: string;
  created_at?: Date;
}

export interface UpsertFarmerProfileDto {
  name: string;
  bio?: string;
  photo_url?: string;
  farm_description?: string;
}
