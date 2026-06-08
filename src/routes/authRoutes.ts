import { FastifyInstance } from "fastify";
import authController from "../controllers/authController";
import { authenticate } from "../plugins/authenticate";
import { RegisterDto, LoginDto, RefreshDto } from "../types/userTypes";

const authRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: RegisterDto }>(
    "/auth/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "회원가입",
        body: {
          type: "object",
          required: ["loginId", "password", "role"],
          properties: {
            loginId: { type: "string" },
            password: { type: "string", minLength: 6 },
            role: { type: "string", enum: ["FARMER", "CONSUMER"] },
            name: { type: "string" },
            phone: { type: "string" },
            email: { type: "string", format: "email" },
          },
        },
      },
    },
    authController.register,
  );

  app.get("/auth/me", { preHandler: authenticate }, authController.me);

  app.post<{ Body: LoginDto }>(
    "/auth/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "로그인 — Access Token + Refresh Token 발급",
        body: {
          type: "object",
          required: ["loginId", "password"],
          properties: {
            loginId: { type: "string" },
            password: { type: "string" },
          },
        },
      },
    },
    authController.login,
  );

  app.post<{ Body: RefreshDto }>(
    "/auth/refresh",
    {
      schema: {
        tags: ["Auth"],
        summary: "Access Token 갱신 (Token Rotation)",
        body: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string" },
          },
        },
      },
    },
    authController.refresh,
  );

  app.post<{ Body: RefreshDto }>(
    "/auth/logout",
    {
      schema: {
        tags: ["Auth"],
        summary: "로그아웃 — Refresh Token 패밀리 전체 폐기",
        body: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string" },
          },
        },
      },
    },
    authController.logout,
  );
};
export default authRoutes;
