import { query, queryOne, execute } from "../db/pool";
import { FarmerProfile } from "../types/farmerTypes";

export const findAllFarmers = (): Promise<FarmerProfile[]> =>
  query<FarmerProfile>("farmer", "findAll");

export const findFarmerById = (id: string): Promise<FarmerProfile | null> =>
  queryOne<FarmerProfile>("farmer", "findById", { id });

export const findFarmerByUserId = (
  userId: string,
): Promise<FarmerProfile | null> =>
  queryOne<FarmerProfile>("farmer", "findByUserId", { userId });

export const createFarmerProfile = (params: {
  userId: string;
  name: string;
  bio?: string;
  photoUrl?: string;
  farmDescription?: string;
}): Promise<FarmerProfile | null> =>
  queryOne<FarmerProfile>("farmer", "create", params);

export const updateFarmerProfile = (params: {
  userId: string;
  name?: string;
  bio?: string;
  photoUrl?: string;
  farmDescription?: string;
}): Promise<FarmerProfile | null> =>
  queryOne<FarmerProfile>("farmer", "update", params);

export const findAllFarmersForAdmin = (): Promise<FarmerProfile[]> =>
  query<FarmerProfile>("farmer", "findAllForAdmin");

export const updateFarmerUserStatus = (
  userId: string,
  status: string,
): Promise<number> => execute("farmer", "updateUserStatus", { userId, status });
