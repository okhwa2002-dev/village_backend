import { ProductStatus } from "./commonTypes";

export interface Product {
  id: string;
  farmerId: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string;
  fileGroupId: string | null;
  status: ProductStatus;
  createdAt: Date;
  farmerName?: string;
  farmerUserId?: string;
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
