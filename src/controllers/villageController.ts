import { FastifyRequest, FastifyReply } from "fastify";
import {
  CreateVillageContentDto,
  UpdateVillageContentDto,
} from "../types/villageTypes";
import villageService from "../services/villageService";
import {
  isMultipartRequest,
  parseMultipartWithFiles,
  toOptionalNumber,
} from "../utils/multipartParser";
import { successResponse, errorResponse } from "../utils/response";
import { handleError } from "../utils/errors";

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

const villageController = {
  async list(_req: FastifyRequest, reply: FastifyReply) {
    const contents = await villageService.getContents();
    return reply.send(successResponse(contents));
  },

  async listBySection(
    req: FastifyRequest<{ Params: { section: string } }>,
    reply: FastifyReply,
  ) {
    const contents = await villageService.getContentsBySection(
      req.params.section,
    );
    return reply.send(successResponse(contents));
  },

  async listAdmin(_req: FastifyRequest, reply: FastifyReply) {
    const contents = await villageService.getContentsForAdmin();
    return reply.send(successResponse(contents));
  },

  async create(
    req: FastifyRequest<{ Body: CreateVillageContentDto }>,
    reply: FastifyReply,
  ) {
    try {
      if (isMultipartRequest(req)) {
        const { fields, files } = await parseMultipartWithFiles(req);
        const dto = toVillageContentDto(fields);

        if (!dto.section || !dto.title) {
          return reply
            .code(400)
            .send(errorResponse("section과 title이 필요합니다"));
        }

        const content = await villageService.createVillageContentWithFiles(
          dto as CreateVillageContentDto,
          {
            files,
            mainIndex: toOptionalNumber(fields.mainIndex),
            sortStartOrder: toOptionalNumber(fields.sortStartOrder),
            userId: req.user.id,
          },
        );
        return reply
          .code(201)
          .send(successResponse(content, "콘텐츠가 추가되었습니다"));
      }

      const content = await villageService.createVillageContent(req.body);
      return reply
        .code(201)
        .send(successResponse(content, "콘텐츠가 추가되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async update(
    req: FastifyRequest<{
      Params: { id: string };
      Body: UpdateVillageContentDto;
    }>,
    reply: FastifyReply,
  ) {
    try {
      if (isMultipartRequest(req)) {
        const { fields, files } = await parseMultipartWithFiles(req);
        const content = await villageService.updateVillageContentWithFiles(
          req.params.id,
          toVillageContentDto(fields) as UpdateVillageContentDto,
          {
            files,
            mainIndex: toOptionalNumber(fields.mainIndex),
            sortStartOrder: toOptionalNumber(fields.sortStartOrder),
            userId: req.user.id,
          },
        );
        return reply.send(successResponse(content, "콘텐츠가 수정되었습니다"));
      }

      const content = await villageService.updateVillageContent(
        req.params.id,
        req.body,
      );
      return reply.send(successResponse(content, "콘텐츠가 수정되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async delete(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      await villageService.deleteVillageContent(req.params.id);
      return reply.send(successResponse(null, "콘텐츠가 삭제되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },
};
export default villageController;
