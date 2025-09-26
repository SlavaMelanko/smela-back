import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { ModuleMocker } from '@/__tests__/module-mocker'
import { AppError, ErrorCode } from '@/lib/catch'
import { onError } from '@/middleware'

import meRoute from '../index'

describe('POST /me endpoint', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

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

  const mockCurrentUser = {
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
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  it('should update user profile successfully', async () => {
    // Mock the business logic functions
    await moduleMocker.mock('../me', () => ({
      getUser: mock(() => Promise.resolve(mockCurrentUser)),
      updateUser: mock(() => Promise.resolve(mockUpdatedUser)),
    }))

    const res = await app.request('/api/v1/protected/me', {
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
    await moduleMocker.mock('../me', () => ({
      getUser: mock(() => Promise.resolve(mockCurrentUser)),
      updateUser: mock(() => Promise.reject(new AppError(ErrorCode.InternalError, 'Failed to update user.'))),
    }))

    const res = await app.request('/api/v1/protected/me', {
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

  it('should validate input data - empty strings', async () => {
    const res = await app.request('/api/v1/protected/me', {
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

  it('should allow partial updates with only firstName', async () => {
    await moduleMocker.mock('../me', () => ({
      getUser: mock(() => Promise.resolve(mockCurrentUser)),
      updateUser: mock(() => Promise.resolve(mockUpdatedUser)),
    }))

    const res = await app.request('/api/v1/protected/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({ firstName: 'Jane' }), // Only firstName
    })

    expect(res.status).toBe(StatusCodes.OK)

    const data = await res.json()
    expect(data.user.firstName).toBe('Jane')

    // Verify updateUser was called with only firstName
    const { updateUser } = await import('../me')
    expect(updateUser).toHaveBeenCalledWith(1, {
      firstName: 'Jane',
    })
  })

  it('should handle valid names with minimum length', async () => {
    // Mock updateUser to return user with minimal names
    await moduleMocker.mock('../me', () => ({
      getUser: mock(() => Promise.resolve(mockCurrentUser)),
      updateUser: mock(() => Promise.resolve(mockUpdatedUserMinimal)),
    }))

    const res = await app.request('/api/v1/protected/me', {
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

  it('should handle empty body (no updates)', async () => {
    // Mock to simulate the actual implementation behavior
    const mockGetUser = mock(() => Promise.resolve(mockCurrentUser))
    const mockUpdateUser = mock((userId: number, updates: any) => {
      // Simulate prepareValidUpdates behavior
      const validUpdates: any = {}
      if (updates.firstName && updates.firstName.trim()) {
        validUpdates.firstName = updates.firstName.trim()
      }
      if (updates.lastName && updates.lastName.trim()) {
        validUpdates.lastName = updates.lastName.trim()
      }

      // If no valid updates, return current user (simulating getUser call)
      if (Object.keys(validUpdates).length === 0) {
        return mockGetUser()
      }

      return Promise.resolve(mockUpdatedUser)
    })

    await moduleMocker.mock('../me', () => ({
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
    }))

    const res = await app.request('/api/v1/protected/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({}), // No fields to update
    })

    expect(res.status).toBe(StatusCodes.OK)

    const data = await res.json()
    // Should return current user data
    expect(data.user.firstName).toBe('John')
    expect(data.user.lastName).toBe('Doe')

    // Verify updateUser was called
    const { updateUser } = await import('../me')
    expect(updateUser).toHaveBeenCalledWith(1, {})
  })

  it('should handle null values properly', async () => {
    await moduleMocker.mock('../me', () => ({
      getUser: mock(() => Promise.resolve(mockCurrentUser)),
      updateUser: mock(() => Promise.resolve(mockUpdatedUser)),
    }))

    const res = await app.request('/api/v1/protected/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({ firstName: 'Jane', lastName: null }), // lastName is null
    })

    expect(res.status).toBe(StatusCodes.OK)

    // Verify updateUser was called with both fields (validation layer handles null)
    const { updateUser } = await import('../me')
    expect(updateUser).toHaveBeenCalledWith(1, {
      firstName: 'Jane',
      lastName: null,
    })
  })

  it('should allow updating only lastName', async () => {
    await moduleMocker.mock('../me', () => ({
      getUser: mock(() => Promise.resolve(mockCurrentUser)),
      updateUser: mock(() => Promise.resolve(mockUpdatedUser)),
    }))

    const res = await app.request('/api/v1/protected/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({ lastName: 'Smith' }), // Only lastName
    })

    expect(res.status).toBe(StatusCodes.OK)

    const data = await res.json()
    expect(data.user.lastName).toBe('Smith')

    // Verify updateUser was called only with lastName
    const { updateUser } = await import('../me')
    expect(updateUser).toHaveBeenCalledWith(1, {
      lastName: 'Smith',
    })
  })

  it('should reject empty strings at validation level', async () => {
    const res = await app.request('/api/v1/protected/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({ firstName: '', lastName: 'Smith' }), // Empty string for firstName
    })

    expect(res.status).toBe(StatusCodes.BAD_REQUEST)

    const data = await res.json()
    expect(data.error).toBe('String must contain at least 2 character(s)')
  })

  it('should handle whitespace-only strings as empty', async () => {
    // Mock to simulate the actual implementation behavior
    const mockGetUser = mock(() => Promise.resolve(mockCurrentUser))
    const mockUpdateUser = mock((userId: number, updates: any) => {
      // Simulate prepareValidUpdates behavior
      const validUpdates: any = {}
      if (updates.firstName && updates.firstName.trim()) {
        validUpdates.firstName = updates.firstName.trim()
      }
      if (updates.lastName && updates.lastName.trim()) {
        validUpdates.lastName = updates.lastName.trim()
      }

      // If no valid updates, return current user
      if (Object.keys(validUpdates).length === 0) {
        return mockGetUser()
      }

      return Promise.resolve(mockUpdatedUser)
    })

    await moduleMocker.mock('../me', () => ({
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
    }))

    const res = await app.request('/api/v1/protected/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({ firstName: '   ', lastName: 'Smith' }), // Whitespace-only firstName
    })

    expect(res.status).toBe(StatusCodes.OK)

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
    await moduleMocker.mock('../me', () => ({
      getUser: mock(() => Promise.resolve(mockCurrentUser)),
      updateUser: mock(() => Promise.resolve(mockUpdatedUser)),
    }))

    const res = await app.request('/api/v1/protected/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify({ firstName: '  Jane  ', lastName: '  Smith  ' }), // Strings with extra spaces
    })

    expect(res.status).toBe(StatusCodes.OK)

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
