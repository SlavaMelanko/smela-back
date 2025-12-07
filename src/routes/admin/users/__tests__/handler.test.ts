import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { SearchResult, User } from '@/data'

import { ModuleMocker } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { Role, Status } from '@/types'

import { adminUserDetailHandler, adminUsersHandler } from '../handler'

describe('adminUsersHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const DEFAULT_LIMIT = 25

  let mockContext: any
  let mockJson: any

  let mockUsers: User[]
  let mockSearchUsers: any

  beforeEach(async () => {
    mockUsers = [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: Role.User,
        status: Status.Active,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ]

    mockJson = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock(() => ({
          roles: [Role.User, Role.Enterprise],
          statuses: undefined,
          page: 1,
          limit: DEFAULT_LIMIT,
        })),
      },
      json: mockJson,
    }

    mockSearchUsers = mock(async (): Promise<{ data: SearchResult }> => ({
      data: {
        users: mockUsers,
        pagination: {
          page: 1,
          limit: DEFAULT_LIMIT,
          total: 1,
          totalPages: 1,
        },
      },
    }))

    await moduleMocker.mock('@/use-cases/admin', () => ({
      searchUsers: mockSearchUsers,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call searchUsers with correct parameters', async () => {
    await adminUsersHandler(mockContext)

    expect(mockSearchUsers).toHaveBeenCalledWith(
      { roles: [Role.User, Role.Enterprise], statuses: undefined },
      { page: 1, limit: DEFAULT_LIMIT },
    )
  })

  it('should return users and pagination with OK status', async () => {
    const result = await adminUsersHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith(
      {
        users: mockUsers,
        pagination: {
          page: 1,
          limit: DEFAULT_LIMIT,
          total: 1,
          totalPages: 1,
        },
      },
      HttpStatus.OK,
    )
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when searchUsers throws', async () => {
    mockSearchUsers.mockImplementation(async () => {
      throw new Error('Database connection failed')
    })

    expect(adminUsersHandler(mockContext)).rejects.toThrow('Database connection failed')
  })
})

describe('adminUserDetailHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any

  let mockUser: User
  let mockGetUser: any

  beforeEach(async () => {
    mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: Role.User,
      status: Status.Active,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockJson = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock(() => ({ id: 1 })),
      },
      json: mockJson,
    }

    mockGetUser = mock(async () => ({ data: mockUser }))

    await moduleMocker.mock('@/use-cases/admin', () => ({
      getUser: mockGetUser,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getUser with correct user id', async () => {
    await adminUserDetailHandler(mockContext)

    expect(mockGetUser).toHaveBeenCalledWith(1)
  })

  it('should return user with OK status', async () => {
    const result = await adminUserDetailHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith(mockUser, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when getUser throws', async () => {
    mockGetUser.mockImplementation(async () => {
      throw new Error('User not found')
    })

    expect(adminUserDetailHandler(mockContext)).rejects.toThrow('User not found')
  })
})
