import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { SessionUser, UserRole } from "../types/commonTypes";
import { getUserMenuPermissions } from "../repositories/permissionRepository";
import { findUserById } from "../repositories/authRepository";

declare module "fastify" {
  interface FastifyRequest {
    user: SessionUser;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

const extractToken = (req: FastifyRequest): string | null => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
};

export const authenticate = async (
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const token = extractToken(req);
  if (!token) {
    return reply
      .code(401)
      .send({ success: false, message: "인증이 필요합니다" });
  }

  let payload: { userId: string };
  try {
    payload = jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return reply
      .code(401)
      .send({ success: false, message: "유효하지 않은 토큰입니다" });
  }

  const user = await findUserById(payload.userId);
  if (!user || user.status !== "ACTIVE") {
    return reply
      .code(401)
      .send({ success: false, message: "인증이 필요합니다" });
  }

  req.user = {
    id: user.id,
    loginId: user.loginId,
    name: user.name,
    role: user.role,
    status: user.status,
  };
};

export const requireRole =
  (...roles: UserRole[]) =>
  async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user || !roles.includes(req.user.role)) {
      return reply
        .code(403)
        .send({ success: false, message: "권한이 없습니다" });
    }
  };

export const checkMenuPermission =
  (menuCode: string, action?: "edit" | "delete") =>
  async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    let perms;
    try {
      perms = await getUserMenuPermissions(req.user.id);
    } catch {
      return reply
        .code(500)
        .send({ success: false, message: "권한 조회에 실패했습니다" });
    }
    const menu = perms.find((p) => p.menu_code === menuCode);

    if (!menu) {
      return reply
        .code(403)
        .send({ success: false, message: "접근 권한이 없습니다" });
    }
    if (action === "edit" && !menu.can_edit) {
      return reply
        .code(403)
        .send({ success: false, message: "수정 권한이 없습니다" });
    }
    if (action === "delete" && !menu.can_delete) {
      return reply
        .code(403)
        .send({ success: false, message: "삭제 권한이 없습니다" });
    }
  };
