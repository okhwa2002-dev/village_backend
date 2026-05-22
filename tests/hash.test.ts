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
