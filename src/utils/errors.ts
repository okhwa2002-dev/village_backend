import { FastifyReply } from "fastify";
import { errorResponse } from "./response";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  notFound: (message = "리소스를 찾을 수 없습니다.") =>
    new AppError(404, "NOT_FOUND", message),
  badRequest: (message = "잘못된 요청입니다.") =>
    new AppError(400, "BAD_REQUEST", message),
  conflict: (message = "이미 존재하는 리소스입니다.") =>
    new AppError(409, "CONFLICT", message),
  forbidden: (message = "접근 권한이 없습니다.") =>
    new AppError(403, "FORBIDDEN", message),
  unauthorized: (message = "인증이 필요합니다.") =>
    new AppError(401, "UNAUTHORIZED", message),
  internal: (message = "서버 오류가 발생했습니다.") =>
    new AppError(500, "INTERNAL_ERROR", message),
};

export const handleError = (err: unknown, reply: FastifyReply): void => {
  if (err instanceof AppError) {
    reply.code(err.statusCode).send(errorResponse(err.message));
    return;
  }
  throw err;
};
