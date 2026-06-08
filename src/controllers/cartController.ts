import { FastifyRequest, FastifyReply } from "fastify";
import { AddCartItemDto, UpdateCartItemDto } from "../types/cartTypes";
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../services/cartService";
import { successResponse, errorResponse } from "../utils/response";

const getCartHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const user = req.user;
  const cart = await getCart(user.id);
  return reply.send(successResponse(cart));
};

const addCartItemHandler = async (
  req: FastifyRequest<{ Body: AddCartItemDto }>,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    const item = await addCartItem(user.id, req.body);
    return reply
      .code(201)
      .send(successResponse(item, "장바구니에 추가되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "INVALID_QUANTITY")
      return reply.code(400).send(errorResponse("수량은 1 이상이어야 합니다"));
    throw err;
  }
};

const updateCartItemHandler = async (
  req: FastifyRequest<{ Params: { itemId: string }; Body: UpdateCartItemDto }>,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    await updateCartItem(user.id, req.params.itemId, req.body);
    return reply.send(successResponse(null, "수량이 변경되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "INVALID_QUANTITY")
        return reply
          .code(400)
          .send(errorResponse("수량은 1 이상이어야 합니다"));
      if (err.message === "ITEM_NOT_FOUND")
        return reply
          .code(404)
          .send(errorResponse("장바구니 아이템을 찾을 수 없습니다"));
    }
    throw err;
  }
};

const removeCartItemHandler = async (
  req: FastifyRequest<{ Params: { itemId: string } }>,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    await removeCartItem(user.id, req.params.itemId);
    return reply.send(successResponse(null, "아이템이 삭제되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "ITEM_NOT_FOUND")
      return reply
        .code(404)
        .send(errorResponse("장바구니 아이템을 찾을 수 없습니다"));
    throw err;
  }
};

const clearCartHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const user = req.user;
  await clearCart(user.id);
  return reply.send(successResponse(null, "장바구니가 비워졌습니다"));
};

export default {
  getCartHandler,
  addCartItemHandler,
  updateCartItemHandler,
  removeCartItemHandler,
  clearCartHandler,
};
