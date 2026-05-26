import { FastifyInstance } from "fastify";
import {
  registerHandler,
  loginHandler,
  logoutHandler,
} from "../controllers/authController";
import { authenticate } from "../plugins/authenticate";
import { RegisterDto, LoginDto } from "../types/userTypes";

export default async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: RegisterDto }>(
    "/auth/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "회원가입",
        body: {
          type: "object",
          required: ["login_id", "password", "role"],
          properties: {
            login_id: { type: "string" },
            password: { type: "string", minLength: 6 },
            role: { type: "string", enum: ["farmer", "consumer"] },
            name: { type: "string" },
            phone: { type: "string" },
            email: { type: "string", format: "email" },
          },
        },
      },
    },
    registerHandler,
  );

  app.post<{ Body: LoginDto }>(
    "/auth/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "로그인",
        body: {
          type: "object",
          required: ["login_id", "password"],
          properties: {
            login_id: { type: "string" },
            password: { type: "string" },
          },
        },
      },
    },
    loginHandler,
  );

  app.post(
    "/auth/logout",
    {
      schema: {
        tags: ["Auth"],
        summary: "로그아웃",
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate],
    },
    logoutHandler,
  );
}
