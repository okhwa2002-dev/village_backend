import {
  createMenu,
  findAllMenus,
  findPublicMenus,
  softDeleteMenuCascade,
  updateMenu,
} from "../repositories/menuRepository";
import { CreateMenuDto, UpdateMenuDto } from "../types/menuTypes";

export const getMenus = () => findAllMenus();

export const getPublicMenus = () => findPublicMenus();

export const addMenu = (dto: CreateMenuDto) =>
  createMenu({
    parentId: dto.parentId ?? null,
    name: dto.name,
    path: dto.path ?? null,
    icon: dto.icon ?? null,
    description: dto.description ?? null,
    sortOrder: dto.sortOrder ?? 0,
    useYn: dto.useYn ?? "Y",

  });

export const editMenu = (id: string, dto: UpdateMenuDto) =>
  updateMenu({
    id,
    name: dto.name,
    path: dto.path ?? null,
    icon: dto.icon ?? null,
    description: dto.description ?? null,
    sortOrder: dto.sortOrder ?? 0,
    useYn: dto.useYn ?? "Y",

  });

export const removeMenu = (id: string) => softDeleteMenuCascade(id);
