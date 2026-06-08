import cartRepo from "../repositories/cartRepository";
import { AddCartItemDto, UpdateCartItemDto } from "../types/cartTypes";
import { Errors } from "../utils/errors";

const getOrCreateCart = async (userId: string) => {
  const cart = await cartRepo.findCartByUserId(userId);
  if (cart) return cart;
  const created = await cartRepo.createCart(userId);
  if (!created) throw Errors.internal("장바구니 생성에 실패했습니다");
  return created;
};

const cartService = {
  async getCart(userId: string) {
    const cart = await getOrCreateCart(userId);
    const items = await cartRepo.findCartItems(cart.id);
    return { ...cart, items };
  },

  async addCartItem(userId: string, dto: AddCartItemDto) {
    const cart = await getOrCreateCart(userId);
    if (dto.quantity < 1) throw Errors.badRequest("수량은 1 이상이어야 합니다");
    return cartRepo.upsertCartItem({
      cartId: cart.id,
      productId: dto.productId,
      quantity: dto.quantity,
    });
  },

  async updateCartItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await getOrCreateCart(userId);
    if (dto.quantity < 1) throw Errors.badRequest("수량은 1 이상이어야 합니다");
    const count = await cartRepo.updateCartItemQuantity({
      itemId,
      cartId: cart.id,
      quantity: dto.quantity,
    });
    if (count === 0)
      throw Errors.notFound("장바구니 아이템을 찾을 수 없습니다");
  },

  async removeCartItem(userId: string, itemId: string) {
    const cart = await getOrCreateCart(userId);
    const count = await cartRepo.deleteCartItem(itemId, cart.id);
    if (count === 0)
      throw Errors.notFound("장바구니 아이템을 찾을 수 없습니다");
  },

  async clearCart(userId: string) {
    const cart = await getOrCreateCart(userId);
    await cartRepo.clearCartItems(cart.id);
  },
};
export default cartService;
