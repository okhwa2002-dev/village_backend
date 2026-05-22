import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateVillageContentDto,
  UpdateVillageContentDto,
} from "../types/villageTypes";
import {
  getContents,
  getContentsBySection,
  getContentsForAdmin,
  createVillageContent,
  updateVillageContent,
  deleteVillageContent,
} from "../services/villageService";
import { successResponse, errorResponse } from "../utils/response";

export const getContentsHandler = async (
  _req: FastifyRequest,
  reply: FastifyReply,
) => {
  const contents = await getContents();
  return reply.send(successResponse(contents));
};

export const getContentsBySectionHandler = async (
  req: FastifyRequest<{ Params: { section: string } }>,
  reply: FastifyReply,
) => {
  const contents = await getContentsBySection(req.params.section);
  return reply.send(successResponse(contents));
};

export const getContentsAdminHandler = async (
  _req: FastifyRequest,
  reply: FastifyReply,
) => {
  const contents = await getContentsForAdmin();
  return reply.send(successResponse(contents));
};

export const createContentHandler = async (
  req: FastifyRequest<{ Body: CreateVillageContentDto }>,
  reply: FastifyReply,
) => {
  const content = await createVillageContent(req.body);
  return reply
    .code(201)
    .send(successResponse(content, "콘텐츠가 추가되었습니다"));
};

export const updateContentHandler = async (
  req: FastifyRequest<{
    Params: { id: string };
    Body: UpdateVillageContentDto;
  }>,
  reply: FastifyReply,
) => {
  try {
    const content = await updateVillageContent(req.params.id, req.body);
    return reply.send(successResponse(content, "콘텐츠가 수정되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "CONTENT_NOT_FOUND")
      return reply.code(404).send(errorResponse("콘텐츠를 찾을 수 없습니다"));
    throw err;
  }
};

export const deleteContentHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  try {
    await deleteVillageContent(req.params.id);
    return reply.send(successResponse(null, "콘텐츠가 삭제되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "CONTENT_NOT_FOUND")
      return reply.code(404).send(errorResponse("콘텐츠를 찾을 수 없습니다"));
    throw err;
  }
};
