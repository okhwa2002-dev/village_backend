# API 규칙

## 엔드포인트 네이밍 규칙

### 기본 원칙
- 모든 API는 `/api` 프리픽스로 시작
- 리소스명은 복수형 소문자 (`/products`, `/orders`)
- 단어 구분은 하이픈 (`/order-items`, `/farmer-profiles`)
- 동사 사용 금지 — HTTP 메서드로 행위를 표현

### HTTP 메서드 사용 기준

| 메서드 | 용도 | 예시 |
|--------|------|------|
| GET | 조회 | `GET /api/products` |
| POST | 생성 | `POST /api/orders` |
| PUT | 전체 수정 (upsert 포함) | `PUT /api/farmers/me` |
| PATCH | 부분 수정 | `PATCH /api/orders/:id/status` |
| DELETE | 삭제 | `DELETE /api/cart/items/:id` |

### URL 패턴

```
컬렉션 조회:    GET    /api/{resources}
단건 조회:      GET    /api/{resources}/:id
생성:           POST   /api/{resources}
수정:           PUT    /api/{resources}/:id
부분 수정:      PATCH  /api/{resources}/:id
삭제:           DELETE /api/{resources}/:id

본인 리소스:    GET    /api/{resources}/me
중첩 리소스:    GET    /api/{resources}/:id/{sub-resources}
액션:           PATCH  /api/{resources}/:id/{action}
```

---

## 요청/응답 형식

### 공통 응답 형식

`src/utils/response.ts`의 `successResponse`, `errorResponse`를 반드시 사용.

#### 성공 응답
```ts
successResponse(data, message?)

// 결과
{
  "success": true,
  "data": { ... },       // 단건: 객체 / 목록: 배열
  "message": "주문이 완료되었습니다"  // 선택
}
```

#### 에러 응답
```ts
errorResponse(message)

// 결과
{
  "success": false,
  "message": "주문을 찾을 수 없습니다"
}
```

### HTTP 상태코드

| 상황 | 코드 |
|------|------|
| 조회/수정 성공 | 200 |
| 생성 성공 | 201 |
| 잘못된 요청 | 400 |
| 인증 필요 | 401 |
| 권한 없음 | 403 |
| 리소스 없음 | 404 |
| 서버 오류 | 500 |

### 요청 형식

#### Content-Type
- 요청 바디: `application/json`
- 파일 업로드: `multipart/form-data`

#### 인증 헤더
```
Authorization: Bearer <accessToken>
```

#### 쿼리스트링 (목록 조회)
```
GET /api/products?category=채소&farmerId=uuid&page=1&limit=20
```

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| page | number | 페이지 번호 (기본값: 1) |
| limit | number | 페이지 크기 (기본값: 20, 최대: 100) |
| 도메인별 필터 | string | 각 도메인 spec 참고 |

#### 페이지네이션 응답
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Fastify 라우트 타입 명시

라우트 메서드에 제네릭 타입을 반드시 명시:

```ts
// Params
app.get<{ Params: { id: string } }>('/products/:id', handler)

// Body
app.post<{ Body: CreateProductDto }>('/products', handler)

// Querystring
app.get<{ Querystring: { category?: string } }>('/products', handler)

// 복합
app.put<{ Params: { id: string }; Body: UpdateProductDto }>('/products/:id', handler)
```
