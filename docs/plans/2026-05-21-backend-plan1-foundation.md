# Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fastify + TypeScript 백엔드 기반 구축 — 프로젝트 셋업, DB 연결, mybatis-mapper, 공통 타입/유틸, 인증(JWT) 구현

**Architecture:** 레이어드 아키텍처 (routes → controllers → services → repositories). 각 레이어는 인접 레이어만 의존한다. DB 접근은 모두 mybatis-mapper XML을 통해 수행한다.

**Tech Stack:** Node.js, TypeScript, Fastify 4, @fastify/jwt, @fastify/swagger, pg (node-postgres), mybatis-mapper, bcryptjs, vitest

---

## 파일 맵

| 파일 | 역할 |
|---|---|
| `package.json` | 의존성 및 스크립트 |
| `tsconfig.json` | TypeScript 설정 |
| `.env.example` | 환경변수 샘플 |
| `src/server.ts` | HTTP 서버 시작점 |
| `src/app.ts` | Fastify 인스턴스 조립 |
| `src/db/pool.ts` | PostgreSQL 연결 + mybatis-mapper 로더 |
| `src/types/common.types.ts` | 공통 타입 (UserRole, JwtPayload 등) |
| `src/types/user.types.ts` | User 도메인 타입 및 DTO |
| `src/utils/hash.ts` | bcrypt 래퍼 |
| `src/utils/response.ts` | 공통 응답 포맷 |
| `src/utils/jwt.ts` | JWT 생성/검증 헬퍼 |
| `src/utils/email.ts` | nodemailer 이메일 발송 |
| `src/plugins/authenticate.ts` | Fastify preHandler — JWT 검증 + 역할 체크 |
| `mapper/auth.xml` | 인증 관련 SQL |
| `src/repositories/auth.repository.ts` | auth DB 접근 |
| `src/services/auth.service.ts` | 인증 비즈니스 로직 |
| `src/controllers/auth.controller.ts` | 인증 요청 처리 |
| `src/routes/auth.ts` | 인증 라우트 + Swagger 스펙 |
| `tests/health.test.ts` | 헬스체크 테스트 |
| `tests/auth.test.ts` | 인증 테스트 |
| `vitest.config.ts` | vitest 설정 |
| `CLAUDE.md` | 백엔드 프로젝트 설명 |

---

## Task 1: 프로젝트 초기화

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: package.json 생성**

```bash
cd D:/workspace/ok2020/village/backend
```

`package.json` 내용:
```json
{
  "name": "village-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "fastify": "^4.28.1",
    "@fastify/cors": "^9.0.1",
    "@fastify/jwt": "^9.0.0",
    "@fastify/multipart": "^8.3.0",
    "@fastify/static": "^7.0.4",
    "@fastify/swagger": "^8.15.0",
    "@fastify/swagger-ui": "^4.0.0",
    "bcryptjs": "^2.4.3",
    "mybatis-mapper": "^0.7.0",
    "nodemailer": "^6.9.15",
    "pg": "^8.12.0",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.0.0",
    "@types/nodemailer": "^6.4.15",
    "@types/pg": "^8.11.0",
    "@types/uuid": "^10.0.0",
    "tsx": "^4.16.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: tsconfig.json 생성**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: vitest.config.ts 생성**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
})
```

- [ ] **Step 4: .env.example 생성**

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=village_db
DB_USER=postgres
DB_PASSWORD=
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3001
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@village-market.com
ADMIN_EMAIL=admin@village-market.com
UPLOAD_DIR=uploads
```

- [ ] **Step 5: .gitignore 생성**

```
node_modules/
dist/
.env
uploads/
*.log
```

- [ ] **Step 6: 의존성 설치**

```bash
npm install
```

Expected: `node_modules/` 생성, 에러 없음

- [ ] **Step 7: 커밋**

```bash
git add package.json tsconfig.json vitest.config.ts .env.example .gitignore
git commit -m "chore: initialize backend project with TypeScript and Fastify"
```

---

## Task 2: Fastify 앱 & 헬스체크

**Files:**
- Create: `src/app.ts`
- Create: `src/server.ts`
- Create: `tests/health.test.ts`

- [ ] **Step 1: 헬스체크 실패 테스트 작성**

`tests/health.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
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

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ status: 'ok' })
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx vitest run tests/health.test.ts
```

Expected: FAIL — `Cannot find module '../src/app'`

- [ ] **Step 3: src/app.ts 구현**

```typescript
import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

export default function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  app.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
  })

  app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret',
  })

  app.register(swagger, {
    openapi: {
      info: {
        title: 'Village Market API',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
    },
  })

  app.register(swaggerUi, {
    routePrefix: '/docs',
  })

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
```

- [ ] **Step 4: src/server.ts 구현**

```typescript
import 'dotenv/config'
import buildApp from './app'

const start = async () => {
  const app = buildApp()
  try {
    await app.listen({
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0',
    })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
```

- [ ] **Step 5: dotenv 설치**

```bash
npm install dotenv
```

- [ ] **Step 6: 테스트 실행 — 통과 확인**

```bash
npx vitest run tests/health.test.ts
```

Expected: PASS

- [ ] **Step 7: 개발 서버 동작 확인**

```bash
cp .env.example .env
npm run dev
```

Expected: `Server listening at http://0.0.0.0:3000`

- [ ] **Step 8: 커밋**

```bash
git add src/app.ts src/server.ts tests/health.test.ts
git commit -m "feat: add Fastify app with health check and Swagger"
```

---

## Task 3: DB 연결 & mybatis-mapper

**Files:**
- Create: `src/db/pool.ts`
- Create: `mapper/auth.xml` (빈 파일 — Task 5에서 채움)

- [ ] **Step 1: mapper 디렉터리 및 빈 XML 파일 생성**

`mapper/auth.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="auth">
</mapper>
```

동일하게 아래 파일들도 생성 (namespace만 다름):
- `mapper/farmer.xml` — namespace="farmer"
- `mapper/product.xml` — namespace="product"
- `mapper/cart.xml` — namespace="cart"
- `mapper/order.xml` — namespace="order"
- `mapper/village.xml` — namespace="village"

- [ ] **Step 2: src/db/pool.ts 구현**

```typescript
import { Pool } from 'pg'
import mybatisMapper from 'mybatis-mapper'
import path from 'path'

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'village_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
})

const mapperDir = path.join(__dirname, '../../mapper')

mybatisMapper.createMapper([
  `${mapperDir}/auth.xml`,
  `${mapperDir}/farmer.xml`,
  `${mapperDir}/product.xml`,
  `${mapperDir}/cart.xml`,
  `${mapperDir}/order.xml`,
  `${mapperDir}/village.xml`,
])

const format = { language: 'sql' as const, indent: '  ' }

export const query = async <T = Record<string, unknown>>(
  namespace: string,
  sqlId: string,
  params: Record<string, unknown> = {}
): Promise<T[]> => {
  const sql = mybatisMapper.getStatement(namespace, sqlId, params, format)
  const result = await pool.query(sql)
  return result.rows as T[]
}

export const queryOne = async <T = Record<string, unknown>>(
  namespace: string,
  sqlId: string,
  params: Record<string, unknown> = {}
): Promise<T | null> => {
  const rows = await query<T>(namespace, sqlId, params)
  return rows[0] ?? null
}

export const execute = async (
  namespace: string,
  sqlId: string,
  params: Record<string, unknown> = {}
): Promise<number> => {
  const sql = mybatisMapper.getStatement(namespace, sqlId, params, format)
  const result = await pool.query(sql)
  return result.rowCount ?? 0
}
```

- [ ] **Step 3: DB 연결 테스트 (수동)**

`.env`에 PostgreSQL 정보 입력 후:
```bash
npm run dev
```

Expected: 서버 시작 시 에러 없음 (DB 연결은 실제 쿼리 시 발생)

- [ ] **Step 4: 커밋**

```bash
git add src/db/pool.ts mapper/
git commit -m "feat: add PostgreSQL pool and mybatis-mapper setup"
```

---

## Task 4: 공통 타입 & 유틸리티

**Files:**
- Create: `src/types/common.types.ts`
- Create: `src/types/user.types.ts`
- Create: `src/utils/hash.ts`
- Create: `src/utils/response.ts`
- Create: `src/utils/email.ts`

- [ ] **Step 1: src/types/common.types.ts**

```typescript
export type UserRole = 'admin' | 'farmer' | 'consumer'
export type UserStatus = 'pending' | 'active' | 'inactive'
export type ProductStatus = 'active' | 'hidden' | 'soldout'
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface JwtPayload {
  id: string
  email: string
  role: UserRole
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}
```

- [ ] **Step 2: src/types/user.types.ts**

```typescript
import { UserRole, UserStatus } from './common.types'

export interface User {
  id: string
  email: string
  password: string
  role: UserRole
  status: UserStatus
  created_at: Date
}

export interface RegisterDto {
  email: string
  password: string
  role: 'farmer' | 'consumer'
}

export interface LoginDto {
  email: string
  password: string
}
```

- [ ] **Step 3: hash.ts 실패 테스트 작성**

`tests/hash.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { hashPassword, comparePassword } from '../src/utils/hash'

describe('hash utils', () => {
  it('hashes a password and verifies it', async () => {
    const hashed = await hashPassword('mypassword')
    expect(hashed).not.toBe('mypassword')
    const match = await comparePassword('mypassword', hashed)
    expect(match).toBe(true)
  })

  it('returns false for wrong password', async () => {
    const hashed = await hashPassword('mypassword')
    const match = await comparePassword('wrongpassword', hashed)
    expect(match).toBe(false)
  })
})
```

- [ ] **Step 4: 테스트 실행 — 실패 확인**

```bash
npx vitest run tests/hash.test.ts
```

Expected: FAIL — `Cannot find module '../src/utils/hash'`

- [ ] **Step 5: src/utils/hash.ts 구현**

```typescript
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS)

export const comparePassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash)
```

- [ ] **Step 6: 테스트 실행 — 통과 확인**

```bash
npx vitest run tests/hash.test.ts
```

Expected: PASS

- [ ] **Step 7: src/utils/response.ts 구현**

```typescript
import { ApiResponse } from '../types/common.types'

export const successResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
})

export const errorResponse = (message: string): ApiResponse<never> => ({
  success: false,
  message,
})
```

- [ ] **Step 8: src/utils/email.ts 구현**

```typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const sendOrderNotification = async (params: {
  orderNumber: string
  consumerName: string
  totalPrice: number
  farmerEmail: string
}): Promise<void> => {
  const subject = `[마을장터] 새 주문이 도착했습니다 — ${params.orderNumber}`
  const text = `
주문번호: ${params.orderNumber}
주문자: ${params.consumerName}
총 금액: ${params.totalPrice.toLocaleString()}원

관리자 페이지에서 주문을 확인해 주세요.
  `.trim()

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: [params.farmerEmail, process.env.ADMIN_EMAIL || ''],
    subject,
    text,
  })
}
```

- [ ] **Step 9: 커밋**

```bash
git add src/types/ src/utils/ tests/hash.test.ts
git commit -m "feat: add common types and utilities (hash, response, email)"
```

---

## Task 5: Auth XML Mapper & Repository

**Files:**
- Modify: `mapper/auth.xml`
- Create: `src/repositories/auth.repository.ts`

- [ ] **Step 1: mapper/auth.xml SQL 작성**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="auth">

  <select id="findByEmail">
    SELECT id, email, password, role, status, created_at
    FROM users
    WHERE email = #{email}
  </select>

  <select id="findById">
    SELECT id, email, role, status, created_at
    FROM users
    WHERE id = #{id}
  </select>

  <insert id="createUser">
    INSERT INTO users (email, password, role, status)
    VALUES (#{email}, #{password}, #{role}, #{status})
    RETURNING id, email, role, status, created_at
  </insert>

</mapper>
```

- [ ] **Step 2: src/repositories/auth.repository.ts 구현**

```typescript
import { query, queryOne } from '../db/pool'
import { User } from '../types/user.types'

type UserRow = Omit<User, 'password'>

export const findUserByEmail = (email: string): Promise<User | null> =>
  queryOne<User>('auth', 'findByEmail', { email })

export const findUserById = (id: string): Promise<UserRow | null> =>
  queryOne<UserRow>('auth', 'findById', { id })

export const createUser = (params: {
  email: string
  password: string
  role: string
  status: string
}): Promise<UserRow | null> =>
  queryOne<UserRow>('auth', 'createUser', params)
```

- [ ] **Step 3: 커밋**

```bash
git add mapper/auth.xml src/repositories/auth.repository.ts
git commit -m "feat: add auth XML mapper and repository"
```

---

## Task 6: Auth Service & Controller

**Files:**
- Create: `src/services/auth.service.ts`
- Create: `src/controllers/auth.controller.ts`
- Create: `tests/auth.test.ts`

- [ ] **Step 1: auth 실패 테스트 작성**

`tests/auth.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import buildApp from '../src/app'
import { FastifyInstance } from 'fastify'

vi.mock('../src/db/pool', () => ({
  pool: { query: vi.fn() },
  query: vi.fn(),
  queryOne: vi.fn(),
  execute: vi.fn(),
}))

import * as pool from '../src/db/pool'

let app: FastifyInstance

beforeAll(async () => {
  app = buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('POST /api/auth/register', () => {
  it('registers a new farmer with status pending', async () => {
    vi.mocked(pool.queryOne)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'uuid-1',
        email: 'farmer@test.com',
        role: 'farmer',
        status: 'pending',
        created_at: new Date(),
      })

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'farmer@test.com', password: 'password123', role: 'farmer' },
    })

    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.success).toBe(true)
    expect(body.data.role).toBe('farmer')
    expect(body.data.status).toBe('pending')
  })

  it('returns 409 when email already exists', async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce({
      id: 'uuid-1',
      email: 'farmer@test.com',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'farmer@test.com', password: 'password123', role: 'farmer' },
    })

    expect(res.statusCode).toBe(409)
  })

  it('returns 400 for invalid role', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'test@test.com', password: 'password123', role: 'admin' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('returns 401 for non-existent email', async () => {
    vi.mocked(pool.queryOne).mockResolvedValueOnce(null)

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'nobody@test.com', password: 'password123' },
    })

    expect(res.statusCode).toBe(401)
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx vitest run tests/auth.test.ts
```

Expected: FAIL — routes not registered

- [ ] **Step 3: src/services/auth.service.ts 구현**

```typescript
import { RegisterDto, LoginDto } from '../types/user.types'
import { hashPassword, comparePassword } from '../utils/hash'
import {
  findUserByEmail,
  createUser,
} from '../repositories/auth.repository'

export const register = async (dto: RegisterDto) => {
  const existing = await findUserByEmail(dto.email)
  if (existing) throw new Error('EMAIL_EXISTS')

  const hashed = await hashPassword(dto.password)
  const status = dto.role === 'farmer' ? 'pending' : 'active'

  return createUser({ email: dto.email, password: hashed, role: dto.role, status })
}

export const login = async (dto: LoginDto) => {
  const user = await findUserByEmail(dto.email)
  if (!user) throw new Error('INVALID_CREDENTIALS')
  if (user.status !== 'active') throw new Error('ACCOUNT_NOT_ACTIVE')

  const valid = await comparePassword(dto.password, user.password)
  if (!valid) throw new Error('INVALID_CREDENTIALS')

  return { id: user.id, email: user.email, role: user.role, status: user.status }
}
```

- [ ] **Step 4: src/controllers/auth.controller.ts 구현**

```typescript
import { FastifyRequest, FastifyReply } from 'fastify'
import { RegisterDto, LoginDto } from '../types/user.types'
import { register, login } from '../services/auth.service'
import { successResponse, errorResponse } from '../utils/response'
import { JwtPayload } from '../types/common.types'

export const registerHandler = async (
  req: FastifyRequest<{ Body: RegisterDto }>,
  reply: FastifyReply
) => {
  try {
    const user = await register(req.body)
    return reply.code(201).send(successResponse(user, '회원가입이 완료되었습니다'))
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'EMAIL_EXISTS')
      return reply.code(409).send(errorResponse('이미 사용 중인 이메일입니다'))
    throw err
  }
}

export const loginHandler = async (
  req: FastifyRequest<{ Body: LoginDto }>,
  reply: FastifyReply
) => {
  try {
    const user = await login(req.body)
    const payload: JwtPayload = { id: user.id, email: user.email, role: user.role }
    const accessToken = req.server.jwt.sign(payload, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' })
    const refreshToken = req.server.jwt.sign({ id: user.id }, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' })

    return reply.send(successResponse({ accessToken, refreshToken, user }))
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'INVALID_CREDENTIALS')
        return reply.code(401).send(errorResponse('이메일 또는 비밀번호가 올바르지 않습니다'))
      if (err.message === 'ACCOUNT_NOT_ACTIVE')
        return reply.code(403).send(errorResponse('승인 대기 중인 계정입니다. 관리자 승인 후 로그인하세요'))
    }
    throw err
  }
}
```

- [ ] **Step 5: 커밋**

```bash
git add src/services/auth.service.ts src/controllers/auth.controller.ts tests/auth.test.ts
git commit -m "feat: add auth service and controller"
```

---

## Task 7: Auth Routes & JWT 미들웨어

**Files:**
- Create: `src/routes/auth.ts`
- Create: `src/plugins/authenticate.ts`
- Modify: `src/app.ts`

- [ ] **Step 1: src/routes/auth.ts 구현**

```typescript
import { FastifyInstance } from 'fastify'
import { registerHandler, loginHandler } from '../controllers/auth.controller'

export default async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: { email: string; password: string; role: string } }>(
    '/auth/register',
    {
      schema: {
        tags: ['Auth'],
        summary: '회원가입',
        body: {
          type: 'object',
          required: ['email', 'password', 'role'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            role: { type: 'string', enum: ['farmer', 'consumer'] },
          },
        },
      },
    },
    registerHandler
  )

  app.post<{ Body: { email: string; password: string } }>(
    '/auth/login',
    {
      schema: {
        tags: ['Auth'],
        summary: '로그인',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
      },
    },
    loginHandler
  )
}
```

- [ ] **Step 2: src/plugins/authenticate.ts 구현**

```typescript
import { FastifyRequest, FastifyReply } from 'fastify'
import { JwtPayload, UserRole } from '../types/common.types'

export const authenticate = async (
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    await req.jwtVerify()
  } catch {
    reply.code(401).send({ success: false, message: '인증이 필요합니다' })
  }
}

export const requireRole = (...roles: UserRole[]) =>
  async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      await req.jwtVerify()
    } catch {
      reply.code(401).send({ success: false, message: '인증이 필요합니다' })
      return
    }
    const user = req.user as JwtPayload
    if (!roles.includes(user.role)) {
      reply.code(403).send({ success: false, message: '권한이 없습니다' })
    }
  }
```

- [ ] **Step 3: Fastify JWT 타입 확장 — src/types/fastify.d.ts**

```typescript
import { JwtPayload } from './common.types'

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload
  }
}
```

- [ ] **Step 4: src/app.ts 전체 업데이트 (auth 라우트 등록)**

```typescript
import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import authRoutes from './routes/auth'

export default function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  app.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
  })

  app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret',
  })

  app.register(swagger, {
    openapi: {
      info: {
        title: 'Village Market API',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer' },
        },
      },
    },
  })

  app.register(swaggerUi, { routePrefix: '/docs' })

  app.register(authRoutes, { prefix: '/api' })

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
```

- [ ] **Step 5: src/controllers/auth.controller.ts에 refresh/logout 핸들러 추가**

기존 파일 끝에 추가:
```typescript
export const refreshHandler = async (
  req: FastifyRequest<{ Body: { refreshToken: string } }>,
  reply: FastifyReply
) => {
  try {
    const decoded = req.server.jwt.verify<{ id: string }>(req.body.refreshToken)
    const { findUserById } = await import('../repositories/auth.repository')
    const user = await findUserById(decoded.id)
    if (!user) return reply.code(401).send(errorResponse('유효하지 않은 토큰입니다'))
    if (user.status !== 'active') return reply.code(403).send(errorResponse('비활성 계정입니다'))

    const payload: JwtPayload = { id: user.id, email: user.email, role: user.role }
    const accessToken = req.server.jwt.sign(payload, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' })
    return reply.send(successResponse({ accessToken }))
  } catch {
    return reply.code(401).send(errorResponse('유효하지 않은 토큰입니다'))
  }
}

export const logoutHandler = async (
  _req: FastifyRequest,
  reply: FastifyReply
) => {
  // JWT는 stateless이므로 클라이언트 측 토큰 삭제로 처리
  return reply.send(successResponse(null, '로그아웃되었습니다'))
}
```

- [ ] **Step 6: src/routes/auth.ts에 refresh/logout 라우트 추가**

기존 파일 끝, `}` 닫기 전에 추가:
```typescript
import { registerHandler, loginHandler, refreshHandler, logoutHandler } from '../controllers/auth.controller'

// 기존 register, login 라우트 다음에:
app.post<{ Body: { refreshToken: string } }>(
  '/auth/refresh',
  {
    schema: {
      tags: ['Auth'],
      summary: '토큰 갱신',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
    },
  },
  refreshHandler
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
  logoutHandler
)
```

- [ ] **Step 7: tests/auth.test.ts에 refresh/logout 테스트 추가**

기존 파일 끝에 추가:
```typescript
describe('POST /api/auth/refresh', () => {
  it('returns 401 for invalid refresh token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: { refreshToken: 'invalid-token' },
    })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/auth/logout', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
    })
    expect(res.statusCode).toBe(401)
  })
})
```

- [ ] **Step 8: 테스트 실행 — 통과 확인**

```bash
npx vitest run tests/auth.test.ts
```

Expected: PASS (모든 테스트 통과)

- [ ] **Step 6: 전체 테스트 실행**

```bash
npx vitest run
```

Expected: health.test.ts + auth.test.ts + hash.test.ts 모두 PASS

- [ ] **Step 7: 커밋**

```bash
git add src/routes/auth.ts src/plugins/authenticate.ts src/types/fastify.d.ts src/app.ts
git commit -m "feat: add auth routes and JWT authenticate middleware"
```

---

## Task 8: CLAUDE.md 작성

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: CLAUDE.md 작성**

```markdown
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

## 환경변수
`.env.example` 참고. `.env`는 git에 포함하지 않음.

## 실행
- 개발: `npm run dev`
- 테스트: `npm test`
- 빌드: `npm run build`
- API 문서: http://localhost:3000/docs
```

- [ ] **Step 2: 커밋**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md for backend project context"
```

---

## 최종 검증

- [ ] **전체 테스트 통과 확인**

```bash
npx vitest run
```

Expected: 모든 테스트 PASS, 에러 없음

- [ ] **개발 서버 + Swagger 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000/docs` 접속 → Swagger UI에 `/api/auth/register`, `/api/auth/login` 표시 확인

- [ ] **빌드 확인**

```bash
npm run build
```

Expected: `dist/` 생성, 타입 에러 없음
