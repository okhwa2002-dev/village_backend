import { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../plugins/authenticate";
import commonCodeController from "../controllers/commonCodeController";
import {
  CreateCodeDto,
  CreateGroupDto,
  UpdateCodeDto,
  UpdateGroupDto,
} from "../types/commonCodeTypes";

const adminGuard = { preHandler: [authenticate, requireRole("ADMIN")] };

export default async function commonCodeRoutes(app: FastifyInstance) {
  app.get(
    "/admin/common-code-groups",
    adminGuard,
    commonCodeController.getGroupsHandler,
  );

  app.post<{ Body: CreateGroupDto }>(
    "/admin/common-code-groups",
    adminGuard,
    commonCodeController.createGroupHandler,
  );

  app.put<{ Params: { id: string }; Body: UpdateGroupDto }>(
    "/admin/common-code-groups/:id",
    adminGuard,
    commonCodeController.updateGroupHandler,
  );

  app.delete<{ Params: { id: string } }>(
    "/admin/common-code-groups/:id",
    adminGuard,
    commonCodeController.deleteGroupHandler,
  );

  app.get<{ Params: { groupId: string } }>(
    "/admin/common-code-groups/:groupId/codes",
    adminGuard,
    commonCodeController.getCodesHandler,
  );

  app.post<{ Params: { groupId: string }; Body: CreateCodeDto }>(
    "/admin/common-code-groups/:groupId/codes",
    adminGuard,
    commonCodeController.createCodeHandler,
  );

  app.put<{ Params: { id: string }; Body: UpdateCodeDto }>(
    "/admin/common-codes/:id",
    adminGuard,
    commonCodeController.updateCodeHandler,
  );

  app.delete<{ Params: { id: string } }>(
    "/admin/common-codes/:id",
    adminGuard,
    commonCodeController.deleteCodeHandler,
  );
}
