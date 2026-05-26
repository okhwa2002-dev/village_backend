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
CREATE INDEX IF NOT EXISTS idx_menus_group_id ON menus(group_id);

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
    deleted_at    TIMESTAMP,
    deleted_by    BIGINT    REFERENCES users(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_permission_menus
    ON permission_menus(permission_id, menu_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_permission_menus_permission_id
    ON permission_menus(permission_id);
CREATE INDEX IF NOT EXISTS idx_permission_menus_menu_id
    ON permission_menus(menu_id);
CREATE INDEX IF NOT EXISTS idx_permission_menus_deleted_at
    ON permission_menus(deleted_at) WHERE deleted_at IS NULL;

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
ON CONFLICT (code) DO UPDATE SET group_id = EXCLUDED.group_id
WHERE menus.group_id IS NULL;

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
ON CONFLICT (permission_id, menu_id) WHERE deleted_at IS NULL DO NOTHING;