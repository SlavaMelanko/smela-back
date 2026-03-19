import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { Role, Status } from '@/types'

import { getUsersHandler } from '../handler'

describe('getUsersHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const DEFAULT_LIMIT = 25

  let mockContext: any
  let mockJson: any

  let mockUsers: User[]
  let mockSearchUsers: any

  beforeEach(async () => {
    mockUsers = [
      {
        id: testUuids.USER_1,
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
          roles: [Role.User],
          statuses: undefined,
          page: 1,
          limit: DEFAULT_LIMIT,
        })),
      },
      json: mockJson,
    }
    mockSearchUsers = mock(async () => ({
      data: { users: mockUsers },
      pagination: { page: 1, limit: DEFAULT_LIMIT, total: 1, totalPages: 1 },
    }))

    await moduleMocker.mock('@/use-cases/admin', () => ({ searchUsers: mockSearchUsers }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call searchUsers and return users with pagination and OK status', async () => {
    const result = await getUsersHandler(mockContext)

    expect(mockSearchUsers).toHaveBeenCalledWith(
      { search: undefined, roles: [Role.User], statuses: undefined },
      { page: 1, limit: DEFAULT_LIMIT },
    )
    expect(mockJson).toHaveBeenCalledWith(
      { users: mockUsers, pagination: { page: 1, limit: DEFAULT_LIMIT, total: 1, totalPages: 1 } },
      HttpStatus.OK,
    )
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when searchUsers throws', async () => {
    mockSearchUsers.mockImplementation(async () => {
      throw new Error('Database connection failed')
    })

    expect(getUsersHandler(mockContext)).rejects.toThrow('Database connection failed')
  })
})
