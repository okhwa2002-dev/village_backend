import { query, queryOne, execute } from "../db/pool";
import { Product } from "../types/productTypes";

const toProduct = (row: any): Product => ({
  id: row.id,
  farmerId: row.farmer_id,
  name: row.name,
  description: row.description ?? null,
  price: row.price,
  stock: row.stock,
  category: row.category,
  fileGroupId: row.file_group_id ?? null,
  status: row.status,
  createdAt: row.created_at,
  farmerName: row.farmer_name ?? undefined,
  farmerUserId: row.farmer_user_id ?? undefined,
});

export const findAllProducts = async (params: {
  category?: string;
  farmerId?: string;
}): Promise<Product[]> => {
  const rows = await query<any>("product", "findAll", params);
  return rows.map(toProduct);
};

export const findProductById = async (id: string): Promise<Product | null> => {
  const row = await queryOne<any>("product", "findById", { id });
  return row ? toProduct(row) : null;
};

export const findProductsByFarmerId = async (
  farmerId: string,
): Promise<Product[]> => {
  const rows = await query<any>("product", "findByFarmerId", { farmerId });
  return rows.map(toProduct);
};

export const createProduct = async (params: {
  farmerId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  fileGroupId?: string;
  status: string;
}): Promise<Product | null> => {
  const row = await queryOne<any>("product", "create", params);
  return row ? toProduct(row) : null;
};

export const updateProduct = async (params: {
  id: string;
  farmerId: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  fileGroupId?: string;
  status?: string;
}): Promise<Product | null> => {
  const row = await queryOne<any>("product", "update", params);
  return row ? toProduct(row) : null;
};

export const deleteProduct = (id: string, farmerId: string): Promise<number> =>
  execute("product", "delete", { id, farmerId });

export const decreaseProductStock = (
  id: string,
  quantity: number,
): Promise<number> => execute("product", "decreaseStock", { id, quantity });
