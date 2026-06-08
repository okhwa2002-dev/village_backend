# Village Backend — CLAUDE.md

## 프로젝트 개요
시골 마을 농산물 마켓 백엔드 API 서버.
Node.js + TypeScript + Fastify + PostgreSQL + mybatis-mapper

## 아키텍처

요청 흐름:
```
HTTP Request
  → src/routes/*.ts          (Fastify 라우트 등록 + Swagger 스펙)
  → src/controllers/*.ts     (요청/응답 처리, 에러 변환)
  → src/services/*.ts        (비즈니스 로직, 도메인 규칙)
  → src/repositories/*.ts    (DB 접근, mybatis-mapper 호출)
  → mapper/*.xml             (SQL 쿼리)
  → PostgreSQL
```

## 파일 생성 규칙

- 파일명은 camelCase, 첫 글자는 소문자.
- 레이어별 접미사: `farmerService.ts`, `farmerRepository.ts`, `farmerController.ts`, `farmerRoutes.ts`, `farmerTypes.ts`
- XML mapper는 예외: `farmer.xml` (도메인명 소문자)

## 코드 스타일 규칙

### Export 패턴 (전 레이어 공통)

모든 레이어는 **named const + export default** 형태를 사용한다.

**Routes** — `async` 화살표 함수:
```ts
const farmerRoutes = async (app: FastifyInstance) => {
  app.get("/farmers", ..., farmerController.list);
};
export default farmerRoutes;
```

**Controllers / Services / Repositories** — 인라인 메소드 객체:
```ts
const farmerController = {
  async list(req: FastifyRequest, reply: FastifyReply) { ... },
  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) { ... },
};
export default farmerController;
```

### Private helpers

객체 공개 API에 속하지 않는 내부 함수는 **모듈 레벨 `const`** 로 선언하고 객체 밖에 둔다.

```ts
// 모듈 레벨 — 공개 API 아님
const toFarmerProfile = (row: any): FarmerProfile => ({ ... });
const getOrCreateCart = async (userId: string) => { ... };

const cartService = {
  async getCart(userId: string) {
    const cart = await getOrCreateCart(userId); // private helper 호출
    ...
  },
};
export default cartService;
```

Repository의 row mapper (`toXxx`), Service의 내부 로직 함수가 여기에 해당한다.

### Controller 메소드 네이밍

`Handler` 접미사 없이 의미 중심의 짧은 이름을 사용한다.

| 역할 | 메소드명 |
|------|---------|
| 목록 조회 | `list` |
| 단건 조회 | `getById` |
| 생성 | `create` |
| 수정 | `update` |
| 삭제 | `delete` |
| 관리자 목록 | `listAdmin` |
| 내 목록 | `listMine` |

## 주요 규칙

### SQL (mybatis-mapper)
- 모든 SQL은 `mapper/*.xml`에 작성. 코드에 인라인 SQL 금지.
- namespace는 도메인명 (auth, farmer, product, cart, order, village).
- `src/db/pool.ts`의 `query`, `queryOne`, `execute` 함수를 통해서만 DB 접근.
- `<where>` 태그는 지원되지 않는다. 고정 조건을 `WHERE`에 직접 쓰고 선택 조건을 `<if>`로 이어붙인다.
- PostgreSQL enum 컬럼을 `text[]`와 비교할 때는 `::text` 캐스팅 필요.

```xml
<!-- 금지 -->
<where>
  <if test="...">AND ...</if>
</where>

<!-- 사용 -->
WHERE fixed_condition
<if test="keyword != null and keyword != ''">
  AND col LIKE '%' || #{keyword} || '%'
</if>
<if test="status != null and status != ''">
  AND enum_col::text = ANY(string_to_array(#{status}, ','))
</if>
```

### 인증
- JWT Access Token (1h) + Refresh Token (7d).
- 보호된 라우트에는 preHandler로 `authenticate` 또는 `requireRole` 사용.
- 농민 가입 시 status='pending'. 관리자 승인 후 'active'.

### 에러 처리

`src/utils/errors.ts`에 `AppError` 클래스와 `Errors` 팩토리가 정의되어 있다.

**`Errors` 팩토리** — HTTP 상태별 생성 메소드, 기본 메시지를 가지며 업무단에서 재정의 가능:

| 메소드 | 상태 | 기본 메시지 |
|--------|------|-------------|
| `Errors.notFound(msg?)` | 404 | 리소스를 찾을 수 없습니다. |
| `Errors.badRequest(msg?)` | 400 | 잘못된 요청입니다. |
| `Errors.conflict(msg?)` | 409 | 이미 존재하는 리소스입니다. |
| `Errors.forbidden(msg?)` | 403 | 접근 권한이 없습니다. |
| `Errors.unauthorized(msg?)` | 401 | 인증이 필요합니다. |
| `Errors.internal(msg?)` | 500 | 서버 오류가 발생했습니다. |

```ts
// Service — 기본 메시지 사용
throw Errors.notFound();

// Service — 업무 맞춤 메시지
throw Errors.notFound("상품을 찾을 수 없습니다");
throw Errors.conflict("이미 사용 중인 아이디입니다");

// Controller — catch 블록은 항상 이 형태만 사용
} catch (err: unknown) {
  return handleError(err, reply);
}
```

- `handleError`는 `AppError`면 해당 상태코드/메시지로 응답하고, 그 외는 re-throw한다.
- 공통 응답은 `src/utils/response.ts`의 `successResponse`, `errorResponse` 사용.
- Controller에 에러 분기 로직을 두지 않는다. 모든 분기는 Service에서 `Errors.xxx()`로 처리.

### 엑셀 다운로드

`src/utils/excel.ts`에 `generateExcel`, `sendExcelReply`가 정의되어 있다.

- **Service**: 데이터 조회 + 빈값 체크 + `generateExcel()` 호출 → `{ buffer, filename }` 반환.
- **Controller**: Service 호출 후 `sendExcelReply(reply, buffer, filename)` 로 응답.
- 컬럼 정의(`columns`), 행 변환(`rowMapper`), 시트명, 타이틀은 모두 Service에서 관리한다.
- 파일명은 `generateExcel` 내부에서 `title_YYYYMMDDHHmmss.xlsx` 형태로 자동 생성된다.

```ts
// Service
async exportFarmerExcel(filters) {
  const data = await repo.findAll(filters);
  if (data.length === 0) throw Errors.notFound("다운로드할 데이터가 없습니다");
  return generateExcel<MyType>({
    title: "농민 관리 목록",
    sheetName: "농민목록",
    columns: [...],
    data,
    rowMapper: (item) => ({ ... }),
  });
}

// Controller
async exportExcel(req, reply) {
  try {
    const { buffer, filename } = await myService.exportFarmerExcel(filters);
    sendExcelReply(reply, buffer, filename);
  } catch (err: unknown) {
    return handleError(err, reply);
  }
}
```

### 테스트
- vitest + fastify.inject() 사용.
- DB는 vi.mock('../src/db/pool')으로 모킹.
- 테스트 파일: `tests/*.test.ts`

## 실행 환경
- 명령어는 **Bash** 도구를 사용 (PowerShell 사용 금지).

## 환경변수
`.env.example` 참고. `.env`는 git에 포함하지 않음.

## 실행
- 개발: `pnpm dev`
- 테스트: `pnpm test`
- 빌드: `pnpm build`
- API 문서: http://localhost:3000/docs
