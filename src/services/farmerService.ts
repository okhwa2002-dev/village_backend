import farmerRepo from "../repositories/farmerRepository";
import { UpsertFarmerProfileDto, FarmerProfile } from "../types/farmerTypes";
import { Errors } from "../utils/errors";
import { generateExcel } from "../utils/excel";

const farmerService = {
  getFarmers() {
    return farmerRepo.findAllFarmers();
  },

  async getFarmerById(id: string) {
    const farmer = await farmerRepo.findFarmerById(id);
    if (!farmer) throw Errors.notFound("농민을 찾을 수 없습니다");
    return farmer;
  },

  async getMyProfile(userId: string) {
    const profile = await farmerRepo.findFarmerByUserId(userId);
    if (!profile) throw Errors.notFound("농민 프로필이 없습니다");
    return profile;
  },

  async upsertProfile(userId: string, dto: UpsertFarmerProfileDto) {
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
  },

  getFarmersForAdmin(
    page: number,
    limit: number,
    filters: { keyword?: string | null; status?: string | null } = {},
  ) {
    return farmerRepo.findAllFarmersForAdmin(page, limit, filters);
  },

  async exportFarmerExcel(
    filters: { keyword?: string | null; status?: string | null } = {},
  ) {
    const farmers = await farmerRepo.findAllFarmersForExport(filters);
    if (farmers.length === 0)
      throw Errors.notFound("다운로드할 데이터가 없습니다");
    return generateExcel<FarmerProfile>({
      title: "농민 관리 목록",
      sheetName: "농민목록",
      columns: [
        { header: "이름", key: "name", width: 15 },
        { header: "이메일", key: "email", width: 25 },
        { header: "소개", key: "bio", width: 30 },
        { header: "농장소개", key: "farmDescription", width: 30 },
        { header: "상태", key: "status", width: 12 },
        { header: "가입일", key: "createdAt", width: 20 },
      ],
      data: farmers,
      rowMapper: (f) => ({
        name: f.name,
        email: f.email ?? "",
        bio: f.bio ?? "",
        farmDescription: f.farmDescription ?? "",
        status: f.status ?? "",
        createdAt: f.createdAt
          ? new Date(f.createdAt).toLocaleDateString("ko-KR")
          : "",
      }),
    });
  },

  async approveFarmer(farmerId: string) {
    const farmer = await farmerRepo.findFarmerById(farmerId);
    if (!farmer) throw Errors.notFound("농민을 찾을 수 없습니다");
    await farmerRepo.updateFarmerUserStatus(farmer.userId, "ACTIVE");
  },

  async rejectFarmer(farmerId: string) {
    const farmer = await farmerRepo.findFarmerById(farmerId);
    if (!farmer) throw Errors.notFound("농민을 찾을 수 없습니다");
    await farmerRepo.updateFarmerUserStatus(farmer.userId, "INACTIVE");
  },
};
export default farmerService;
