import { query, queryOne, execute } from "../db/pool";
import { Product } from "../types/productTypes";

export const findAllProducts = (params: {
  category?: string;
  farmerId?: string;
}): Promise<Product[]> => query<Product>("product", "findAll", params);

export const findProductById = (id: string): Promise<Product | null> =>
  queryOne<Product>("product", "findById", { id });

export const findProductsByFarmerId = (farmerId: string): Promise<Product[]> =>
  query<Product>("product", "findByFarmerId", { farmerId });

export const createProduct = (params: {
  farmerId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  fileGroupId?: string;
  status: string;
}): Promise<Product | null> => queryOne<Product>("product", "create", params);

export const updateProduct = (params: {
  id: string;
  farmerId: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  fileGroupId?: string;
  status?: string;
}): Promise<Product | null> => queryOne<Product>("product", "update", params);

export const deleteProduct = (id: string, farmerId: string): Promise<number> =>
  execute("product", "delete", { id, farmerId });

export const decreaseProductStock = (
  id: string,
  quantity: number,
): Promise<number> => execute("product", "decreaseStock", { id, quantity });
