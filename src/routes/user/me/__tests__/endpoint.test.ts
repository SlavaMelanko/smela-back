import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User, UserRecord } from '@/data'
import type { UserClaims } from '@/jwt'

import { createTestApp, ModuleMocker, post } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import HttpStatus from '@/lib/http-status'
import { Role, Status } from '@/types'

import meRoute from '../index'

describe('Me Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const ME_URL = '/api/v1/protected/me'

  let app: Hono

  let mockUpdatedUserMinimal: User

  let mockFullUser: User
  let mockGetUser: any
  let mockUpdatedUser: User
  let mockUpdateUser: any

  let mockUserClaims: UserClaims

  beforeEach(async () => {
    mockUpdatedUserMinimal = {
      id: 1,
      firstName: 'Jo',
      lastName: 'Do',
      email: 'test@example.com',
      role: Role.User,
      status: Status.Active,
      tokenVersion: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockFullUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      role: Role.User,
      status: Status.Active,
      tokenVersion: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }
    mockGetUser = mock(async () => mockFullUser)
    mockUpdatedUser = {
      id: 1,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'test@example.com',
      role: Role.User,
      status: Status.Active,
      tokenVersion: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    }
    mockUpdateUser = mock(async () => mockUpdatedUser)

    await moduleMocker.mock('../me', () => ({
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
    }))

    mockUserClaims = {
      id: 1,
      email: 'test@example.com',
      role: Role.User,
      status: Status.Active,
      tokenVersion: 1,
    }

    const userMiddleware: any = async (c: any, next: any) => {
      c.set('user', mockUserClaims)
      await next()
    }

    app = createTestApp('/api/v1/protected', meRoute, [userMiddleware])
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('GET /me', () => {
    it('should return full user data without tokenVersion', async () => {
      const res = await app.request(ME_URL, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data).toEqual({
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          role: Role.User,
          status: Status.Active,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      })

      // Verify tokenVersion is not included
      expect(data.user).not.toHaveProperty('tokenVersion')

      // Verify all other fields are included
      expect(data.user).toHaveProperty('id')
      expect(data.user).toHaveProperty('firstName')
      expect(data.user).toHaveProperty('lastName')
      expect(data.user).toHaveProperty('email')
      expect(data.user).toHaveProperty('role')
      expect(data.user).toHaveProperty('status')
      expect(data.user).toHaveProperty('createdAt')
      expect(data.user).toHaveProperty('updatedAt')

      // Verify getUser was called with correct user ID
      const { getUser } = await import('../me')
      expect(getUser).toHaveBeenCalledWith(1)
      expect(getUser).toHaveBeenCalledTimes(1)
    })

    it('should handle user not found as data inconsistency', async () => {
      mockGetUser.mockImplementation(async () => {
        throw new AppError(ErrorCode.InternalError, 'Internal server error.')
      })

      const res = await app.request(ME_URL, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)

      const data = await res.json()
      expect(data.error).toBe('Internal server error.')
    })

    it('should return same structure as login and signup', async () => {
      const res = await app.request(ME_URL, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()

      // Should have 'user' key at top level (like login/signup)
      expect(data).toHaveProperty('user')

      // Should NOT have 'db' key (which was in old implementation)
      expect(data).not.toHaveProperty('db')

      // User object should have all fields except tokenVersion
      const userKeys = Object.keys(data.user).sort()
      const expectedKeys = ['id', 'firstName', 'lastName', 'email', 'role', 'status', 'createdAt', 'updatedAt'].sort()
      expect(userKeys).toEqual(expectedKeys)
    })
  })

  describe('POST /me', () => {
    it('should update user profile successfully', async () => {
      const res = await post(app, ME_URL, { firstName: 'Jane', lastName: 'Smith' }, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data).toEqual({
        user: {
          id: 1,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'test@example.com',
          role: Role.User,
          status: Status.Active,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      })

      // Verify tokenVersion is not included
      expect(data.user).not.toHaveProperty('tokenVersion')

      // Verify updateUser was called with correct parameters
      const { updateUser } = await import('../me')
      expect(updateUser).toHaveBeenCalledWith(1, {
        firstName: 'Jane',
        lastName: 'Smith',
      })
      expect(updateUser).toHaveBeenCalledTimes(1)
    })

    it('should handle update failure', async () => {
      mockUpdateUser.mockImplementation(async () => {
        throw new AppError(ErrorCode.InternalError, 'Failed to update user.')
      })

      const res = await post(app, ME_URL, { firstName: 'Jane', lastName: 'Smith' }, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)

      const data = await res.json()
      expect(data.error).toBe('Failed to update user.')
    })

    it('should validate input data - empty strings', async () => {
      const res = await post(app, ME_URL, { firstName: '', lastName: '' }, { // empty strings should fail validation
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)

      const data = await res.json()
      expect(data.error).toBeDefined()
      // The actual error message is about string length, which is expected for empty strings
    })

    it('should allow partial updates with only firstName', async () => {
      const res = await post(app, ME_URL, { firstName: 'Jane' }, { // only firstName
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data.user.firstName).toBe('Jane')

      // Verify updateUser was called with only firstName
      const { updateUser } = await import('../me')
      expect(updateUser).toHaveBeenCalledWith(1, {
        firstName: 'Jane',
      })
    })

    it('should handle valid names with minimum length', async () => {
      mockUpdateUser.mockImplementation(async () => mockUpdatedUserMinimal)

      const res = await post(app, ME_URL, {
        firstName: mockUpdatedUserMinimal.firstName,
        lastName: mockUpdatedUserMinimal.lastName,
      }, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data.user.firstName).toBe('Jo')
      expect(data.user.lastName).toBe('Do')
    })

    it('should handle empty body (no updates)', async () => {
      mockUpdateUser.mockImplementation(async (_userId: number, updates: any) => {
        const validUpdates: any = {}
        if (updates.firstName && updates.firstName.trim()) {
          validUpdates.firstName = updates.firstName.trim()
        }
        if (updates.lastName && updates.lastName.trim()) {
          validUpdates.lastName = updates.lastName.trim()
        }

        if (Object.keys(validUpdates).length === 0) {
          return mockGetUser() as Promise<UserRecord>
        }

        return mockUpdatedUser
      })

      const res = await post(app, ME_URL, {}, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      // Should return current user data
      expect(data.user.firstName).toBe('John')
      expect(data.user.lastName).toBe('Doe')

      // Verify updateUser was called
      const { updateUser } = await import('../me')
      expect(updateUser).toHaveBeenCalledWith(1, {})
    })

    it('should handle null values properly', async () => {
      const res = await post(app, ME_URL, { firstName: 'Jane', lastName: null }, { // lastName is null
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.OK)

      // Verify updateUser was called with both fields (validation layer handles null)
      const { updateUser } = await import('../me')
      expect(updateUser).toHaveBeenCalledWith(1, {
        firstName: 'Jane',
        lastName: undefined, // null is converted to undefined
      })
    })

    it('should allow updating only lastName', async () => {
      const res = await post(app, ME_URL, { lastName: 'Smith' }, { // only lastName
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data.user.lastName).toBe('Smith')

      // Verify updateUser was called only with lastName
      const { updateUser } = await import('../me')
      expect(updateUser).toHaveBeenCalledWith(1, {
        lastName: 'Smith',
      })
    })

    it('should reject empty strings at validation level', async () => {
      const res = await post(app, ME_URL, { firstName: '', lastName: 'Smith' }, { // empty string for firstName
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)

      const data = await res.json()
      expect(data.error).toBe('String must contain at least 2 character(s)')
    })

    it('should handle whitespace-only strings as empty', async () => {
      mockUpdateUser.mockImplementation(async (_userId: number, updates: any) => {
        const validUpdates: any = {}
        if (updates.firstName && updates.firstName.trim()) {
          validUpdates.firstName = updates.firstName.trim()
        }
        if (updates.lastName && updates.lastName.trim()) {
          validUpdates.lastName = updates.lastName.trim()
        }

        if (Object.keys(validUpdates).length === 0) {
          return mockGetUser() as Promise<UserRecord>
        }

        return mockUpdatedUser
      })

      const res = await post(app, ME_URL, { firstName: '   ', lastName: 'Smith' }, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      // Should update only lastName since firstName is whitespace-only
      expect(data.user.lastName).toBe('Smith')

      // Verify updateUser was called with whitespace string (prepareValidUpdates will filter it)
      const { updateUser } = await import('../me')
      expect(updateUser).toHaveBeenCalledWith(1, {
        firstName: '   ',
        lastName: 'Smith',
      })
    })

    it('should trim valid strings before updating', async () => {
      const res = await post(app, ME_URL, { firstName: '  Jane  ', lastName: '  Smith  ' }, { // strings with extra spaces
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data.user.firstName).toBe('Jane')
      expect(data.user.lastName).toBe('Smith')

      // Verify updateUser was called with untrimmed values (trimming happens inside updateUser)
      const { updateUser } = await import('../me')
      expect(updateUser).toHaveBeenCalledWith(1, {
        firstName: '  Jane  ',
        lastName: '  Smith  ',
      })
    })
  })
})
