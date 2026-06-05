import { FastifyRequest, FastifyReply } from "fastify";
import { UpsertFarmerProfileDto } from "../types/farmerTypes";
import {
  getFarmers,
  getFarmerById,
  getMyProfile,
  upsertProfile,
  getFarmersForAdmin,
  approveFarmer,
  rejectFarmer,
} from "../services/farmerService";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "../utils/response";

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
