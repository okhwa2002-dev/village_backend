import { FastifyInstance } from "fastify";
import {
  getContentsHandler,
  getContentsBySectionHandler,
  getContentsAdminHandler,
  createContentHandler,
  updateContentHandler,
  deleteContentHandler,
} from "../controllers/villageController";
import {
  CreateVillageContentDto,
  UpdateVillageContentDto,
} from "../types/villageTypes";
import { authenticate, checkMenuPermission } from "../plugins/authenticate";

export default async function villageRoutes(app: FastifyInstance) {
  app.get(
    "/village",
    { schema: { tags: ["Village"], summary: "마을 콘텐츠 목록" } },
    getContentsHandler,
  );

  app.get<{ Params: { section: string } }>(
    "/village/:section",
    { schema: { tags: ["Village"], summary: "섹션별 콘텐츠" } },
    getContentsBySectionHandler,
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
    getContentsAdminHandler,
  );

  app.post<{ Body: CreateVillageContentDto }>(
    "/admin/village",
    {
      schema: {
        tags: ["Admin"],
        summary: "콘텐츠 추가",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["section", "title"],
          properties: {
            section: { type: "string" },
            title: { type: "string" },
            body: { type: "string" },
            fileGroupId: { type: "string" },
            sort_order: { type: "integer" },
            publishedYn: { type: "string", enum: ["Y", "N"] },
          },
        },
      },
      preHandler: [authenticate, checkMenuPermission("ADMIN_VILLAGE", "edit")],
    },
    createContentHandler,
  );

  app.put<{ Params: { id: string }; Body: UpdateVillageContentDto }>(
    "/admin/village/:id",
    {
      schema: {
        tags: ["Admin"],
        summary: "콘텐츠 수정",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            section: { type: "string" },
            title: { type: "string" },
            body: { type: "string" },
            fileGroupId: { type: "string" },
            sort_order: { type: "integer" },
            publishedYn: { type: "string", enum: ["Y", "N"] },
          },
        },
      },
      preHandler: [authenticate, checkMenuPermission("ADMIN_VILLAGE", "edit")],
    },
    updateContentHandler,
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
    deleteContentHandler,
  );
}
