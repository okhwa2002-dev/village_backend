import { FastifyInstance } from 'fastify'
import { registerHandler, loginHandler, refreshHandler, logoutHandler } from '../controllers/authController'
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
}
