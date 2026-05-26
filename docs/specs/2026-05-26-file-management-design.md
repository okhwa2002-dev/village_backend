# 파일 관리 시스템 설계

- 작성일: 2026-05-26
- 상태: 확정

## 개요

상품 이미지, 농민 프로필 사진, 마을 콘텐츠 이미지 등 여러 도메인에서 공통으로 사용할 파일 관리 시스템 설계.  
`file_groups` + `files` 두 테이블로 구성하며, 각 엔티티는 `file_group_id`만 보관한다.

---

## 핵심 요구사항

- 하나의 엔티티(상품, 농민 프로필 등)에 파일 여러 장 첨부 가능
- 파일 그룹 내 대표 이미지 지정 (`is_main_yn`)
- 파일 표시 순서 관리 (`sort_order`)
- 저장소는 로컬 디스크 우선, 이후 S3 전환 가능하도록 추상화 (`storage_type`)
- 업무 구분 코드로 파일 그룹 출처 추적 (`ref_type`)

---

## 테이블 설계

### `file_groups` — 파일 그룹 컨테이너

```sql
CREATE TABLE file_groups (
    id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ref_type   VARCHAR(50) NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    created_by BIGINT      REFERENCES users(id)
);
```

| 컬럼 | 설명 |
|---|---|
| `ref_type` | 업무 구분 코드 (공통코드 `FILE_REF_TYPE_CD` 참조) |

- 엔티티 생성 전 또는 생성 시 그룹 ID를 먼저 발급한다.
- 삭제는 논리 삭제 없이 물리 삭제 (연관 files CASCADE 삭제).

---

### `files` — 개별 파일 메타데이터

```sql
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
```

| 컬럼 | 설명 |
|---|---|
| `file_group_id` | 소속 그룹 |
| `original_name` | 사용자가 올린 원본 파일명 |
| `stored_name` | UUID 기반 저장 파일명 (중복·보안 방지) |
| `file_path` | 서버 상대 경로 (예: `uploads/product/abc.jpg`) |
| `file_url` | 클라이언트 접근 URL (예: `/files/abc.jpg`) |
| `mime_type` | MIME 타입 (예: `image/jpeg`) |
| `file_size` | 파일 크기 (bytes) |
| `storage_type` | `LOCAL` / `S3` (전환 시 이 컬럼으로 분기) |
| `sort_order` | 그룹 내 표시 순서 (오름차순) |
| `is_main_yn` | 대표 이미지 여부 (`Y` = 대표, 그룹 내 1개만 `Y`) |

- 파일 삭제는 소프트 삭제 (`deleted_at`).
- `is_main_yn = 'Y'`는 그룹 내 1개만 유지 — DB partial unique index + 애플리케이션 양쪽에서 보장.

---

## 공통코드

### `FILE_REF_TYPE_CD` — 업무 구분 코드

| code | name |
|---|---|
| `PRODUCT` | 상품 |
| `FARMER` | 농민 프로필 |
| `VILLAGE` | 마을 콘텐츠 |
| `BOARD` | 게시판 |

---

## 기존 스키마 변경

| 테이블 | 제거 컬럼 | 추가 컬럼 |
|---|---|---|
| `products` | `images JSONB` | `file_group_id BIGINT REFERENCES file_groups(id)` |
| `farmer_profiles` | `photo_url VARCHAR(500)` | `file_group_id BIGINT REFERENCES file_groups(id)` |
| `village_content` | `image_url VARCHAR(500)` | `file_group_id BIGINT REFERENCES file_groups(id)` |

`file_group_id`는 선택적(`NULL` 허용) — 파일 없이 엔티티 등록 가능.

---

## 업로드 흐름

```
① POST /file-groups
   body: { ref_type: 'PRODUCT' }
   → file_group_id 발급

② POST /files  (multipart/form-data, 파일 1개씩)
   body: { file_group_id, is_main_yn }
   → 파일 저장 + files 레코드 생성

③ POST /products
   body: { file_group_id, name, price, ... }
   → 상품 등록
```

파일 먼저 업로드 후 엔티티를 등록하는 2단계 방식.  
미완료 업로드(그룹만 생성되고 엔티티가 연결되지 않은 경우)는 주기적 정리 작업으로 처리.

---

## API 엔드포인트 목록

| Method | Path | 설명 |
|---|---|---|
| `POST` | `/file-groups` | 파일 그룹 생성 |
| `POST` | `/files` | 파일 업로드 (단건) |
| `GET` | `/file-groups/:id/files` | 그룹 내 파일 목록 조회 |
| `PATCH` | `/files/:id` | 파일 정보 수정 (sort_order, is_main_yn) |
| `DELETE` | `/files/:id` | 파일 삭제 (소프트) |

---

## 저장소 추상화 전략

`storage_type` 컬럼으로 저장 위치를 구분한다.

- `LOCAL`: `uploads/` 폴더에 저장, `file_path`로 직접 접근
- `S3`: 버킷에 저장, `file_url`은 CDN URL

전환 시 서비스 레이어의 스토리지 어댑터만 교체하면 되도록 인터페이스를 분리한다.

```
src/services/storage/
  localStorageAdapter.ts
  s3StorageAdapter.ts
  storageAdapter.ts  (interface)
```

---

## 인덱스

```sql
CREATE INDEX idx_files_file_group_id ON files(file_group_id);
CREATE INDEX idx_files_deleted_at    ON files(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_file_groups_ref_type ON file_groups(ref_type);

-- 그룹 내 대표 이미지는 1개만 허용 (소프트 삭제된 파일 제외)
CREATE UNIQUE INDEX uidx_files_main ON files(file_group_id) WHERE is_main_yn = 'Y' AND deleted_at IS NULL;
```

---

## 삭제 시나리오

- **파일 삭제**: `files.deleted_at` 소프트 삭제. 물리 파일은 별도 정리 배치.
- **파일 그룹 삭제**: 엔티티(products 등) 삭제 시 서비스 레이어에서 `file_groups` 물리 삭제 → `files` CASCADE 물리 삭제.
- `products.file_group_id`는 NULL-able이므로 FK 오류 없이 처리 가능.
- 미연결 그룹(엔티티 없이 생성만 된 그룹) 정리는 향후 배치 작업으로 처리.