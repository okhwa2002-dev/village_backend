import { FastifyRequest, FastifyReply } from "fastify";
import { UpsertFarmerProfileDto } from "../types/farmerTypes";
import farmerService from "../services/farmerService";
import { successResponse, paginatedResponse } from "../utils/response";
import { handleError } from "../utils/errors";
import { sendExcelReply } from "../utils/excel";

const farmerController = {
  async list(_req: FastifyRequest, reply: FastifyReply) {
    const farmers = await farmerService.getFarmers();
    return reply.send(successResponse(farmers));
  },

  async getById(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const farmer = await farmerService.getFarmerById(req.params.id);
      return reply.send(successResponse(farmer));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async getMyProfile(req: FastifyRequest, reply: FastifyReply) {
    try {
      const profile = await farmerService.getMyProfile(req.user.id);
      return reply.send(successResponse(profile));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async upsertProfile(
    req: FastifyRequest<{ Body: UpsertFarmerProfileDto }>,
    reply: FastifyReply,
  ) {
    const profile = await farmerService.upsertProfile(req.user.id, req.body);
    return reply.send(successResponse(profile, "프로필이 저장되었습니다"));
  },

  async listAdmin(req: FastifyRequest, reply: FastifyReply) {
    const qs = req.query as {
      page?: string;
      limit?: string;
      keyword?: string;
      status?: string;
    };
    const page = Math.max(1, Number(qs.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(qs.limit) || 20));
    const filters = { keyword: qs.keyword ?? null, status: qs.status ?? null };
    const result = await farmerService.getFarmersForAdmin(page, limit, filters);
    return reply.send(paginatedResponse(result));
  },

  async exportExcel(req: FastifyRequest, reply: FastifyReply) {
    try {
      const qs = req.query as { keyword?: string; status?: string };
      const filters = {
        keyword: qs.keyword ?? null,
        status: qs.status ?? null,
      };
      const { buffer, filename } =
        await farmerService.exportFarmerExcel(filters);
      sendExcelReply(reply, buffer, filename);
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async approve(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      await farmerService.approveFarmer(req.params.id);
      return reply.send(successResponse(null, "농민이 승인되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async reject(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      await farmerService.rejectFarmer(req.params.id);
      return reply.send(successResponse(null, "농민이 거절되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },
};
export default farmerController;
