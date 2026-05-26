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
CREATE INDEX idx_files_file_group_id ON files(file_group_id);
CREATE INDEX idx_files_deleted_at    ON files(deleted_at) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uidx_files_main  ON files(file_group_id) WHERE is_main_yn = 'Y' AND deleted_at IS NULL;

-- 3. products: images JSONB → file_group_id
ALTER TABLE products
    DROP COLUMN images,
    ADD COLUMN file_group_id BIGINT REFERENCES file_groups(id) ON DELETE SET NULL;
CREATE INDEX idx_products_file_group_id ON products(file_group_id);

-- 4. farmer_profiles: photo_url → file_group_id
ALTER TABLE farmer_profiles
    DROP COLUMN photo_url,
    ADD COLUMN file_group_id BIGINT REFERENCES file_groups(id) ON DELETE SET NULL;

-- 5. village_content: image_url → file_group_id
ALTER TABLE village_content
    DROP COLUMN image_url,
    ADD COLUMN file_group_id BIGINT REFERENCES file_groups(id) ON DELETE SET NULL;