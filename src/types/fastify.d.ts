import { JwtPayload } from './commonTypes'

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload
  }
}
