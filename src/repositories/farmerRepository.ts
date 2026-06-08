import { query, queryOne, execute } from "../db/pool";
import { FarmerProfile } from "../types/farmerTypes";
import { PaginatedResult } from "../types/commonTypes";

const toFarmerProfile = (row: any): FarmerProfile => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  bio: row.bio ?? null,
  fileGroupId: row.file_group_id ?? null,
  farmDescription: row.farm_description ?? null,
  email: row.email ?? null,
  status: row.status ?? undefined,
  createdAt: row.created_at ?? undefined,
});

const findAllFarmers = async (): Promise<FarmerProfile[]> => {
  const rows = await query<any>("farmer", "findAll");
  return rows.map(toFarmerProfile);
};

const findFarmerById = async (id: string): Promise<FarmerProfile | null> => {
  const row = await queryOne<any>("farmer", "findById", { id });
  return row ? toFarmerProfile(row) : null;
};

const findFarmerByUserId = async (
  userId: string,
): Promise<FarmerProfile | null> => {
  const row = await queryOne<any>("farmer", "findByUserId", { userId });
  return row ? toFarmerProfile(row) : null;
};

const createFarmerProfile = async (params: {
  userId: string;
  name: string;
  bio?: string;
  fileGroupId?: string;
  farmDescription?: string;
}): Promise<FarmerProfile | null> => {
  const row = await queryOne<any>("farmer", "create", params);
  return row ? toFarmerProfile(row) : null;
};

const updateFarmerProfile = async (params: {
  userId: string;
  name?: string;
  bio?: string;
  fileGroupId?: string;
  farmDescription?: string;
}): Promise<FarmerProfile | null> => {
  const row = await queryOne<any>("farmer", "update", params);
  return row ? toFarmerProfile(row) : null;
};

const findAllFarmersForAdmin = async (
  page: number,
  limit: number,
): Promise<PaginatedResult<FarmerProfile>> => {
  const offset = (page - 1) * limit;
  const [rows, countRows] = await Promise.all([
    query<any>("farmer", "findAllForAdmin", { limit, offset }),
    query<any>("farmer", "countForAdmin"),
  ]);
  return {
    items: rows.map(toFarmerProfile),
    total: Number(countRows[0]?.total ?? 0),
    page,
    limit,
  };
};

const findAllFarmersForExport = async (): Promise<FarmerProfile[]> => {
  const rows = await query<any>("farmer", "findAllForAdminExport");
  return rows.map(toFarmerProfile);
};

const updateFarmerUserStatus = (
  userId: string,
  status: string,
): Promise<number> => execute("farmer", "updateUserStatus", { userId, status });

export default {
  findAllFarmers,
  findFarmerById,
  findFarmerByUserId,
  createFarmerProfile,
  updateFarmerProfile,
  findAllFarmersForAdmin,
  findAllFarmersForExport,
  updateFarmerUserStatus,
};
