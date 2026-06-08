import cartRepo from "../repositories/cartRepository";
import { AddCartItemDto, UpdateCartItemDto } from "../types/cartTypes";

const getOrCreateCart = async (userId: string) => {
  const cart = await cartRepo.findCartByUserId(userId);
  if (cart) return cart;
  const created = await cartRepo.createCart(userId);
  if (!created) throw new Error("CART_CREATE_FAILED");
  return created;
};

const getCart = async (userId: string) => {
  const cart = await getOrCreateCart(userId);
  const items = await cartRepo.findCartItems(cart.id);
  return { ...cart, items };
};

const addCartItem = async (userId: string, dto: AddCartItemDto) => {
  const cart = await getOrCreateCart(userId);
  if (dto.quantity < 1) throw new Error("INVALID_QUANTITY");
  return cartRepo.upsertCartItem({
    cartId: cart.id,
    productId: dto.productId,
    quantity: dto.quantity,
  });
};

const updateCartItem = async (
  userId: string,
  itemId: string,
  dto: UpdateCartItemDto,
) => {
  const cart = await getOrCreateCart(userId);
  if (dto.quantity < 1) throw new Error("INVALID_QUANTITY");
  const count = await cartRepo.updateCartItemQuantity({
    itemId,
    cartId: cart.id,
    quantity: dto.quantity,
  });
  if (count === 0) throw new Error("ITEM_NOT_FOUND");
};

const removeCartItem = async (userId: string, itemId: string) => {
  const cart = await getOrCreateCart(userId);
  const count = await cartRepo.deleteCartItem(itemId, cart.id);
  if (count === 0) throw new Error("ITEM_NOT_FOUND");
};

const clearCart = async (userId: string) => {
  const cart = await getOrCreateCart(userId);
  await cartRepo.clearCartItems(cart.id);
};

export default {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
};
