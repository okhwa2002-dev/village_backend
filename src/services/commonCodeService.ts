import commonCodeRepo from "../repositories/commonCodeRepository";
import {
  CreateCodeDto,
  CreateGroupDto,
  UpdateCodeDto,
  UpdateGroupDto,
} from "../types/commonCodeTypes";

const commonCodeService = {
  getGroups() {
    return commonCodeRepo.findAllGroups();
  },

  addGroup(dto: CreateGroupDto) {
    return commonCodeRepo.createGroup({
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      useYn: dto.useYn ?? "Y",
    });
  },

  editGroup(id: string, dto: UpdateGroupDto) {
    return commonCodeRepo.updateGroup({
      id,
      name: dto.name,
      description: dto.description ?? null,
      useYn: dto.useYn,
    });
  },

  removeGroup(id: string) {
    return commonCodeRepo.softDeleteGroup(id);
  },

  getCodes(groupId: string) {
    return commonCodeRepo.findCodesByGroupId(groupId);
  },

  addCode(groupId: string, dto: CreateCodeDto) {
    return commonCodeRepo.createCode({
      groupId,
      code: dto.code,
      name: dto.name,
      extraValue: dto.extraValue ?? null,
      sortOrder: dto.sortOrder ?? 0,
      useYn: dto.useYn ?? "Y",
    });
  },

  editCode(id: string, dto: UpdateCodeDto) {
    return commonCodeRepo.updateCode({
      id,
      name: dto.name,
      extraValue: dto.extraValue ?? null,
      sortOrder: dto.sortOrder,
      useYn: dto.useYn,
    });
  },

  removeCode(id: string) {
    return commonCodeRepo.softDeleteCode(id);
  },
};
export default commonCodeService;
