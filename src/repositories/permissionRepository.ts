import { query } from "../db/pool";
import { MenuPermission } from "../types/permissionTypes";

const permissionRepo = {
  getUserMenuPermissions(userId: string): Promise<MenuPermission[]> {
    return query<MenuPermission>("permission", "getUserMenuPermissions", {
      userId,
    });
  },
};
export default permissionRepo;
