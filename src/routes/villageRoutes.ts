import { FastifyInstance } from "fastify";
import villageController from "../controllers/villageController";
import {
  CreateVillageContentDto,
  UpdateVillageContentDto,
} from "../types/villageTypes";
import { authenticate, checkMenuPermission } from "../plugins/authenticate";

const villageRoutes = async (app: FastifyInstance) => {
  app.get(
    "/village",
    { schema: { tags: ["Village"], summary: "마을 콘텐츠 목록" } },
    villageController.list,
  );

  app.get<{ Params: { section: string } }>(
    "/village/:section",
    { schema: { tags: ["Village"], summary: "섹션별 콘텐츠 목록" } },
    villageController.listBySection,
  );

  app.get(
    "/admin/village",
    {
      schema: {
        tags: ["Admin"],
        summary: "전체 콘텐츠 목록 (관리자)",
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate, checkMenuPermission("ADMIN_VILLAGE")],
    },
    villageController.listAdmin,
  );

  app.post<{ Body: CreateVillageContentDto }>(
    "/admin/village",
    {
      schema: {
        tags: ["Admin"],
        summary: "콘텐츠 추가 (JSON 또는 multipart/form-data)",
        security: [{ bearerAuth: [] }],
        consumes: ["application/json", "multipart/form-data"],
      },
      preHandler: [authenticate, checkMenuPermission("ADMIN_VILLAGE", "edit")],
    },
    villageController.create,
  );

  app.put<{ Params: { id: string }; Body: UpdateVillageContentDto }>(
    "/admin/village/:id",
    {
      schema: {
        tags: ["Admin"],
        summary: "콘텐츠 수정 (JSON 또는 multipart/form-data)",
        security: [{ bearerAuth: [] }],
        consumes: ["application/json", "multipart/form-data"],
      },
      preHandler: [authenticate, checkMenuPermission("ADMIN_VILLAGE", "edit")],
    },
    villageController.update,
  );

  app.delete<{ Params: { id: string } }>(
    "/admin/village/:id",
    {
      schema: {
        tags: ["Admin"],
        summary: "콘텐츠 삭제",
        security: [{ bearerAuth: [] }],
      },
      preHandler: [
        authenticate,
        checkMenuPermission("ADMIN_VILLAGE", "delete"),
      ],
    },
    villageController.delete,
  );
};
export default villageRoutes;
