import { FastifyInstance } from "fastify";
import productController from "../controllers/productController";
import { CreateProductDto, UpdateProductDto } from "../types/productTypes";
import { authenticate, requireRole } from "../plugins/authenticate";

const productRoutes = async (app: FastifyInstance) => {
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
    productController.list,
  );

  app.get<{ Params: { id: string } }>(
    "/products/:id",
    { schema: { tags: ["Product"], summary: "상품 상세" } },
    productController.getById,
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
    productController.listMine,
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
    productController.create,
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
    productController.update,
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
    productController.delete,
  );
};
export default productRoutes;
