export interface Cart {
  id: string;
  userId: string;
  createdAt: Date;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  productName: string;
  price: number;
  stock: number;
  fileGroupId: string | null;
  productStatus: string;
  farmerName: string;
}

export interface AddCartItemDto {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}
