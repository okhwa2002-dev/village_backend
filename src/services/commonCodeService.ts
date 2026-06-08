import commonCodeRepo from "../repositories/commonCodeRepository";
import {
  CreateCodeDto,
  CreateGroupDto,
  UpdateCodeDto,
  UpdateGroupDto,
} from "../types/commonCodeTypes";

const getGroups = () => commonCodeRepo.findAllGroups();

const addGroup = (dto: CreateGroupDto) =>
  commonCodeRepo.createGroup({
    code: dto.code,
    name: dto.name,
    description: dto.description ?? null,
    useYn: dto.useYn ?? "Y",
  });

const editGroup = (id: string, dto: UpdateGroupDto) =>
  commonCodeRepo.updateGroup({
    id,
    name: dto.name,
    description: dto.description ?? null,
    useYn: dto.useYn,
  });

const removeGroup = (id: string) => commonCodeRepo.softDeleteGroup(id);

const getCodes = (groupId: string) =>
  commonCodeRepo.findCodesByGroupId(groupId);

const addCode = (groupId: string, dto: CreateCodeDto) =>
  commonCodeRepo.createCode({
    groupId,
    code: dto.code,
    name: dto.name,
    extraValue: dto.extraValue ?? null,
    sortOrder: dto.sortOrder ?? 0,
    useYn: dto.useYn ?? "Y",
  });

const editCode = (id: string, dto: UpdateCodeDto) =>
  commonCodeRepo.updateCode({
    id,
    name: dto.name,
    extraValue: dto.extraValue ?? null,
    sortOrder: dto.sortOrder,
    useYn: dto.useYn,
  });

const removeCode = (id: string) => commonCodeRepo.softDeleteCode(id);

export default {
  getGroups,
  addGroup,
  editGroup,
  removeGroup,
  getCodes,
  addCode,
  editCode,
  removeCode,
};
