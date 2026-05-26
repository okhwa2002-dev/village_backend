import { FastifyRequest, FastifyReply } from "fastify";
import { CreateProductDto, UpdateProductDto } from "../types/productTypes";
import {
  getProducts,
  getProductById,
  getMyProducts,
  createProductByFarmer,
  updateProductByFarmer,
  deleteProductByFarmer,
} from "../services/productService";
import { successResponse, errorResponse } from "../utils/response";

export const getProductsHandler = async (
  req: FastifyRequest<{
    Querystring: { category?: string; farmerId?: string };
  }>,
  reply: FastifyReply,
) => {
  const products = await getProducts(req.query.category, req.query.farmerId);
  return reply.send(successResponse(products));
};

export const getProductHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  try {
    const product = await getProductById(req.params.id);
    return reply.send(successResponse(product));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "PRODUCT_NOT_FOUND")
      return reply.code(404).send(errorResponse("상품을 찾을 수 없습니다"));
    throw err;
  }
};

export const getMyProductsHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    const products = await getMyProducts(user.id);
    return reply.send(successResponse(products));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "PROFILE_NOT_FOUND")
      return reply.code(404).send(errorResponse("농민 프로필이 없습니다"));
    throw err;
  }
};

export const createProductHandler = async (
  req: FastifyRequest<{ Body: CreateProductDto }>,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    const product = await createProductByFarmer(user.id, req.body);
    return reply
      .code(201)
      .send(successResponse(product, "상품이 등록되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "PROFILE_NOT_FOUND")
      return reply.code(404).send(errorResponse("농민 프로필이 없습니다"));
    throw err;
  }
};

export const updateProductHandler = async (
  req: FastifyRequest<{ Params: { id: string }; Body: UpdateProductDto }>,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    const product = await updateProductByFarmer(
      user.id,
      req.params.id,
      req.body,
    );
    return reply.send(successResponse(product, "상품이 수정되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "PRODUCT_NOT_FOUND")
        return reply.code(404).send(errorResponse("상품을 찾을 수 없습니다"));
      if (err.message === "PROFILE_NOT_FOUND")
        return reply.code(404).send(errorResponse("농민 프로필이 없습니다"));
    }
    throw err;
  }
};

export const deleteProductHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  try {
    const user = req.user;
    await deleteProductByFarmer(user.id, req.params.id);
    return reply.send(successResponse(null, "상품이 삭제되었습니다"));
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "PRODUCT_NOT_FOUND")
        return reply.code(404).send(errorResponse("상품을 찾을 수 없습니다"));
      if (err.message === "PROFILE_NOT_FOUND")
        return reply.code(404).send(errorResponse("농민 프로필이 없습니다"));
    }
    throw err;
  }
};
