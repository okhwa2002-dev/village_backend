# 관리자 권한 기반 시스템 설계

- 작성일: 2026-05-26
- 상태: 확정

## 개요

관리자 메뉴를 권한 기반으로 제어하는 기반 시스템 구축.  
메뉴 그룹 → 메뉴 → 권한 → 조직 → 사용자 흐름으로 "누가 어떤 메뉴에서 무엇을 할 수 있는지" 관리한다.

---

## 핵심 요구사항

- 메뉴를 그룹별로 분류 (`menu_groups`)
- 권한(`permissions`)은 독립 엔티티 — 특정 메뉴/액션과 분리
- `permission_menus`가 "어떤 권한이 어떤 메뉴에서 편집/삭제 가능한지" 정의
- 메뉴에 행이 존재하면 읽기 자동 허용, `edit_yn='Y'`이면 수정, `delete_yn='Y'`이면 삭제
- 권한은 조직 단위로 부여, 사용자는 조직에 소속되어 권한 상속
- 기존 `requireRole('admin')` → 새 `checkMenuPermission` 미들웨어로 교체

---

## 스키마 변경

### 신규: `menu_groups` — 메뉴 그룹

```sql
CREATE TABLE menu_groups (
    id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code       VARCHAR(50) NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    icon       VARCHAR(100),
    sort_order INTEGER     NOT NULL DEFAULT 0,
    use_yn     CHAR(1)     NOT NULL DEFAULT 'Y' CHECK (use_yn IN ('Y', 'N')),
    created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    created_by BIGINT      REFERENCES users(id),
    updated_at TIMESTAMP,
    updated_by BIGINT      REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by BIGINT      REFERENCES users(id)
);
```

### 수정: `menus` — `group_id` 컬럼 추가

```sql
ALTER TABLE menus
    ADD COLUMN group_id BIGINT REFERENCES menu_groups(id);
```

기존 `parent_id` 유지 — 그룹 내 2단계 하위 메뉴 지원.

### 수정: `permissions` — `menu_id`, `action` 제거, `code` 추가

```sql
ALTER TABLE permissions
    DROP CONSTRAINT IF EXISTS permissions_menu_id_action_key,
    DROP COLUMN menu_id,
    DROP COLUMN action,
    ADD COLUMN code VARCHAR(50) UNIQUE,
    ADD COLUMN description TEXT;
```

권한은 메뉴/액션과 분리된 독립 엔티티가 된다.

### 신규: `permission_menus` — 권한별 메뉴 접근 범위

```sql
CREATE TABLE permission_menus (
    id            BIGINT  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    permission_id BIGINT  NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    menu_id       BIGINT  NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    edit_yn       CHAR(1) NOT NULL DEFAULT 'N' CHECK (edit_yn IN ('Y', 'N')),
    delete_yn     CHAR(1) NOT NULL DEFAULT 'N' CHECK (delete_yn IN ('Y', 'N')),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by    BIGINT    REFERENCES users(id),
    updated_at    TIMESTAMP,
    updated_by    BIGINT    REFERENCES users(id),
    UNIQUE (permission_id, menu_id)
);

CREATE INDEX idx_permission_menus_permission_id ON permission_menus(permission_id);
CREATE INDEX idx_permission_menus_menu_id       ON permission_menus(menu_id);
```

---

## 데이터 흐름

```
users
  → user_organizations (사용자 ↔ 조직 다대다)
    → organizations
      → org_permissions (조직 ↔ 권한 다대다)
        → permissions (권한 코드/이름)
          → permission_menus (권한 ↔ 메뉴, edit_yn, delete_yn)
            → menus (메뉴 코드/경로)
              → menu_groups (메뉴 그룹)
```

**권한 조회 SQL 패턴:**
```sql
SELECT m.code AS menu_code,
       BOOL_OR(pm.edit_yn = 'Y')   AS can_edit,
       BOOL_OR(pm.delete_yn = 'Y') AS can_delete
FROM   user_organizations uo
JOIN   org_permissions op    ON op.organization_id = uo.organization_id
JOIN   permission_menus pm   ON pm.permission_id   = op.permission_id
JOIN   menus m               ON m.id               = pm.menu_id
WHERE  uo.user_id    = #{userId}
  AND  uo.deleted_at IS NULL
  AND  op.deleted_at IS NULL
  AND  m.deleted_at  IS NULL
GROUP  BY m.code
```

---

## 미들웨어: `checkMenuPermission`

위치: `src/plugins/authenticate.ts` (기존 파일에 추가)

```typescript
export const checkMenuPermission = (
  menuCode: string,
  action?: 'edit' | 'delete',
) => async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const user = req.user as JwtPayload;
  const perms = await getUserMenuPermissions(user.id);  // src/repositories/permissionRepository.ts
  const menu = perms.find(p => p.menu_code === menuCode);

  if (!menu) {
    return reply.code(403).send(errorResponse('접근 권한이 없습니다'));
  }
  if (action === 'edit' && !menu.can_edit) {
    return reply.code(403).send(errorResponse('수정 권한이 없습니다'));
  }
  if (action === 'delete' && !menu.can_delete) {
    return reply.code(403).send(errorResponse('삭제 권한이 없습니다'));
  }
};
```

**라우트 사용 예시:**
```typescript
// 읽기 (행 존재 = 자동 허용)
app.get('/admin/common-codes', {
  preHandler: [authenticate, checkMenuPermission('ADMIN_COMMON_CODE')],
}, handler);

// 수정
app.put('/admin/common-codes/:id', {
  preHandler: [authenticate, checkMenuPermission('ADMIN_COMMON_CODE', 'edit')],
}, handler);

// 삭제
app.delete('/admin/common-codes/:id', {
  preHandler: [authenticate, checkMenuPermission('ADMIN_COMMON_CODE', 'delete')],
}, handler);
```

---

## 씨드 데이터

마이그레이션 실행 시 자동 생성.

### 메뉴 그룹

| code | name |
|---|---|
| `SYSTEM_ADMIN` | 시스템관리 |
| `SERVICE_ADMIN` | 서비스관리 |

### 메뉴

| group | code | name | path |
|---|---|---|---|
| SYSTEM_ADMIN | `ADMIN_COMMON_CODE` | 공통코드 관리 | /admin/common-codes |
| SYSTEM_ADMIN | `ADMIN_MENU` | 메뉴 관리 | /admin/menus |
| SYSTEM_ADMIN | `ADMIN_PERMISSION` | 권한 관리 | /admin/permissions |
| SYSTEM_ADMIN | `ADMIN_ORG` | 조직 관리 | /admin/organizations |
| SERVICE_ADMIN | `ADMIN_FARMER` | 농민 관리 | /admin/farmers |
| SERVICE_ADMIN | `ADMIN_ORDER` | 주문 관리 | /admin/orders |
| SERVICE_ADMIN | `ADMIN_VILLAGE` | 마을 관리 | /admin/village |

### 기본 권한

| code | name | 적용 메뉴 | edit_yn | delete_yn |
|---|---|---|---|---|
| `SUPER_ADMIN` | 슈퍼관리자 | 위 메뉴 전체 | Y | Y |

---

## 기존 코드 변경

| 파일 | 변경 내용 |
|---|---|
| `src/routes/farmerRoutes.ts` | `requireRole('admin')` → `checkMenuPermission('ADMIN_FARMER', ...)` |
| `src/routes/orderRoutes.ts` | `requireRole('admin')` → `checkMenuPermission('ADMIN_ORDER', ...)` |
| `src/routes/villageRoutes.ts` | `requireRole('admin')` → `checkMenuPermission('ADMIN_VILLAGE', ...)` |
| `src/plugins/authenticate.ts` | `checkMenuPermission` 함수 추가 |
| `src/repositories/permissionRepository.ts` | `getUserMenuPermissions(userId)` 구현 |
| `mapper/permission.xml` | 권한 조회 SQL 추가 (namespace: permission) |
| `village_schema.sql` | menu_groups, permission_menus 추가, menus/permissions 수정 |

---

## 마이그레이션 전략

기존 `permissions` 테이블에 데이터가 없으면 단순 ALTER로 처리.  
데이터가 있으면:
1. 기존 `(menu_id, action)` 기반 레코드 삭제
2. `code`, `description` 컬럼 추가
3. 씨드 데이터 INSERT

마이그레이션 파일: `migrations/012_admin_permission_foundation.sql`

---

## SQL Mapper

namespace: `permission`

| sqlId | 설명 |
|---|---|
| `getUserMenuPermissions` | 사용자의 메뉴별 권한 목록 조회 |
| `getMenuTree` | menu_groups + menus 트리 조회 |
