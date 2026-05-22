import { FastifyRequest, FastifyReply } from 'fastify'
import { JwtPayload, UserRole } from '../types/commonTypes'

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
      return reply.code(403).send({ success: false, message: '권한이 없습니다' })
    }
  }
