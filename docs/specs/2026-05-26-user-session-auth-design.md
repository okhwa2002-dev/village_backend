# 사용자 세션 기반 인증 시스템 설계

- 작성일: 2026-05-26
- 상태: 확정

## 개요

현재 JWT 기반 stateless 인증을 DB 세션 토큰 방식으로 전환한다.  
로그인 시 UUID 토큰을 생성해 DB에 저장하고 프론트에 반환, 이후 모든 API 호출은 해당 토큰으로 인증한다.  
세션은 슬라이딩 방식으로 유지되며 기본 30분, 환경변수로 변경 가능하다.

---

## 핵심 요구사항

- 로그인 식별자를 `email` → `login_id`(아이디)로 변경
- 로그인 성공 시 UUID 토큰 생성 → `user_sessions` 테이블 저장 → 프론트 반환
- API 호출마다 토큰으로 DB 조회, 유효하면 `expires_at` 갱신 (슬라이딩)
- 로그아웃 시 `expires_at = NOW()` 업데이트 (즉시 만료, 레코드 삭제 없음)
- 세션 유지 시간: 기본 30분, `SESSION_DURATION_MINUTES` 환경변수로 설정
- `@fastify/jwt` 제거, `/auth/refresh` 엔드포인트 제거

---

## 스키마 변경

### 수정: `users` — 컬럼 추가

```sql
ALTER TABLE users
    ADD COLUMN login_id             VARCHAR(50)  UNIQUE,
    ADD COLUMN name                 VARCHAR(100),
    ADD COLUMN phone                VARCHAR(20),
    ADD COLUMN last_login_at        TIMESTAMP,
    ADD COLUMN password_changed_at  TIMESTAMP;

-- email을 선택값으로 변경 (기존 NOT NULL 제거)
ALTER TABLE users
    ALTER COLUMN email DROP NOT NULL;

CREATE UNIQUE INDEX idx_users_login_id ON users(login_id) WHERE deleted_at IS NULL;
```

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `login_id` | VARCHAR(50) UNIQUE | 로그인용 아이디 (새 로그인 식별자) |
| `name` | VARCHAR(100) | 사용자 이름 |
| `phone` | VARCHAR(20) | 연락처 |
| `email` | VARCHAR(255) nullable | 알림용 이메일 (로그인 식별자 아님) |
| `last_login_at` | TIMESTAMP | 최종 로그인 일시 (로그인 성공마다 갱신) |
| `password_changed_at` | TIMESTAMP | 비밀번호 변경 일시 |

### 신규: `user_sessions` — 세션 관리

```sql
CREATE TABLE user_sessions (
    id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users(id),
    token      VARCHAR(36) NOT NULL UNIQUE,
    expires_at TIMESTAMP   NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_sessions_token      ON user_sessions(token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
```

---

## 인증 흐름

### 로그인 `POST /auth/login`

```
요청: { login_id: string, password: string }

1. users WHERE login_id = ? AND deleted_at IS NULL 조회
2. 미존재 또는 비밀번호 불일치 → 401
3. status !== 'active' → 403
4. UUID 토큰 생성 (crypto.randomUUID())
5. user_sessions INSERT (expires_at = NOW() + SESSION_DURATION_MINUTES)
6. users.last_login_at = NOW() 갱신
7. 응답: { token, user: { id, login_id, name, role } }
```

### API 인증 미들웨어 (`authenticate`)

```
Authorization: Bearer <uuid-token>

1. 헤더에서 토큰 추출 (없으면 401)
2. SELECT * FROM user_sessions
   WHERE token = ? AND expires_at > NOW()
3. 미존재 또는 만료 → 401
4. UPDATE user_sessions SET expires_at = NOW() + SESSION_DURATION_MINUTES
   WHERE token = ?  (슬라이딩 갱신)
5. user_id로 users 조회 → req.user = { id, login_id, name, role } 설정
```

### 로그아웃 `POST /auth/logout`

```
1. 헤더에서 토큰 추출
2. UPDATE user_sessions SET expires_at = NOW() WHERE token = ?
3. 응답: { success: true }
```

---

## 데이터 흐름

```
POST /auth/login
  → authService.login(login_id, password)
    → authRepository.findUserByLoginId(login_id)
    → authRepository.createSession(userId, token, expiresAt)
    → authRepository.updateLastLoginAt(userId)
  → { token, user }

API 요청 (Bearer token)
  → authenticate 미들웨어
    → authRepository.findSessionByToken(token)
    → authRepository.refreshSession(token, expiresAt)
    → req.user = { id, login_id, name, role }
  → 라우트 핸들러
```

---

## 환경변수

| 변수 | 기본값 | 설명 |
|---|---|---|
| `SESSION_DURATION_MINUTES` | `30` | 세션 유지 시간 (분) |

기존 `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`은 제거.

---

## 파일 변경 범위

| 파일 | 변경 내용 |
|---|---|
| `village_schema.sql` | users 컬럼 추가, user_sessions 테이블 신규 |
| `migrations/013_user_session_auth.sql` | 마이그레이션 (IF NOT EXISTS, IF EXISTS 가드) |
| `src/types/userTypes.ts` | `LoginDto` (login_id/password), `RegisterDto` (login_id/name/phone 추가) |
| `src/types/commonTypes.ts` | `SessionUser` 타입으로 교체 (id, login_id, name, role) |
| `mapper/auth.xml` | findUserByLoginId, createSession, findSessionByToken, refreshSession, updateLastLoginAt SQL |
| `src/repositories/authRepository.ts` | 세션 CRUD, login_id 기반 조회 |
| `src/services/authService.ts` | 로그인/로그아웃 로직 교체 |
| `src/plugins/authenticate.ts` | JWT verify → DB 세션 조회로 교체 |
| `src/controllers/authController.ts` | 토큰 발급 방식 변경, refreshHandler 제거 |
| `src/routes/authRoutes.ts` | refresh 라우트 제거, body 스키마 수정 |
| `src/app.ts` | `@fastify/jwt` 제거 |
| `.env.example` | `SESSION_DURATION_MINUTES=30` 추가, JWT 변수 제거 |
| `tests/auth.test.ts` | 전체 재작성 |

**변경 없는 파일:**
- `src/routes/farmerRoutes.ts`, `orderRoutes.ts`, `villageRoutes.ts` — preHandler 그대로

**주의: `requireRole` 내부 수정 필요**  
현재 `requireRole`이 내부에서 `req.jwtVerify()`를 직접 호출한다.  
JWT 제거 후에는 `jwtVerify()` 호출을 제거하고, `authenticate` 이후 `req.user`가 이미 설정된 상태를 전제로 동작하도록 변경한다.

---

## SQL Mapper

namespace: `auth`

| sqlId | 설명 |
|---|---|
| `findUserByLoginId` | login_id로 사용자 조회 |
| `createSession` | 세션 생성 |
| `findSessionByToken` | 토큰으로 세션+사용자 조회 (JOIN) |
| `refreshSession` | expires_at 갱신 (슬라이딩) |
| `expireSession` | 로그아웃 — expires_at = NOW() |
| `updateLastLoginAt` | 최종 로그인 일시 갱신 |

---

## 마이그레이션 전략

- `login_id`는 기존 사용자에 대해 NULL 허용으로 추가 후 UNIQUE 인덱스 적용
- 기존 사용자는 관리자가 login_id를 직접 설정하거나 별도 일괄 처리
- `email` NOT NULL 제약 해제 (기존 데이터 유지)

마이그레이션 파일: `migrations/013_user_session_auth.sql`