import { withTransaction, clientQueryOne } from "../db/pool";
import {
  findOrdersByUserId,
  findOrderById,
  findOrderItems,
  findAllOrdersForAdmin,
  updateOrderStatus,
  createOrderInTx,
  createOrderItemInTx,
  decreaseStockInTx,
} from "../repositories/orderRepository";
import { CreateOrderDto } from "../types/orderTypes";
import { Product } from "../types/productTypes";

const generateOrderNumber = () =>
  `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export const getMyOrders = (userId: string) => findOrdersByUserId(userId);

export const getOrderById = async (userId: string, orderId: string) => {
  const order = await findOrderById(orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.user_id !== userId) throw new Error("FORBIDDEN");
  const items = await findOrderItems(orderId);
  return { ...order, items };
};

export const createOrder = async (userId: string, dto: CreateOrderDto) => {
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
        {
          id: item.productId,
        },
      );
      if (!product) throw new Error("PRODUCT_NOT_FOUND");
      if (product.status !== "active") throw new Error("PRODUCT_NOT_AVAILABLE");
      if (product.stock < item.quantity) throw new Error("INSUFFICIENT_STOCK");

      totalPrice += product.price * item.quantity;
      itemsWithPrice.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtOrder: product.price,
      });
    }

    const order = await createOrderInTx(client, {
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
      await createOrderItemInTx(client, { orderId: order.id, ...item });
      await decreaseStockInTx(client, item.productId, item.quantity);
    }

    return order;
  });
};

export const cancelOrder = async (userId: string, orderId: string) => {
  const order = await findOrderById(orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.user_id !== userId) throw new Error("FORBIDDEN");
  if (!["pending", "confirmed"].includes(order.status))
    throw new Error("CANNOT_CANCEL");
  await updateOrderStatus(orderId, "cancelled");
};

export const getAllOrdersForAdmin = () => findAllOrdersForAdmin();

export const updateOrderStatusByAdmin = async (
  orderId: string,
  status: string,
) => {
  const order = await findOrderById(orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  await updateOrderStatus(orderId, status);
};
