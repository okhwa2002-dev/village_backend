import { FastifyRequest, FastifyReply } from "fastify";
import { JwtPayload, UserRole } from "../types/commonTypes";
import { getUserMenuPermissions } from "../repositories/permissionRepository";

export const authenticate = async (
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    await req.jwtVerify();
  } catch {
    return reply
      .code(401)
      .send({ success: false, message: "인증이 필요합니다" });
  }
};

export const requireRole =
  (...roles: UserRole[]) =>
  async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      await req.jwtVerify();
    } catch {
      reply.code(401).send({ success: false, message: "인증이 필요합니다" });
      return;
    }
    const user = req.user as JwtPayload;
    if (!roles.includes(user.role)) {
      return reply
        .code(403)
        .send({ success: false, message: "권한이 없습니다" });
    }
  };

export const checkMenuPermission =
  (menuCode: string, action?: "edit" | "delete") =>
  async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = req.user as JwtPayload;
    let perms;
    try {
      perms = await getUserMenuPermissions(user.id);
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
