-- 기존 DB에서 파일 관리 시스템을 추가하기 위한 DDL 마이그레이션
-- (village_schema.sql 기준 신규 DB에는 이미 반영되어 있음)

-- 1. file_groups 테이블 생성
CREATE TABLE IF NOT EXISTS file_groups (
    id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ref_type   VARCHAR(50) NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    created_by BIGINT      REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_file_groups_ref_type ON file_groups(ref_type);

-- 2. files 테이블 생성
CREATE TABLE IF NOT EXISTS files (
    id            BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    file_group_id BIGINT       NOT NULL REFERENCES file_groups(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    stored_name   VARCHAR(255) NOT NULL,
    file_path     VARCHAR(500) NOT NULL,
    file_url      VARCHAR(500) NOT NULL,
    mime_type     VARCHAR(100) NOT NULL,
    file_size     BIGINT       NOT NULL,
    storage_type  VARCHAR(20)  NOT NULL DEFAULT 'LOCAL' CHECK (storage_type IN ('LOCAL', 'S3')),
    sort_order    INTEGER      NOT NULL DEFAULT 0,
    is_main_yn    CHAR(1)      NOT NULL DEFAULT 'N' CHECK (is_main_yn IN ('Y', 'N')),
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by    BIGINT       REFERENCES users(id),
    updated_at    TIMESTAMP,
    updated_by    BIGINT       REFERENCES users(id),
    deleted_at    TIMESTAMP,
    deleted_by    BIGINT       REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_files_file_group_id ON files(file_group_id);
CREATE INDEX IF NOT EXISTS idx_files_deleted_at    ON files(deleted_at) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uidx_files_main  ON files(file_group_id) WHERE is_main_yn = 'Y' AND deleted_at IS NULL;

-- 3. products: images JSONB → file_group_id
ALTER TABLE products DROP COLUMN IF EXISTS images;
ALTER TABLE products ADD COLUMN IF NOT EXISTS file_group_id BIGINT REFERENCES file_groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_file_group_id ON products(file_group_id);

-- 4. farmer_profiles: photo_url → file_group_id
ALTER TABLE farmer_profiles DROP COLUMN IF EXISTS photo_url;
ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS file_group_id BIGINT REFERENCES file_groups(id) ON DELETE SET NULL;

-- 5. village_content: image_url → file_group_id
ALTER TABLE village_content DROP COLUMN IF EXISTS image_url;
ALTER TABLE village_content ADD COLUMN IF NOT EXISTS file_group_id BIGINT REFERENCES file_groups(id) ON DELETE SET NULL;