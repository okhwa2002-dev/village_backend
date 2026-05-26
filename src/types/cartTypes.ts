export interface Cart {
  id: string;
  user_id: string;
  created_at: Date;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  product_name: string;
  price: number;
  stock: number;
  file_group_id: string | null;
  product_status: string;
  farmer_name: string;
}

export interface AddCartItemDto {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}
