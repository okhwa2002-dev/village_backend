import { FastifyRequest, FastifyReply } from "fastify";
import { RegisterDto, LoginDto } from "../types/userTypes";
import { register, login, logout } from "../services/authService";
import { successResponse, errorResponse } from "../utils/response";

export const registerHandler = async (
  req: FastifyRequest<{ Body: RegisterDto }>,
  reply: FastifyReply,
) => {
  try {
    const user = await register(req.body);
    return reply
      .code(201)
      .send(successResponse(user, "회원가입이 완료되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "LOGIN_ID_EXISTS")
      return reply.code(409).send(errorResponse("이미 사용 중인 아이디입니다"));
    throw err;
  }
};

export const loginHandler = async (
  req: FastifyRequest<{ Body: LoginDto }>,
  reply: FastifyReply,
) => {
  try {
    const result = await login(req.body);
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

export const logoutHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    await logout(token);
  }
  return reply.send(successResponse(null, "로그아웃되었습니다"));
};
