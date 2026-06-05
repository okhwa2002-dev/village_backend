# 사용자 세션 기반 인증 시스템 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** JWT 기반 stateless 인증을 DB 세션 토큰 방식으로 전환하고, 로그인 식별자를 email → login_id로 변경하며, users 테이블에 name/phone/last_login_at/password_changed_at 컬럼을 추가한다.

**Architecture:** 로그인 시 `crypto.randomUUID()`로 UUID 토큰 생성 → `user_sessions` 테이블 저장 → 프론트에 반환. 이후 모든 API 요청은 `Authorization: Bearer <uuid>` 헤더로 인증하며, `authenticate` 미들웨어가 DB에서 세션 조회 + 슬라이딩 갱신(+30분)을 수행한다. `@fastify/jwt`는 완전 제거한다.

**Tech Stack:** Fastify, TypeScript, PostgreSQL, mybatis-mapper, vitest, `crypto.randomUUID()` (Node.js 내장)

---

## 파일 구조 맵

| 작업 | 파일 |
|---|---|
| 수정 | `village_schema.sql` |
| 신규 | `migrations/013_user_session_auth.sql` |
| 수정 | `src/types/commonTypes.ts` |
| 수정 | `src/types/userTypes.ts` |
| 수정 | `mapper/auth.xml` |
| 수정 | `src/repositories/authRepository.ts` |
| 수정 | `src/services/authService.ts` |
| 수정 | `src/plugins/authenticate.ts` |
| 수정 | `src/controllers/authController.ts` |
| 수정 | `src/routes/authRoutes.ts` |
| 수정 | `src/routes/farmerRoutes.ts` |
| 수정 | `src/app.ts` |
| 수정 | `.env.example` |
| 수정 | `tests/auth.test.ts` |
| 수정 | `tests/permission.test.ts` |

---

## Task 1: village_schema.sql + 마이그레이션 파일

**Files:**
- Modify: `village_schema.sql`
- Create: `migrations/013_user_session_auth.sql`

- [ ] **Step 1: village_schema.sql — users 테이블 수정**

`village_schema.sql`의 users 테이블에서 `email VARCHAR(255) NOT NULL UNIQUE,` 줄을 아래로 교체하고 신규 컬럼을 추가한다.

```sql
CREATE TABLE users (
    id                   BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    login_id             VARCHAR(50)  NOT NULL UNIQUE,
    email                VARCHAR(255),
    password             VARCHAR(255) NOT NULL,
    name                 VARCHAR(100),
    phone                VARCHAR(20),
    role                 user_role    NOT NULL,
    status               user_status  NOT NULL DEFAULT 'pending',
    last_login_at        TIMESTAMP,
    password_changed_at  TIMESTAMP,
    created_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by           BIGINT       REFERENCES users(id),
    updated_at           TIMESTAMP,
    updated_by           BIGINT       REFERENCES users(id),
    deleted_at           TIMESTAMP,
    deleted_by           BIGINT       REFERENCES users(id)
);
COMMENT ON TABLE  users                        IS '서비스 사용자 (소비자/농민/관리자 통합)';
COMMENT ON COLUMN users.login_id               IS '로그인용 아이디 (유일값)';
COMMENT ON COLUMN users.email                  IS '이메일 (알림용, 선택값)';
COMMENT ON COLUMN users.password               IS 'bcrypt 해시된 비밀번호';
COMMENT ON COLUMN users.name                   IS '사용자 이름';
COMMENT ON COLUMN users.phone                  IS '연락처';
COMMENT ON COLUMN users.role                   IS '역할: admin=관리자, farmer=농민, consumer=소비자';
COMMENT ON COLUMN users.status                 IS '계정 상태: pending=승인대기, active=정상, inactive=비활성';
COMMENT ON COLUMN users.last_login_at          IS '최종 로그인 일시';
COMMENT ON COLUMN users.password_changed_at    IS '비밀번호 변경 일시';
COMMENT ON COLUMN users.created_at             IS '계정 생성 일시';
COMMENT ON COLUMN users.deleted_at             IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
CREATE INDEX idx_users_deleted_at  ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_login_id ON users(login_id) WHERE deleted_at IS NULL;
```

- [ ] **Step 2: village_schema.sql — user_sessions 테이블 추가**

users 테이블 블록 바로 뒤에 삽입한다.

```sql
-- 사용자 세션
CREATE TABLE user_sessions (
    id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users(id),
    token      VARCHAR(36) NOT NULL UNIQUE,
    expires_at TIMESTAMP   NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  user_sessions            IS '로그인 세션 (슬라이딩 만료)';
COMMENT ON COLUMN user_sessions.token      IS 'UUID 세션 토큰';
COMMENT ON COLUMN user_sessions.expires_at IS '만료 일시 — 로그아웃 시 NOW()로 갱신';
CREATE INDEX idx_user_sessions_token      ON user_sessions(token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
```

- [ ] **Step 3: migrations/013_user_session_auth.sql 생성**

```sql
-- 013: JWT → DB 세션 전환, login_id/name/phone/last_login_at/password_changed_at 추가

-- 1. users 컬럼 추가
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS login_id            VARCHAR(50),
    ADD COLUMN IF NOT EXISTS name                VARCHAR(100),
    ADD COLUMN IF NOT EXISTS phone               VARCHAR(20),
    ADD COLUMN IF NOT EXISTS last_login_at       TIMESTAMP,
    ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;

-- email NOT NULL 제약 해제
ALTER TABLE users
    ALTER COLUMN email DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_id
    ON users(login_id) WHERE deleted_at IS NULL;

-- 2. user_sessions 신규
CREATE TABLE IF NOT EXISTS user_sessions (
    id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users(id),
    token      VARCHAR(36) NOT NULL UNIQUE,
    expires_at TIMESTAMP   NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token
    ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at
    ON user_sessions(expires_at);
```

- [ ] **Step 4: 커밋**

```bash
cd /d/workspace/ok2020/village/backend
git add village_schema.sql migrations/013_user_session_auth.sql
git commit -m "feat: add login_id/user_sessions schema for session-based auth"
```

---

## Task 2: 타입 + SQL 매퍼 + 리포지토리 (TDD)

**Files:**
- Modify: `src/types/commonTypes.ts`
- Modify: `src/types/userTypes.ts`
- Modify: `mapper/auth.xml`
- Modify: `src/repositories/authRepository.ts`
- Test: `tests/auth.test.ts` (repository unit tests 추가)

- [ ] **Step 1: commonTypes.ts 수정**

`JwtPayload`를 `SessionUser`로 교체한다. 기존 `JwtPayload`는 삭제.

```typescript
// src/types/commonTypes.ts
export type UserRole = 'admin' | 'farmer' | 'consumer'
export type UserStatus = 'pending' | 'active' | 'inactive'
export type ProductStatus = 'active' | 'hidden' | 'soldout'
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface SessionUser {
  id: string
  login_id: string
  name: string | null
  role: UserRole
  status: UserStatus
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}
```

- [ ] **Step 2: userTypes.ts 수정**

`User`, `RegisterDto`, `LoginDto`를 새 스키마에 맞게 변경한다.

```typescript
// src/types/userTypes.ts
import { UserRole, UserStatus } from './commonTypes'

export interface User {
  id: string
  login_id: string
  email: string | null
  password: string
  name: string | null
  phone: string | null
  role: UserRole
  status: UserStatus
  last_login_at: Date | null
  password_changed_at: Date | null
  created_at: Date
}

export interface RegisterDto {
  login_id: string
  password: string
  role: 'farmer' | 'consumer'
  name?: string
  phone?: string
  email?: string
}

export interface LoginDto {
  login_id: string
  password: string
}
```

- [ ] **Step 3: mapper/auth.xml 교체**

기존 파일 전체를 아래로 교체한다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="auth">

  <select id="findUserByLoginId">
    SELECT id, login_id, email, password, name, phone, role, status,
           last_login_at, password_changed_at, created_at
    FROM   users
    WHERE  login_id    = #{loginId}
      AND  deleted_at IS NULL
  </select>

  <select id="findById">
    SELECT id, login_id, email, name, phone, role, status, created_at
    FROM   users
    WHERE  id          = #{id}
      AND  deleted_at IS NULL
  </select>

  <insert id="createUser">
    INSERT INTO users (login_id, password, role, status, name, phone, email)
    VALUES (#{loginId}, #{password}, #{role}, #{status}, #{name}, #{phone}, #{email})
    RETURNING id, login_id, email, name, phone, role, status, created_at
  </insert>

  <insert id="createSession">
    INSERT INTO user_sessions (user_id, token, expires_at)
    VALUES (#{userId}, #{token}, #{expiresAt})
    RETURNING id, user_id, token, expires_at, created_at
  </insert>

  <select id="findSessionByToken">
    SELECT s.id, s.user_id, s.token, s.expires_at,
           u.login_id, u.name, u.role, u.status
    FROM   user_sessions s
    JOIN   users u ON u.id = s.user_id AND u.deleted_at IS NULL
    WHERE  s.token      = #{token}
      AND  s.expires_at > NOW()
  </select>

  <update id="refreshSession">
    UPDATE user_sessions
    SET    expires_at = #{expiresAt}
    WHERE  token      = #{token}
  </update>

  <update id="expireSession">
    UPDATE user_sessions
    SET    expires_at = NOW()
    WHERE  token      = #{token}
  </update>

  <update id="updateLastLoginAt">
    UPDATE users
    SET    last_login_at = NOW()
    WHERE  id = #{userId}
  </update>

</mapper>
```

- [ ] **Step 4: 리포지토리 단위 테스트 작성 (tests/auth.test.ts)**

기존 `tests/auth.test.ts`를 아래로 교체한다. (통합 테스트는 Task 5에서 추가)

```typescript
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'

vi.mock('../src/db/pool', () => ({
  pool: { query: vi.fn() },
  query: vi.fn(),
  queryOne: vi.fn(),
  execute: vi.fn(),
  withTransaction: vi.fn(),
  clientQuery: vi.fn(),
  clientQueryOne: vi.fn(),
  clientExecute: vi.fn(),
}))

import * as pool from '../src/db/pool'
import {
  findUserByLoginId,
  findUserById,
  createSession,
  findSessionByToken,
  refreshSession,
  expireSession,
  updateLastLoginAt,
} from '../src/repositories/authRepository'

describe('authRepository', () => {
  beforeEach(() => vi.clearAllMocks())

  it('findUserByLoginId — pool.queryOne을 올바른 인수로 호출한다', async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null)
    await findUserByLoginId('admin01')
    expect(pool.queryOne).toHaveBeenCalledWith('auth', 'findUserByLoginId', { loginId: 'admin01' })
  })

  it('findUserById — pool.queryOne을 올바른 인수로 호출한다', async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null)
    await findUserById('1')
    expect(pool.queryOne).toHaveBeenCalledWith('auth', 'findById', { id: '1' })
  })

  it('createSession — pool.queryOne을 올바른 인수로 호출한다', async () => {
    const expiresAt = new Date()
    vi.mocked(pool.queryOne).mockResolvedValueOnce({ token: 'uuid-123' })
    await createSession({ userId: '1', token: 'uuid-123', expiresAt })
    expect(pool.queryOne).toHaveBeenCalledWith('auth', 'createSession', {
      userId: '1', token: 'uuid-123', expiresAt,
    })
  })

  it('findSessionByToken — pool.queryOne을 올바른 인수로 호출한다', async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null)
    await findSessionByToken('uuid-token')
    expect(pool.queryOne).toHaveBeenCalledWith('auth', 'findSessionByToken', { token: 'uuid-token' })
  })

  it('refreshSession — pool.execute를 올바른 인수로 호출한다', async () => {
    const expiresAt = new Date()
    vi.mocked(pool.execute).mockResolvedValueOnce(1)
    await refreshSession('uuid-token', expiresAt)
    expect(pool.execute).toHaveBeenCalledWith('auth', 'refreshSession', { token: 'uuid-token', expiresAt })
  })

  it('expireSession — pool.execute를 올바른 인수로 호출한다', async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce(1)
    await expireSession('uuid-token')
    expect(pool.execute).toHaveBeenCalledWith('auth', 'expireSession', { token: 'uuid-token' })
  })

  it('updateLastLoginAt — pool.execute를 올바른 인수로 호출한다', async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce(1)
    await updateLastLoginAt('1')
    expect(pool.execute).toHaveBeenCalledWith('auth', 'updateLastLoginAt', { userId: '1' })
  })
})
```

- [ ] **Step 5: 테스트 실행 — 실패 확인**

```bash
cd /d/workspace/ok2020/village/backend && pnpm test -- tests/auth.test.ts 2>&1 | tail -20
```

Expected: FAIL — `findUserByLoginId is not a function` 또는 `Cannot find module`

- [ ] **Step 6: authRepository.ts 교체**

```typescript
// src/repositories/authRepository.ts
import { queryOne, execute } from '../db/pool'
import { User } from '../types/userTypes'

export type UserRow = Omit<User, 'password'>

export interface SessionRow {
  id: string
  user_id: string
  token: string
  expires_at: Date
  login_id: string
  name: string | null
  role: string
  status: string
}

export const findUserByLoginId = (loginId: string): Promise<User | null> =>
  queryOne<User>('auth', 'findUserByLoginId', { loginId })

export const findUserById = (id: string): Promise<UserRow | null> =>
  queryOne<UserRow>('auth', 'findById', { id })

export const createUser = (params: {
  loginId: string
  password: string
  role: string
  status: string
  name?: string | null
  phone?: string | null
  email?: string | null
}): Promise<UserRow | null> =>
  queryOne<UserRow>('auth', 'createUser', params)

export const createSession = (params: {
  userId: string
  token: string
  expiresAt: Date
}): Promise<{ token: string } | null> =>
  queryOne<{ token: string }>('auth', 'createSession', params)

export const findSessionByToken = (token: string): Promise<SessionRow | null> =>
  queryOne<SessionRow>('auth', 'findSessionByToken', { token })

export const refreshSession = (token: string, expiresAt: Date): Promise<number> =>
  execute('auth', 'refreshSession', { token, expiresAt })

export const expireSession = (token: string): Promise<number> =>
  execute('auth', 'expireSession', { token })

export const updateLastLoginAt = (userId: string): Promise<number> =>
  execute('auth', 'updateLastLoginAt', { userId })
```

- [ ] **Step 7: 테스트 실행 — 통과 확인**

```bash
cd /d/workspace/ok2020/village/backend && pnpm test -- tests/auth.test.ts 2>&1 | tail -20
```

Expected: 7 tests PASS

- [ ] **Step 8: 커밋**

```bash
cd /d/workspace/ok2020/village/backend
git add src/types/commonTypes.ts src/types/userTypes.ts mapper/auth.xml src/repositories/authRepository.ts tests/auth.test.ts
git commit -m "feat: add session types, auth SQL mapper, and repository"
```

---

## Task 3: authService.ts (TDD)

**Files:**
- Modify: `src/services/authService.ts`
- Test: `tests/auth.test.ts` (서비스 단위 테스트 추가)

- [ ] **Step 1: 서비스 단위 테스트를 auth.test.ts 하단에 추가**

`tests/auth.test.ts`의 `describe('authRepository', ...)` 블록 아래에 추가한다.  
파일 상단 import에 `vi.mock` 두 줄도 추가한다.

파일 상단 import 섹션에 추가:
```typescript
vi.mock('../src/utils/hash', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-pw'),
  comparePassword: vi.fn(),
}))

vi.mock('crypto', () => ({
  randomUUID: vi.fn().mockReturnValue('test-uuid-1234'),
}))
```

파일 하단에 추가:
```typescript
import * as hash from '../src/utils/hash'
import { register, login, logout } from '../src/services/authService'

describe('authService.register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('login_id 중복이면 LOGIN_ID_EXISTS를 throw한다', async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({ id: '1', login_id: 'admin01' })
    await expect(register({
      login_id: 'admin01', password: 'pw', role: 'consumer',
    })).rejects.toThrow('LOGIN_ID_EXISTS')
  })

  it('farmer 가입 시 status=pending으로 생성된다', async () => {
    vi.mocked(pool.queryOne)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: '1', login_id: 'farmer01', role: 'farmer', status: 'pending', created_at: new Date() })

    const result = await register({ login_id: 'farmer01', password: 'pw', role: 'farmer' })

    expect(pool.queryOne).toHaveBeenNthCalledWith(2, 'auth', 'createUser', expect.objectContaining({
      loginId: 'farmer01',
      password: 'hashed-pw',
      role: 'farmer',
      status: 'pending',
    }))
    expect(result?.status).toBe('pending')
  })

  it('consumer 가입 시 status=active로 생성된다', async () => {
    vi.mocked(pool.queryOne)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: '2', login_id: 'consumer01', role: 'consumer', status: 'active', created_at: new Date() })

    const result = await register({ login_id: 'consumer01', password: 'pw', role: 'consumer' })
    expect(result?.status).toBe('active')
  })
})

describe('authService.login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('login_id가 없으면 INVALID_CREDENTIALS를 throw한다', async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null)
    await expect(login({ login_id: 'nobody', password: 'pw' })).rejects.toThrow('INVALID_CREDENTIALS')
  })

  it('비밀번호가 틀리면 INVALID_CREDENTIALS를 throw한다', async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({ id: '1', login_id: 'admin01', password: 'hashed', status: 'active', role: 'admin' })
    vi.mocked(hash.comparePassword).mockResolvedValueOnce(false)
    await expect(login({ login_id: 'admin01', password: 'wrong' })).rejects.toThrow('INVALID_CREDENTIALS')
  })

  it('status가 active가 아니면 ACCOUNT_NOT_ACTIVE를 throw한다', async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({ id: '1', login_id: 'farmer01', password: 'hashed', status: 'pending', role: 'farmer' })
    vi.mocked(hash.comparePassword).mockResolvedValueOnce(true)
    await expect(login({ login_id: 'farmer01', password: 'pw' })).rejects.toThrow('ACCOUNT_NOT_ACTIVE')
  })

  it('성공 시 token과 user를 반환한다', async () => {
    vi.mocked(pool.queryOne)
      .mockResolvedValueOnce({ id: '1', login_id: 'admin01', password: 'hashed', status: 'active', role: 'admin', name: '관리자' })
      .mockResolvedValueOnce({ token: 'test-uuid-1234' })
    vi.mocked(pool.execute)
      .mockResolvedValueOnce(1) // updateLastLoginAt
    vi.mocked(hash.comparePassword).mockResolvedValueOnce(true)

    const result = await login({ login_id: 'admin01', password: 'pw' })

    expect(result.token).toBe('test-uuid-1234')
    expect(result.user.login_id).toBe('admin01')
    expect(result.user.role).toBe('admin')
  })
})

describe('authService.logout', () => {
  it('expireSession을 호출한다', async () => {
    vi.mocked(pool.execute).mockResolvedValueOnce(1)
    await logout('uuid-token')
    expect(pool.execute).toHaveBeenCalledWith('auth', 'expireSession', { token: 'uuid-token' })
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd /d/workspace/ok2020/village/backend && pnpm test -- tests/auth.test.ts 2>&1 | tail -20
```

Expected: FAIL — `register is not exported from authService`

- [ ] **Step 3: authService.ts 교체**

```typescript
// src/services/authService.ts
import { randomUUID } from 'crypto'
import { RegisterDto, LoginDto } from '../types/userTypes'
import { hashPassword, comparePassword } from '../utils/hash'
import {
  findUserByLoginId,
  createUser,
  createSession,
  expireSession,
  updateLastLoginAt,
} from '../repositories/authRepository'

const getSessionDurationMinutes = () =>
  parseInt(process.env.SESSION_DURATION_MINUTES || '30', 10)

const getExpiresAt = (): Date => {
  const d = new Date()
  d.setMinutes(d.getMinutes() + getSessionDurationMinutes())
  return d
}

export const register = async (dto: RegisterDto) => {
  const existing = await findUserByLoginId(dto.login_id)
  if (existing) throw new Error('LOGIN_ID_EXISTS')

  const hashed = await hashPassword(dto.password)
  const status = dto.role === 'farmer' ? 'pending' : 'active'

  return createUser({
    loginId: dto.login_id,
    password: hashed,
    role: dto.role,
    status,
    name: dto.name ?? null,
    phone: dto.phone ?? null,
    email: dto.email ?? null,
  })
}

export const login = async (dto: LoginDto) => {
  const user = await findUserByLoginId(dto.login_id)
  if (!user) throw new Error('INVALID_CREDENTIALS')
  if (user.status !== 'active') throw new Error('ACCOUNT_NOT_ACTIVE')

  const valid = await comparePassword(dto.password, user.password)
  if (!valid) throw new Error('INVALID_CREDENTIALS')

  const token = randomUUID()
  await createSession({ userId: user.id, token, expiresAt: getExpiresAt() })
  await updateLastLoginAt(user.id)

  return {
    token,
    user: { id: user.id, login_id: user.login_id, name: user.name ?? null, role: user.role },
  }
}

export const logout = async (token: string): Promise<void> => {
  await expireSession(token)
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
cd /d/workspace/ok2020/village/backend && pnpm test -- tests/auth.test.ts 2>&1 | tail -20
```

Expected: 14 tests PASS

- [ ] **Step 5: 커밋**

```bash
cd /d/workspace/ok2020/village/backend
git add src/services/authService.ts tests/auth.test.ts
git commit -m "feat: replace JWT auth service with session-based login/logout"
```

---

## Task 4: 미들웨어 + 앱 정리 + 라우트 수정

**Files:**
- Modify: `src/plugins/authenticate.ts`
- Modify: `src/app.ts`
- Modify: `src/routes/farmerRoutes.ts`
- Modify: `tests/permission.test.ts`

- [ ] **Step 1: authenticate.ts 전체 교체**

```typescript
// src/plugins/authenticate.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { SessionUser, UserRole } from '../types/commonTypes'
import { getUserMenuPermissions } from '../repositories/permissionRepository'
import { findSessionByToken, refreshSession } from '../repositories/authRepository'

declare module 'fastify' {
  interface FastifyRequest {
    user: SessionUser
  }
}

const getExpiresAt = (): Date => {
  const d = new Date()
  d.setMinutes(d.getMinutes() + parseInt(process.env.SESSION_DURATION_MINUTES || '30', 10))
  return d
}

const extractToken = (req: FastifyRequest): string | null => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export const authenticate = async (
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const token = extractToken(req)
  if (!token) {
    return reply.code(401).send({ success: false, message: '인증이 필요합니다' })
  }

  const session = await findSessionByToken(token)
  if (!session) {
    return reply.code(401).send({ success: false, message: '인증이 필요합니다' })
  }

  await refreshSession(token, getExpiresAt())
  req.user = {
    id: session.user_id,
    login_id: session.login_id,
    name: session.name,
    role: session.role as UserRole,
    status: session.status as SessionUser['status'],
  }
}

export const requireRole = (...roles: UserRole[]) =>
  async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user || !roles.includes(req.user.role)) {
      return reply.code(403).send({ success: false, message: '권한이 없습니다' })
    }
  }

export const checkMenuPermission = (
  menuCode: string,
  action?: 'edit' | 'delete',
) =>
  async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    let perms
    try {
      perms = await getUserMenuPermissions(req.user.id)
    } catch {
      return reply.code(500).send({ success: false, message: '권한 조회에 실패했습니다' })
    }
    const menu = perms.find((p) => p.menu_code === menuCode)

    if (!menu) {
      return reply.code(403).send({ success: false, message: '접근 권한이 없습니다' })
    }
    if (action === 'edit' && !menu.can_edit) {
      return reply.code(403).send({ success: false, message: '수정 권한이 없습니다' })
    }
    if (action === 'delete' && !menu.can_delete) {
      return reply.code(403).send({ success: false, message: '삭제 권한이 없습니다' })
    }
  }
```

- [ ] **Step 2: app.ts에서 @fastify/jwt 제거**

`src/app.ts`에서 아래 두 줄을 삭제한다:
```typescript
import jwt from "@fastify/jwt";           // 삭제
app.register(jwt, { secret: ... });       // 삭제
```

Swagger securitySchemes `bearerAuth`는 유지한다.

최종 app.ts:
```typescript
import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import multipart from "@fastify/multipart";
import staticFiles from "@fastify/static";
import path from "path";
import authRoutes from "./routes/authRoutes";
import farmerRoutes from "./routes/farmerRoutes";
import productRoutes from "./routes/productRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import villageRoutes from "./routes/villageRoutes";
import fileRoutes from "./routes/fileRoutes";

export default function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "test",
  });

  app.register(cors, {
    origin: process.env.CORS_ORIGIN || "*",
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: "Village Market API",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer" },
        },
      },
    },
  });

  app.register(swaggerUi, { routePrefix: "/docs" });

  app.register(multipart);
  app.register(staticFiles, {
    root: path.join(process.cwd(), "uploads"),
    prefix: "/files/",
  });

  app.register(authRoutes, { prefix: "/api" });
  app.register(farmerRoutes, { prefix: "/api" });
  app.register(productRoutes, { prefix: "/api" });
  app.register(cartRoutes, { prefix: "/api" });
  app.register(orderRoutes, { prefix: "/api" });
  app.register(villageRoutes, { prefix: "/api" });
  app.register(fileRoutes, { prefix: "/api" });

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
```

- [ ] **Step 3: farmerRoutes.ts — requireRole 단독 사용 라우트에 authenticate 추가**

`src/routes/farmerRoutes.ts`를 읽어 `preHandler: [requireRole("farmer")]` 형태의 라우트를 모두 `preHandler: [authenticate, requireRole("farmer")]`로 변경한다.

- [ ] **Step 4: permission.test.ts — JWT 토큰 대신 세션 모킹으로 교체**

`tests/permission.test.ts`를 읽어 현재 내용을 파악한 뒤, 4개의 통합 테스트를 아래로 교체한다.

`describe('checkMenuPermission 미들웨어', ...)` 블록의 `beforeEach` 이후:

```typescript
const TEST_TOKEN = 'test-session-uuid-1234'

const mockSession = {
  id: '10',
  user_id: '1',
  token: TEST_TOKEN,
  expires_at: new Date(Date.now() + 60_000),
  login_id: 'admin01',
  name: '관리자',
  role: 'admin',
  status: 'active',
}

it('메뉴 권한이 없으면 403을 반환한다', async () => {
  vi.mocked(pool.queryOne).mockResolvedValueOnce(mockSession) // findSessionByToken
  vi.mocked(pool.execute).mockResolvedValueOnce(1)            // refreshSession
  vi.mocked(pool.query).mockResolvedValueOnce([])             // getUserMenuPermissions

  const res = await app.inject({
    method: 'GET',
    url: '/api/admin/farmers',
    headers: { authorization: `Bearer ${TEST_TOKEN}` },
  })

  expect(res.statusCode).toBe(403)
})

it('읽기 권한이 있으면 admin/farmers GET에 200을 반환한다', async () => {
  vi.mocked(pool.queryOne).mockResolvedValueOnce(mockSession) // findSessionByToken
  vi.mocked(pool.execute).mockResolvedValueOnce(1)            // refreshSession
  vi.mocked(pool.query)
    .mockResolvedValueOnce([{ menu_code: 'ADMIN_FARMER', can_edit: false, can_delete: false }]) // getUserMenuPermissions
    .mockResolvedValueOnce([])  // findAllFarmersForAdmin

  const res = await app.inject({
    method: 'GET',
    url: '/api/admin/farmers',
    headers: { authorization: `Bearer ${TEST_TOKEN}` },
  })

  expect(res.statusCode).toBe(200)
})

it('edit 권한이 없으면 PATCH 라우트에 403을 반환한다', async () => {
  vi.mocked(pool.queryOne).mockResolvedValueOnce(mockSession) // findSessionByToken
  vi.mocked(pool.execute).mockResolvedValueOnce(1)            // refreshSession
  vi.mocked(pool.query).mockResolvedValueOnce([
    { menu_code: 'ADMIN_FARMER', can_edit: false, can_delete: false },
  ])                                                          // getUserMenuPermissions

  const res = await app.inject({
    method: 'PATCH',
    url: '/api/admin/farmers/1/approve',
    headers: { authorization: `Bearer ${TEST_TOKEN}` },
  })

  expect(res.statusCode).toBe(403)
})

it('인증 없이 접근하면 401을 반환한다', async () => {
  const res = await app.inject({
    method: 'GET',
    url: '/api/admin/farmers',
  })

  expect(res.statusCode).toBe(401)
})
```

- [ ] **Step 5: 빌드 확인**

```bash
cd /d/workspace/ok2020/village/backend && pnpm build 2>&1 | tail -15
```

Expected: 0 TypeScript 에러

- [ ] **Step 6: 커밋**

```bash
cd /d/workspace/ok2020/village/backend
git add src/plugins/authenticate.ts src/app.ts src/routes/farmerRoutes.ts tests/permission.test.ts
git commit -m "feat: replace JWT middleware with DB session lookup, update requireRole and tests"
```

---

## Task 5: 컨트롤러 + 라우트 + .env + 통합 테스트

**Files:**
- Modify: `src/controllers/authController.ts`
- Modify: `src/routes/authRoutes.ts`
- Modify: `.env.example`
- Modify: `tests/auth.test.ts` (통합 테스트 추가)

- [ ] **Step 1: authController.ts 교체**

```typescript
// src/controllers/authController.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { RegisterDto, LoginDto } from '../types/userTypes'
import { register, login, logout } from '../services/authService'
import { successResponse, errorResponse } from '../utils/response'

export const registerHandler = async (
  req: FastifyRequest<{ Body: RegisterDto }>,
  reply: FastifyReply,
) => {
  try {
    const user = await register(req.body)
    return reply.code(201).send(successResponse(user, '회원가입이 완료되었습니다'))
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'LOGIN_ID_EXISTS')
      return reply.code(409).send(errorResponse('이미 사용 중인 아이디입니다'))
    throw err
  }
}

export const loginHandler = async (
  req: FastifyRequest<{ Body: LoginDto }>,
  reply: FastifyReply,
) => {
  try {
    const result = await login(req.body)
    return reply.send(successResponse(result))
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'INVALID_CREDENTIALS')
        return reply.code(401).send(errorResponse('아이디 또는 비밀번호가 올바르지 않습니다'))
      if (err.message === 'ACCOUNT_NOT_ACTIVE')
        return reply.code(403).send(errorResponse('승인 대기 중인 계정입니다. 관리자 승인 후 로그인하세요'))
    }
    throw err
  }
}

export const logoutHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const token = req.headers.authorization?.slice(7) ?? ''
  await logout(token)
  return reply.send(successResponse(null, '로그아웃되었습니다'))
}
```

- [ ] **Step 2: authRoutes.ts 교체**

`/auth/refresh` 라우트 제거, body 스키마 수정. `refreshHandler` import 제거.

```typescript
// src/routes/authRoutes.ts
import { FastifyInstance } from 'fastify'
import { registerHandler, loginHandler, logoutHandler } from '../controllers/authController'
import { authenticate } from '../plugins/authenticate'
import { RegisterDto } from '../types/userTypes'

export default async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: RegisterDto }>(
    '/auth/register',
    {
      schema: {
        tags: ['Auth'],
        summary: '회원가입',
        body: {
          type: 'object',
          required: ['login_id', 'password', 'role'],
          properties: {
            login_id: { type: 'string', minLength: 3, maxLength: 50 },
            password: { type: 'string', minLength: 6 },
            role:     { type: 'string', enum: ['farmer', 'consumer'] },
            name:     { type: 'string' },
            phone:    { type: 'string' },
            email:    { type: 'string', format: 'email' },
          },
        },
      },
    },
    registerHandler,
  )

  app.post<{ Body: { login_id: string; password: string } }>(
    '/auth/login',
    {
      schema: {
        tags: ['Auth'],
        summary: '로그인',
        body: {
          type: 'object',
          required: ['login_id', 'password'],
          properties: {
            login_id: { type: 'string' },
            password: { type: 'string' },
          },
        },
      },
    },
    loginHandler,
  )

  app.post(
    '/auth/logout',
    {
      schema: {
        tags: ['Auth'],
        summary: '로그아웃',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate],
    },
    logoutHandler,
  )
}
```

- [ ] **Step 3: .env.example 업데이트**

`JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`을 제거하고 `SESSION_DURATION_MINUTES` 추가.

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=village_db
DB_USER=postgres
DB_PASSWORD=
SESSION_DURATION_MINUTES=30
CORS_ORIGIN=http://localhost:3001
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@village-market.com
ADMIN_EMAIL=admin@village-market.com
UPLOAD_DIR=uploads
```

- [ ] **Step 4: 통합 테스트를 auth.test.ts 하단에 추가**

`tests/auth.test.ts` 하단에 추가한다. (기존 describe 블록들 아래)

```typescript
import buildApp from '../src/app'
import { FastifyInstance } from 'fastify'

let app: FastifyInstance

beforeAll(async () => {
  app = buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('farmer 가입 시 201과 status=pending을 반환한다', async () => {
    vi.mocked(pool.queryOne)
      .mockResolvedValueOnce(null) // findUserByLoginId — 중복 없음
      .mockResolvedValueOnce({
        id: '1', login_id: 'farmer01', role: 'farmer', status: 'pending', created_at: new Date(),
      })

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { login_id: 'farmer01', password: 'password123', role: 'farmer', name: '김농부' },
    })

    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('pending')
  })

  it('login_id 중복 시 409를 반환한다', async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({ id: '1', login_id: 'farmer01' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { login_id: 'farmer01', password: 'password123', role: 'farmer' },
    })

    expect(res.statusCode).toBe(409)
  })

  it('role이 유효하지 않으면 400을 반환한다', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { login_id: 'admin01', password: 'password123', role: 'admin' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('성공 시 200과 token을 반환한다', async () => {
    vi.mocked(pool.queryOne)
      .mockResolvedValueOnce({
        id: '1', login_id: 'admin01', password: 'hashed', status: 'active', role: 'admin', name: '관리자',
      })
      .mockResolvedValueOnce({ token: 'test-uuid-1234' }) // createSession
    vi.mocked(pool.execute).mockResolvedValueOnce(1) // updateLastLoginAt
    vi.mocked(hash.comparePassword).mockResolvedValueOnce(true)

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { login_id: 'admin01', password: 'password123' },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.success).toBe(true)
    expect(body.data.token).toBeDefined()
  })

  it('login_id가 없으면 401을 반환한다', async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null)

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { login_id: 'nobody', password: 'password123' },
    })

    expect(res.statusCode).toBe(401)
  })

  it('비활성 계정이면 403을 반환한다', async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({
      id: '1', login_id: 'farmer01', password: 'hashed', status: 'pending', role: 'farmer',
    })
    vi.mocked(hash.comparePassword).mockResolvedValueOnce(true)

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { login_id: 'farmer01', password: 'password123' },
    })

    expect(res.statusCode).toBe(403)
  })
})

describe('POST /api/auth/logout', () => {
  beforeEach(() => vi.clearAllMocks())

  it('인증 없이 접근하면 401을 반환한다', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/logout' })
    expect(res.statusCode).toBe(401)
  })

  it('유효한 토큰으로 로그아웃하면 200을 반환한다', async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({
      id: '10', user_id: '1', token: 'uuid-abc', expires_at: new Date(Date.now() + 60_000),
      login_id: 'admin01', name: '관리자', role: 'admin', status: 'active',
    })
    vi.mocked(pool.execute)
      .mockResolvedValueOnce(1) // refreshSession
      .mockResolvedValueOnce(1) // expireSession

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { authorization: 'Bearer uuid-abc' },
    })

    expect(res.statusCode).toBe(200)
  })
})
```

- [ ] **Step 5: 전체 테스트 실행**

```bash
cd /d/workspace/ok2020/village/backend && pnpm test 2>&1 | tail -20
```

Expected: 전체 PASS. 실패 시 에러 메시지를 확인하고 수정 후 재실행.

- [ ] **Step 6: 빌드 확인**

```bash
cd /d/workspace/ok2020/village/backend && pnpm build 2>&1 | tail -10
```

Expected: 0 TypeScript 에러

- [ ] **Step 7: 커밋**

```bash
cd /d/workspace/ok2020/village/backend
git add src/controllers/authController.ts src/routes/authRoutes.ts .env.example tests/auth.test.ts
git commit -m "feat: session-based auth controller, routes, and integration tests"
```
