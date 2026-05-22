import { FastifyInstance } from "fastify";
import {
  getCartHandler,
  addCartItemHandler,
  updateCartItemHandler,
  removeCartItemHandler,
  clearCartHandler,
} from "../controllers/cartController";
import { AddCartItemDto, UpdateCartItemDto } from "../types/cartTypes";
import { authenticate } from "../plugins/authenticate";

export default async function cartRoutes(app: FastifyInstance) {
  const auth = { preHandler: [authenticate] };

  app.get(
    "/cart",
    {
      schema: {
        tags: ["Cart"],
        summary: "장바구니 조회",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    getCartHandler,
  );

  app.post<{ Body: AddCartItemDto }>(
    "/cart/items",
    {
      schema: {
        tags: ["Cart"],
        summary: "장바구니 아이템 추가",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["productId", "quantity"],
          properties: {
            productId: { type: "string" },
            quantity: { type: "integer", minimum: 1 },
          },
        },
      },
      ...auth,
    },
    addCartItemHandler,
  );

  app.patch<{ Params: { itemId: string }; Body: UpdateCartItemDto }>(
    "/cart/items/:itemId",
    {
      schema: {
        tags: ["Cart"],
        summary: "장바구니 수량 변경",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["quantity"],
          properties: {
            quantity: { type: "integer", minimum: 1 },
          },
        },
      },
      ...auth,
    },
    updateCartItemHandler,
  );

  app.delete<{ Params: { itemId: string } }>(
    "/cart/items/:itemId",
    {
      schema: {
        tags: ["Cart"],
        summary: "장바구니 아이템 삭제",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    removeCartItemHandler,
  );

  app.delete(
    "/cart",
    {
      schema: {
        tags: ["Cart"],
        summary: "장바구니 비우기",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    clearCartHandler,
  );
}
