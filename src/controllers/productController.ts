import { FastifyRequest, FastifyReply } from "fastify";
import { CreateProductDto, UpdateProductDto } from "../types/productTypes";
import productService from "../services/productService";
import { successResponse } from "../utils/response";
import { handleError } from "../utils/errors";

const productController = {
  async list(
    req: FastifyRequest<{
      Querystring: { category?: string; farmerId?: string };
    }>,
    reply: FastifyReply,
  ) {
    const products = await productService.getProducts(
      req.query.category,
      req.query.farmerId,
    );
    return reply.send(successResponse(products));
  },

  async getById(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const product = await productService.getProductById(req.params.id);
      return reply.send(successResponse(product));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async listMine(req: FastifyRequest, reply: FastifyReply) {
    try {
      const products = await productService.getMyProducts(req.user.id);
      return reply.send(successResponse(products));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async create(
    req: FastifyRequest<{ Body: CreateProductDto }>,
    reply: FastifyReply,
  ) {
    try {
      const product = await productService.createProductByFarmer(
        req.user.id,
        req.body,
      );
      return reply
        .code(201)
        .send(successResponse(product, "상품이 등록되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async update(
    req: FastifyRequest<{ Params: { id: string }; Body: UpdateProductDto }>,
    reply: FastifyReply,
  ) {
    try {
      const product = await productService.updateProductByFarmer(
        req.user.id,
        req.params.id,
        req.body,
      );
      return reply.send(successResponse(product, "상품이 수정되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },

  async delete(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      await productService.deleteProductByFarmer(req.user.id, req.params.id);
      return reply.send(successResponse(null, "상품이 삭제되었습니다"));
    } catch (err: unknown) {
      return handleError(err, reply);
    }
  },
};
export default productController;
