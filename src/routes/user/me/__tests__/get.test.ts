import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { ModuleMocker } from '@/__tests__/module-mocker'
import { AppError, ErrorCode } from '@/lib/catch'
import { onError } from '@/middleware'

import meRoute from '../index'

describe('GET /me endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let app: Hono
  const mockJwtPayload = {
    id: 1,
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    v: 1, // tokenVersion in JWT
  }

  const mockFullUser = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    tokenVersion: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  beforeEach(async () => {
    app = new Hono()
    app.onError(onError)

    // Add middleware that sets user from JWT
    app.use('/api/v1/protected/*', async (c, next) => {
      c.set('user', mockJwtPayload)
      await next()
    })

    app.route('/api/v1/protected', meRoute)

    // Mock the business logic functions
    await moduleMocker.mock('../me', () => ({
      getUser: mock(() => Promise.resolve(mockFullUser)),
      updateUser: mock(() => Promise.resolve(mockFullUser)),
    }))
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  it('should return full user data without tokenVersion', async () => {
    const res = await app.request('/api/v1/protected/me', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer mock-token',
      },
    })

    expect(res.status).toBe(StatusCodes.OK)

    const data = await res.json()
    expect(data).toEqual({
      user: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
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
    // Mock getUser to throw internal error for data inconsistency
    await moduleMocker.mock('../me', () => ({
      getUser: mock(() => Promise.reject(new AppError(ErrorCode.InternalError))),
      updateUser: mock(() => Promise.resolve(null)),
    }))

    const res = await app.request('/api/v1/protected/me', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer mock-token',
      },
    })

    expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)

    const data = await res.json()
    expect(data.error).toBe('Internal server error.')
  })

  it('should return same structure as login and signup', async () => {
    const res = await app.request('/api/v1/protected/me', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer mock-token',
      },
    })

    expect(res.status).toBe(StatusCodes.OK)

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
