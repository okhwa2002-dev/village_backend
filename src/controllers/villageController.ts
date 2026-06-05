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
  createVillageContentWithFiles,
  updateVillageContent,
  updateVillageContentWithFiles,
  deleteVillageContent,
} from "../services/villageService";
import {
  isMultipartRequest,
  parseMultipartWithFiles,
  toOptionalNumber,
} from "../utils/multipartParser";
import { successResponse, errorResponse } from "../utils/response";

const toVillageContentDto = (
  fields: Record<string, string>,
): CreateVillageContentDto | UpdateVillageContentDto => ({
  section: fields.section,
  title: fields.title,
  body: fields.body,
  fileGroupId: fields.fileGroupId,
  sortOrder: toOptionalNumber(fields.sortOrder ?? fields.sort_order),
  publishedYn: fields.publishedYn,
});

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
  try {
    if (isMultipartRequest(req)) {
      const user = req.user;
      const { fields, files } = await parseMultipartWithFiles(req);
      const dto = toVillageContentDto(fields);

      if (!dto.section || !dto.title) {
        return reply
          .code(400)
          .send(errorResponse("section과 title이 필요합니다"));
      }

      const content = await createVillageContentWithFiles(
        dto as CreateVillageContentDto,
        {
          files,
          mainIndex: toOptionalNumber(fields.mainIndex),
          sortStartOrder: toOptionalNumber(fields.sortStartOrder),
          userId: user.id,
        },
      );

      return reply
        .code(201)
        .send(successResponse(content, "콘텐츠가 추가되었습니다"));
    }

    const content = await createVillageContent(req.body);
    return reply
      .code(201)
      .send(successResponse(content, "콘텐츠가 추가되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "FILE_GROUP_NOT_FOUND") {
      return reply.code(404).send(errorResponse("파일 그룹을 찾을 수 없습니다"));
    }
    if (err instanceof Error && err.message === "INVALID_MAIN_INDEX") {
      return reply.code(400).send(errorResponse("mainIndex가 잘못되었습니다"));
    }
    throw err;
  }
};

export const updateContentHandler = async (
  req: FastifyRequest<{
    Params: { id: string };
    Body: UpdateVillageContentDto;
  }>,
  reply: FastifyReply,
) => {
  try {
    if (isMultipartRequest(req)) {
      const user = req.user;
      const { fields, files } = await parseMultipartWithFiles(req);

      const content = await updateVillageContentWithFiles(
        req.params.id,
        toVillageContentDto(fields) as UpdateVillageContentDto,
        {
          files,
          mainIndex: toOptionalNumber(fields.mainIndex),
          sortStartOrder: toOptionalNumber(fields.sortStartOrder),
          userId: user.id,
        },
      );

      return reply.send(successResponse(content, "콘텐츠가 수정되었습니다"));
    }

    const content = await updateVillageContent(req.params.id, req.body);
    return reply.send(successResponse(content, "콘텐츠가 수정되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "CONTENT_NOT_FOUND") {
      return reply.code(404).send(errorResponse("콘텐츠를 찾을 수 없습니다"));
    }
    if (err instanceof Error && err.message === "FILE_GROUP_NOT_FOUND") {
      return reply.code(404).send(errorResponse("파일 그룹을 찾을 수 없습니다"));
    }
    if (err instanceof Error && err.message === "INVALID_MAIN_INDEX") {
      return reply.code(400).send(errorResponse("mainIndex가 잘못되었습니다"));
    }
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
    if (err instanceof Error && err.message === "CONTENT_NOT_FOUND") {
      return reply.code(404).send(errorResponse("콘텐츠를 찾을 수 없습니다"));
    }
    throw err;
  }
};
