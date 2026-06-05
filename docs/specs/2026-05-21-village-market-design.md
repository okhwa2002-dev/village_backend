# Village Market — 설계 문서

**작성일**: 2026-05-21  
**프로젝트 경로**: `D:/workspace/ok2020/village/`

---

## 1. 프로젝트 개요

시골 마을을 소개하고 주민 농산물을 판매하는 웹사이트.

- 마을 소개 콘텐츠를 관리자가 CMS 방식으로 운영
- 농민(판매자)은 자신의 농산물을 등록하여 판매
- 소비자는 마을을 구경하고 농산물을 주문 (비회원 포함)
- 관리자는 농민 승인, 콘텐츠 관리, 상품 대리 등록/수정 가능

---

## 2. 기술 스택

### Backend (`village/backend/`)
| 항목 | 기술 |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Fastify |
| API 문서 | @fastify/swagger + @fastify/swagger-ui |
| DB | PostgreSQL |
| SQL 관리 | mybatis-mapper (XML mapper) |
| DB 드라이버 | pg (node-postgres) |
| 개발 실행 | tsx |
| 빌드 | tsc → dist/ |

### Frontend (`village/frontend/`)
| 항목 | 기술 |
|---|---|
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

---

## 3. 프로젝트 구조

```
village/
├── backend/
│   ├── .claude/
│   │   └── commands/
│   ├── CLAUDE.md
│   ├── src/
│   │   ├── routes/                      # API 라우트 + Swagger 스펙
│   │   │   ├── auth.ts
│   │   │   ├── farmer.ts
│   │   │   ├── product.ts
│   │   │   ├── cart.ts
│   │   │   ├── order.ts
│   │   │   ├── village.ts
│   │   │   └── admin.ts
│   │   ├── controllers/                 # 요청 처리 로직
│   │   │   ├── auth.controller.ts
│   │   │   ├── farmer.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── cart.controller.ts
│   │   │   ├── order.controller.ts
│   │   │   ├── village.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── services/                    # 비즈니스 로직
│   │   │   ├── auth.service.ts
│   │   │   ├── farmer.service.ts
│   │   │   ├── product.service.ts
│   │   │   ├── cart.service.ts
│   │   │   ├── order.service.ts
│   │   │   ├── village.service.ts
│   │   │   └── admin.service.ts
│   │   ├── repositories/                # DB 접근 (mybatis-mapper 호출)
│   │   │   ├── auth.repository.ts
│   │   │   ├── farmer.repository.ts
│   │   │   ├── product.repository.ts
│   │   │   ├── cart.repository.ts
│   │   │   ├── order.repository.ts
│   │   │   └── village.repository.ts
│   │   ├── types/                       # 공통 타입/인터페이스
│   │   │   ├── user.types.ts
│   │   │   ├── product.types.ts
│   │   │   ├── order.types.ts
│   │   │   └── common.types.ts
│   │   └── utils/
│   │       ├── jwt.ts                   # JWT 생성/검증
│   │       ├── hash.ts                  # 비밀번호 bcrypt
│   │       ├── email.ts                 # 주문 알림 이메일
│   │       └── response.ts             # 공통 응답 포맷
│   ├── mapper/                          # MyBatis XML 쿼리 파일
│   │   ├── auth.xml
│   │   ├── farmer.xml
│   │   ├── product.xml
│   │   ├── cart.xml
│   │   ├── order.xml
│   │   └── village.xml
│   ├── tsconfig.json
│   └── package.json
│
└── frontend/
    ├── .claude/
    │   └── commands/
    ├── CLAUDE.md
    ├── pages/
    │   ├── index.vue                    # 메인 (마을 소개 히어로)
    │   ├── village/
    │   │   └── index.vue                # 마을 상세 소개
    │   ├── shop/
    │   │   ├── index.vue                # 전체 상품 목록
    │   │   └── [id].vue                 # 상품 상세
    │   ├── farmers/
    │   │   ├── index.vue                # 농민 목록
    │   │   └── [id].vue                 # 농민 프로필 + 상품
    │   ├── order/
    │   │   ├── index.vue                # 주문서 작성
    │   │   └── complete.vue             # 주문 완료
    │   ├── auth/
    │   │   ├── login.vue
    │   │   └── register.vue
    │   └── admin/
    │       ├── index.vue                # 대시보드
    │       ├── farmers.vue              # 농민 승인 관리
    │       ├── products.vue             # 상품 관리
    │       ├── orders.vue               # 주문 관리
    │       └── village.vue              # 마을 콘텐츠 편집
    ├── components/
    │   ├── common/
    │   ├── product/
    │   ├── farmer/
    │   └── admin/
    ├── stores/
    │   ├── auth.ts
    │   ├── cart.ts
    │   └── village.ts
    ├── composables/
    ├── layouts/
    │   ├── default.vue
    │   └── admin.vue
    └── package.json
```

---

## 4. 사용자 역할 (Role)

| 역할 | 설명 |
|---|---|
| `admin` | 전체 관리 — 농민 승인, 마을 콘텐츠 편집, 모든 상품 CRUD, 주문 조회 |
| `farmer` | 자신의 상품 CRUD, 자신의 주문 조회 |
| `consumer` | 회원 가입 후 주문 내역 조회 |
| `guest` | 비회원 주문 가능 (이름·연락처·이메일 입력) |

---

## 5. 인증

- JWT Access Token + Refresh Token
- 농민 가입: `status: pending` → 관리자 승인 → `status: active`
- 소비자: 가입 선택적. 비회원도 주문 가능
- 관리자 계정: 초기 seed 데이터로 생성

---

## 6. 주요 API 엔드포인트

### 인증
| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/auth/register` | 회원가입 (farmer/consumer) |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/refresh` | 토큰 갱신 |
| POST | `/api/auth/logout` | 로그아웃 |

### 농민
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/farmers` | 농민 목록 |
| GET | `/api/farmers/:id` | 농민 프로필 + 상품 |
| PUT | `/api/farmers/:id` | 농민 프로필 수정 |

### 상품
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/products` | 전체 상품 목록 (필터/검색) |
| GET | `/api/products/:id` | 상품 상세 |
| POST | `/api/products` | 상품 등록 (farmer/admin) |
| PUT | `/api/products/:id` | 상품 수정 (farmer 본인/admin) |
| DELETE | `/api/products/:id` | 상품 삭제 (farmer 본인/admin) |

### 장바구니
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/cart` | 장바구니 조회 (회원: user_id, 비회원: guest_token) |
| POST | `/api/cart/items` | 상품 추가 |
| PUT | `/api/cart/items/:id` | 수량 변경 |
| DELETE | `/api/cart/items/:id` | 상품 제거 |
| POST | `/api/cart/merge` | 로그인 시 게스트 장바구니 병합 |

### 주문
| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/orders` | 주문 생성 (회원/비회원) |
| GET | `/api/orders/:id` | 주문 조회 |
| GET | `/api/orders/mine` | 내 주문 목록 (회원) |
| PATCH | `/api/orders/:id/status` | 주문 상태 변경 (farmer/admin) |

### 마을 콘텐츠
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/village` | 마을 콘텐츠 전체 조회 |
| GET | `/api/village/:section` | 섹션별 조회 |
| POST | `/api/village` | 콘텐츠 섹션 추가 (admin) |
| PUT | `/api/village/:id` | 콘텐츠 수정 (admin) |
| DELETE | `/api/village/:id` | 콘텐츠 삭제 (admin) |

### 관리자
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/admin/farmers/pending` | 승인 대기 농민 목록 |
| PATCH | `/api/admin/farmers/:id/approve` | 농민 승인 |
| PATCH | `/api/admin/farmers/:id/reject` | 농민 거절 |

---

## 7. 데이터베이스 스키마

상세 DDL은 [`backend/village_schema.sql`](../../backend/village_schema.sql) 참조.

### 테이블 목록

| 테이블 | 설명 |
|---|---|
| `users` | 사용자 (admin/farmer/consumer) |
| `farmer_profiles` | 농민 프로필 및 농장 소개 |
| `products` | 농산물 상품 |
| `carts` | 장바구니 (회원/비회원) |
| `cart_items` | 장바구니 상품 |
| `orders` | 주문 |
| `order_items` | 주문 상품 (주문 시점 가격 보존) |
| `village_content` | 마을 소개 CMS 콘텐츠 |

---

## 8. 주문 흐름

```
소비자 → 상품 선택 → 장바구니 → 주문서 작성 (회원/비회원) → 주문 완료
                                                                    ↓
                                                     이메일 알림 → 농민 + 관리자
                                                                    ↓
                                                       농민이 직접 연락 후 거래 확정
                                                                    ↓
                                                        (추후 PG 결제 연동 가능)
```

---

## 9. 장바구니 흐름

- 비회원: 클라이언트에서 UUID `guest_token` 생성 → localStorage 저장 → 요청마다 헤더로 전송
- 로그인 시: `guest_token`을 서버에 전달해 회원 장바구니로 병합 (`POST /api/cart/merge`)

---

## 10. 이미지 업로드

- 로컬 개발: `backend/uploads/` 디렉터리에 저장
- API: `@fastify/multipart` 플러그인 사용
- 추후 S3/NCP Object Storage로 교체 가능한 구조로 서비스 레이어 추상화

---

## 11. 배포

- 현재: 로컬 개발 환경
- 추후: 클라우드 배포 (미정) — DB는 PostgreSQL 유지
