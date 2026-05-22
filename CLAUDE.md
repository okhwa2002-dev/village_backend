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

## 주요 규칙

### SQL (mybatis-mapper)
- 모든 SQL은 `mapper/*.xml`에 작성. 코드에 인라인 SQL 금지.
- namespace는 도메인명 (auth, farmer, product, cart, order, village).
- `src/db/pool.ts`의 `query`, `queryOne`, `execute` 함수를 통해서만 DB 접근.

### 인증
- JWT Access Token (1h) + Refresh Token (7d).
- 보호된 라우트에는 preHandler로 `authenticate` 또는 `requireRole` 사용.
- 농민 가입 시 status='pending'. 관리자 승인 후 'active'.

### 에러 처리
- Service 레이어에서 의미 있는 에러 메시지를 throw.
- Controller 레이어에서 에러 메시지를 HTTP 상태코드로 변환.
- 공통 응답은 `src/utils/response.ts`의 `successResponse`, `errorResponse` 사용.

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
