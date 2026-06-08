import { withTransaction, clientQueryOne } from "../db/pool";
import orderRepo from "../repositories/orderRepository";
import { CreateOrderDto } from "../types/orderTypes";
import { Product } from "../types/productTypes";
import { Errors } from "../utils/errors";

const generateOrderNumber = () =>
  `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const orderService = {
  getMyOrders(userId: string) {
    return orderRepo.findOrdersByUserId(userId);
  },

  async getOrderById(userId: string, orderId: string) {
    const order = await orderRepo.findOrderById(orderId);
    if (!order) throw Errors.notFound("주문을 찾을 수 없습니다");
    if (order.userId !== userId) throw Errors.forbidden();
    const items = await orderRepo.findOrderItems(orderId);
    return { ...order, items };
  },

  async createOrder(userId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0)
      throw Errors.badRequest("주문 상품이 없습니다");

    return withTransaction(async (client) => {
      let totalPrice = 0;
      const itemsWithPrice: {
        productId: string;
        quantity: number;
        priceAtOrder: number;
      }[] = [];

      for (const item of dto.items) {
        const product = await clientQueryOne<Product>(
          client,
          "product",
          "findById",
          { id: item.productId },
        );
        if (!product) throw Errors.notFound("상품을 찾을 수 없습니다");
        if (product.status !== "ACTIVE")
          throw Errors.badRequest("판매 중지된 상품이 포함되어 있습니다");
        if (product.stock < item.quantity)
          throw Errors.badRequest("재고가 부족합니다");

        totalPrice += product.price * item.quantity;
        itemsWithPrice.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtOrder: product.price,
        });
      }

      const order = await orderRepo.createOrderInTx(client, {
        orderNumber: generateOrderNumber(),
        userId,
        consumerName: dto.consumerName,
        consumerPhone: dto.consumerPhone,
        consumerEmail: dto.consumerEmail,
        address: dto.address,
        memo: dto.memo,
        totalPrice,
      });
      if (!order) throw Errors.internal("주문 생성에 실패했습니다");

      for (const item of itemsWithPrice) {
        await orderRepo.createOrderItemInTx(client, {
          orderId: order.id,
          ...item,
        });
        await orderRepo.decreaseStockInTx(
          client,
          item.productId,
          item.quantity,
        );
      }

      return order;
    });
  },

  async cancelOrder(userId: string, orderId: string) {
    const order = await orderRepo.findOrderById(orderId);
    if (!order) throw Errors.notFound("주문을 찾을 수 없습니다");
    if (order.userId !== userId) throw Errors.forbidden();
    if (!["PENDING", "CONFIRMED"].includes(order.status))
      throw Errors.badRequest("취소할 수 없는 주문입니다");
    await orderRepo.updateOrderStatus(orderId, "CANCELLED");
  },

  getAllOrdersForAdmin() {
    return orderRepo.findAllOrdersForAdmin();
  },

  async updateOrderStatusByAdmin(orderId: string, status: string) {
    const order = await orderRepo.findOrderById(orderId);
    if (!order) throw Errors.notFound("주문을 찾을 수 없습니다");
    await orderRepo.updateOrderStatus(orderId, status);
  },
};
export default orderService;
