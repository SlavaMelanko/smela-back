import type { Hono } from 'hono'

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'
import type { UserClaims } from '@/security/jwt'

import { createTestApp, ModuleMocker } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { Role, Status } from '@/types'

import adminUsersRoute from '../index'

describe('Admin Users Endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const USERS_URL = '/api/v1/admin/users'
  const DEFAULT_LIMIT = 25

  let app: Hono

  let mockUsers: User[]
  let mockSearchUsers: any

  let mockAdminClaims: UserClaims

  beforeEach(async () => {
    mockUsers = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: Role.User,
        status: Status.Active,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: Role.Enterprise,
        status: Status.Verified,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ]

    mockSearchUsers = mock(async () => ({
      data: { users: mockUsers },
      pagination: {
        page: 1,
        limit: DEFAULT_LIMIT,
        total: 2,
        totalPages: 1,
      },
    }))

    await moduleMocker.mock('@/use-cases/admin', () => ({
      searchUsers: mockSearchUsers,
    }))

    mockAdminClaims = {
      id: '550e8400-e29b-41d4-a716-446655440100',
      email: 'admin@example.com',
      role: Role.Admin,
      status: Status.Active,
    }

    const adminMiddleware: any = async (c: any, next: any) => {
      c.set('user', mockAdminClaims)
      await next()
    }

    app = createTestApp('/api/v1/admin', adminUsersRoute, [adminMiddleware])
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('GET /users', () => {
    it('should return paginated users list with default parameters', async () => {
      const res = await app.request(USERS_URL, { method: 'GET' })

      expect(res.status).toBe(HttpStatus.OK)

      const data = await res.json()
      expect(data).toEqual({
        users: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: Role.User,
            status: Status.Active,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            role: Role.Enterprise,
            status: Status.Verified,
            createdAt: '2024-01-02T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: DEFAULT_LIMIT,
          total: 2,
          totalPages: 1,
        },
      })
    })

    it('should reject invalid page parameter', async () => {
      const res = await app.request(`${USERS_URL}?page=0`, { method: 'GET' })

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)

      const data = await res.json()
      expect(data.error).toContain('page')
    })

    it('should reject limit exceeding maximum', async () => {
      const res = await app.request(`${USERS_URL}?limit=101`, { method: 'GET' })

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)

      const data = await res.json()
      expect(data.error).toContain('limit')
    })

    it('should reject invalid statuses value', async () => {
      const res = await app.request(`${USERS_URL}?statuses=invalid`, { method: 'GET' })

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)
    })

    it('should reject invalid roles value', async () => {
      const res = await app.request(`${USERS_URL}?roles=invalid`, { method: 'GET' })

      expect(res.status).toBe(HttpStatus.BAD_REQUEST)
    })

    it('should pass search parameter to use case', async () => {
      const res = await app.request(`${USERS_URL}?search=john`, { method: 'GET' })

      expect(res.status).toBe(HttpStatus.OK)
      expect(mockSearchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'john' }),
        expect.any(Object),
      )
    })

    it('should pass search combined with filters', async () => {
      const res = await app.request(
        `${USERS_URL}?search=test&roles=${Role.User}&statuses=${Status.Active}`,
        { method: 'GET' },
      )

      expect(res.status).toBe(HttpStatus.OK)
      expect(mockSearchUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test',
          roles: [Role.User],
          statuses: [Status.Active],
        }),
        expect.any(Object),
      )
    })

    it('should pass search combined with pagination', async () => {
      const res = await app.request(`${USERS_URL}?search=jane&page=2&limit=10`, { method: 'GET' })

      expect(res.status).toBe(HttpStatus.OK)
      expect(mockSearchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'jane' }),
        { page: 2, limit: 10 },
      )
    })

    it('should trim whitespace from search parameter', async () => {
      const res = await app.request(`${USERS_URL}?search=  john  `, { method: 'GET' })

      expect(res.status).toBe(HttpStatus.OK)
      expect(mockSearchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'john' }),
        expect.any(Object),
      )
    })
  })
})
