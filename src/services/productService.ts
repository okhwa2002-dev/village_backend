import {
  findAllProducts,
  findProductById,
  findProductsByFarmerId,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../repositories/productRepository";
import { findFarmerByUserId } from "../repositories/farmerRepository";
import { CreateProductDto, UpdateProductDto } from "../types/productTypes";

export const getProducts = (category?: string, farmerId?: string) =>
  findAllProducts({ category, farmerId });

export const getProductById = async (id: string) => {
  const product = await findProductById(id);
  if (!product) throw new Error("PRODUCT_NOT_FOUND");
  return product;
};

export const getMyProducts = async (userId: string) => {
  const profile = await findFarmerByUserId(userId);
  if (!profile) throw new Error("PROFILE_NOT_FOUND");
  return findProductsByFarmerId(profile.id);
};

export const createProductByFarmer = async (
  userId: string,
  dto: CreateProductDto,
) => {
  const profile = await findFarmerByUserId(userId);
  if (!profile) throw new Error("PROFILE_NOT_FOUND");

  return createProduct({
    farmerId: profile.id,
    name: dto.name,
    description: dto.description,
    price: dto.price,
    stock: dto.stock,
    category: dto.category,
    fileGroupId: dto.fileGroupId,
    status: "active",
  });
};

export const updateProductByFarmer = async (
  userId: string,
  productId: string,
  dto: UpdateProductDto,
) => {
  const profile = await findFarmerByUserId(userId);
  if (!profile) throw new Error("PROFILE_NOT_FOUND");

  const product = await updateProduct({
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

export const deleteProductByFarmer = async (
  userId: string,
  productId: string,
) => {
  const profile = await findFarmerByUserId(userId);
  if (!profile) throw new Error("PROFILE_NOT_FOUND");

  const count = await deleteProduct(productId, profile.id);
  if (count === 0) throw new Error("PRODUCT_NOT_FOUND");
};
