import { execute, query, queryOne } from "../db/pool";
import { Menu, MenuGroup } from "../types/menuTypes";

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

const findAllMenus = async (): Promise<MenuGroup[]> => {
  const rows = await query<any>("menu", "findAllMenus");
  return groupRows(rows);
};

const findPublicMenus = async (): Promise<MenuGroup[]> => {
  const rows = await query<any>("menu", "findPublicMenus");
  return groupRows(rows);
};

const createMenu = async (params: {
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
}): Promise<Menu | null> => {
  const row = await queryOne<any>("menu", "createMenu", params);
  return row ? toMenu(row) : null;
};

const updateMenu = async (params: {
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
}): Promise<Menu | null> => {
  const row = await queryOne<any>("menu", "updateMenu", params);
  return row ? toMenu(row) : null;
};

const softDeleteMenuCascade = (id: string): Promise<number> =>
  execute("menu", "softDeleteMenuCascade", { id });

export default {
  findAllMenus,
  findPublicMenus,
  createMenu,
  updateMenu,
  softDeleteMenuCascade,
};
