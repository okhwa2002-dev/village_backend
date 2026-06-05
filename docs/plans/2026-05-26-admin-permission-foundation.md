# 관리자 권한 기반 시스템 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메뉴 그룹/권한/permission_menus 스키마를 구축하고, `checkMenuPermission` 미들웨어로 기존 `requireRole('admin')`를 교체한다.

**Architecture:** `menu_groups → menus`, `permissions → permission_menus → menus`, `org_permissions → permissions`, `user_organizations → organizations → org_permissions` 구조로 사용자의 메뉴 접근 권한을 조직 단위로 관리한다. `checkMenuPermission(menuCode, action?)` preHandler가 JWT 이후 실행되며, DB에서 사용자의 메뉴 권한을 조회해 접근을 제어한다.

**Tech Stack:** Fastify, TypeScript, PostgreSQL, mybatis-mapper, vitest

---

## 파일 구조 맵

| 작업 | 파일 |
|---|---|
| 수정 | `village_schema.sql` |
| 신규 | `migrations/012_admin_permission_foundation.sql` |
| 신규 | `src/types/permissionTypes.ts` |
| 신규 | `mapper/permission.xml` |
| 신규 | `src/repositories/permissionRepository.ts` |
| 수정 | `src/db/pool.ts` |
| 수정 | `src/plugins/authenticate.ts` |
| 수정 | `src/routes/farmerRoutes.ts` |
| 수정 | `src/routes/orderRoutes.ts` |
| 수정 | `src/routes/villageRoutes.ts` |
| 신규 | `tests/permission.test.ts` |

---

## Task 1: village_schema.sql 스키마 업데이트

**Files:**
- Modify: `village_schema.sql`

- [ ] **Step 1: menu_groups 테이블을 menus 블록 바로 앞에 추가**

`village_schema.sql`의 `-- 메뉴` 주석 바로 앞에 아래 블록을 삽입한다.

```sql
-- 메뉴 그룹
CREATE TABLE menu_groups (
    id         BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code       VARCHAR(50)  NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    icon       VARCHAR(100),
    sort_order INTEGER      NOT NULL DEFAULT 0,
    use_yn     CHAR(1)      NOT NULL DEFAULT 'Y' CHECK (use_yn IN ('Y', 'N')),
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by BIGINT       REFERENCES users(id),
    updated_at TIMESTAMP,
    updated_by BIGINT       REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by BIGINT       REFERENCES users(id)
);
COMMENT ON TABLE  menu_groups            IS '메뉴 그룹 (사이드바 카테고리)';
COMMENT ON COLUMN menu_groups.code       IS '그룹 식별 코드 (예: SYSTEM_ADMIN, SERVICE_ADMIN)';
COMMENT ON COLUMN menu_groups.use_yn     IS '사용 여부 (Y=사용, N=미사용)';
CREATE INDEX idx_menu_groups_deleted_at ON menu_groups(deleted_at) WHERE deleted_at IS NULL;

```

- [ ] **Step 2: menus 테이블에 group_id 컬럼 추가**

현재:
```sql
CREATE TABLE menus (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    parent_id   BIGINT       REFERENCES menus(id),
```

변경:
```sql
CREATE TABLE menus (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id    BIGINT       REFERENCES menu_groups(id),
    parent_id   BIGINT       REFERENCES menus(id),
```

COMMENT 블록에 추가 (기존 comments 아래에):
```sql
COMMENT ON COLUMN menus.group_id   IS '메뉴 그룹 ID (menu_groups.id 참조)';
```

- [ ] **Step 3: permissions 테이블 재설계**

기존 블록 전체를 아래로 교체한다.

```sql
-- 권한
CREATE TABLE permissions (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by  BIGINT       REFERENCES users(id),
    updated_at  TIMESTAMP,
    updated_by  BIGINT       REFERENCES users(id),
    deleted_at  TIMESTAMP,
    deleted_by  BIGINT       REFERENCES users(id)
);
COMMENT ON TABLE  permissions             IS '권한 (명칭 단위 독립 엔티티)';
COMMENT ON COLUMN permissions.code        IS '권한 식별 코드 (예: SUPER_ADMIN, ORDER_MANAGER)';
COMMENT ON COLUMN permissions.description IS '권한 설명';
CREATE INDEX idx_permissions_deleted_at ON permissions(deleted_at) WHERE deleted_at IS NULL;
```

- [ ] **Step 4: permission_menus 테이블을 org_permissions 블록 뒤에 추가**

`org_permissions` 블록 마지막 인덱스 다음에 삽입:

```sql
-- 권한별 메뉴 접근 범위
CREATE TABLE permission_menus (
    id            BIGINT    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    permission_id BIGINT    NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    menu_id       BIGINT    NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    edit_yn       CHAR(1)   NOT NULL DEFAULT 'N' CHECK (edit_yn IN ('Y', 'N')),
    delete_yn     CHAR(1)   NOT NULL DEFAULT 'N' CHECK (delete_yn IN ('Y', 'N')),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by    BIGINT    REFERENCES users(id),
    updated_at    TIMESTAMP,
    updated_by    BIGINT    REFERENCES users(id),
    UNIQUE (permission_id, menu_id)
);
COMMENT ON TABLE  permission_menus               IS '권한별 메뉴 접근 범위 (행 존재=읽기, edit_yn/delete_yn으로 수정/삭제 제어)';
COMMENT ON COLUMN permission_menus.permission_id IS 'permissions.id 참조';
COMMENT ON COLUMN permission_menus.menu_id       IS 'menus.id 참조';
COMMENT ON COLUMN permission_menus.edit_yn       IS '수정 가능 여부 (Y=가능)';
COMMENT ON COLUMN permission_menus.delete_yn     IS '삭제 가능 여부 (Y=가능)';
CREATE INDEX idx_permission_menus_permission_id ON permission_menus(permission_id);
CREATE INDEX idx_permission_menus_menu_id       ON permission_menus(menu_id);
```

- [ ] **Step 5: 커밋**

```bash
git add village_schema.sql
git commit -m "feat: redesign permissions schema - add menu_groups, permission_menus"
```

---

## Task 2: 마이그레이션 파일 생성

**Files:**
- Create: `migrations/012_admin_permission_foundation.sql`

- [ ] **Step 1: 파일 생성**

`migrations/012_admin_permission_foundation.sql` 전체 내용:

```sql
-- 012: 관리자 권한 기반 시스템 — menu_groups, permission_menus 추가 및 permissions 재설계

-- 1. menu_groups 신규
CREATE TABLE IF NOT EXISTS menu_groups (
    id         BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code       VARCHAR(50)  NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    icon       VARCHAR(100),
    sort_order INTEGER      NOT NULL DEFAULT 0,
    use_yn     CHAR(1)      NOT NULL DEFAULT 'Y' CHECK (use_yn IN ('Y', 'N')),
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by BIGINT       REFERENCES users(id),
    updated_at TIMESTAMP,
    updated_by BIGINT       REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by BIGINT       REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_menu_groups_deleted_at
    ON menu_groups(deleted_at) WHERE deleted_at IS NULL;

-- 2. menus에 group_id 추가
ALTER TABLE menus
    ADD COLUMN IF NOT EXISTS group_id BIGINT REFERENCES menu_groups(id);

-- 3. permissions 재설계 (menu_id, action 제거 / code, description 추가)
ALTER TABLE permissions
    DROP CONSTRAINT IF EXISTS permissions_menu_id_action_key,
    DROP COLUMN IF EXISTS menu_id,
    DROP COLUMN IF EXISTS action,
    ADD COLUMN IF NOT EXISTS code        VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS description TEXT;

DROP INDEX IF EXISTS idx_permissions_menu_id;

-- 4. permission_menus 신규
CREATE TABLE IF NOT EXISTS permission_menus (
    id            BIGINT    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    permission_id BIGINT    NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    menu_id       BIGINT    NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    edit_yn       CHAR(1)   NOT NULL DEFAULT 'N' CHECK (edit_yn IN ('Y', 'N')),
    delete_yn     CHAR(1)   NOT NULL DEFAULT 'N' CHECK (delete_yn IN ('Y', 'N')),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by    BIGINT    REFERENCES users(id),
    updated_at    TIMESTAMP,
    updated_by    BIGINT    REFERENCES users(id),
    UNIQUE (permission_id, menu_id)
);
CREATE INDEX IF NOT EXISTS idx_permission_menus_permission_id
    ON permission_menus(permission_id);
CREATE INDEX IF NOT EXISTS idx_permission_menus_menu_id
    ON permission_menus(menu_id);

-- 5. 씨드: 메뉴 그룹
INSERT INTO menu_groups (code, name, sort_order)
VALUES
    ('SYSTEM_ADMIN',  '시스템관리', 1),
    ('SERVICE_ADMIN', '서비스관리', 2)
ON CONFLICT (code) DO NOTHING;

-- 6. 씨드: 메뉴
INSERT INTO menus (group_id, code, name, path, sort_order)
SELECT mg.id, v.code, v.name, v.path, v.sort_order
FROM menu_groups mg,
(VALUES
    ('SYSTEM_ADMIN',  'ADMIN_COMMON_CODE', '공통코드 관리', '/admin/common-codes', 1),
    ('SYSTEM_ADMIN',  'ADMIN_MENU',        '메뉴 관리',     '/admin/menus',        2),
    ('SYSTEM_ADMIN',  'ADMIN_PERMISSION',  '권한 관리',     '/admin/permissions',  3),
    ('SYSTEM_ADMIN',  'ADMIN_ORG',         '조직 관리',     '/admin/organizations',4),
    ('SERVICE_ADMIN', 'ADMIN_FARMER',      '농민 관리',     '/admin/farmers',      1),
    ('SERVICE_ADMIN', 'ADMIN_ORDER',       '주문 관리',     '/admin/orders',       2),
    ('SERVICE_ADMIN', 'ADMIN_VILLAGE',     '마을 관리',     '/admin/village',      3)
) AS v(group_code, code, name, path, sort_order)
WHERE mg.code = v.group_code
ON CONFLICT (code) DO NOTHING;

-- 7. 씨드: SUPER_ADMIN 권한
INSERT INTO permissions (code, name, description)
VALUES ('SUPER_ADMIN', '슈퍼관리자', '모든 메뉴에 대한 전체 권한')
ON CONFLICT (code) DO NOTHING;

-- 8. 씨드: SUPER_ADMIN → 전체 메뉴 (edit_yn=Y, delete_yn=Y)
INSERT INTO permission_menus (permission_id, menu_id, edit_yn, delete_yn)
SELECT p.id, m.id, 'Y', 'Y'
FROM permissions p
CROSS JOIN menus m
WHERE p.code = 'SUPER_ADMIN'
  AND m.code IN (
      'ADMIN_COMMON_CODE', 'ADMIN_MENU', 'ADMIN_PERMISSION', 'ADMIN_ORG',
      'ADMIN_FARMER', 'ADMIN_ORDER', 'ADMIN_VILLAGE'
  )
  AND m.deleted_at IS NULL
ON CONFLICT (permission_id, menu_id) DO NOTHING;
```

- [ ] **Step 2: 커밋**

```bash
git add migrations/012_admin_permission_foundation.sql
git commit -m "feat: add migration 012 - admin permission foundation with seed data"
```

---

## Task 3: 타입 + 매퍼 + 리포지토리 (TDD)

**Files:**
- Create: `src/types/permissionTypes.ts`
- Create: `mapper/permission.xml`
- Create: `src/repositories/permissionRepository.ts`
- Modify: `src/db/pool.ts`
- Test: `tests/permission.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`tests/permission.test.ts` 전체 내용:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/db/pool', () => ({
  pool: { query: vi.fn() },
  query: vi.fn(),
  queryOne: vi.fn(),
  execute: vi.fn(),
  withTransaction: vi.fn(),
  clientQuery: vi.fn(),
  clientQueryOne: vi.fn(),
  clientExecute: vi.fn(),
}));

import * as pool from '../src/db/pool';
import { getUserMenuPermissions } from '../src/repositories/permissionRepository';

describe('permissionRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('사용자의 메뉴 권한 목록을 반환한다', async () => {
    const mockPerms = [
      { menu_code: 'ADMIN_FARMER', can_edit: true,  can_delete: false },
      { menu_code: 'ADMIN_ORDER',  can_edit: false, can_delete: false },
    ];
    vi.mocked(pool.query).mockResolvedValueOnce(mockPerms);

    const result = await getUserMenuPermissions('1');

    expect(pool.query).toHaveBeenCalledWith(
      'permission',
      'getUserMenuPermissions',
      { userId: '1' },
    );
    expect(result).toEqual(mockPerms);
  });

  it('권한이 없는 사용자는 빈 배열을 반환한다', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce([]);

    const result = await getUserMenuPermissions('999');

    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
pnpm test -- tests/permission.test.ts
```

Expected: FAIL — `Cannot find module '../src/repositories/permissionRepository'`

- [ ] **Step 3: permissionTypes.ts 생성**

```typescript
// src/types/permissionTypes.ts
export interface MenuPermission {
  menu_code: string;
  can_edit: boolean;
  can_delete: boolean;
}
```

- [ ] **Step 4: mapper/permission.xml 생성**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="permission">

  <select id="getUserMenuPermissions">
    SELECT m.code                      AS menu_code,
           BOOL_OR(pm.edit_yn   = 'Y') AS can_edit,
           BOOL_OR(pm.delete_yn = 'Y') AS can_delete
    FROM   user_organizations uo
    JOIN   org_permissions op  ON op.organization_id = uo.organization_id
                              AND op.deleted_at IS NULL
    JOIN   permission_menus pm ON pm.permission_id   = op.permission_id
    JOIN   menus m             ON m.id               = pm.menu_id
                              AND m.deleted_at IS NULL
    WHERE  uo.user_id    = #{userId}
      AND  uo.deleted_at IS NULL
    GROUP  BY m.code
  </select>

  <select id="getMenuTree">
    SELECT mg.id         AS group_id,
           mg.code       AS group_code,
           mg.name       AS group_name,
           mg.icon       AS group_icon,
           mg.sort_order AS group_sort_order,
           m.id,
           m.code,
           m.name,
           m.path,
           m.icon,
           m.sort_order,
           m.is_visible
    FROM   menu_groups mg
    LEFT JOIN menus m ON m.group_id = mg.id AND m.deleted_at IS NULL
    WHERE  mg.deleted_at IS NULL
      AND  mg.use_yn = 'Y'
    ORDER  BY mg.sort_order ASC, m.sort_order ASC
  </select>

</mapper>
```

- [ ] **Step 5: permissionRepository.ts 생성**

```typescript
// src/repositories/permissionRepository.ts
import { query } from '../db/pool';
import { MenuPermission } from '../types/permissionTypes';

export const getUserMenuPermissions = (userId: string): Promise<MenuPermission[]> =>
  query<MenuPermission>('permission', 'getUserMenuPermissions', { userId });
```

- [ ] **Step 6: pool.ts에 permission.xml 등록**

`src/db/pool.ts`의 `mybatisMapper.createMapper` 배열 마지막에 추가:

```typescript
mybatisMapper.createMapper([
  `${mapperDir}/auth.xml`,
  `${mapperDir}/farmer.xml`,
  `${mapperDir}/product.xml`,
  `${mapperDir}/cart.xml`,
  `${mapperDir}/order.xml`,
  `${mapperDir}/village.xml`,
  `${mapperDir}/file.xml`,
  `${mapperDir}/permission.xml`,
]);
```

- [ ] **Step 7: 테스트 실행 — 통과 확인**

```bash
pnpm test -- tests/permission.test.ts
```

Expected: 2 tests PASS

- [ ] **Step 8: 커밋**

```bash
git add src/types/permissionTypes.ts mapper/permission.xml src/repositories/permissionRepository.ts src/db/pool.ts tests/permission.test.ts
git commit -m "feat: add permission types, mapper, repository"
```

---

## Task 4: checkMenuPermission 미들웨어 (TDD)

**Files:**
- Modify: `src/plugins/authenticate.ts`
- Modify: `tests/permission.test.ts`

- [ ] **Step 1: 통합 테스트를 permission.test.ts 하단에 추가**

`tests/permission.test.ts` 상단 import에 추가:
```typescript
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
```

파일 하단에 추가:
```typescript
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

describe('checkMenuPermission 미들웨어', () => {
  beforeEach(() => vi.clearAllMocks());

  it('메뉴 권한이 없으면 403을 반환한다', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce([]); // 권한 없음

    const token = app.jwt.sign({ id: '1', email: 'admin@test.com', role: 'admin' });
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/farmers',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('읽기 권한이 있으면 admin/farmers GET에 200을 반환한다', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce([
        { menu_code: 'ADMIN_FARMER', can_edit: false, can_delete: false },
      ])
      .mockResolvedValueOnce([]); // findAllFarmersForAdmin

    const token = app.jwt.sign({ id: '1', email: 'admin@test.com', role: 'admin' });
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/farmers',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
  });

  it('edit 권한이 없으면 PATCH 라우트에 403을 반환한다', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce([
      { menu_code: 'ADMIN_FARMER', can_edit: false, can_delete: false },
    ]);

    const token = app.jwt.sign({ id: '1', email: 'admin@test.com', role: 'admin' });
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/admin/farmers/1/approve',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(403);
  });

  it('인증 없이 접근하면 401을 반환한다', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/farmers',
    });

    expect(res.statusCode).toBe(401);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
pnpm test -- tests/permission.test.ts
```

Expected: 통합 테스트 4개 FAIL — `checkMenuPermission is not a function` 또는 라우트가 여전히 `requireRole('admin')` 사용 중

- [ ] **Step 3: authenticate.ts에 checkMenuPermission 추가**

`src/plugins/authenticate.ts` 파일 전체:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload, UserRole } from '../types/commonTypes';
import { getUserMenuPermissions } from '../repositories/permissionRepository';

export const authenticate = async (
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    await req.jwtVerify();
  } catch {
    reply.code(401).send({ success: false, message: '인증이 필요합니다' });
  }
};

export const requireRole = (...roles: UserRole[]) =>
  async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      await req.jwtVerify();
    } catch {
      reply.code(401).send({ success: false, message: '인증이 필요합니다' });
      return;
    }
    const user = req.user as JwtPayload;
    if (!roles.includes(user.role)) {
      return reply.code(403).send({ success: false, message: '권한이 없습니다' });
    }
  };

export const checkMenuPermission = (
  menuCode: string,
  action?: 'edit' | 'delete',
) =>
  async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = req.user as JwtPayload;
    const perms = await getUserMenuPermissions(user.id);
    const menu = perms.find((p) => p.menu_code === menuCode);

    if (!menu) {
      return reply.code(403).send({ success: false, message: '접근 권한이 없습니다' });
    }
    if (action === 'edit' && !menu.can_edit) {
      return reply.code(403).send({ success: false, message: '수정 권한이 없습니다' });
    }
    if (action === 'delete' && !menu.can_delete) {
      return reply.code(403).send({ success: false, message: '삭제 권한이 없습니다' });
    }
  };
```

- [ ] **Step 4: 테스트 실행 — 아직 실패 (라우트 미업데이트)**

```bash
pnpm test -- tests/permission.test.ts
```

Expected: 통합 테스트는 아직 실패. Task 5에서 라우트 교체 후 통과.

- [ ] **Step 5: 커밋**

```bash
git add src/plugins/authenticate.ts
git commit -m "feat: add checkMenuPermission middleware"
```

---

## Task 5: 기존 admin 라우트 교체 + 전체 테스트

**Files:**
- Modify: `src/routes/farmerRoutes.ts`
- Modify: `src/routes/orderRoutes.ts`
- Modify: `src/routes/villageRoutes.ts`

- [ ] **Step 1: farmerRoutes.ts import 교체 및 preHandler 변경**

import 줄 변경:
```typescript
// 변경 전
import { requireRole } from "../plugins/authenticate";

// 변경 후
import { requireRole, checkMenuPermission, authenticate } from "../plugins/authenticate";
```

admin 라우트 3개의 preHandler 변경:

```typescript
// GET /admin/farmers
preHandler: [authenticate, checkMenuPermission('ADMIN_FARMER')],

// PATCH /admin/farmers/:id/approve
preHandler: [authenticate, checkMenuPermission('ADMIN_FARMER', 'edit')],

// PATCH /admin/farmers/:id/reject
preHandler: [authenticate, checkMenuPermission('ADMIN_FARMER', 'edit')],
```

farmer 라우트(non-admin)는 `requireRole("farmer")` 그대로 유지.

- [ ] **Step 2: orderRoutes.ts preHandler 변경**

import에 추가:
```typescript
import { authenticate, requireRole, checkMenuPermission } from "../plugins/authenticate";
```

```typescript
// GET /admin/orders
preHandler: [authenticate, checkMenuPermission('ADMIN_ORDER')],

// PATCH /admin/orders/:id/status
preHandler: [authenticate, checkMenuPermission('ADMIN_ORDER', 'edit')],
```

- [ ] **Step 3: villageRoutes.ts preHandler 변경**

import에 추가:
```typescript
import { authenticate, requireRole, checkMenuPermission } from "../plugins/authenticate";
```

```typescript
// GET /admin/village
preHandler: [authenticate, checkMenuPermission('ADMIN_VILLAGE')],

// POST /admin/village
preHandler: [authenticate, checkMenuPermission('ADMIN_VILLAGE', 'edit')],

// PUT /admin/village/:id
preHandler: [authenticate, checkMenuPermission('ADMIN_VILLAGE', 'edit')],

// DELETE /admin/village/:id
preHandler: [authenticate, checkMenuPermission('ADMIN_VILLAGE', 'delete')],
```

- [ ] **Step 4: 전체 테스트 실행**

```bash
pnpm test
```

Expected: 전체 PASS. 기존 29개 + 신규 6개 = 35개 이상.

빌드도 확인:
```bash
pnpm build
```

Expected: 0 TypeScript 에러.

- [ ] **Step 5: 커밋**

```bash
git add src/routes/farmerRoutes.ts src/routes/orderRoutes.ts src/routes/villageRoutes.ts
git commit -m "feat: replace requireRole(admin) with checkMenuPermission on all admin routes"
```