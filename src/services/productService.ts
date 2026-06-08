import productRepo from "../repositories/productRepository";
import farmerRepo from "../repositories/farmerRepository";
import { CreateProductDto, UpdateProductDto } from "../types/productTypes";

const getProducts = (category?: string, farmerId?: string) =>
  productRepo.findAllProducts({ category, farmerId });

const getProductById = async (id: string) => {
  const product = await productRepo.findProductById(id);
  if (!product) throw new Error("PRODUCT_NOT_FOUND");
  return product;
};

const getMyProducts = async (userId: string) => {
  const profile = await farmerRepo.findFarmerByUserId(userId);
  if (!profile) throw new Error("PROFILE_NOT_FOUND");
  return productRepo.findProductsByFarmerId(profile.id);
};

const createProductByFarmer = async (userId: string, dto: CreateProductDto) => {
  const profile = await farmerRepo.findFarmerByUserId(userId);
  if (!profile) throw new Error("PROFILE_NOT_FOUND");

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
};

const updateProductByFarmer = async (
  userId: string,
  productId: string,
  dto: UpdateProductDto,
) => {
  const profile = await farmerRepo.findFarmerByUserId(userId);
  if (!profile) throw new Error("PROFILE_NOT_FOUND");

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
  if (!product) throw new Error("PRODUCT_NOT_FOUND");
  return product;
};

const deleteProductByFarmer = async (userId: string, productId: string) => {
  const profile = await farmerRepo.findFarmerByUserId(userId);
  if (!profile) throw new Error("PROFILE_NOT_FOUND");

  const count = await productRepo.deleteProduct(productId, profile.id);
  if (count === 0) throw new Error("PRODUCT_NOT_FOUND");
};

export default {
  getProducts,
  getProductById,
  getMyProducts,
  createProductByFarmer,
  updateProductByFarmer,
  deleteProductByFarmer,
};
