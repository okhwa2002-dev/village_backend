import { query, queryOne, execute } from "../db/pool";
import { Cart, CartItem } from "../types/cartTypes";

const toCart = (row: any): Cart => ({
  id: row.id,
  userId: row.user_id,
  createdAt: row.created_at,
});

const toCartItem = (row: any): CartItem => ({
  id: row.id,
  cartId: row.cart_id,
  productId: row.product_id,
  quantity: row.quantity,
  productName: row.product_name ?? null,
  price: row.price ?? null,
  stock: row.stock ?? null,
  fileGroupId: row.file_group_id ?? null,
  productStatus: row.product_status ?? null,
  farmerName: row.farmer_name ?? null,
});

export const findCartByUserId = async (
  userId: string,
): Promise<Cart | null> => {
  const row = await queryOne<any>("cart", "findByUserId", { userId });
  return row ? toCart(row) : null;
};

export const createCart = async (userId: string): Promise<Cart | null> => {
  const row = await queryOne<any>("cart", "create", { userId });
  return row ? toCart(row) : null;
};

export const findCartItems = async (cartId: string): Promise<CartItem[]> => {
  const rows = await query<any>("cart", "findItems", { cartId });
  return rows.map(toCartItem);
};

export const upsertCartItem = async (params: {
  cartId: string;
  productId: string;
  quantity: number;
}): Promise<CartItem | null> => {
  const row = await queryOne<any>("cart", "upsertItem", params);
  return row ? toCartItem(row) : null;
};

export const updateCartItemQuantity = (params: {
  itemId: string;
  cartId: string;
  quantity: number;
}): Promise<number> => execute("cart", "updateItemQuantity", params);

export const deleteCartItem = (
  itemId: string,
  cartId: string,
): Promise<number> => execute("cart", "deleteItem", { itemId, cartId });

export const clearCartItems = (cartId: string): Promise<number> =>
  execute("cart", "clearItems", { cartId });
