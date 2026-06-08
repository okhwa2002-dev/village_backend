import { FastifyInstance } from "fastify";
import fileController from "../controllers/fileController";
import { authenticate } from "../plugins/authenticate";

export default async function fileRoutes(app: FastifyInstance) {
  app.post<{ Body: { refType: "PRODUCT" | "FARMER" | "VILLAGE" | "BOARD" } }>(
    "/file-groups",
    {
      schema: {
        tags: ["File"],
        summary: "파일 그룹 생성",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["refType"],
          properties: {
            refType: {
              type: "string",
              enum: ["PRODUCT", "FARMER", "VILLAGE", "BOARD"],
            },
          },
        },
      },
      preHandler: [authenticate],
    },
    fileController.createFileGroupHandler,
  );

  app.post(
    "/files",
    {
      schema: {
        tags: ["File"],
        summary: "파일 업로드 (multipart/form-data, 다중 파일 지원)",
        security: [{ bearerAuth: [] }],
        consumes: ["multipart/form-data"],
      },
      preHandler: [authenticate],
    },
    fileController.uploadFileHandler,
  );

  app.get<{ Params: { id: string } }>(
    "/file-groups/:id/files",
    {
      schema: {
        tags: ["File"],
        summary: "파일 그룹 내 파일 목록 조회",
      },
    },
    fileController.getFilesHandler,
  );

  app.patch<{
    Params: { id: string };
    Body: { sortOrder?: number; isMainYn?: "Y" | "N" };
  }>(
    "/files/:id",
    {
      schema: {
        tags: ["File"],
        summary: "파일 정보 수정 (정렬, 대표 이미지)",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            sortOrder: { type: "integer", minimum: 0 },
            isMainYn: { type: "string", enum: ["Y", "N"] },
          },
        },
      },
      preHandler: [authenticate],
    },
    fileController.patchFileHandler,
  );

  app.delete<{ Params: { id: string } }>(
    "/files/:id",
    {
      schema: {
        tags: ["File"],
        summary: "파일 삭제",
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate],
    },
    fileController.deleteFileHandler,
  );
}
