import {
  createCode,
  createGroup,
  findAllGroups,
  findCodesByGroupId,
  softDeleteCode,
  softDeleteGroup,
  updateCode,
  updateGroup,
} from "../repositories/commonCodeRepository";
import {
  CreateCodeDto,
  CreateGroupDto,
  UpdateCodeDto,
  UpdateGroupDto,
} from "../types/commonCodeTypes";

export const getGroups = () => findAllGroups();

export const addGroup = (dto: CreateGroupDto) =>
  createGroup({
    code: dto.code,
    name: dto.name,
    description: dto.description ?? null,
    useYn: dto.useYn ?? "Y",
  });

export const editGroup = (id: string, dto: UpdateGroupDto) =>
  updateGroup({
    id,
    name: dto.name,
    description: dto.description ?? null,
    useYn: dto.useYn,
  });

export const removeGroup = (id: string) => softDeleteGroup(id);

export const getCodes = (groupId: string) => findCodesByGroupId(groupId);

export const addCode = (groupId: string, dto: CreateCodeDto) =>
  createCode({
    groupId,
    code: dto.code,
    name: dto.name,
    extraValue: dto.extraValue ?? null,
    sortOrder: dto.sortOrder ?? 0,
    useYn: dto.useYn ?? "Y",
  });

export const editCode = (id: string, dto: UpdateCodeDto) =>
  updateCode({
    id,
    name: dto.name,
    extraValue: dto.extraValue ?? null,
    sortOrder: dto.sortOrder,
    useYn: dto.useYn,
  });

export const removeCode = (id: string) => softDeleteCode(id);