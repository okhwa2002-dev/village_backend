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

const orderRepo = {
  async findOrdersByUserId(userId: string): Promise<Order[]> {
    const rows = await query<any>("order", "findByUserId", { userId });
    return rows.map(toOrder);
  },

  async findOrderById(id: string): Promise<Order | null> {
    const row = await queryOne<any>("order", "findById", { id });
    return row ? toOrder(row) : null;
  },

  async findOrderItems(orderId: string): Promise<OrderItemDetail[]> {
    const rows = await query<any>("order", "findItems", { orderId });
    return rows.map(toOrderItem);
  },

  async findAllOrdersForAdmin(): Promise<Order[]> {
    const rows = await query<any>("order", "findAllForAdmin");
    return rows.map(toOrder);
  },

  updateOrderStatus(id: string, status: string): Promise<number> {
    return execute("order", "updateStatus", { id, status });
  },

  async createOrderInTx(
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
  ): Promise<Order | null> {
    const row = await clientQueryOne<any>(client, "order", "create", params);
    return row ? toOrder(row) : null;
  },

  async createOrderItemInTx(
    client: PoolClient,
    params: {
      orderId: string;
      productId: string;
      quantity: number;
      priceAtOrder: number;
    },
  ): Promise<OrderItemDetail | null> {
    const row = await clientQueryOne<any>(
      client,
      "order",
      "createItem",
      params,
    );
    return row ? toOrderItem(row) : null;
  },

  decreaseStockInTx(
    client: PoolClient,
    productId: string,
    quantity: number,
  ): Promise<number> {
    return clientExecute(client, "product", "decreaseStock", {
      id: productId,
      quantity,
    });
  },
};
export default orderRepo;
