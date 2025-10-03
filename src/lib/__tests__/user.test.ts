import { describe, expect, it } from 'bun:test'

import type { User } from '@/data/user/types'

import { Role, Status } from '@/types'

import { normalizeUser } from '../user'

describe('Normalize User', () => {
  const mockUser: User = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: Role.User,
    status: Status.Active,
    tokenVersion: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  }

  it('should remove tokenVersion from user object', () => {
    const result = normalizeUser(mockUser)

    expect(result).not.toHaveProperty('tokenVersion')
    expect(result).toEqual({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: Role.User,
      status: Status.Active,
      createdAt: mockUser.createdAt,
      updatedAt: mockUser.updatedAt,
    })
  })

  it('should keep all other fields intact', () => {
    const result = normalizeUser(mockUser)

    expect(result.id).toBe(mockUser.id)
    expect(result.firstName).toBe(mockUser.firstName)
    expect(result.lastName).toBe(mockUser.lastName)
    expect(result.email).toBe(mockUser.email)
    expect(result.role).toBe(mockUser.role)
    expect(result.status).toBe(mockUser.status)
    expect(result.createdAt).toBe(mockUser.createdAt)
    expect(result.updatedAt).toBe(mockUser.updatedAt)
  })

  it('should handle users with tokenVersion 0', () => {
    const userWithZeroTokenVersion = { ...mockUser, tokenVersion: 0 }
    const result = normalizeUser(userWithZeroTokenVersion)

    expect(result).not.toHaveProperty('tokenVersion')
    expect(result.id).toBe(mockUser.id)
  })

  it('should handle users with large tokenVersion', () => {
    const userWithLargeTokenVersion = { ...mockUser, tokenVersion: 999999 }
    const result = normalizeUser(userWithLargeTokenVersion)

    expect(result).not.toHaveProperty('tokenVersion')
    expect(result.id).toBe(mockUser.id)
  })

  it('should return a new object, not mutate the original', () => {
    const originalUser = { ...mockUser }
    const result = normalizeUser(originalUser)

    // Original should still have tokenVersion
    expect(originalUser.tokenVersion).toBe(5)

    // Result should not have tokenVersion
    expect(result).not.toHaveProperty('tokenVersion')

    // Result should be a different object
    expect(result).not.toBe(originalUser)
  })
})
