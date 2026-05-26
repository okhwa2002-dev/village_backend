import { ProductStatus } from "./commonTypes";

export interface Product {
  id: string;
  farmer_id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string;
  file_group_id: string | null;
  status: ProductStatus;
  created_at: Date;
  farmer_name?: string;
  farmer_user_id?: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  fileGroupId?: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  fileGroupId?: string;
  status?: ProductStatus;
}
