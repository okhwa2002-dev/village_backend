import { FastifyRequest, FastifyReply } from "fastify";
import { UpsertFarmerProfileDto, FarmerProfile } from "../types/farmerTypes";
import {
  getFarmers,
  getFarmerById,
  getMyProfile,
  upsertProfile,
  getFarmersForAdmin,
  exportFarmers,
  approveFarmer,
  rejectFarmer,
} from "../services/farmerService";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "../utils/response";
import { generateExcel } from "../utils/excel";

export const getFarmersHandler = async (
  _req: FastifyRequest,
  reply: FastifyReply,
) => {
  const farmers = await getFarmers();
  return reply.send(successResponse(farmers));
};

export const getFarmerHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  try {
    const farmer = await getFarmerById(req.params.id);
    return reply.send(successResponse(farmer));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "FARMER_NOT_FOUND")
      return reply.code(404).send(errorResponse("농민을 찾을 수 없습니다"));
    throw err;
  }
};

export const getMyProfileHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    const profile = await getMyProfile(user.id);
    return reply.send(successResponse(profile));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "PROFILE_NOT_FOUND")
      return reply.code(404).send(errorResponse("프로필이 없습니다"));
    throw err;
  }
};

export const upsertProfileHandler = async (
  req: FastifyRequest<{ Body: UpsertFarmerProfileDto }>,
  reply: FastifyReply,
) => {
  const user = req.user;
  const profile = await upsertProfile(user.id, req.body);
  return reply.send(successResponse(profile, "프로필이 저장되었습니다"));
};

export const getFarmersAdminHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const qs = req.query as { page?: string; limit?: string };
  const page = Math.max(1, Number(qs.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(qs.limit) || 20));
  const result = await getFarmersForAdmin(page, limit);
  return reply.send(paginatedResponse(result));
};

export const exportFarmersHandler = async (
  _req: FastifyRequest,
  reply: FastifyReply,
) => {
  const farmers = await exportFarmers();
  const buffer = await generateExcel<FarmerProfile>({
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

  reply
    .header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    .header(
      "Content-Disposition",
      `attachment; filename="farmers_${Date.now()}.xlsx"`,
    )
    .send(buffer);
};

export const approveFarmerHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  try {
    await approveFarmer(req.params.id);
    return reply.send(successResponse(null, "농민이 승인되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "FARMER_NOT_FOUND")
      return reply.code(404).send(errorResponse("농민을 찾을 수 없습니다"));
    throw err;
  }
};

export const rejectFarmerHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  try {
    await rejectFarmer(req.params.id);
    return reply.send(successResponse(null, "농민이 거절되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "FARMER_NOT_FOUND")
      return reply.code(404).send(errorResponse("농민을 찾을 수 없습니다"));
    throw err;
  }
};
