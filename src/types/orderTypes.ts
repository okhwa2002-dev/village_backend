import { OrderStatus } from "./commonTypes";

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  consumerName: string;
  consumerPhone: string;
  consumerEmail: string;
  address: string;
  memo: string | null;
  status: OrderStatus;
  totalPrice: number;
  createdAt: Date;
  items?: OrderItemDetail[];
}

export interface OrderItemDetail {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceAtOrder: number;
  productName: string;
  fileGroupId: string | null;
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
}

export interface CreateOrderDto {
  consumerName: string;
  consumerPhone: string;
  consumerEmail: string;
  address: string;
  memo?: string;
  items: CreateOrderItemDto[];
}
