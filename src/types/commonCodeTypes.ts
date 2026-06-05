export interface CommonCodeGroup {
  id: string;
  code: string;
  name: string;
  description: string | null;
  useYn: "Y" | "N";
  createdAt: Date;
}

export interface CommonCode {
  id: string;
  groupId: string;
  code: string;
  name: string;
  extraValue: string | null;
  sortOrder: number;
  useYn: "Y" | "N";
  createdAt: Date;
}

export interface CreateGroupDto {
  code: string;
  name: string;
  description?: string | null;
  useYn?: "Y" | "N";
}

export interface UpdateGroupDto {
  name: string;
  description?: string | null;
  useYn: "Y" | "N";
}

export interface CreateCodeDto {
  code: string;
  name: string;
  extraValue?: string | null;
  sortOrder?: number;
  useYn?: "Y" | "N";
}

export interface UpdateCodeDto {
  name: string;
  extraValue?: string | null;
  sortOrder: number;
  useYn: "Y" | "N";
}