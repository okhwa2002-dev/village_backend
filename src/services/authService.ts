import { RegisterDto, LoginDto } from '../types/userTypes'
import { hashPassword, comparePassword } from '../utils/hash'
import { findUserByEmail, createUser } from '../repositories/authRepository'

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
