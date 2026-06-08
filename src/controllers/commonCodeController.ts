import { FastifyReply, FastifyRequest } from "fastify";
import {
  CreateCodeDto,
  CreateGroupDto,
  UpdateCodeDto,
  UpdateGroupDto,
} from "../types/commonCodeTypes";
import {
  addCode,
  addGroup,
  editCode,
  editGroup,
  getCodes,
  getGroups,
  removeCode,
  removeGroup,
} from "../services/commonCodeService";
import { errorResponse, successResponse } from "../utils/response";

const getGroupsHandler = async (_req: FastifyRequest, reply: FastifyReply) => {
  const groups = await getGroups();
  return reply.send(successResponse(groups, "코드 그룹 목록"));
};

const createGroupHandler = async (
  req: FastifyRequest<{ Body: CreateGroupDto }>,
  reply: FastifyReply,
) => {
  const group = await addGroup(req.body);
  return reply.code(201).send(successResponse(group, "코드 그룹 생성"));
};

const updateGroupHandler = async (
  req: FastifyRequest<{ Params: { id: string }; Body: UpdateGroupDto }>,
  reply: FastifyReply,
) => {
  const group = await editGroup(req.params.id, req.body);
  if (!group)
    return reply.code(404).send(errorResponse("코드 그룹을 찾을 수 없습니다"));
  return reply.send(successResponse(group, "코드 그룹 수정"));
};

const deleteGroupHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  await removeGroup(req.params.id);
  return reply.send(successResponse(null, "코드 그룹 삭제"));
};

const getCodesHandler = async (
  req: FastifyRequest<{ Params: { groupId: string } }>,
  reply: FastifyReply,
) => {
  const codes = await getCodes(req.params.groupId);
  return reply.send(successResponse(codes, "코드 목록"));
};

const createCodeHandler = async (
  req: FastifyRequest<{ Params: { groupId: string }; Body: CreateCodeDto }>,
  reply: FastifyReply,
) => {
  const code = await addCode(req.params.groupId, req.body);
  return reply.code(201).send(successResponse(code, "코드 생성"));
};

const updateCodeHandler = async (
  req: FastifyRequest<{ Params: { id: string }; Body: UpdateCodeDto }>,
  reply: FastifyReply,
) => {
  const code = await editCode(req.params.id, req.body);
  if (!code)
    return reply.code(404).send(errorResponse("코드를 찾을 수 없습니다"));
  return reply.send(successResponse(code, "코드 수정"));
};

const deleteCodeHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  await removeCode(req.params.id);
  return reply.send(successResponse(null, "코드 삭제"));
};

export default {
  getGroupsHandler,
  createGroupHandler,
  updateGroupHandler,
  deleteGroupHandler,
  getCodesHandler,
  createCodeHandler,
  updateCodeHandler,
  deleteCodeHandler,
};
