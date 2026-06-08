import productRepo from "../repositories/productRepository";
import farmerRepo from "../repositories/farmerRepository";
import { CreateProductDto, UpdateProductDto } from "../types/productTypes";
import { Errors } from "../utils/errors";

const productService = {
  getProducts(category?: string, farmerId?: string) {
    return productRepo.findAllProducts({ category, farmerId });
  },

  async getProductById(id: string) {
    const product = await productRepo.findProductById(id);
    if (!product) throw Errors.notFound("상품을 찾을 수 없습니다");
    return product;
  },

  async getMyProducts(userId: string) {
    const profile = await farmerRepo.findFarmerByUserId(userId);
    if (!profile) throw Errors.notFound("농민 프로필이 없습니다");
    return productRepo.findProductsByFarmerId(profile.id);
  },

  async createProductByFarmer(userId: string, dto: CreateProductDto) {
    const profile = await farmerRepo.findFarmerByUserId(userId);
    if (!profile) throw Errors.notFound("농민 프로필이 없습니다");

    return productRepo.createProduct({
      farmerId: profile.id,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      category: dto.category,
      fileGroupId: dto.fileGroupId,
      status: "ACTIVE",
    });
  },

  async updateProductByFarmer(
    userId: string,
    productId: string,
    dto: UpdateProductDto,
  ) {
    const profile = await farmerRepo.findFarmerByUserId(userId);
    if (!profile) throw Errors.notFound("농민 프로필이 없습니다");

    const product = await productRepo.updateProduct({
      id: productId,
      farmerId: profile.id,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      category: dto.category,
      fileGroupId: dto.fileGroupId,
      status: dto.status,
    });
    if (!product) throw Errors.notFound("상품을 찾을 수 없습니다");
    return product;
  },

  async deleteProductByFarmer(userId: string, productId: string) {
    const profile = await farmerRepo.findFarmerByUserId(userId);
    if (!profile) throw Errors.notFound("농민 프로필이 없습니다");

    const count = await productRepo.deleteProduct(productId, profile.id);
    if (count === 0) throw Errors.notFound("상품을 찾을 수 없습니다");
  },
};
export default productService;
