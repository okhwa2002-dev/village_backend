import { FastifyRequest, FastifyReply } from "fastify";
import { AddCartItemDto, UpdateCartItemDto } from "../types/cartTypes";
import cartService from "../services/cartService";
import { successResponse } from "../utils/response";
import { handleError } from "../utils/errors";

const cartController = {
  async get(req: FastifyRequest, reply: FastifyReply) {
    const cart = await cartService.getCart(req.user.id);
    return reply.send(successResponse(cart));
  },

  async addItem(
    req: FastifyRequest<{ Body: AddCartItemDto }>,
    reply: FastifyReply,
  ) {
    try {
      const item = await cartService.addCartItem(req.user.id, req.body);
      return reply
        .code(201)
        .send(successResponse(item, "장바구니에 추가되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async updateItem(
    req: FastifyRequest<{
      Params: { itemId: string };
      Body: UpdateCartItemDto;
    }>,
    reply: FastifyReply,
  ) {
    try {
      await cartService.updateCartItem(
        req.user.id,
        req.params.itemId,
        req.body,
      );
      return reply.send(successResponse(null, "수량이 변경되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async removeItem(
    req: FastifyRequest<{ Params: { itemId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      await cartService.removeCartItem(req.user.id, req.params.itemId);
      return reply.send(successResponse(null, "아이템이 삭제되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async clear(req: FastifyRequest, reply: FastifyReply) {
    await cartService.clearCart(req.user.id);
    return reply.send(successResponse(null, "장바구니가 비워졌습니다"));
  },
};
export default cartController;
