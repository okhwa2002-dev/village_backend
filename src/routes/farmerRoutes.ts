import { FastifyInstance } from "fastify";
import farmerController from "../controllers/farmerController";
import { UpsertFarmerProfileDto } from "../types/farmerTypes";
import {
  authenticate,
  requireRole,
  checkMenuPermission,
} from "../plugins/authenticate";

const farmerRoutes = async (app: FastifyInstance) => {
  app.get(
    "/farmers",
    { schema: { tags: ["Farmer"], summary: "농민 목록" } },
    farmerController.list,
  );

  app.get<{ Params: { id: string } }>(
    "/farmers/:id",
    { schema: { tags: ["Farmer"], summary: "농민 상세" } },
    farmerController.getById,
  );

  app.get(
    "/farmers/me",
    {
      schema: {
        tags: ["Farmer"],
        summary: "내 프로필",
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate, requireRole("FARMER")],
    },
    farmerController.getMyProfile,
  );

  app.put<{ Body: UpsertFarmerProfileDto }>(
    "/farmers/me",
    {
      schema: {
        tags: ["Farmer"],
        summary: "프로필 등록/수정",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            bio: { type: "string" },
            fileGroupId: { type: "string" },
            farm_description: { type: "string" },
          },
        },
      },
      preHandler: [authenticate, requireRole("FARMER")],
    },
    farmerController.upsertProfile,
  );

  app.get(
    "/admin/farmers",
    {
      schema: {
        tags: ["Admin"],
        summary: "전체 농민 목록",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        },
      },
      preHandler: [authenticate, checkMenuPermission("ADMIN_FARMERS")],
    },
    farmerController.listAdmin,
  );

  app.get(
    "/admin/farmers/export",
    {
      schema: {
        tags: ["Admin"],
        summary: "농민 목록 엑셀 다운로드",
        security: [{ bearerAuth: [] }],
        produces: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
      },
      preHandler: [authenticate, checkMenuPermission("ADMIN_FARMERS")],
    },
    farmerController.exportExcel,
  );

  app.patch<{ Params: { id: string } }>(
    "/admin/farmers/:id/approve",
    {
      schema: {
        tags: ["Admin"],
        summary: "농민 승인",
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate, checkMenuPermission("ADMIN_FARMERS", "edit")],
    },
    farmerController.approve,
  );

  app.patch<{ Params: { id: string } }>(
    "/admin/farmers/:id/reject",
    {
      schema: {
        tags: ["Admin"],
        summary: "농민 거절",
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate, checkMenuPermission("ADMIN_FARMERS", "edit")],
    },
    farmerController.reject,
  );
};
export default farmerRoutes;
