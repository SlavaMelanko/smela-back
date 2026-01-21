import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'
import type { UserClaims } from '@/security/jwt'

import { createTestApp, ModuleMocker, post, testUuids } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { HttpStatus } from '@/net/http'
import { Role, Status } from '@/types'

import meRoute from '../index'

describe('Me Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const ME_URL = '/api/v1/user/me'

  let app: Hono

  let mockUpdatedUserMinimal: User

  let mockFullUser: User
  let mockGetUser: any
  let mockUpdatedUser: User
  let mockUpdateUser: any

  let mockUserClaims: UserClaims

  beforeEach(async () => {
    mockUpdatedUserMinimal = {
      id: testUuids.USER_1,
      firstName: 'Jo',
      lastName: 'Do',
      email: 'test@example.com',
      role: Role.User,
      status: Status.Active,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockFullUser = {
      id: testUuids.USER_1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      role: Role.User,
      status: Status.Active,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }
    mockGetUser = mock(async () => ({ data: { user: mockFullUser } }))
    mockUpdatedUser = {
      id: testUuids.USER_1,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'test@example.com',
      role: Role.User,
      status: Status.Active,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    }
    mockUpdateUser = mock(async () => ({ data: { user: mockUpdatedUser } }))

    await moduleMocker.mock('@/use-cases/user/me', () => ({
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
    }))

    mockUserClaims = {
      id: testUuids.USER_1,
      email: 'test@example.com',
      role: Role.User,
      status: Status.Active,
    }

    const userMiddleware: any = async (c: any, next: any) => {
      c.set('user', mockUserClaims)
      await next()
    }

    app = createTestApp('/api/v1/user', meRoute, [userMiddleware])
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
          id: testUuids.USER_1,
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
      const { getUser } = await import('@/use-cases/user/me')
      expect(getUser).toHaveBeenCalledWith(testUuids.USER_1)
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
      const res = await post(app, ME_URL, { data: { firstName: 'Jane', lastName: 'Smith' } }, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data).toEqual({
        user: {
          id: testUuids.USER_1,
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
      const { updateUser } = await import('@/use-cases/user/me')
      expect(updateUser).toHaveBeenCalledWith(testUuids.USER_1, {
        firstName: 'Jane',
        lastName: 'Smith',
      })
      expect(updateUser).toHaveBeenCalledTimes(1)
    })

    it('should handle update failure', async () => {
      mockUpdateUser.mockImplementation(async () => {
        throw new AppError(ErrorCode.InternalError, 'Failed to update user.')
      })

      const res = await post(app, ME_URL, { data: { firstName: 'Jane', lastName: 'Smith' } }, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)

      const data = await res.json()
      expect(data.error).toBe('Failed to update user.')
    })

    it('should validate input data - empty strings', async () => {
      const res = await post(app, ME_URL, { data: { firstName: '', lastName: '' } }, { // empty strings should fail validation
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)

      const data = await res.json()
      expect(data.error).toBeDefined()
      // The actual error message is about string length, which is expected for empty strings
    })

    it('should allow partial updates with only firstName', async () => {
      const res = await post(app, ME_URL, { data: { firstName: 'Jane' } }, { // only firstName
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data.user.firstName).toBe('Jane')

      // Verify updateUser was called with only firstName
      const { updateUser } = await import('@/use-cases/user/me')
      expect(updateUser).toHaveBeenCalledWith(testUuids.USER_1, {
        firstName: 'Jane',
      })
    })

    it('should handle valid names with minimum length', async () => {
      mockUpdateUser.mockImplementation(async () => ({ data: { user: mockUpdatedUserMinimal } }))

      const res = await post(app, ME_URL, {
        data: {
          firstName: mockUpdatedUserMinimal.firstName,
          lastName: mockUpdatedUserMinimal.lastName,
        },
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
      mockUpdateUser.mockImplementation(async (_userId: string, updates: any) => {
        const validUpdates: any = {}
        if (updates.firstName && updates.firstName.trim()) {
          validUpdates.firstName = updates.firstName.trim()
        }
        if (updates.lastName && updates.lastName.trim()) {
          validUpdates.lastName = updates.lastName.trim()
        }

        if (Object.keys(validUpdates).length === 0) {
          // eslint-disable-next-line ts/no-unsafe-return
          return mockGetUser()
        }

        return { data: { user: mockUpdatedUser } }
      })

      const res = await post(app, ME_URL, { data: {} }, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      // Should return current user data
      expect(data.user.firstName).toBe('John')
      expect(data.user.lastName).toBe('Doe')

      // Verify updateUser was called
      const { updateUser } = await import('@/use-cases/user/me')
      expect(updateUser).toHaveBeenCalledWith(testUuids.USER_1, {})
    })

    it('should normalize null lastName to empty string', async () => {
      const res = await post(app, ME_URL, { data: { firstName: 'Jane', lastName: null } }, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.OK)

      // Verify updateUser was called with lastName normalized to ""
      const { updateUser } = await import('@/use-cases/user/me')
      expect(updateUser).toHaveBeenCalledWith(testUuids.USER_1, {
        firstName: 'Jane',
        lastName: '',
      })
    })

    it('should allow updating only lastName', async () => {
      const res = await post(app, ME_URL, { data: { lastName: 'Smith' } }, { // only lastName
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data.user.lastName).toBe('Smith')

      // Verify updateUser was called only with lastName
      const { updateUser } = await import('@/use-cases/user/me')
      expect(updateUser).toHaveBeenCalledWith(testUuids.USER_1, {
        lastName: 'Smith',
      })
    })

    it('should reject empty strings at validation level', async () => {
      const res = await post(app, ME_URL, { data: { firstName: '', lastName: 'Smith' } }, { // empty string for firstName
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)

      const data = await res.json()
      expect(data.error).toBe('[data.firstName]: string must contain at least 2 character(s)')
    })

    it('should reject whitespace-only strings at validation level', async () => {
      const res = await post(app, ME_URL, { data: { firstName: '   ', lastName: 'Smith' } }, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      // Whitespace-only firstName trims to '' which fails min(2) validation
      expect(res.status).toBe(HttpStatus.BAD_REQUEST)
    })

    it('should trim valid strings at validation layer', async () => {
      const res = await post(app, ME_URL, { data: { firstName: '  Jane  ', lastName: '  Smith  ' } }, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data.user.firstName).toBe('Jane')
      expect(data.user.lastName).toBe('Smith')

      // Verify updateUser was called with already trimmed values (trimming happens at schema layer)
      const { updateUser } = await import('@/use-cases/user/me')
      expect(updateUser).toHaveBeenCalledWith(testUuids.USER_1, {
        firstName: 'Jane',
        lastName: 'Smith',
      })
    })
  })
})
