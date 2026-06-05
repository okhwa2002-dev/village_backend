# 목록 페이징 패턴

관리자 목록 API에서 공통으로 사용하는 페이징 패턴입니다.
농민 관리(`/api/admin/farmers`)를 기준으로 작성되었습니다.

---

## 응답 구조

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

타입: `ApiResponse<PaginatedResult<T>>` (`src/types/commonTypes.ts`)

---

## 구현 체크리스트

새 목록에 페이징을 추가할 때 아래 5곳을 순서대로 수정합니다.

### 1. mapper/`{domain}`.xml

카운트 쿼리와 페이징 쿼리 두 개를 추가합니다.

```xml
<select id="countForAdmin">
  SELECT COUNT(*) AS total
  FROM {table}
  WHERE deleted_at IS NULL
</select>

<select id="findAllForAdmin">
  SELECT ...
  FROM {table}
  WHERE deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT #{limit} OFFSET #{offset}
</select>
```

검색 조건이 있으면 두 쿼리 모두 동일한 WHERE 조건을 적용해야 합니다.

### 2. src/repositories/`{domain}`Repository.ts

```typescript
import { PaginatedResult } from "../types/commonTypes";

export const findAllForAdmin = async (
  page: number,
  limit: number,
): Promise<PaginatedResult<{도메인타입}>> => {
  const offset = (page - 1) * limit;
  const [rows, countRows] = await Promise.all([
    query<any>("{domain}", "findAllForAdmin", { limit, offset }),
    query<any>("{domain}", "countForAdmin"),
  ]);
  return {
    items: rows.map(toModel),
    total: Number(countRows[0]?.total ?? 0),
    page,
    limit,
  };
};
```

`Promise.all`로 데이터 조회와 카운트 조회를 병렬 실행합니다.

### 3. src/services/`{domain}`Service.ts

```typescript
export const getListForAdmin = (page: number, limit: number) =>
  findAllForAdmin(page, limit);
```

### 4. src/controllers/`{domain}`Controller.ts

```typescript
import { paginatedResponse } from "../utils/response";

export const getListAdminHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const qs = req.query as { page?: string; limit?: string };
  const page = Math.max(1, Number(qs.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(qs.limit) || 20));
  const result = await getListForAdmin(page, limit);
  return reply.send(paginatedResponse(result));
};
```

- `page` 기본값: 1
- `limit` 기본값: 20, 최대: 100

### 5. src/routes/`{domain}`Routes.ts

```typescript
app.get(
  "/admin/{domain}",
  {
    schema: {
      tags: ["Admin"],
      summary: "목록",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          page:  { type: "integer", minimum: 1, default: 1 },
          limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
      },
    },
    preHandler: [authenticate, checkMenuPermission("{MENU_CODE}")],
  },
  getListAdminHandler,
);
```

---

## 검색 조건 추가 시

쿼리스트링에 검색 파라미터를 추가하면 됩니다.

**route 스키마 예시:**
```xml
querystring: {
  type: "object",
  properties: {
    page:   { type: "integer", minimum: 1, default: 1 },
    limit:  { type: "integer", minimum: 1, maximum: 100, default: 20 },
    status: { type: "string", enum: ["PENDING", "ACTIVE", "INACTIVE"] },
    name:   { type: "string" },
  },
},
```

**mapper WHERE 조건 예시 (mybatis dynamic SQL):**
```xml
<select id="countForAdmin">
  SELECT COUNT(*) AS total
  FROM users u
  WHERE u.deleted_at IS NULL
  <if test="status != null">AND u.status = #{status}</if>
  <if test="name != null">AND u.name ILIKE '%' || #{name} || '%'</if>
</select>
```

countForAdmin과 findAllForAdmin 두 쿼리 모두 동일한 `<if>` 조건을 포함해야 합니다.

**controller 예시:**
```typescript
const qs = req.query as { page?: string; limit?: string; status?: string; name?: string };
const page = Math.max(1, Number(qs.page) || 1);
const limit = Math.min(100, Math.max(1, Number(qs.limit) || 20));
const result = await getListForAdmin(page, limit, {
  status: qs.status,
  name: qs.name,
});
```

---

## 테스트 mock 패턴

`pool.query`는 호출 순서대로 소비됩니다.
`findAllForAdmin`과 `countForAdmin`이 `Promise.all`로 실행되므로 mock도 2개 필요합니다.

```typescript
vi.mocked(pool.query)
  .mockResolvedValueOnce([/* permissions */])
  .mockResolvedValueOnce([/* findAllForAdmin 결과 */])
  .mockResolvedValueOnce([{ total: "0" }]);  // countForAdmin
```
