export interface Menu {
  id: string;
  groupId: string | null;
  parentId: string | null;
  code: string;
  name: string;
  path: string | null;
  icon: string | null;
  dept: number;
  description: string | null;
  sortOrder: number;
  useYn: string;
  visibleYn: string;
  createdAt: string;
}

export interface MenuGroup {
  groupId: string;
  groupCode: string;
  groupName: string;
  groupIcon: string | null;
  groupSortOrder: number;
  groupUseYn: string;
  menus: Menu[];
}

export interface CreateMenuDto {
  groupId?: string | null;
  parentId?: string | null;
  code: string;
  name: string;
  path?: string | null;
  icon?: string | null;
  description?: string | null;
  sortOrder?: number;
  useYn?: string;
  visibleYn?: string;
}

export interface UpdateMenuDto {
  groupId?: string | null;
  parentId?: string | null;
  code: string;
  name: string;
  path?: string | null;
  icon?: string | null;
  description?: string | null;
  sortOrder?: number;
  useYn?: string;
  visibleYn?: string;
}
