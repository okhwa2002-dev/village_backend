import { FastifyRequest, FastifyReply } from "fastify";
import { CreateOrderDto } from "../types/orderTypes";
import {
  getMyOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  getAllOrdersForAdmin,
  updateOrderStatusByAdmin,
} from "../services/orderService";
import { successResponse, errorResponse } from "../utils/response";

export const getMyOrdersHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const user = req.user;
  const orders = await getMyOrders(user.id);
  return reply.send(successResponse(orders));
};

export const getOrderHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    const order = await getOrderById(user.id, req.params.id);
    return reply.send(successResponse(order));
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "ORDER_NOT_FOUND")
        return reply.code(404).send(errorResponse("주문을 찾을 수 없습니다"));
      if (err.message === "FORBIDDEN")
        return reply.code(403).send(errorResponse("접근 권한이 없습니다"));
    }
    throw err;
  }
};

export const createOrderHandler = async (
  req: FastifyRequest<{ Body: CreateOrderDto }>,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    const order = await createOrder(user.id, req.body);
    return reply
      .code(201)
      .send(successResponse(order, "주문이 완료되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "EMPTY_ORDER")
        return reply.code(400).send(errorResponse("주문 상품이 없습니다"));
      if (err.message === "PRODUCT_NOT_FOUND")
        return reply.code(404).send(errorResponse("상품을 찾을 수 없습니다"));
      if (err.message === "PRODUCT_NOT_AVAILABLE")
        return reply
          .code(400)
          .send(errorResponse("판매 중지된 상품이 포함되어 있습니다"));
      if (err.message === "INSUFFICIENT_STOCK")
        return reply.code(400).send(errorResponse("재고가 부족합니다"));
    }
    throw err;
  }
};

export const cancelOrderHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    await cancelOrder(user.id, req.params.id);
    return reply.send(successResponse(null, "주문이 취소되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "ORDER_NOT_FOUND")
        return reply.code(404).send(errorResponse("주문을 찾을 수 없습니다"));
      if (err.message === "FORBIDDEN")
        return reply.code(403).send(errorResponse("접근 권한이 없습니다"));
      if (err.message === "CANNOT_CANCEL")
        return reply.code(400).send(errorResponse("취소할 수 없는 주문입니다"));
    }
    throw err;
  }
};

export const getAdminOrdersHandler = async (
  _req: FastifyRequest,
  reply: FastifyReply,
) => {
  const orders = await getAllOrdersForAdmin();
  return reply.send(successResponse(orders));
};

export const updateOrderStatusHandler = async (
  req: FastifyRequest<{ Params: { id: string }; Body: { status: string } }>,
  reply: FastifyReply,
) => {
  try {
    await updateOrderStatusByAdmin(req.params.id, req.body.status);
    return reply.send(successResponse(null, "주문 상태가 변경되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "ORDER_NOT_FOUND")
      return reply.code(404).send(errorResponse("주문을 찾을 수 없습니다"));
    throw err;
  }
};
