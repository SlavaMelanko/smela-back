import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'
import type { UserClaims } from '@/security/jwt'

import { createTestApp, ModuleMocker, patch, testUuids } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { HttpStatus } from '@/net/http'
import { Role, Status } from '@/types'

import { meRoute } from '../index'

describe('Me Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const ME_URL = '/api/v1/user/me'

  let app: Hono

  let mockFullUser: User
  let mockGetUser: any
  let mockUpdatedUser: User
  let mockUpdateUser: any
  let mockUserClaims: UserClaims

  beforeEach(async () => {
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
    mockGetUser = mock(async () => ({ user: mockFullUser }))
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
    mockUpdateUser = mock(async () => ({ user: mockUpdatedUser }))

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
    it('should return user data without tokenVersion', async () => {
      const res = await app.request(ME_URL, { method: 'GET' })

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
      expect(data.user).not.toHaveProperty('tokenVersion')

      const { getUser } = await import('@/use-cases/user/me')
      expect(getUser).toHaveBeenCalledWith(testUuids.USER_1)
    })

    it('should handle user not found as data inconsistency', async () => {
      mockGetUser.mockImplementation(async () => {
        throw new AppError(ErrorCode.InternalError, 'Internal server error.')
      })

      const res = await app.request(ME_URL, { method: 'GET' })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect((await res.json()).error).toBe('Internal server error.')
    })
  })

  describe('PATCH /me', () => {
    it('should update user profile successfully', async () => {
      const res = await patch(app, ME_URL, { firstName: 'Jane', lastName: 'Smith' }, {
        'Content-Type': 'application/json',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data.user.firstName).toBe('Jane')
      expect(data.user.lastName).toBe('Smith')
      expect(data.user).not.toHaveProperty('tokenVersion')

      const { updateUser } = await import('@/use-cases/user/me')
      expect(updateUser).toHaveBeenCalledWith(testUuids.USER_1, { firstName: 'Jane', lastName: 'Smith' })
    })

    it('should handle update failure', async () => {
      mockUpdateUser.mockImplementation(async () => {
        throw new AppError(ErrorCode.InternalError, 'Failed to update user.')
      })

      const res = await patch(app, ME_URL, { firstName: 'Jane', lastName: 'Smith' }, {
        'Content-Type': 'application/json',
      })

      expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect((await res.json()).error).toBe('Failed to update user.')
    })

    it('should reject empty strings', async () => {
      const res = await patch(app, ME_URL, { firstName: '', lastName: '' }, {
        'Content-Type': 'application/json',
      })

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)
    })

    it('should trim strings and reject whitespace-only values', async () => {
      const res = await patch(app, ME_URL, { firstName: '   ', lastName: 'Smith' }, {
        'Content-Type': 'application/json',
      })

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)
    })

    it('should trim valid strings at validation layer', async () => {
      const res = await patch(app, ME_URL, { firstName: '  Jane  ', lastName: '  Smith  ' }, {
        'Content-Type': 'application/json',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const { updateUser } = await import('@/use-cases/user/me')
      expect(updateUser).toHaveBeenCalledWith(testUuids.USER_1, { firstName: 'Jane', lastName: 'Smith' })
    })

    it('should normalize null lastName to empty string', async () => {
      const res = await patch(app, ME_URL, { firstName: 'Jane', lastName: null }, {
        'Content-Type': 'application/json',
      })

      expect(res.status).toBe(HttpStatus.OK)

      const { updateUser } = await import('@/use-cases/user/me')
      expect(updateUser).toHaveBeenCalledWith(testUuids.USER_1, { firstName: 'Jane', lastName: '' })
    })
  })
})
