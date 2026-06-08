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

const farmerRepo = {
  async findAllFarmers(): Promise<FarmerProfile[]> {
    const rows = await query<any>("farmer", "findAll");
    return rows.map(toFarmerProfile);
  },

  async findFarmerById(id: string): Promise<FarmerProfile | null> {
    const row = await queryOne<any>("farmer", "findById", { id });
    return row ? toFarmerProfile(row) : null;
  },

  async findFarmerByUserId(userId: string): Promise<FarmerProfile | null> {
    const row = await queryOne<any>("farmer", "findByUserId", { userId });
    return row ? toFarmerProfile(row) : null;
  },

  async createFarmerProfile(params: {
    userId: string;
    name: string;
    bio?: string;
    fileGroupId?: string;
    farmDescription?: string;
  }): Promise<FarmerProfile | null> {
    const row = await queryOne<any>("farmer", "create", params);
    return row ? toFarmerProfile(row) : null;
  },

  async updateFarmerProfile(params: {
    userId: string;
    name?: string;
    bio?: string;
    fileGroupId?: string;
    farmDescription?: string;
  }): Promise<FarmerProfile | null> {
    const row = await queryOne<any>("farmer", "update", params);
    return row ? toFarmerProfile(row) : null;
  },

  async findAllFarmersForAdmin(
    page: number,
    limit: number,
    filters: { keyword?: string | null; status?: string | null } = {},
  ): Promise<PaginatedResult<FarmerProfile>> {
    const offset = (page - 1) * limit;
    const conditions = {
      keyword: filters.keyword ?? null,
      status: filters.status ?? null,
    };
    const [rows, countRows] = await Promise.all([
      query<any>("farmer", "findAllForAdmin", { ...conditions, limit, offset }),
      query<any>("farmer", "countForAdmin", conditions),
    ]);
    return {
      items: rows.map(toFarmerProfile),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  },

  async findAllFarmersForExport(
    filters: { keyword?: string | null; status?: string | null } = {},
  ): Promise<FarmerProfile[]> {
    const rows = await query<any>("farmer", "findAllForAdminExport", {
      keyword: filters.keyword ?? null,
      status: filters.status ?? null,
    });
    return rows.map(toFarmerProfile);
  },

  updateFarmerUserStatus(userId: string, status: string): Promise<number> {
    return execute("farmer", "updateUserStatus", { userId, status });
  },
};
export default farmerRepo;
