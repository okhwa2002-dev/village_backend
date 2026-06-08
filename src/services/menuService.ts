import menuRepo from "../repositories/menuRepository";
import { CreateMenuDto, UpdateMenuDto } from "../types/menuTypes";

const getMenus = () => menuRepo.findAllMenus();

const getPublicMenus = () => menuRepo.findPublicMenus();

const addMenu = (dto: CreateMenuDto) =>
  menuRepo.createMenu({
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

const editMenu = (id: string, dto: UpdateMenuDto) =>
  menuRepo.updateMenu({
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

const removeMenu = (id: string) => menuRepo.softDeleteMenuCascade(id);

export default { getMenus, getPublicMenus, addMenu, editMenu, removeMenu };
