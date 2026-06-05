import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../plugins/authenticate";
import {
  createCodeHandler,
  createGroupHandler,
  deleteCodeHandler,
  deleteGroupHandler,
  getCodesHandler,
  getGroupsHandler,
  updateCodeHandler,
  updateGroupHandler,
} from "../controllers/commonCodeController";
import {
  CreateCodeDto,
  CreateGroupDto,
  UpdateCodeDto,
  UpdateGroupDto,
} from "../types/commonCodeTypes";

const adminGuard = { preHandler: [authenticate, requireRole("ADMIN")] };

export default async function commonCodeRoutes(app: FastifyInstance) {
  app.get("/admin/common-code-groups", adminGuard, getGroupsHandler);

  app.post<{ Body: CreateGroupDto }>(
    "/admin/common-code-groups",
    adminGuard,
    createGroupHandler,
  );

  app.put<{ Params: { id: string }; Body: UpdateGroupDto }>(
    "/admin/common-code-groups/:id",
    adminGuard,
    updateGroupHandler,
  );

  app.delete<{ Params: { id: string } }>(
    "/admin/common-code-groups/:id",
    adminGuard,
    deleteGroupHandler,
  );

  app.get<{ Params: { groupId: string } }>(
    "/admin/common-code-groups/:groupId/codes",
    adminGuard,
    getCodesHandler,
  );

  app.post<{ Params: { groupId: string }; Body: CreateCodeDto }>(
    "/admin/common-code-groups/:groupId/codes",
    adminGuard,
    createCodeHandler,
  );

  app.put<{ Params: { id: string }; Body: UpdateCodeDto }>(
    "/admin/common-codes/:id",
    adminGuard,
    updateCodeHandler,
  );

  app.delete<{ Params: { id: string } }>(
    "/admin/common-codes/:id",
    adminGuard,
    deleteCodeHandler,
  );
}