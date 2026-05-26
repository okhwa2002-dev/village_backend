# File Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 파일 그룹(file_groups) + 개별 파일(files) 테이블을 도입하고, 상품/농민프로필/마을콘텐츠가 `file_group_id`로 파일을 참조하도록 구현한다.

**Architecture:** `file_groups`는 파일 묶음 컨테이너(업무구분코드 보유), `files`는 개별 파일 메타데이터(sort_order, is_main_yn 포함). 각 엔티티는 `file_group_id`만 보관하며 여러 장의 이미지를 지원한다. 로컬 디스크 저장 우선, storage_type 컬럼으로 S3 전환 대비.

**Tech Stack:** Fastify, @fastify/multipart (이미 설치됨), @fastify/static (이미 설치됨), uuid, mybatis-mapper, PostgreSQL

---

## 파일 구조 맵

| 작업 | 파일 |
|---|---|
| 신규 생성 | `migrations/010_seed_file_ref_type_code.sql` |
| 신규 생성 | `migrations/011_alter_tables_file_support.sql` |
| 신규 생성 | `src/types/fileTypes.ts` |
| 신규 생성 | `mapper/file.xml` |
| 신규 생성 | `src/services/storage/localStorageAdapter.ts` |
| 신규 생성 | `src/repositories/fileRepository.ts` |
| 신규 생성 | `src/services/fileService.ts` |
| 신규 생성 | `src/controllers/fileController.ts` |
| 신규 생성 | `src/routes/fileRoutes.ts` |
| 신규 생성 | `tests/file.test.ts` |
| 수정 | `village_schema.sql` |
| 수정 | `src/db/pool.ts` |
| 수정 | `src/app.ts` |
| 수정 | `src/types/productTypes.ts` |
| 수정 | `mapper/product.xml` |
| 수정 | `src/repositories/productRepository.ts` |
| 수정 | `src/services/productService.ts` |
| 수정 | `src/routes/productRoutes.ts` |
| 수정 | `src/controllers/productController.ts` |

---

## Task 1: village_schema.sql — 파일 테이블 추가 및 기존 컬럼 변경

**Files:**
- Modify: `village_schema.sql`

- [ ] **Step 1: products 테이블에서 images 컬럼 제거 및 file_group_id 추가**

`village_schema.sql` 의 products 테이블 블록에서 아래를 수정한다.

```sql
-- 제거
images      JSONB          NOT NULL DEFAULT '[]',

-- 추가 (status 컬럼 위에 삽입)
file_group_id BIGINT,
```

COMMENT 수정:
```sql
-- 아래 줄 제거
COMMENT ON COLUMN products.images      IS '상품 이미지 URL 배열 (JSONB, 예: ["url1","url2"])';

-- 아래 줄 추가
COMMENT ON COLUMN products.file_group_id IS 'file_groups.id 참조 (NULL이면 이미지 없음)';
```

인덱스 제거 (products 블록 하단):
```sql
-- 아래 줄 제거
CREATE INDEX idx_products_category   ON products(category);
```

인덱스 추가:
```sql
CREATE INDEX idx_products_category      ON products(category);
CREATE INDEX idx_products_file_group_id ON products(file_group_id);
```

- [ ] **Step 2: farmer_profiles 테이블 photo_url → file_group_id**

```sql
-- 제거
photo_url        VARCHAR(500),

-- 추가 (bio 아래에)
file_group_id    BIGINT,
```

COMMENT 수정:
```sql
-- 제거
COMMENT ON COLUMN farmer_profiles.photo_url        IS '프로필 사진 URL';

-- 추가
COMMENT ON COLUMN farmer_profiles.file_group_id IS 'file_groups.id 참조 (NULL이면 사진 없음)';
```

- [ ] **Step 3: village_content 테이블 image_url → file_group_id**

```sql
-- 제거
image_url  VARCHAR(500),

-- 추가 (body 아래에)
file_group_id BIGINT,
```

COMMENT 수정:
```sql
-- 제거
COMMENT ON COLUMN village_content.image_url  IS '대표 이미지 URL';

-- 추가
COMMENT ON COLUMN village_content.file_group_id IS 'file_groups.id 참조 (NULL이면 이미지 없음)';
```

- [ ] **Step 4: file_groups 테이블 추가 (common_codes 블록 앞에 삽입)**

```sql
-- 파일 그룹
CREATE TABLE file_groups (
    id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ref_type   VARCHAR(50) NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    created_by BIGINT      REFERENCES users(id)
);
COMMENT ON TABLE  file_groups          IS '파일 그룹 컨테이너 (엔티티당 하나의 그룹)';
COMMENT ON COLUMN file_groups.id       IS '파일 그룹 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN file_groups.ref_type IS '업무 구분 (공통코드 FILE_REF_TYPE_CD: PRODUCT=상품, FARMER=농민프로필, VILLAGE=마을콘텐츠, BOARD=게시판)';
COMMENT ON COLUMN file_groups.created_at IS '생성 일시';
COMMENT ON COLUMN file_groups.created_by IS '생성자 ID';
CREATE INDEX idx_file_groups_ref_type ON file_groups(ref_type);

-- 개별 파일
CREATE TABLE files (
    id            BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    file_group_id BIGINT       NOT NULL REFERENCES file_groups(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    stored_name   VARCHAR(255) NOT NULL,
    file_path     VARCHAR(500) NOT NULL,
    file_url      VARCHAR(500) NOT NULL,
    mime_type     VARCHAR(100) NOT NULL,
    file_size     BIGINT       NOT NULL,
    storage_type  VARCHAR(20)  NOT NULL DEFAULT 'LOCAL',
    sort_order    INTEGER      NOT NULL DEFAULT 0,
    is_main_yn    CHAR(1)      NOT NULL DEFAULT 'N' CHECK (is_main_yn IN ('Y', 'N')),
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by    BIGINT       REFERENCES users(id),
    deleted_at    TIMESTAMP,
    deleted_by    BIGINT       REFERENCES users(id)
);
COMMENT ON TABLE  files               IS '개별 파일 메타데이터';
COMMENT ON COLUMN files.id            IS '파일 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN files.file_group_id IS 'file_groups.id 참조';
COMMENT ON COLUMN files.original_name IS '원본 파일명 (업로드 시 사용자 파일명)';
COMMENT ON COLUMN files.stored_name   IS '저장 파일명 (UUID 기반, 중복/보안 방지)';
COMMENT ON COLUMN files.file_path     IS '서버 상대 저장 경로 (예: uploads/product/abc.jpg)';
COMMENT ON COLUMN files.file_url      IS '클라이언트 접근 URL (예: /files/product/abc.jpg)';
COMMENT ON COLUMN files.mime_type     IS 'MIME 타입 (예: image/jpeg, image/png)';
COMMENT ON COLUMN files.file_size     IS '파일 크기 (bytes)';
COMMENT ON COLUMN files.storage_type  IS '저장소 유형: LOCAL=로컬 디스크, S3=AWS S3';
COMMENT ON COLUMN files.sort_order    IS '그룹 내 표시 순서 (오름차순)';
COMMENT ON COLUMN files.is_main_yn    IS '대표 이미지 여부 (Y=대표, 그룹 내 1개만 Y)';
COMMENT ON COLUMN files.created_at    IS '업로드 일시';
COMMENT ON COLUMN files.created_by    IS '업로드 사용자 ID';
COMMENT ON COLUMN files.deleted_at    IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN files.deleted_by    IS '삭제 처리자 ID';
CREATE INDEX idx_files_file_group_id ON files(file_group_id);
CREATE INDEX idx_files_deleted_at    ON files(deleted_at) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uidx_files_main  ON files(file_group_id) WHERE is_main_yn = 'Y' AND deleted_at IS NULL;
```

- [ ] **Step 5: products, farmer_profiles, village_content에 FK 추가**

`file_groups` 테이블 정의 뒤에 FK 제약 추가:

```sql
-- 파일 그룹 FK (file_groups 생성 후에 추가)
ALTER TABLE products        ADD CONSTRAINT fk_products_file_group        FOREIGN KEY (file_group_id) REFERENCES file_groups(id);
ALTER TABLE farmer_profiles ADD CONSTRAINT fk_farmer_profiles_file_group FOREIGN KEY (file_group_id) REFERENCES file_groups(id);
ALTER TABLE village_content ADD CONSTRAINT fk_village_content_file_group FOREIGN KEY (file_group_id) REFERENCES file_groups(id);
```

- [ ] **Step 6: 커밋**

```bash
git add village_schema.sql
git commit -m "feat: add file_groups and files tables to schema"
```

---

## Task 2: 마이그레이션 파일 생성 (공통코드 + DDL)

**Files:**
- Create: `migrations/010_seed_file_ref_type_code.sql`
- Create: `migrations/011_alter_tables_file_support.sql`

- [ ] **Step 1: 공통코드 시드 파일 생성**

```sql
-- migrations/010_seed_file_ref_type_code.sql
-- 파일 업무 구분 공통 코드
WITH grp AS (
    INSERT INTO common_code_groups (code, name, description)
    VALUES ('FILE_REF_TYPE_CD', '파일 업무 구분', '파일 그룹이 속한 업무 영역')
    RETURNING id
)
INSERT INTO common_codes (group_id, code, name, sort_order)
SELECT id, v.code, v.name, v.sort_order FROM grp,
(VALUES
    ('PRODUCT', '상품',        1),
    ('FARMER',  '농민 프로필', 2),
    ('VILLAGE', '마을 콘텐츠', 3),
    ('BOARD',   '게시판',      4)
) AS v(code, name, sort_order);
```

- [ ] **Step 2: DDL 마이그레이션 파일 생성 (기존 DB 적용용)**

```sql
-- migrations/011_alter_tables_file_support.sql
-- 기존 DB에서 파일 관리 시스템을 추가하기 위한 DDL 마이그레이션

-- 1. file_groups 테이블 생성
CREATE TABLE file_groups (
    id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ref_type   VARCHAR(50) NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    created_by BIGINT      REFERENCES users(id)
);
CREATE INDEX idx_file_groups_ref_type ON file_groups(ref_type);

-- 2. files 테이블 생성
CREATE TABLE files (
    id            BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    file_group_id BIGINT       NOT NULL REFERENCES file_groups(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    stored_name   VARCHAR(255) NOT NULL,
    file_path     VARCHAR(500) NOT NULL,
    file_url      VARCHAR(500) NOT NULL,
    mime_type     VARCHAR(100) NOT NULL,
    file_size     BIGINT       NOT NULL,
    storage_type  VARCHAR(20)  NOT NULL DEFAULT 'LOCAL',
    sort_order    INTEGER      NOT NULL DEFAULT 0,
    is_main_yn    CHAR(1)      NOT NULL DEFAULT 'N' CHECK (is_main_yn IN ('Y', 'N')),
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by    BIGINT       REFERENCES users(id),
    deleted_at    TIMESTAMP,
    deleted_by    BIGINT       REFERENCES users(id)
);
CREATE INDEX idx_files_file_group_id ON files(file_group_id);
CREATE INDEX idx_files_deleted_at    ON files(deleted_at) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uidx_files_main  ON files(file_group_id) WHERE is_main_yn = 'Y' AND deleted_at IS NULL;

-- 3. products: images JSONB → file_group_id
ALTER TABLE products
    DROP COLUMN images,
    ADD COLUMN file_group_id BIGINT REFERENCES file_groups(id);
CREATE INDEX idx_products_file_group_id ON products(file_group_id);

-- 4. farmer_profiles: photo_url → file_group_id
ALTER TABLE farmer_profiles
    DROP COLUMN photo_url,
    ADD COLUMN file_group_id BIGINT REFERENCES file_groups(id);

-- 5. village_content: image_url → file_group_id
ALTER TABLE village_content
    DROP COLUMN image_url,
    ADD COLUMN file_group_id BIGINT REFERENCES file_groups(id);
```

- [ ] **Step 3: 커밋**

```bash
git add migrations/010_seed_file_ref_type_code.sql migrations/011_alter_tables_file_support.sql
git commit -m "feat: add file management migration files"
```

---

## Task 3: 타입 정의

**Files:**
- Create: `src/types/fileTypes.ts`
- Modify: `src/types/productTypes.ts`

- [ ] **Step 1: fileTypes.ts 생성**

```typescript
// src/types/fileTypes.ts
export type StorageType = 'LOCAL' | 'S3';
export type FileRefType = 'PRODUCT' | 'FARMER' | 'VILLAGE' | 'BOARD';

export interface FileGroup {
  id: string;
  ref_type: FileRefType;
  created_at: Date;
  created_by: string | null;
}

export interface FileRecord {
  id: string;
  file_group_id: string;
  original_name: string;
  stored_name: string;
  file_path: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  storage_type: StorageType;
  sort_order: number;
  is_main_yn: 'Y' | 'N';
  created_at: Date;
}

export interface CreateFileGroupDto {
  refType: FileRefType;
}

export interface PatchFileDto {
  sortOrder?: number;
  isMainYn?: 'Y' | 'N';
}
```

- [ ] **Step 2: productTypes.ts 수정 — images 제거, file_group_id 추가**

`Product` 인터페이스에서:
```typescript
// 제거
images: string[];

// 추가
file_group_id: string | null;
```

`CreateProductDto` 에서:
```typescript
// 제거
images?: string[];

// 추가
fileGroupId?: string;
```

`UpdateProductDto` 에서:
```typescript
// 제거
images?: string[];

// 추가
fileGroupId?: string;
```

- [ ] **Step 3: 커밋**

```bash
git add src/types/fileTypes.ts src/types/productTypes.ts
git commit -m "feat: add file types and update product types"
```

---

## Task 4: SQL 매퍼 생성 및 업데이트

**Files:**
- Create: `mapper/file.xml`
- Modify: `mapper/product.xml`
- Modify: `src/db/pool.ts`

- [ ] **Step 1: mapper/file.xml 생성**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="file">

  <insert id="createGroup">
    INSERT INTO file_groups (ref_type, created_by)
    VALUES (#{refType}, #{createdBy})
    RETURNING id, ref_type, created_at, created_by
  </insert>

  <select id="findGroupById">
    SELECT id, ref_type, created_at, created_by
    FROM file_groups
    WHERE id = #{id}
  </select>

  <insert id="createFile">
    INSERT INTO files (
      file_group_id, original_name, stored_name, file_path, file_url,
      mime_type, file_size, storage_type, sort_order, is_main_yn, created_by
    ) VALUES (
      #{fileGroupId}, #{originalName}, #{storedName}, #{filePath}, #{fileUrl},
      #{mimeType}, #{fileSize}, #{storageType}, #{sortOrder}, #{isMainYn}, #{createdBy}
    )
    RETURNING id, file_group_id, original_name, stored_name, file_path, file_url,
              mime_type, file_size, storage_type, sort_order, is_main_yn, created_at
  </insert>

  <select id="findFilesByGroupId">
    SELECT id, file_group_id, original_name, stored_name, file_path, file_url,
           mime_type, file_size, storage_type, sort_order, is_main_yn, created_at
    FROM files
    WHERE file_group_id = #{fileGroupId}
      AND deleted_at IS NULL
    ORDER BY sort_order ASC
  </select>

  <select id="findFileById">
    SELECT id, file_group_id, original_name, stored_name, file_path, file_url,
           mime_type, file_size, storage_type, sort_order, is_main_yn, created_at
    FROM files
    WHERE id = #{id} AND deleted_at IS NULL
  </select>

  <update id="clearMainYn">
    UPDATE files
    SET is_main_yn = 'N'
    WHERE file_group_id = #{fileGroupId}
      AND is_main_yn = 'Y'
      AND deleted_at IS NULL
  </update>

  <update id="updateFile">
    UPDATE files
    SET sort_order = COALESCE(#{sortOrder}, sort_order),
        is_main_yn = COALESCE(#{isMainYn}, is_main_yn)
    WHERE id = #{id} AND deleted_at IS NULL
    RETURNING id, file_group_id, original_name, stored_name, file_path, file_url,
              mime_type, file_size, storage_type, sort_order, is_main_yn, created_at
  </update>

  <update id="deleteFile">
    UPDATE files
    SET deleted_at = NOW(), deleted_by = #{deletedBy}
    WHERE id = #{id} AND deleted_at IS NULL
  </update>

</mapper>
```

- [ ] **Step 2: mapper/product.xml 수정 — images → file_group_id**

`findAll` SELECT:
```xml
<!-- 제거 -->
p.category, p.images, p.status, p.created_at,

<!-- 변경 -->
p.category, p.file_group_id, p.status, p.created_at,
```

`findById` SELECT:
```xml
<!-- 제거 -->
p.category, p.images, p.status, p.created_at,

<!-- 변경 -->
p.category, p.file_group_id, p.status, p.created_at,
```

`findByFarmerId` SELECT:
```xml
<!-- 제거 -->
category, images, status, created_at

<!-- 변경 -->
category, file_group_id, status, created_at
```

`create` INSERT:
```xml
<!-- 제거 -->
INSERT INTO products (farmer_id, name, description, price, stock, category, images, status)
VALUES (#{farmerId}, #{name}, #{description}, #{price}, #{stock}, #{category}, #{images}::jsonb, #{status})
RETURNING id, farmer_id, name, description, price, stock, category, images, status, created_at

<!-- 변경 -->
INSERT INTO products (farmer_id, name, description, price, stock, category, file_group_id, status)
VALUES (#{farmerId}, #{name}, #{description}, #{price}, #{stock}, #{category}, #{fileGroupId}, #{status})
RETURNING id, farmer_id, name, description, price, stock, category, file_group_id, status, created_at
```

`update` UPDATE:
```xml
<!-- 제거 -->
images      = COALESCE(#{images}::jsonb, images),

<!-- 변경 -->
file_group_id = COALESCE(#{fileGroupId}, file_group_id),
```

RETURNING 절 수정:
```xml
<!-- 제거 -->
RETURNING id, farmer_id, name, description, price, stock, category, images, status, created_at

<!-- 변경 -->
RETURNING id, farmer_id, name, description, price, stock, category, file_group_id, status, created_at
```

- [ ] **Step 3: pool.ts에 file.xml 등록**

`src/db/pool.ts`의 `mybatisMapper.createMapper` 배열에 추가:

```typescript
mybatisMapper.createMapper([
  `${mapperDir}/auth.xml`,
  `${mapperDir}/farmer.xml`,
  `${mapperDir}/product.xml`,
  `${mapperDir}/cart.xml`,
  `${mapperDir}/order.xml`,
  `${mapperDir}/village.xml`,
  `${mapperDir}/file.xml`,
]);
```

- [ ] **Step 4: 커밋**

```bash
git add mapper/file.xml mapper/product.xml src/db/pool.ts
git commit -m "feat: add file mapper and update product mapper"
```

---

## Task 5: 로컬 스토리지 어댑터

**Files:**
- Create: `src/services/storage/localStorageAdapter.ts`

- [ ] **Step 1: 테스트 작성 (별도 파일)**

```typescript
// tests/localStorageAdapter.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';

vi.mock('fs');

describe('localStorageAdapter', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
  });

  afterEach(() => vi.clearAllMocks());

  it('저장된 파일명은 UUID + 원본 확장자 형식이다', async () => {
    const { saveFile } = await import('../src/services/storage/localStorageAdapter');
    const result = await saveFile(Buffer.from('data'), '사과.jpg', 'PRODUCT');
    expect(result.storedName).toMatch(/^[0-9a-f-]{36}\.jpg$/);
  });

  it('fileUrl은 /files/{refType소문자}/{storedName} 형식이다', async () => {
    const { saveFile } = await import('../src/services/storage/localStorageAdapter');
    const result = await saveFile(Buffer.from('data'), 'test.png', 'PRODUCT');
    expect(result.fileUrl).toMatch(/^\/files\/product\//);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
pnpm test -- tests/localStorageAdapter.test.ts
```

Expected: FAIL — `Cannot find module '../src/services/storage/localStorageAdapter'`

- [ ] **Step 3: 어댑터 구현**

```typescript
// src/services/storage/localStorageAdapter.ts
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export interface SavedFile {
  storedName: string;
  filePath: string;
  fileUrl: string;
}

export const saveFile = async (
  buffer: Buffer,
  originalName: string,
  refType: string,
): Promise<SavedFile> => {
  const ext = path.extname(originalName) || '.bin';
  const storedName = `${uuidv4()}${ext}`;
  const subDir = path.join(UPLOAD_DIR, refType.toLowerCase());

  if (!fs.existsSync(subDir)) {
    fs.mkdirSync(subDir, { recursive: true });
  }

  const absolutePath = path.join(subDir, storedName);
  fs.writeFileSync(absolutePath, buffer);

  return {
    storedName,
    filePath: `uploads/${refType.toLowerCase()}/${storedName}`,
    fileUrl: `/files/${refType.toLowerCase()}/${storedName}`,
  };
};

export const removeFile = (filePath: string): void => {
  const absolutePath = path.join(process.cwd(), filePath);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
pnpm test -- tests/localStorageAdapter.test.ts
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/services/storage/localStorageAdapter.ts tests/localStorageAdapter.test.ts
git commit -m "feat: add local storage adapter"
```

---

## Task 6: Repository 레이어

**Files:**
- Create: `src/repositories/fileRepository.ts`
- Modify: `src/repositories/productRepository.ts`

- [ ] **Step 1: fileRepository.ts 생성**

```typescript
// src/repositories/fileRepository.ts
import { query, queryOne, execute } from '../db/pool';
import { FileGroup, FileRecord } from '../types/fileTypes';

export const createFileGroup = (params: {
  refType: string;
  createdBy: string;
}): Promise<FileGroup | null> =>
  queryOne<FileGroup>('file', 'createGroup', params);

export const findFileGroupById = (id: string): Promise<FileGroup | null> =>
  queryOne<FileGroup>('file', 'findGroupById', { id });

export const createFile = (params: {
  fileGroupId: string;
  originalName: string;
  storedName: string;
  filePath: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  storageType: string;
  sortOrder: number;
  isMainYn: string;
  createdBy: string;
}): Promise<FileRecord | null> =>
  queryOne<FileRecord>('file', 'createFile', params);

export const findFilesByGroupId = (fileGroupId: string): Promise<FileRecord[]> =>
  query<FileRecord>('file', 'findFilesByGroupId', { fileGroupId });

export const findFileById = (id: string): Promise<FileRecord | null> =>
  queryOne<FileRecord>('file', 'findFileById', { id });

export const clearMainYn = (fileGroupId: string): Promise<number> =>
  execute('file', 'clearMainYn', { fileGroupId });

export const updateFile = (params: {
  id: string;
  sortOrder?: number;
  isMainYn?: string;
}): Promise<FileRecord | null> =>
  queryOne<FileRecord>('file', 'updateFile', params);

export const softDeleteFile = (id: string, deletedBy: string): Promise<number> =>
  execute('file', 'deleteFile', { id, deletedBy });
```

- [ ] **Step 2: productRepository.ts 수정 — images → fileGroupId**

`createProduct` 파라미터:
```typescript
// 제거
images: string;

// 추가
fileGroupId?: string;
```

`createProduct` 함수 호출부:
```typescript
// 제거
images: string;

// 추가
fileGroupId?: string;
```

`updateProduct` 파라미터:
```typescript
// 제거
images?: string;

// 추가
fileGroupId?: string;
```

- [ ] **Step 3: 커밋**

```bash
git add src/repositories/fileRepository.ts src/repositories/productRepository.ts
git commit -m "feat: add file repository and update product repository"
```

---

## Task 7: Service 레이어

**Files:**
- Create: `src/services/fileService.ts`
- Modify: `src/services/productService.ts`

- [ ] **Step 1: fileService 테스트 추가 (tests/file.test.ts에 추가)**

```typescript
// tests/file.test.ts에 아래 블록 추가

vi.mock('../src/db/pool', () => ({
  pool: { query: vi.fn() },
  query: vi.fn(),
  queryOne: vi.fn(),
  execute: vi.fn(),
}));

vi.mock('../src/services/storage/localStorageAdapter', () => ({
  saveFile: vi.fn().mockResolvedValue({
    storedName: 'abc-uuid.jpg',
    filePath: 'uploads/product/abc-uuid.jpg',
    fileUrl: '/files/product/abc-uuid.jpg',
  }),
  removeFile: vi.fn(),
}));

import * as pool from '../src/db/pool';
import { createGroup, uploadFile, getFilesByGroup, patchFile, removeFileById } from '../src/services/fileService';

describe('fileService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('createGroup', () => {
    it('파일 그룹을 생성하고 반환한다', async () => {
      const mockGroup = { id: '1', ref_type: 'PRODUCT', created_at: new Date() };
      vi.mocked(pool.queryOne).mockResolvedValueOnce(mockGroup);

      const result = await createGroup('PRODUCT', '10');

      expect(pool.queryOne).toHaveBeenCalledWith('file', 'createGroup', { refType: 'PRODUCT', createdBy: '10' });
      expect(result).toEqual(mockGroup);
    });

    it('생성 실패 시 FILE_GROUP_CREATE_FAILED 에러를 던진다', async () => {
      vi.mocked(pool.queryOne).mockResolvedValueOnce(null);

      await expect(createGroup('PRODUCT', '10')).rejects.toThrow('FILE_GROUP_CREATE_FAILED');
    });
  });

  describe('uploadFile', () => {
    it('그룹이 없으면 FILE_GROUP_NOT_FOUND 에러를 던진다', async () => {
      vi.mocked(pool.queryOne).mockResolvedValueOnce(null);

      await expect(uploadFile({
        fileGroupId: '999',
        buffer: Buffer.from('data'),
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 100,
        isMainYn: 'N',
        sortOrder: 0,
        userId: '1',
      })).rejects.toThrow('FILE_GROUP_NOT_FOUND');
    });

    it('is_main_yn=Y이면 clearMainYn을 먼저 호출한다', async () => {
      const mockGroup = { id: '1', ref_type: 'PRODUCT', created_at: new Date() };
      const mockFile = { id: '10', file_group_id: '1', original_name: 'test.jpg' };
      vi.mocked(pool.queryOne)
        .mockResolvedValueOnce(mockGroup)
        .mockResolvedValueOnce(mockFile);
      vi.mocked(pool.execute).mockResolvedValueOnce(1);

      await uploadFile({
        fileGroupId: '1',
        buffer: Buffer.from('data'),
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 100,
        isMainYn: 'Y',
        sortOrder: 1,
        userId: '1',
      });

      expect(pool.execute).toHaveBeenCalledWith('file', 'clearMainYn', { fileGroupId: '1' });
    });
  });

  describe('patchFile', () => {
    it('파일이 없으면 FILE_NOT_FOUND 에러를 던진다', async () => {
      vi.mocked(pool.queryOne).mockResolvedValueOnce(null);

      await expect(patchFile({ id: '999', userId: '1' })).rejects.toThrow('FILE_NOT_FOUND');
    });
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
pnpm test -- tests/file.test.ts
```

Expected: FAIL — `Cannot find module '../src/services/fileService'`

- [ ] **Step 3: fileService.ts 구현**

```typescript
// src/services/fileService.ts
import {
  createFileGroup,
  findFileGroupById,
  createFile,
  findFilesByGroupId,
  findFileById,
  clearMainYn,
  updateFile,
  softDeleteFile,
} from '../repositories/fileRepository';
import { saveFile, removeFile } from './storage/localStorageAdapter';
import { FileRefType } from '../types/fileTypes';

export const createGroup = async (refType: FileRefType, userId: string) => {
  const group = await createFileGroup({ refType, createdBy: userId });
  if (!group) throw new Error('FILE_GROUP_CREATE_FAILED');
  return group;
};

export const uploadFile = async (params: {
  fileGroupId: string;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  fileSize: number;
  isMainYn: 'Y' | 'N';
  sortOrder: number;
  userId: string;
}) => {
  const group = await findFileGroupById(params.fileGroupId);
  if (!group) throw new Error('FILE_GROUP_NOT_FOUND');

  const saved = await saveFile(params.buffer, params.originalName, group.ref_type);

  if (params.isMainYn === 'Y') {
    await clearMainYn(params.fileGroupId);
  }

  const file = await createFile({
    fileGroupId: params.fileGroupId,
    originalName: params.originalName,
    storedName: saved.storedName,
    filePath: saved.filePath,
    fileUrl: saved.fileUrl,
    mimeType: params.mimeType,
    fileSize: params.fileSize,
    storageType: 'LOCAL',
    sortOrder: params.sortOrder,
    isMainYn: params.isMainYn,
    createdBy: params.userId,
  });
  if (!file) throw new Error('FILE_CREATE_FAILED');
  return file;
};

export const getFilesByGroup = (fileGroupId: string) =>
  findFilesByGroupId(fileGroupId);

export const patchFile = async (params: {
  id: string;
  sortOrder?: number;
  isMainYn?: 'Y' | 'N';
  userId: string;
}) => {
  const file = await findFileById(params.id);
  if (!file) throw new Error('FILE_NOT_FOUND');

  if (params.isMainYn === 'Y') {
    await clearMainYn(file.file_group_id);
  }

  const updated = await updateFile({
    id: params.id,
    sortOrder: params.sortOrder,
    isMainYn: params.isMainYn,
  });
  if (!updated) throw new Error('FILE_NOT_FOUND');
  return updated;
};

export const removeFileById = async (id: string, userId: string) => {
  const file = await findFileById(id);
  if (!file) throw new Error('FILE_NOT_FOUND');

  const count = await softDeleteFile(id, userId);
  if (count === 0) throw new Error('FILE_NOT_FOUND');

  try {
    removeFile(file.file_path);
  } catch {
    // 물리 파일 삭제 실패는 무시 (별도 배치로 정리)
  }
};
```

- [ ] **Step 4: productService.ts 수정 — images → fileGroupId**

`createProductByFarmer` 내부:
```typescript
// 제거
images: JSON.stringify(dto.images ?? []),
status: 'active',

// 변경
fileGroupId: dto.fileGroupId,
status: 'active',
```

`updateProductByFarmer` 내부:
```typescript
// 제거
images: dto.images !== undefined ? JSON.stringify(dto.images) : undefined,

// 변경
fileGroupId: dto.fileGroupId,
```

- [ ] **Step 5: 테스트 실행 — 통과 확인**

```bash
pnpm test -- tests/file.test.ts
```

Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add src/services/fileService.ts src/services/productService.ts tests/file.test.ts
git commit -m "feat: add file service and update product service"
```

---

## Task 8: Controller + Routes 레이어

**Files:**
- Create: `src/controllers/fileController.ts`
- Create: `src/routes/fileRoutes.ts`
- Modify: `src/controllers/productController.ts`
- Modify: `src/routes/productRoutes.ts`

- [ ] **Step 1: fileController.ts 생성**

```typescript
// src/controllers/fileController.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types/commonTypes';
import { FileRefType, PatchFileDto } from '../types/fileTypes';
import {
  createGroup,
  uploadFile,
  getFilesByGroup,
  patchFile,
  removeFileById,
} from '../services/fileService';
import { successResponse, errorResponse } from '../utils/response';

export const createFileGroupHandler = async (
  req: FastifyRequest<{ Body: { refType: FileRefType } }>,
  reply: FastifyReply,
) => {
  const user = req.user as JwtPayload;
  const group = await createGroup(req.body.refType, user.id);
  return reply.code(201).send(successResponse(group, '파일 그룹이 생성되었습니다'));
};

export const uploadFileHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const user = req.user as JwtPayload;
    const data = await req.file();
    if (!data) return reply.code(400).send(errorResponse('파일이 없습니다'));

    const fileGroupIdField = data.fields.fileGroupId as any;
    const isMainYnField = data.fields.isMainYn as any;
    const sortOrderField = data.fields.sortOrder as any;

    if (!fileGroupIdField?.value) {
      return reply.code(400).send(errorResponse('fileGroupId가 필요합니다'));
    }

    const buffer = await data.toBuffer();
    const file = await uploadFile({
      fileGroupId: fileGroupIdField.value,
      buffer,
      originalName: data.filename,
      mimeType: data.mimetype,
      fileSize: buffer.length,
      isMainYn: isMainYnField?.value === 'Y' ? 'Y' : 'N',
      sortOrder: Number(sortOrderField?.value ?? 0),
      userId: user.id,
    });
    return reply.code(201).send(successResponse(file, '파일이 업로드되었습니다'));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'FILE_GROUP_NOT_FOUND')
      return reply.code(404).send(errorResponse('파일 그룹을 찾을 수 없습니다'));
    throw err;
  }
};

export const getFilesHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const files = await getFilesByGroup(req.params.id);
  return reply.send(successResponse(files));
};

export const patchFileHandler = async (
  req: FastifyRequest<{ Params: { id: string }; Body: PatchFileDto }>,
  reply: FastifyReply,
) => {
  try {
    const user = req.user as JwtPayload;
    const file = await patchFile({
      id: req.params.id,
      sortOrder: req.body.sortOrder,
      isMainYn: req.body.isMainYn,
      userId: user.id,
    });
    return reply.send(successResponse(file, '파일이 수정되었습니다'));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'FILE_NOT_FOUND')
      return reply.code(404).send(errorResponse('파일을 찾을 수 없습니다'));
    throw err;
  }
};

export const deleteFileHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  try {
    const user = req.user as JwtPayload;
    await removeFileById(req.params.id, user.id);
    return reply.send(successResponse(null, '파일이 삭제되었습니다'));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'FILE_NOT_FOUND')
      return reply.code(404).send(errorResponse('파일을 찾을 수 없습니다'));
    throw err;
  }
};
```

- [ ] **Step 2: fileRoutes.ts 생성**

```typescript
// src/routes/fileRoutes.ts
import { FastifyInstance } from 'fastify';
import {
  createFileGroupHandler,
  uploadFileHandler,
  getFilesHandler,
  patchFileHandler,
  deleteFileHandler,
} from '../controllers/fileController';
import { authenticate } from '../plugins/authenticate';

export default async function fileRoutes(app: FastifyInstance) {
  app.post<{ Body: { refType: string } }>(
    '/file-groups',
    {
      schema: {
        tags: ['File'],
        summary: '파일 그룹 생성',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['refType'],
          properties: {
            refType: {
              type: 'string',
              enum: ['PRODUCT', 'FARMER', 'VILLAGE', 'BOARD'],
            },
          },
        },
      },
      preHandler: [authenticate],
    },
    createFileGroupHandler,
  );

  app.post(
    '/files',
    {
      schema: {
        tags: ['File'],
        summary: '파일 업로드 (multipart/form-data)',
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
      },
      preHandler: [authenticate],
    },
    uploadFileHandler,
  );

  app.get<{ Params: { id: string } }>(
    '/file-groups/:id/files',
    {
      schema: {
        tags: ['File'],
        summary: '파일 그룹 내 파일 목록 조회',
      },
    },
    getFilesHandler,
  );

  app.patch<{ Params: { id: string }; Body: { sortOrder?: number; isMainYn?: string } }>(
    '/files/:id',
    {
      schema: {
        tags: ['File'],
        summary: '파일 정보 수정 (순서, 대표 이미지)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            sortOrder: { type: 'integer', minimum: 0 },
            isMainYn: { type: 'string', enum: ['Y', 'N'] },
          },
        },
      },
      preHandler: [authenticate],
    },
    patchFileHandler,
  );

  app.delete<{ Params: { id: string } }>(
    '/files/:id',
    {
      schema: {
        tags: ['File'],
        summary: '파일 삭제',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate],
    },
    deleteFileHandler,
  );
}
```

- [ ] **Step 3: productRoutes.ts 수정 — images → fileGroupId**

`POST /products` body schema:
```typescript
// 제거
images: { type: 'array', items: { type: 'string' } },

// 추가
fileGroupId: { type: 'string' },
```

`PUT /products/:id` body schema:
```typescript
// 제거
images: { type: 'array', items: { type: 'string' } },

// 추가
fileGroupId: { type: 'string' },
```

- [ ] **Step 4: productController.ts 수정**

`createProductHandler`와 `updateProductHandler`의 에러 처리는 변경 없음. 타입이 변경됐으므로 TypeScript 컴파일 에러만 없으면 된다.

- [ ] **Step 5: 빌드 에러 확인**

```bash
pnpm build
```

Expected: 빌드 성공 (타입 에러 없음)

- [ ] **Step 6: 커밋**

```bash
git add src/controllers/fileController.ts src/routes/fileRoutes.ts src/controllers/productController.ts src/routes/productRoutes.ts
git commit -m "feat: add file controller and routes, update product routes"
```

---

## Task 9: app.ts — multipart, static, fileRoutes 등록

**Files:**
- Modify: `src/app.ts`

- [ ] **Step 1: app.ts 수정**

import 추가:
```typescript
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import path from 'path';
import fileRoutes from './routes/fileRoutes';
```

플러그인 등록 (swagger 등록 블록 아래에 추가):
```typescript
app.register(multipart);

app.register(staticFiles, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/files/',
});
```

라우트 등록 (기존 라우트 등록 블록 마지막에 추가):
```typescript
app.register(fileRoutes, { prefix: '/api' });
```

- [ ] **Step 2: 빌드 확인**

```bash
pnpm build
```

Expected: 빌드 성공

- [ ] **Step 3: 개발 서버 기동 후 Swagger 확인**

```bash
pnpm dev
```

브라우저에서 `http://localhost:3000/docs` 접속 → File 태그 아래에 5개 엔드포인트 확인:
- POST /api/file-groups
- POST /api/files
- GET /api/file-groups/:id/files
- PATCH /api/files/:id
- DELETE /api/files/:id

- [ ] **Step 4: 커밋**

```bash
git add src/app.ts
git commit -m "feat: register file routes and multipart/static plugins in app"
```

---

## Task 10: 통합 테스트

**Files:**
- Modify: `tests/file.test.ts` (API 레벨 테스트 추가)

- [ ] **Step 1: API 통합 테스트 추가**

```typescript
// tests/file.test.ts 하단에 추가

import buildApp from '../src/app';
import { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('POST /api/file-groups', () => {
  it('인증 없이 요청하면 401을 반환한다', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/file-groups',
      payload: { refType: 'PRODUCT' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('유효한 토큰으로 파일 그룹을 생성한다', async () => {
    const mockGroup = { id: '1', ref_type: 'PRODUCT', created_at: new Date() };
    vi.mocked(pool.queryOne).mockResolvedValueOnce(mockGroup);

    const token = app.jwt.sign({ id: '1', email: 'user@test.com', role: 'farmer' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/file-groups',
      headers: { authorization: `Bearer ${token}` },
      payload: { refType: 'PRODUCT' },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.ref_type).toBe('PRODUCT');
  });
});

describe('GET /api/file-groups/:id/files', () => {
  it('파일 목록을 반환한다', async () => {
    const mockFiles = [
      { id: '1', file_group_id: '10', original_name: 'test.jpg', is_main_yn: 'Y', sort_order: 0 },
    ];
    vi.mocked(pool.query).mockResolvedValueOnce(mockFiles);

    const res = await app.inject({
      method: 'GET',
      url: '/api/file-groups/10/files',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });
});

describe('DELETE /api/files/:id', () => {
  it('파일이 없으면 404를 반환한다', async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null);

    const token = app.jwt.sign({ id: '1', email: 'user@test.com', role: 'farmer' });
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/files/999',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(404);
  });
});
```

- [ ] **Step 2: 전체 테스트 실행**

```bash
pnpm test
```

Expected: 모든 테스트 PASS

- [ ] **Step 3: 최종 커밋 및 푸시**

```bash
git add tests/file.test.ts
git commit -m "feat: add file management API integration tests"
git push origin master
```

---

## 구현 완료 기준

- [ ] `pnpm build` 성공 (TypeScript 에러 없음)
- [ ] `pnpm test` 전체 통과
- [ ] `/docs` Swagger에 File 태그 5개 엔드포인트 노출
- [ ] `POST /api/file-groups` → file_group_id 발급
- [ ] `POST /api/files` (multipart) → 파일 저장 + DB 기록
- [ ] `GET /api/file-groups/:id/files` → is_main_yn, sort_order 포함 목록 반환
- [ ] `PATCH /api/files/:id` → is_main_yn=Y 변경 시 기존 대표 자동 해제
- [ ] `DELETE /api/files/:id` → 소프트 삭제 + 물리 파일 제거