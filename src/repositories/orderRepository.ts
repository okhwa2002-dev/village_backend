import { PoolClient } from "pg";
import {
  query,
  queryOne,
  execute,
  clientQueryOne,
  clientExecute,
} from "../db/pool";
import { Order, OrderItemDetail } from "../types/orderTypes";

const toOrder = (row: any): Order => ({
  id: row.id,
  orderNumber: row.order_number,
  userId: row.user_id ?? null,
  consumerName: row.consumer_name,
  consumerPhone: row.consumer_phone,
  consumerEmail: row.consumer_email,
  address: row.address,
  memo: row.memo ?? null,
  status: row.status,
  totalPrice: row.total_price,
  createdAt: row.created_at,
});

const toOrderItem = (row: any): OrderItemDetail => ({
  id: row.id,
  orderId: row.order_id,
  productId: row.product_id,
  quantity: row.quantity,
  priceAtOrder: row.price_at_order,
  productName: row.product_name,
  fileGroupId: row.file_group_id ?? null,
});

const findOrdersByUserId = async (userId: string): Promise<Order[]> => {
  const rows = await query<any>("order", "findByUserId", { userId });
  return rows.map(toOrder);
};

const findOrderById = async (id: string): Promise<Order | null> => {
  const row = await queryOne<any>("order", "findById", { id });
  return row ? toOrder(row) : null;
};

const findOrderItems = async (orderId: string): Promise<OrderItemDetail[]> => {
  const rows = await query<any>("order", "findItems", { orderId });
  return rows.map(toOrderItem);
};

const findAllOrdersForAdmin = async (): Promise<Order[]> => {
  const rows = await query<any>("order", "findAllForAdmin");
  return rows.map(toOrder);
};

const updateOrderStatus = (id: string, status: string): Promise<number> =>
  execute("order", "updateStatus", { id, status });

const createOrderInTx = async (
  client: PoolClient,
  params: {
    orderNumber: string;
    userId: string;
    consumerName: string;
    consumerPhone: string;
    consumerEmail: string;
    address: string;
    memo?: string;
    totalPrice: number;
  },
): Promise<Order | null> => {
  const row = await clientQueryOne<any>(client, "order", "create", params);
  return row ? toOrder(row) : null;
};

const createOrderItemInTx = async (
  client: PoolClient,
  params: {
    orderId: string;
    productId: string;
    quantity: number;
    priceAtOrder: number;
  },
): Promise<OrderItemDetail | null> => {
  const row = await clientQueryOne<any>(client, "order", "createItem", params);
  return row ? toOrderItem(row) : null;
};

const decreaseStockInTx = (
  client: PoolClient,
  productId: string,
  quantity: number,
): Promise<number> =>
  clientExecute(client, "product", "decreaseStock", {
    id: productId,
    quantity,
  });

export default {
  findOrdersByUserId,
  findOrderById,
  findOrderItems,
  findAllOrdersForAdmin,
  updateOrderStatus,
  createOrderInTx,
  createOrderItemInTx,
  decreaseStockInTx,
};
