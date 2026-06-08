import { query } from "../db/pool";
import { MenuPermission } from "../types/permissionTypes";

const getUserMenuPermissions = (userId: string): Promise<MenuPermission[]> =>
  query<MenuPermission>("permission", "getUserMenuPermissions", { userId });

export default { getUserMenuPermissions };
