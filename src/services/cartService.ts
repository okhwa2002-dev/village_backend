import {
  findCartByUserId,
  createCart,
  findCartItems,
  upsertCartItem,
  updateCartItemQuantity,
  deleteCartItem,
  clearCartItems,
} from "../repositories/cartRepository";
import { AddCartItemDto, UpdateCartItemDto } from "../types/cartTypes";

const getOrCreateCart = async (userId: string) => {
  const cart = await findCartByUserId(userId);
  if (cart) return cart;
  const created = await createCart(userId);
  if (!created) throw new Error("CART_CREATE_FAILED");
  return created;
};

export const getCart = async (userId: string) => {
  const cart = await getOrCreateCart(userId);
  const items = await findCartItems(cart.id);
  return { ...cart, items };
};

export const addCartItem = async (userId: string, dto: AddCartItemDto) => {
  const cart = await getOrCreateCart(userId);
  if (dto.quantity < 1) throw new Error("INVALID_QUANTITY");
  return upsertCartItem({
    cartId: cart.id,
    productId: dto.productId,
    quantity: dto.quantity,
  });
};

export const updateCartItem = async (
  userId: string,
  itemId: string,
  dto: UpdateCartItemDto,
) => {
  const cart = await getOrCreateCart(userId);
  if (dto.quantity < 1) throw new Error("INVALID_QUANTITY");
  const count = await updateCartItemQuantity({
    itemId,
    cartId: cart.id,
    quantity: dto.quantity,
  });
  if (count === 0) throw new Error("ITEM_NOT_FOUND");
};

export const removeCartItem = async (userId: string, itemId: string) => {
  const cart = await getOrCreateCart(userId);
  const count = await deleteCartItem(itemId, cart.id);
  if (count === 0) throw new Error("ITEM_NOT_FOUND");
};

export const clearCart = async (userId: string) => {
  const cart = await getOrCreateCart(userId);
  await clearCartItems(cart.id);
};
