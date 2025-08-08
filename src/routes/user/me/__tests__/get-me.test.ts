import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'
import { userRepo } from '@/repositories'

import meRoute from '../index'

describe('GET /me endpoint', () => {
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

  beforeEach(() => {
    app = new Hono()
    app.onError(onError)
    
    // Add middleware that sets user from JWT
    app.use('/api/v1/*', async (c, next) => {
      c.set('user', mockJwtPayload)
      await next()
    })
    
    app.route('/api/v1', meRoute)

    // Mock user repository
    mock.module('@/repositories', () => ({
      userRepo: {
        findById: mock(() => Promise.resolve(mockFullUser)),
        update: mock(() => Promise.resolve(mockFullUser)),
      },
    }))
  })

  it('should return full user data without tokenVersion', async () => {
    const res = await app.request('/api/v1/me', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-token',
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

    // Verify findById was called with correct user ID
    expect(userRepo.findById).toHaveBeenCalledWith(1)
    expect(userRepo.findById).toHaveBeenCalledTimes(1)
  })

  it('should handle user not found', async () => {
    // Mock findById to return null
    mock.module('@/repositories', () => ({
      userRepo: {
        findById: mock(() => Promise.resolve(null)),
        update: mock(() => Promise.resolve(null)),
      },
    }))

    const res = await app.request('/api/v1/me', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-token',
      },
    })

    expect(res.status).toBe(StatusCodes.NOT_FOUND)
    
    const data = await res.json()
    expect(data.error).toBe('User not found')
  })

  it('should return same structure as login and signup', async () => {
    const res = await app.request('/api/v1/me', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-token',
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