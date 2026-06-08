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

const commonCodeRoutes = async (app: FastifyInstance) => {
  app.get(
    "/admin/common-code-groups",
    adminGuard,
    commonCodeController.listGroups,
  );

  app.post<{ Body: CreateGroupDto }>(
    "/admin/common-code-groups",
    adminGuard,
    commonCodeController.createGroup,
  );

  app.put<{ Params: { id: string }; Body: UpdateGroupDto }>(
    "/admin/common-code-groups/:id",
    adminGuard,
    commonCodeController.updateGroup,
  );

  app.delete<{ Params: { id: string } }>(
    "/admin/common-code-groups/:id",
    adminGuard,
    commonCodeController.deleteGroup,
  );

  app.get<{ Params: { groupId: string } }>(
    "/admin/common-code-groups/:groupId/codes",
    adminGuard,
    commonCodeController.listCodes,
  );

  app.post<{ Params: { groupId: string }; Body: CreateCodeDto }>(
    "/admin/common-code-groups/:groupId/codes",
    adminGuard,
    commonCodeController.createCode,
  );

  app.put<{ Params: { id: string }; Body: UpdateCodeDto }>(
    "/admin/common-codes/:id",
    adminGuard,
    commonCodeController.updateCode,
  );

  app.delete<{ Params: { id: string } }>(
    "/admin/common-codes/:id",
    adminGuard,
    commonCodeController.deleteCode,
  );
};
export default commonCodeRoutes;
