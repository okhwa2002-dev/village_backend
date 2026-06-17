import menuRepo from "../repositories/menuRepository";
import {
  CreateMenuDto,
  CreateMenuGroupDto,
  UpdateMenuDto,
  UpdateMenuGroupDto,
} from "../types/menuTypes";

const menuService = {
  getMenus() {
    return menuRepo.findAllMenus();
  },

  getPublicMenus() {
    return menuRepo.findPublicMenus();
  },

  addMenu(dto: CreateMenuDto) {
    return menuRepo.createMenu({
      groupId: dto.groupId ?? null,
      parentId: dto.parentId ?? null,
      code: dto.code,
      name: dto.name,
      path: dto.path ?? null,
      icon: dto.icon ?? null,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? 0,
      useYn: dto.useYn ?? "Y",
      visibleYn: dto.visibleYn ?? "Y",
    });
  },

  editMenu(id: string, dto: UpdateMenuDto) {
    return menuRepo.updateMenu({
      id,
      groupId: dto.groupId ?? null,
      parentId: dto.parentId ?? null,
      code: dto.code,
      name: dto.name,
      path: dto.path ?? null,
      icon: dto.icon ?? null,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? 0,
      useYn: dto.useYn ?? "Y",
      visibleYn: dto.visibleYn ?? "Y",
    });
  },

  addMenuGroup(dto: CreateMenuGroupDto) {
    return menuRepo.createMenuGroup({
      code: dto.code,
      name: dto.name,
      icon: dto.icon ?? null,
      sortOrder: dto.sortOrder ?? 0,
      useYn: dto.useYn ?? "Y",
    });
  },

  editMenuGroup(id: string, dto: UpdateMenuGroupDto) {
    return menuRepo.updateMenuGroup({
      id,
      code: dto.code,
      name: dto.name,
      icon: dto.icon ?? null,
      sortOrder: dto.sortOrder ?? 0,
      useYn: dto.useYn ?? "Y",
    });
  },

  getMenuGroups() {
    return menuRepo.findAllMenuGroups();
  },

  getMenusByGroupId(groupId: string) {
    return menuRepo.findMenusByGroupId(groupId);
  },

  removeMenu(id: string) {
    return menuRepo.softDeleteMenuCascade(id);
  },
};
export default menuService;
