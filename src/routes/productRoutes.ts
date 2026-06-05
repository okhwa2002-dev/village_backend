import { FastifyInstance } from "fastify";
import {
  getProductsHandler,
  getProductHandler,
  getMyProductsHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} from "../controllers/productController";
import { CreateProductDto, UpdateProductDto } from "../types/productTypes";
import { authenticate, requireRole } from "../plugins/authenticate";

export default async function productRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { category?: string; farmerId?: string } }>(
    "/products",
    {
      schema: {
        tags: ["Product"],
        summary: "상품 목록",
        querystring: {
          type: "object",
          properties: {
            category: { type: "string" },
            farmerId: { type: "string" },
          },
        },
      },
    },
    getProductsHandler,
  );

  app.get<{ Params: { id: string } }>(
    "/products/:id",
    { schema: { tags: ["Product"], summary: "상품 상세" } },
    getProductHandler,
  );

  app.get(
    "/farmers/me/products",
    {
      schema: {
        tags: ["Product"],
        summary: "내 상품 목록",
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate, requireRole("FARMER")],
    },
    getMyProductsHandler,
  );

  app.post<{ Body: CreateProductDto }>(
    "/products",
    {
      schema: {
        tags: ["Product"],
        summary: "상품 등록",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name", "price", "stock", "category"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "integer", minimum: 0 },
            stock: { type: "integer", minimum: 0 },
            category: { type: "string" },
            fileGroupId: { type: "string" },
          },
        },
      },
      preHandler: [authenticate, requireRole("FARMER")],
    },
    createProductHandler,
  );

  app.put<{ Params: { id: string }; Body: UpdateProductDto }>(
    "/products/:id",
    {
      schema: {
        tags: ["Product"],
        summary: "상품 수정",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "integer", minimum: 0 },
            stock: { type: "integer", minimum: 0 },
            category: { type: "string" },
            fileGroupId: { type: "string" },
            status: { type: "string", enum: ["ACTIVE", "HIDDEN", "SOLDOUT"] },
          },
        },
      },
      preHandler: [authenticate, requireRole("FARMER")],
    },
    updateProductHandler,
  );

  app.delete<{ Params: { id: string } }>(
    "/products/:id",
    {
      schema: {
        tags: ["Product"],
        summary: "상품 삭제",
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate, requireRole("FARMER")],
    },
    deleteProductHandler,
  );
}
