import { query, queryOne } from '../db/pool'
import { User } from '../types/userTypes'

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
