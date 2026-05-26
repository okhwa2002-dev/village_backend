import { query } from "../db/pool";
import { MenuPermission } from "../types/permissionTypes";

export const getUserMenuPermissions = (
  userId: string,
): Promise<MenuPermission[]> =>
  query<MenuPermission>("permission", "getUserMenuPermissions", { userId });
