import {
  findAllFarmers,
  findFarmerById,
  findFarmerByUserId,
  createFarmerProfile,
  updateFarmerProfile,
  findAllFarmersForAdmin,
  updateFarmerUserStatus,
} from "../repositories/farmerRepository";
import { UpsertFarmerProfileDto } from "../types/farmerTypes";

export const getFarmers = () => findAllFarmers();

export const getFarmerById = async (id: string) => {
  const farmer = await findFarmerById(id);
  if (!farmer) throw new Error("FARMER_NOT_FOUND");
  return farmer;
};

export const getMyProfile = async (userId: string) => {
  const profile = await findFarmerByUserId(userId);
  if (!profile) throw new Error("PROFILE_NOT_FOUND");
  return profile;
};

export const upsertProfile = async (
  userId: string,
  dto: UpsertFarmerProfileDto,
) => {
  const existing = await findFarmerByUserId(userId);
  const params = {
    userId,
    name: dto.name,
    bio: dto.bio,
    photoUrl: dto.photo_url,
    farmDescription: dto.farm_description,
  };
  return existing ? updateFarmerProfile(params) : createFarmerProfile(params);
};

export const getFarmersForAdmin = () => findAllFarmersForAdmin();

export const approveFarmer = async (farmerId: string) => {
  const farmer = await findFarmerById(farmerId);
  if (!farmer) throw new Error("FARMER_NOT_FOUND");
  await updateFarmerUserStatus(farmer.user_id, "active");
};

export const rejectFarmer = async (farmerId: string) => {
  const farmer = await findFarmerById(farmerId);
  if (!farmer) throw new Error("FARMER_NOT_FOUND");
  await updateFarmerUserStatus(farmer.user_id, "inactive");
};
