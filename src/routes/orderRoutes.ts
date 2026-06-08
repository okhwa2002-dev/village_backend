import { FastifyInstance } from "fastify";
import orderController from "../controllers/orderController";
import { CreateOrderDto } from "../types/orderTypes";
import { authenticate, checkMenuPermission } from "../plugins/authenticate";

const orderRoutes = async (app: FastifyInstance) => {
  const auth = { preHandler: [authenticate] };

  app.get(
    "/orders",
    {
      schema: {
        tags: ["Order"],
        summary: "내 주문 목록",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    orderController.listMine,
  );

  app.get<{ Params: { id: string } }>(
    "/orders/:id",
    {
      schema: {
        tags: ["Order"],
        summary: "주문 상세",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    orderController.getById,
  );

  app.post<{ Body: CreateOrderDto }>(
    "/orders",
    {
      schema: {
        tags: ["Order"],
        summary: "주문 생성",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: [
            "consumerName",
            "consumerPhone",
            "consumerEmail",
            "address",
            "items",
          ],
          properties: {
            consumerName: { type: "string" },
            consumerPhone: { type: "string" },
            consumerEmail: { type: "string", format: "email" },
            address: { type: "string" },
            memo: { type: "string" },
            items: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["productId", "quantity"],
                properties: {
                  productId: { type: "string" },
                  quantity: { type: "integer", minimum: 1 },
                },
              },
            },
          },
        },
      },
      ...auth,
    },
    orderController.create,
  );

  app.patch<{ Params: { id: string } }>(
    "/orders/:id/cancel",
    {
      schema: {
        tags: ["Order"],
        summary: "주문 취소",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    orderController.cancel,
  );

  app.get(
    "/admin/orders",
    {
      schema: {
        tags: ["Admin"],
        summary: "전체 주문 목록",
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate, checkMenuPermission("ADMIN_ORDER")],
    },
    orderController.listAdmin,
  );

  app.patch<{ Params: { id: string }; Body: { status: string } }>(
    "/admin/orders/:id/status",
    {
      schema: {
        tags: ["Admin"],
        summary: "주문 상태 변경",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: [
                "PENDING",
                "CONFIRMED",
                "SHIPPED",
                "DELIVERED",
                "CANCELLED",
              ],
            },
          },
        },
      },
      preHandler: [authenticate, checkMenuPermission("ADMIN_ORDER", "edit")],
    },
    orderController.updateStatus,
  );
};
export default orderRoutes;
