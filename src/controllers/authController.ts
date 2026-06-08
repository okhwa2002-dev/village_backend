import { FastifyRequest, FastifyReply } from "fastify";
import { RegisterDto, LoginDto, RefreshDto } from "../types/userTypes";
import authService from "../services/authService";
import { successResponse } from "../utils/response";
import { handleError } from "../utils/errors";

const authController = {
  async register(
    req: FastifyRequest<{ Body: RegisterDto }>,
    reply: FastifyReply,
  ) {
    try {
      const user = await authService.register(req.body);
      return reply
        .code(201)
        .send(successResponse(user, "회원가입이 완료되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async login(req: FastifyRequest<{ Body: LoginDto }>, reply: FastifyReply) {
    try {
      const result = await authService.login(req.body);
      return reply.send(successResponse(result, "로그인되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async refresh(
    req: FastifyRequest<{ Body: RefreshDto }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      return reply.send(successResponse(result, "토큰이 갱신되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async me(req: FastifyRequest, reply: FastifyReply) {
    return reply.send(successResponse(req.user, "사용자 정보 조회"));
  },

  async logout(req: FastifyRequest<{ Body: RefreshDto }>, reply: FastifyReply) {
    await authService.logout(req.body.refreshToken);
    return reply.send(successResponse(null, "로그아웃되었습니다"));
  },
};
export default authController;
