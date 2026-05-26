import { FastifyRequest, FastifyReply } from "fastify";
import "@fastify/multipart";
import { FileRefType, PatchFileDto } from "../types/fileTypes";
import {
  createGroup,
  uploadFile,
  getFilesByGroup,
  patchFile,
  removeFileById,
} from "../services/fileService";
import { successResponse, errorResponse } from "../utils/response";

export const createFileGroupHandler = async (
  req: FastifyRequest<{ Body: { refType: FileRefType } }>,
  reply: FastifyReply,
) => {
  const user = req.user;
  const group = await createGroup(req.body.refType, user.id);
  return reply
    .code(201)
    .send(successResponse(group, "파일 그룹이 생성되었습니다"));
};

export const uploadFileHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    const data = await req.file();
    if (!data) return reply.code(400).send(errorResponse("파일이 없습니다"));

    const fileGroupIdField = data.fields.fileGroupId as any;
    const isMainYnField = data.fields.isMainYn as any;
    const sortOrderField = data.fields.sortOrder as any;

    if (!fileGroupIdField?.value) {
      return reply.code(400).send(errorResponse("fileGroupId가 필요합니다"));
    }

    const buffer = await data.toBuffer();
    const file = await uploadFile({
      fileGroupId: fileGroupIdField.value,
      buffer,
      originalName: data.filename,
      mimeType: data.mimetype,
      fileSize: buffer.length,
      isMainYn: isMainYnField?.value === "Y" ? "Y" : "N",
      sortOrder: Number(sortOrderField?.value ?? 0),
      userId: user.id,
    });
    return reply
      .code(201)
      .send(successResponse(file, "파일이 업로드되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "FILE_GROUP_NOT_FOUND")
      return reply
        .code(404)
        .send(errorResponse("파일 그룹을 찾을 수 없습니다"));
    throw err;
  }
};

export const getFilesHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const files = await getFilesByGroup(req.params.id);
  return reply.send(successResponse(files));
};

export const patchFileHandler = async (
  req: FastifyRequest<{ Params: { id: string }; Body: PatchFileDto }>,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    const file = await patchFile({
      id: req.params.id,
      sortOrder: req.body.sortOrder,
      isMainYn: req.body.isMainYn,
      userId: user.id,
    });
    return reply.send(successResponse(file, "파일이 수정되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "FILE_NOT_FOUND")
      return reply.code(404).send(errorResponse("파일을 찾을 수 없습니다"));
    throw err;
  }
};

export const deleteFileHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    await removeFileById(req.params.id, user.id);
    return reply.send(successResponse(null, "파일이 삭제되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "FILE_NOT_FOUND")
      return reply.code(404).send(errorResponse("파일을 찾을 수 없습니다"));
    throw err;
  }
};
