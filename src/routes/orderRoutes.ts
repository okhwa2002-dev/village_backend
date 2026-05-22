import { FastifyInstance } from "fastify";
import {
  getMyOrdersHandler,
  getOrderHandler,
  createOrderHandler,
  cancelOrderHandler,
  getAdminOrdersHandler,
  updateOrderStatusHandler,
} from "../controllers/orderController";
import { CreateOrderDto } from "../types/orderTypes";
import { authenticate, requireRole } from "../plugins/authenticate";

export default async function orderRoutes(app: FastifyInstance) {
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
    getMyOrdersHandler,
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
    getOrderHandler,
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
    createOrderHandler,
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
    cancelOrderHandler,
  );

  app.get(
    "/admin/orders",
    {
      schema: {
        tags: ["Admin"],
        summary: "전체 주문 목록",
        security: [{ bearerAuth: [] }],
      },
      preHandler: [requireRole("admin")],
    },
    getAdminOrdersHandler,
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
                "pending",
                "confirmed",
                "shipped",
                "delivered",
                "cancelled",
              ],
            },
          },
        },
      },
      preHandler: [requireRole("admin")],
    },
    updateOrderStatusHandler,
  );
}
