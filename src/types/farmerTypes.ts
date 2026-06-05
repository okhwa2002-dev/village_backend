export interface FarmerProfile {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  fileGroupId: string | null;
  farmDescription: string | null;
  email: string;
  status?: string;
  createdAt?: Date;
}

export interface UpsertFarmerProfileDto {
  name: string;
  bio?: string;
  fileGroupId?: string;
  farmDescription?: string;
}
