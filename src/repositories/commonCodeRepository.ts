import { execute, query, queryOne } from "../db/pool";
import { CommonCode, CommonCodeGroup } from "../types/commonCodeTypes";

const toGroup = (row: any): CommonCodeGroup => ({
  id: row.id,
  code: row.code,
  name: row.name,
  description: row.description ?? null,
  useYn: row.use_yn,
  createdAt: row.created_at,
});

const toCode = (row: any): CommonCode => ({
  id: row.id,
  groupId: row.group_id,
  code: row.code,
  name: row.name,
  extraValue: row.extra_value ?? null,
  sortOrder: row.sort_order,
  useYn: row.use_yn,
  createdAt: row.created_at,
});

const commonCodeRepo = {
  async findAllGroups(): Promise<CommonCodeGroup[]> {
    const rows = await query<any>("commonCode", "findAllGroups");
    return rows.map(toGroup);
  },

  async createGroup(params: {
    code: string;
    name: string;
    description?: string | null;
    useYn: string;
  }): Promise<CommonCodeGroup | null> {
    const row = await queryOne<any>("commonCode", "createGroup", params);
    return row ? toGroup(row) : null;
  },

  async updateGroup(params: {
    id: string;
    name: string;
    description?: string | null;
    useYn: string;
  }): Promise<CommonCodeGroup | null> {
    const row = await queryOne<any>("commonCode", "updateGroup", params);
    return row ? toGroup(row) : null;
  },

  softDeleteGroup(id: string): Promise<number> {
    return execute("commonCode", "softDeleteGroup", { id });
  },

  async findCodesByGroupId(groupId: string): Promise<CommonCode[]> {
    const rows = await query<any>("commonCode", "findCodesByGroupId", {
      groupId,
    });
    return rows.map(toCode);
  },

  async createCode(params: {
    groupId: string;
    code: string;
    name: string;
    extraValue?: string | null;
    sortOrder: number;
    useYn: string;
  }): Promise<CommonCode | null> {
    const row = await queryOne<any>("commonCode", "createCode", params);
    return row ? toCode(row) : null;
  },

  async updateCode(params: {
    id: string;
    name: string;
    extraValue?: string | null;
    sortOrder: number;
    useYn: string;
  }): Promise<CommonCode | null> {
    const row = await queryOne<any>("commonCode", "updateCode", params);
    return row ? toCode(row) : null;
  },

  softDeleteCode(id: string): Promise<number> {
    return execute("commonCode", "softDeleteCode", { id });
  },
};
export default commonCodeRepo;
