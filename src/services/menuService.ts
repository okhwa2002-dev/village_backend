import menuRepo from "../repositories/menuRepository";
import { CreateMenuDto, UpdateMenuDto } from "../types/menuTypes";

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

  removeMenu(id: string) {
    return menuRepo.softDeleteMenuCascade(id);
  },
};
export default menuService;
