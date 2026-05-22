import { FastifyRequest, FastifyReply } from 'fastify'
import { RegisterDto, LoginDto } from '../types/userTypes'
import { register, login } from '../services/authService'
import { successResponse, errorResponse } from '../utils/response'
import { JwtPayload } from '../types/commonTypes'

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

export const refreshHandler = async (
  req: FastifyRequest<{ Body: { refreshToken: string } }>,
  reply: FastifyReply
) => {
  try {
    const decoded = req.server.jwt.verify<{ id: string }>(req.body.refreshToken)
    const { findUserById } = await import('../repositories/authRepository')
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
  return reply.send(successResponse(null, '로그아웃되었습니다'))
}
