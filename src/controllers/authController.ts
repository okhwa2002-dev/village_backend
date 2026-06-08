import { FastifyRequest, FastifyReply } from "fastify";
import { RegisterDto, LoginDto, RefreshDto } from "../types/userTypes";
import authService from "../services/authService";
import { successResponse, errorResponse } from "../utils/response";

const registerHandler = async (
  req: FastifyRequest<{ Body: RegisterDto }>,
  reply: FastifyReply,
) => {
  try {
    const user = await authService.register(req.body);
    return reply
      .code(201)
      .send(successResponse(user, "회원가입이 완료되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "LOGIN_ID_EXISTS")
      return reply.code(409).send(errorResponse("이미 사용 중인 아이디입니다"));
    throw err;
  }
};

const loginHandler = async (
  req: FastifyRequest<{ Body: LoginDto }>,
  reply: FastifyReply,
) => {
  try {
    const result = await authService.login(req.body);
    return reply.send(successResponse(result, "로그인되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "INVALID_CREDENTIALS")
        return reply
          .code(401)
          .send(errorResponse("아이디 또는 비밀번호가 올바르지 않습니다"));
      if (err.message === "ACCOUNT_NOT_ACTIVE")
        return reply
          .code(403)
          .send(
            errorResponse(
              "승인 대기 중인 계정입니다. 관리자 승인 후 로그인하세요",
            ),
          );
    }
    throw err;
  }
};

const refreshHandler = async (
  req: FastifyRequest<{ Body: RefreshDto }>,
  reply: FastifyReply,
) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    return reply.send(successResponse(result, "토큰이 갱신되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (
        err.message === "INVALID_REFRESH_TOKEN" ||
        err.message === "REFRESH_TOKEN_EXPIRED"
      )
        return reply.code(401).send(errorResponse("유효하지 않은 토큰입니다"));
      if (err.message === "REFRESH_TOKEN_REUSE")
        return reply
          .code(401)
          .send(
            errorResponse("토큰이 탈취되었을 수 있습니다. 다시 로그인하세요"),
          );
      if (err.message === "ACCOUNT_NOT_ACTIVE")
        return reply.code(403).send(errorResponse("비활성 계정입니다"));
    }
    throw err;
  }
};

const meHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  return reply.send(successResponse(req.user, "사용자 정보 조회"));
};

const logoutHandler = async (
  req: FastifyRequest<{ Body: RefreshDto }>,
  reply: FastifyReply,
) => {
  await authService.logout(req.body.refreshToken);
  return reply.send(successResponse(null, "로그아웃되었습니다"));
};

export default {
  registerHandler,
  loginHandler,
  refreshHandler,
  meHandler,
  logoutHandler,
};
