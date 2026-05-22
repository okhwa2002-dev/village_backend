import { OrderStatus } from "./commonTypes";

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  consumer_name: string;
  consumer_phone: string;
  consumer_email: string;
  address: string;
  memo: string | null;
  status: OrderStatus;
  total_price: number;
  created_at: Date;
  items?: OrderItemDetail[];
}

export interface OrderItemDetail {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_order: number;
  product_name: string;
  images: string[];
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
