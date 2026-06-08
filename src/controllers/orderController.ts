import { FastifyRequest, FastifyReply } from "fastify";
import { CreateOrderDto } from "../types/orderTypes";
import orderService from "../services/orderService";
import { successResponse } from "../utils/response";
import { handleError } from "../utils/errors";

const orderController = {
  async listMine(req: FastifyRequest, reply: FastifyReply) {
    const orders = await orderService.getMyOrders(req.user.id);
    return reply.send(successResponse(orders));
  },

  async getById(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const order = await orderService.getOrderById(req.user.id, req.params.id);
      return reply.send(successResponse(order));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async create(
    req: FastifyRequest<{ Body: CreateOrderDto }>,
    reply: FastifyReply,
  ) {
    try {
      const order = await orderService.createOrder(req.user.id, req.body);
      return reply
        .code(201)
        .send(successResponse(order, "주문이 완료되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async cancel(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      await orderService.cancelOrder(req.user.id, req.params.id);
      return reply.send(successResponse(null, "주문이 취소되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async listAdmin(_req: FastifyRequest, reply: FastifyReply) {
    const orders = await orderService.getAllOrdersForAdmin();
    return reply.send(successResponse(orders));
  },

  async updateStatus(
    req: FastifyRequest<{ Params: { id: string }; Body: { status: string } }>,
    reply: FastifyReply,
  ) {
    try {
      await orderService.updateOrderStatusByAdmin(
        req.params.id,
        req.body.status,
      );
      return reply.send(successResponse(null, "주문 상태가 변경되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },
};
export default orderController;
