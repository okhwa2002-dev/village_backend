import { withTransaction, clientQueryOne } from "../db/pool";
import orderRepo from "../repositories/orderRepository";
import { CreateOrderDto } from "../types/orderTypes";
import { Product } from "../types/productTypes";

const generateOrderNumber = () =>
  `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const getMyOrders = (userId: string) => orderRepo.findOrdersByUserId(userId);

const getOrderById = async (userId: string, orderId: string) => {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.userId !== userId) throw new Error("FORBIDDEN");
  const items = await orderRepo.findOrderItems(orderId);
  return { ...order, items };
};

const createOrder = async (userId: string, dto: CreateOrderDto) => {
  if (!dto.items || dto.items.length === 0) throw new Error("EMPTY_ORDER");

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
      if (!product) throw new Error("PRODUCT_NOT_FOUND");
      if (product.status !== "ACTIVE") throw new Error("PRODUCT_NOT_AVAILABLE");
      if (product.stock < item.quantity) throw new Error("INSUFFICIENT_STOCK");

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
    if (!order) throw new Error("ORDER_CREATE_FAILED");

    for (const item of itemsWithPrice) {
      await orderRepo.createOrderItemInTx(client, {
        orderId: order.id,
        ...item,
      });
      await orderRepo.decreaseStockInTx(client, item.productId, item.quantity);
    }

    return order;
  });
};

const cancelOrder = async (userId: string, orderId: string) => {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.userId !== userId) throw new Error("FORBIDDEN");
  if (!["PENDING", "CONFIRMED"].includes(order.status))
    throw new Error("CANNOT_CANCEL");
  await orderRepo.updateOrderStatus(orderId, "CANCELLED");
};

const getAllOrdersForAdmin = () => orderRepo.findAllOrdersForAdmin();

const updateOrderStatusByAdmin = async (orderId: string, status: string) => {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  await orderRepo.updateOrderStatus(orderId, status);
};

export default {
  getMyOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  getAllOrdersForAdmin,
  updateOrderStatusByAdmin,
};
