import { PoolClient } from "pg";
import {
  query,
  queryOne,
  execute,
  clientQueryOne,
  clientExecute,
} from "../db/pool";
import { Order, OrderItemDetail } from "../types/orderTypes";

export const findOrdersByUserId = (userId: string): Promise<Order[]> =>
  query<Order>("order", "findByUserId", { userId });

export const findOrderById = (id: string): Promise<Order | null> =>
  queryOne<Order>("order", "findById", { id });

export const findOrderItems = (orderId: string): Promise<OrderItemDetail[]> =>
  query<OrderItemDetail>("order", "findItems", { orderId });

export const findAllOrdersForAdmin = (): Promise<Order[]> =>
  query<Order>("order", "findAllForAdmin");

export const updateOrderStatus = (
  id: string,
  status: string,
): Promise<number> => execute("order", "updateStatus", { id, status });

export const createOrderInTx = (
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
): Promise<Order | null> =>
  clientQueryOne<Order>(client, "order", "create", params);

export const createOrderItemInTx = (
  client: PoolClient,
  params: {
    orderId: string;
    productId: string;
    quantity: number;
    priceAtOrder: number;
  },
): Promise<OrderItemDetail | null> =>
  clientQueryOne<OrderItemDetail>(client, "order", "createItem", params);

export const decreaseStockInTx = (
  client: PoolClient,
  productId: string,
  quantity: number,
): Promise<number> =>
  clientExecute(client, "product", "decreaseStock", {
    id: productId,
    quantity,
  });
