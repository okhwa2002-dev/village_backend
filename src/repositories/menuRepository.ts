import { execute, query, queryOne } from "../db/pool";
import { Menu, MenuGroup, MenuGroupSummary } from "../types/menuTypes";

const toMenu = (row: any): Menu => ({
  id: row.id,
  groupId: row.group_id ?? null,
  parentId: row.parent_id ?? null,
  code: row.code,
  name: row.name,
  path: row.path ?? null,
  icon: row.icon ?? null,
  dept: row.dept ?? 1,
  description: row.description ?? null,
  sortOrder: row.sort_order,
  useYn: row.use_yn,
  visibleYn: row.visible_yn ?? "Y",
  createdAt: row.created_at,
});

const toMenuGroupSummary = (row: any): MenuGroupSummary => ({
  id: row.id,
  code: row.code,
  name: row.name,
  icon: row.icon ?? null,
  sortOrder: row.sort_order,
  useYn: row.use_yn,
});

const groupRows = (rows: any[]): MenuGroup[] => {
  const groupMap = new Map<string, MenuGroup>();
  for (const row of rows) {
    const gid = String(row.group_id);
    if (!groupMap.has(gid)) {
      groupMap.set(gid, {
        groupId: gid,
        groupCode: row.group_code,
        groupName: row.group_name,
        groupIcon: row.group_icon ?? null,
        groupSortOrder: row.group_sort_order,
        groupUseYn: row.group_use_yn,
        menus: [],
      });
    }
    if (row.id !== null) {
      groupMap.get(gid)!.menus.push(toMenu(row));
    }
  }
  return Array.from(groupMap.values());
};

const menuRepo = {
  async findAllMenus(): Promise<MenuGroup[]> {
    const rows = await query<any>("menu", "findAllMenus");
    return groupRows(rows);
  },

  async findPublicMenus(): Promise<MenuGroup[]> {
    const rows = await query<any>("menu", "findPublicMenus");
    return groupRows(rows);
  },

  async createMenu(params: {
    groupId?: string | null;
    parentId?: string | null;
    code: string;
    name: string;
    path?: string | null;
    icon?: string | null;
    description?: string | null;
    sortOrder: number;
    useYn: string;
    visibleYn: string;
  }): Promise<Menu | null> {
    const row = await queryOne<any>("menu", "createMenu", params);
    return row ? toMenu(row) : null;
  },

  async updateMenu(params: {
    id: string;
    groupId?: string | null;
    parentId?: string | null;
    code: string;
    name: string;
    path?: string | null;
    icon?: string | null;
    description?: string | null;
    sortOrder: number;
    useYn: string;
    visibleYn: string;
  }): Promise<Menu | null> {
    const row = await queryOne<any>("menu", "updateMenu", params);
    return row ? toMenu(row) : null;
  },

  async createMenuGroup(params: {
    code: string;
    name: string;
    icon?: string | null;
    sortOrder: number;
    useYn: string;
  }): Promise<MenuGroupSummary | null> {
    const row = await queryOne<any>("menu", "createMenuGroup", params);
    return row ? toMenuGroupSummary(row) : null;
  },

  async updateMenuGroup(params: {
    id: string;
    code: string;
    name: string;
    icon?: string | null;
    sortOrder: number;
    useYn: string;
  }): Promise<MenuGroupSummary | null> {
    const row = await queryOne<any>("menu", "updateMenuGroup", params);
    return row ? toMenuGroupSummary(row) : null;
  },

  async findAllMenuGroups(): Promise<MenuGroupSummary[]> {
    const rows = await query<any>("menu", "findAllMenuGroups");
    return rows.map(toMenuGroupSummary);
  },

  async findMenusByGroupId(groupId: string): Promise<Menu[]> {
    const rows = await query<any>("menu", "findMenusByGroupId", { groupId });
    return rows.map(toMenu);
  },

  softDeleteMenuCascade(id: string): Promise<number> {
    return execute("menu", "softDeleteMenuCascade", { id });
  },
};
export default menuRepo;
