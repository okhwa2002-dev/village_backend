import { FastifyRequest, FastifyReply } from "fastify";
import { FileRefType, PatchFileDto } from "../types/fileTypes";
import fileService from "../services/fileService";
import {
  parseMultipartWithFiles,
  toNumberOrDefault,
} from "../utils/multipartParser";
import { successResponse, errorResponse } from "../utils/response";

const createFileGroupHandler = async (
  req: FastifyRequest<{ Body: { refType: FileRefType } }>,
  reply: FastifyReply,
) => {
  const user = req.user;
  const group = await fileService.createGroup(req.body.refType, user.id);
  return reply
    .code(201)
    .send(successResponse(group, "파일 그룹이 생성되었습니다"));
};

const uploadFileHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = req.user;
    const { fields, files } = await parseMultipartWithFiles(req);

    if (!fields.fileGroupId) {
      return reply.code(400).send(errorResponse("fileGroupId가 필요합니다"));
    }

    if (files.length === 0) {
      return reply.code(400).send(errorResponse("파일이 없습니다"));
    }

    const mainIndex =
      fields.mainIndex !== undefined
        ? toNumberOrDefault(fields.mainIndex, -1)
        : fields.isMainYn === "Y" && files.length === 1
          ? 0
          : undefined;

    const result = await fileService.uploadFiles({
      fileGroupId: fields.fileGroupId,
      files,
      mainIndex,
      sortStartOrder: toNumberOrDefault(
        fields.sortStartOrder ?? fields.sortOrder,
        0,
      ),
      userId: user.id,
    });

    return reply
      .code(201)
      .send(successResponse(result, "파일이 업로드되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "FILE_GROUP_NOT_FOUND") {
      return reply
        .code(404)
        .send(errorResponse("파일 그룹을 찾을 수 없습니다"));
    }
    if (err instanceof Error && err.message === "INVALID_MAIN_INDEX") {
      return reply.code(400).send(errorResponse("mainIndex가 잘못되었습니다"));
    }
    if (err instanceof Error && err.message === "FILE_REQUIRED") {
      return reply.code(400).send(errorResponse("파일이 없습니다"));
    }
    throw err;
  }
};

const getFilesHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const files = await fileService.getFilesByGroup(req.params.id);
  return reply.send(successResponse(files));
};

const patchFileHandler = async (
  req: FastifyRequest<{ Params: { id: string }; Body: PatchFileDto }>,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    const file = await fileService.patchFile({
      id: req.params.id,
      sortOrder: req.body.sortOrder,
      isMainYn: req.body.isMainYn,
      userId: user.id,
    });
    return reply.send(successResponse(file, "파일이 수정되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "FILE_NOT_FOUND") {
      return reply.code(404).send(errorResponse("파일을 찾을 수 없습니다"));
    }
    throw err;
  }
};

const deleteFileHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    await fileService.removeFileById(req.params.id, user.id);
    return reply.send(successResponse(null, "파일이 삭제되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "FILE_NOT_FOUND") {
      return reply.code(404).send(errorResponse("파일을 찾을 수 없습니다"));
    }
    throw err;
  }
};

export default {
  createFileGroupHandler,
  uploadFileHandler,
  getFilesHandler,
  patchFileHandler,
  deleteFileHandler,
};
