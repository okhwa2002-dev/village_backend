import { FastifyReply, FastifyRequest } from "fastify";
import {
  CreateCodeDto,
  CreateGroupDto,
  UpdateCodeDto,
  UpdateGroupDto,
} from "../types/commonCodeTypes";
import commonCodeService from "../services/commonCodeService";
import { errorResponse, successResponse } from "../utils/response";

const commonCodeController = {
  async listGroups(_req: FastifyRequest, reply: FastifyReply) {
    const groups = await commonCodeService.getGroups();
    return reply.send(successResponse(groups, "코드 그룹 목록"));
  },

  async createGroup(
    req: FastifyRequest<{ Body: CreateGroupDto }>,
    reply: FastifyReply,
  ) {
    const group = await commonCodeService.addGroup(req.body);
    return reply.code(201).send(successResponse(group, "코드 그룹 생성"));
  },

  async updateGroup(
    req: FastifyRequest<{ Params: { id: string }; Body: UpdateGroupDto }>,
    reply: FastifyReply,
  ) {
    const group = await commonCodeService.editGroup(req.params.id, req.body);
    if (!group)
      return reply
        .code(404)
        .send(errorResponse("코드 그룹을 찾을 수 없습니다"));
    return reply.send(successResponse(group, "코드 그룹 수정"));
  },

  async deleteGroup(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    await commonCodeService.removeGroup(req.params.id);
    return reply.send(successResponse(null, "코드 그룹 삭제"));
  },

  async listCodes(
    req: FastifyRequest<{ Params: { groupId: string } }>,
    reply: FastifyReply,
  ) {
    const codes = await commonCodeService.getCodes(req.params.groupId);
    return reply.send(successResponse(codes, "코드 목록"));
  },

  async createCode(
    req: FastifyRequest<{ Params: { groupId: string }; Body: CreateCodeDto }>,
    reply: FastifyReply,
  ) {
    const code = await commonCodeService.addCode(req.params.groupId, req.body);
    return reply.code(201).send(successResponse(code, "코드 생성"));
  },

  async updateCode(
    req: FastifyRequest<{ Params: { id: string }; Body: UpdateCodeDto }>,
    reply: FastifyReply,
  ) {
    const code = await commonCodeService.editCode(req.params.id, req.body);
    if (!code)
      return reply.code(404).send(errorResponse("코드를 찾을 수 없습니다"));
    return reply.send(successResponse(code, "코드 수정"));
  },

  async deleteCode(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    await commonCodeService.removeCode(req.params.id);
    return reply.send(successResponse(null, "코드 삭제"));
  },
};
export default commonCodeController;
