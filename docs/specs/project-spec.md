# Village Market Backend — 개발 스펙

## 1. 프로젝트 개요

시골 마을 농산물 마켓 백엔드 API 서버.
소비자가 농민의 농산물을 구매하고, 관리자가 전체를 관리하는 플랫폼.

---

## 2. 기술 스택

| 항목 | 내용 |
|------|------|
**프론트엔드** (`village/frontend/`)

| 항목 | 기술 |
|------|------|
| Framework | Vue 3 (SPA) |
| Build Tool | Vite |
| Language | JavaScript (jsconfig.json) |
| Router | Vue Router 5 |
| 상태관리 | Pinia |
| 스타일 | UnoCSS + Sass |
| Template | Pug |
| HTTP Client | Axios |
| 테이블/그리드 | Tabulator Tables |
| 아이콘 | Iconify / Lucide |

**백엔드** (`village/backend/`)

| 항목 | 기술 |
|------|------|
| Runtime | Node.js (CommonJS) |
| Language | TypeScript 5.x |
| Framework | Fastify 4.x |
| DB | PostgreSQL 18 |
| SQL | mybatis-mapper (XML) |
| Package Manager | pnpm |
| Test | Vitest + fastify.inject() |
| Dev Server | tsx watch |
| Build | tsc → dist/ |
| API Docs | Swagger UI (`/docs`) |

---

## 3. 아키텍처

```
HTTP Request
  → src/routes/*.ts          라우트 등록 + Swagger 스펙
  → src/controllers/*.ts     요청/응답 처리, 에러 변환
  → src/services/*.ts        비즈니스 로직, 도메인 규칙
  → src/repositories/*.ts    DB 접근, mybatis-mapper 호출
  → mapper/*.xml             SQL 쿼리 (인라인 SQL 금지)
  → PostgreSQL
```

---

## 4. 인증 / 권한

### 인증 방식

- **Access Token**: JWT, 유효기간 15분, `Authorization: Bearer {token}` 헤더
- **Refresh Token**: DB 저장 (SHA-256 해시), Rotation 방식 — 갱신 시 기존 토큰 폐기 + 새 토큰 발급
- **탈취 감지**: `family_id`로 그룹 관리 — 폐기된 토큰 재사용 시 해당 family 전체 폐기

### 사용자 역할 (UserRole)

| 역할 | 설명 |
|------|------|
| `ADMIN` | 전체 관리 권한 |
| `FARMER` | 농민 — 상품 등록/관리, 주문 처리 |
| `CONSUMER` | 소비자 — 상품 조회/구매 |

### 계정 상태 (UserStatus)

| 상태 | 설명 |
|------|------|
| `PENDING` | 가입 대기 (농민 가입 시 초기값) |
| `ACTIVE` | 정상 활성 |
| `INACTIVE` | 비활성 (관리자가 거절 처리) |

### 메뉴 권한 체계

```
users → user_organizations → organizations
                                ↓
                         org_permissions → permissions
                                                ↓
                                        permission_menus → menus
```

- `checkMenuPermission(menuCode)` 미들웨어로 메뉴 접근 제어
- `edit_yn`, `delete_yn`으로 수정/삭제 권한 세분화
- 초기 시드: 본사(HQ) 조직 → SUPER_ADMIN 권한 → 전체 메뉴 → admin 사용자

---

## 5. 공통 응답 형식

### 성공

```json
{ "success": true, "data": { ... }, "message": "선택적 메시지" }
```

### 페이징

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

### 에러

```json
{ "success": false, "message": "에러 메시지" }
```

### HTTP 상태코드 규칙

| 코드 | 상황 |
|------|------|
| 200 | 조회/수정 성공 |
| 201 | 생성 성공 |
| 400 | 요청 형식 오류 |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 중복 (loginId 등) |
| 500 | 서버 오류 |

---

## 6. API 엔드포인트

### 인증 (`/api/auth`)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | `/auth/register` | — | 회원가입 (role: FARMER\|CONSUMER) |
| POST | `/auth/login` | — | 로그인 → accessToken + refreshToken |
| GET | `/auth/me` | ✓ | 내 정보 조회 |
| POST | `/auth/refresh` | — | 토큰 갱신 |
| POST | `/auth/logout` | — | 로그아웃 (refreshToken 폐기) |

### 농민 (`/api/farmers`, `/api/admin/farmers`)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | `/farmers` | — | 농민 목록 (공개) |
| GET | `/farmers/:id` | — | 농민 상세 |
| GET | `/farmers/me` | FARMER | 내 프로필 |
| PUT | `/farmers/me` | FARMER | 프로필 저장 (upsert) |
| GET | `/admin/farmers` | ADMIN | 전체 농민 목록 (페이징) |
| PATCH | `/admin/farmers/:id/approve` | ADMIN | 농민 승인 |
| PATCH | `/admin/farmers/:id/reject` | ADMIN | 농민 거절 |

### 상품 (`/api/products`)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | `/products` | — | 상품 목록 (category, farmerId 필터) |
| GET | `/products/:id` | — | 상품 상세 |
| GET | `/products/my` | FARMER | 내 상품 목록 |
| POST | `/products` | FARMER | 상품 등록 |
| PUT | `/products/:id` | FARMER | 상품 수정 |
| DELETE | `/products/:id` | FARMER | 상품 삭제 |

### 장바구니 (`/api/cart`)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | `/cart` | CONSUMER | 장바구니 조회 |
| POST | `/cart` | CONSUMER | 상품 추가 |
| PATCH | `/cart/:itemId` | CONSUMER | 수량 변경 |
| DELETE | `/cart/:itemId` | CONSUMER | 항목 삭제 |
| DELETE | `/cart` | CONSUMER | 전체 비우기 |

### 주문 (`/api/orders`, `/api/admin/orders`)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | `/orders` | CONSUMER | 내 주문 목록 |
| GET | `/orders/:id` | CONSUMER | 주문 상세 |
| POST | `/orders` | CONSUMER | 주문 생성 (재고 차감) |
| PATCH | `/orders/:id/cancel` | CONSUMER | 주문 취소 |
| GET | `/admin/orders` | FARMER\|ADMIN | 전체 주문 목록 |
| PATCH | `/admin/orders/:id/status` | FARMER\|ADMIN | 주문 상태 변경 |

### 마을 콘텐츠 (`/api/village`)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | `/village` | — | 전체 섹션 목록 |
| GET | `/village/:section` | — | 섹션별 콘텐츠 |
| GET | `/admin/village` | ADMIN | 관리용 전체 조회 |
| POST | `/admin/village` | ADMIN | 콘텐츠 생성 |
| PUT | `/admin/village/:id` | ADMIN | 콘텐츠 수정 |
| DELETE | `/admin/village/:id` | ADMIN | 콘텐츠 삭제 |

### 파일 (`/api/files`)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | `/files/groups` | ✓ | 파일 그룹 생성 |
| POST | `/files/upload` | ✓ | 파일 업로드 (multipart) |
| GET | `/files/:id` | — | 파일 메타 조회 |
| PATCH | `/files/:id/main` | ✓ | 대표 이미지 지정 |
| DELETE | `/files/:id` | ✓ | 파일 삭제 |

### 공통코드 (`/api/admin/common-code-groups`)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | `/admin/common-code-groups` | ADMIN | 그룹 목록 |
| POST | `/admin/common-code-groups` | ADMIN | 그룹 생성 |
| PUT | `/admin/common-code-groups/:id` | ADMIN | 그룹 수정 |
| DELETE | `/admin/common-code-groups/:id` | ADMIN | 그룹 삭제 |
| GET | `/admin/common-code-groups/:groupId/codes` | ADMIN | 코드 목록 |
| POST | `/admin/common-code-groups/:groupId/codes` | ADMIN | 코드 생성 |
| PUT | `/admin/common-codes/:id` | ADMIN | 코드 수정 |
| DELETE | `/admin/common-codes/:id` | ADMIN | 코드 삭제 |

### 메뉴 (`/api/menus`, `/api/admin/menus`)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | `/menus` | — | 공개 메뉴 (use_yn=Y, 그룹별) |
| GET | `/admin/menus` | ADMIN | 전체 메뉴 (그룹별) |
| POST | `/admin/menus` | ADMIN | 메뉴 생성 |
| PUT | `/admin/menus/:id` | ADMIN | 메뉴 수정 |
| DELETE | `/admin/menus/:id` | ADMIN | 메뉴 삭제 (자식 포함 soft delete) |

---

## 7. DB 주요 테이블

| 테이블 | 설명 |
|--------|------|
| `users` | 사용자 (ADMIN / FARMER / CONSUMER 통합) |
| `user_refresh_tokens` | JWT Refresh Token (Token Rotation) |
| `farmer_profiles` | 농민 프로필 (users와 1:1) |
| `products` | 상품 (ACTIVE / HIDDEN / SOLDOUT) |
| `cart_items` | 장바구니 항목 |
| `orders` | 주문 헤더 |
| `order_items` | 주문 상세 항목 |
| `organizations` | 조직 (계층형) |
| `user_organizations` | 사용자-조직 매핑 |
| `permissions` | 권한 단위 |
| `org_permissions` | 조직-권한 매핑 |
| `permission_menus` | 권한별 메뉴 접근 범위 (edit_yn, delete_yn) |
| `menu_groups` | 메뉴 그룹 (VILLAGE / SHOP / FARMERS / ADMIN / MY) |
| `menus` | 메뉴 (계층형, dept로 깊이 표현) |
| `village_content` | 마을 소개 콘텐츠 |
| `file_groups` | 파일 그룹 |
| `files` | 업로드 파일 메타 |
| `common_code_groups` | 공통코드 그룹 |
| `common_codes` | 공통코드 항목 |

### ENUM 코드값 (모두 대문자)

```
user_role:    ADMIN / FARMER / CONSUMER
user_status:  PENDING / ACTIVE / INACTIVE
product_status: ACTIVE / HIDDEN / SOLDOUT
order_status: PENDING / CONFIRMED / SHIPPED / DELIVERED / CANCELLED
```

---

## 8. 개발 환경

```bash
# 개발 서버 (hot reload)
pnpm dev

# 테스트
pnpm test

# 프로덕션 빌드
pnpm build      # → dist/
pnpm start      # → node dist/server.js

# API 문서
http://localhost:3000/docs
```

### 환경변수 (`.env`)

```
DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD
JWT_SECRET
LOG_LEVEL=debug
CORS_ORIGIN
```

---

## 9. 주요 개발 규칙

- 모든 SQL은 `mapper/*.xml`에 작성 — 인라인 SQL 금지
- DB 접근은 `src/db/pool.ts`의 `query` / `queryOne` / `execute`만 사용
- 소프트 삭제: `deleted_at` 컬럼, 조회 시 `WHERE deleted_at IS NULL` 필수
- 페이징 응답: `PaginatedResult<T>` 타입 + `paginatedResponse()` 유틸 사용 ([패턴 문서](../pagination-pattern.md))
- 테스트: `vi.mock('../src/db/pool')` 으로 DB 모킹, 실제 DB 불필요
