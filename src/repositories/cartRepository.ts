import { query, queryOne, execute } from "../db/pool";
import { Cart, CartItem } from "../types/cartTypes";

export const findCartByUserId = (userId: string): Promise<Cart | null> =>
  queryOne<Cart>("cart", "findByUserId", { userId });

export const createCart = (userId: string): Promise<Cart | null> =>
  queryOne<Cart>("cart", "create", { userId });

export const findCartItems = (cartId: string): Promise<CartItem[]> =>
  query<CartItem>("cart", "findItems", { cartId });

export const upsertCartItem = (params: {
  cartId: string;
  productId: string;
  quantity: number;
}): Promise<CartItem | null> =>
  queryOne<CartItem>("cart", "upsertItem", params);

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
