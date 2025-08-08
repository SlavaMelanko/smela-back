import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { AppError, ErrorCode } from '@/lib/catch'
import { onError } from '@/middleware'

import meRoute from '../index'

describe('POST /me endpoint', () => {
  let app: Hono
  const mockJwtPayload = {
    id: 1,
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    v: 1,
  }

  const mockUpdatedUser = {
    id: 1,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    tokenVersion: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  }

  const mockUpdatedUserMinimal = {
    id: 1,
    firstName: 'Jo',
    lastName: 'Do',
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    tokenVersion: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
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

    // Mock the business logic functions
    mock.module('../me', () => ({
      getUser: mock(() => Promise.resolve(mockUpdatedUser)),
      updateUser: mock(() => Promise.resolve(mockUpdatedUser)),
    }))
  })

  it('should update user profile successfully', async () => {
    const res = await app.request('/api/v1/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({ firstName: 'Jane', lastName: 'Smith' }),
    })

    expect(res.status).toBe(StatusCodes.OK)

    const data = await res.json()
    expect(data).toEqual({
      user: {
        id: 1,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
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
    // Mock updateUser to throw error
    mock.module('../me', () => ({
      getUser: mock(() => Promise.resolve(mockUpdatedUser)),
      updateUser: mock(() => Promise.reject(new AppError(ErrorCode.InternalError, 'Failed to update user.'))),
    }))

    const res = await app.request('/api/v1/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({ firstName: 'Jane', lastName: 'Smith' }),
    })

    expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)

    const data = await res.json()
    expect(data.error).toBe('Failed to update user.')
  })

  it('should validate input data', async () => {
    const res = await app.request('/api/v1/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({ firstName: '', lastName: '' }), // Empty strings should fail validation
    })

    expect(res.status).toBe(StatusCodes.BAD_REQUEST)

    const data = await res.json()
    expect(data.error).toBeDefined()
    // The actual error message is about string length, which is expected for empty strings
  })

  it('should require both firstName and lastName', async () => {
    const res = await app.request('/api/v1/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({ firstName: 'Jane' }), // Only firstName
    })

    expect(res.status).toBe(StatusCodes.BAD_REQUEST)

    const data = await res.json()
    expect(data.error).toBe('Required') // lastName is required
  })

  it('should handle valid names with minimum length', async () => {
    // Mock updateUser to return user with minimal names
    mock.module('../me', () => ({
      getUser: mock(() => Promise.resolve(mockUpdatedUserMinimal)),
      updateUser: mock(() => Promise.resolve(mockUpdatedUserMinimal)),
    }))

    const res = await app.request('/api/v1/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({ firstName: 'Jo', lastName: 'Do' }), // Minimum valid length
    })

    expect(res.status).toBe(StatusCodes.OK)

    const data = await res.json()
    expect(data.user.firstName).toBe('Jo')
    expect(data.user.lastName).toBe('Do')
  })
})
