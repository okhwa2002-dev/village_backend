import farmerRepo from "../repositories/farmerRepository";
import { UpsertFarmerProfileDto } from "../types/farmerTypes";

const getFarmers = () => farmerRepo.findAllFarmers();

const getFarmerById = async (id: string) => {
  const farmer = await farmerRepo.findFarmerById(id);
  if (!farmer) throw new Error("FARMER_NOT_FOUND");
  return farmer;
};

const getMyProfile = async (userId: string) => {
  const profile = await farmerRepo.findFarmerByUserId(userId);
  if (!profile) throw new Error("PROFILE_NOT_FOUND");
  return profile;
};

const upsertProfile = async (userId: string, dto: UpsertFarmerProfileDto) => {
  const existing = await farmerRepo.findFarmerByUserId(userId);
  const params = {
    userId,
    name: dto.name,
    bio: dto.bio,
    fileGroupId: dto.fileGroupId,
    farmDescription: dto.farmDescription,
  };
  return existing
    ? farmerRepo.updateFarmerProfile(params)
    : farmerRepo.createFarmerProfile(params);
};

const getFarmersForAdmin = (page: number, limit: number) =>
  farmerRepo.findAllFarmersForAdmin(page, limit);

const exportFarmers = () => farmerRepo.findAllFarmersForExport();

const approveFarmer = async (farmerId: string) => {
  const farmer = await farmerRepo.findFarmerById(farmerId);
  if (!farmer) throw new Error("FARMER_NOT_FOUND");
  await farmerRepo.updateFarmerUserStatus(farmer.userId, "ACTIVE");
};

const rejectFarmer = async (farmerId: string) => {
  const farmer = await farmerRepo.findFarmerById(farmerId);
  if (!farmer) throw new Error("FARMER_NOT_FOUND");
  await farmerRepo.updateFarmerUserStatus(farmer.userId, "INACTIVE");
};

export default {
  getFarmers,
  getFarmerById,
  getMyProfile,
  upsertProfile,
  getFarmersForAdmin,
  exportFarmers,
  approveFarmer,
  rejectFarmer,
};
