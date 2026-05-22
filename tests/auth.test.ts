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
