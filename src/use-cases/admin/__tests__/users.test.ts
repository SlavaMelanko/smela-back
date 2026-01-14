import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { SearchResult, User } from '@/data'

import { ModuleMocker } from '@/__tests__'
import AppError from '@/errors/app-error'
import ErrorCode from '@/errors/codes'
import { Role, Status } from '@/types'

import { getUser, searchUsers } from '../users'

describe('searchUsers', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const DEFAULT_PAGINATION = { page: 1, limit: 25 }

  let mockSearchResult: SearchResult
  let mockUserRepoSearch: any

  beforeEach(async () => {
    mockSearchResult = {
      users: [
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
      ],
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    }

    mockUserRepoSearch = mock(async () => mockSearchResult)

    await moduleMocker.mock('@/data', () => ({
      userRepo: { search: mockUserRepoSearch },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should filter out admin roles from search params', async () => {
    await searchUsers({ roles: [Role.Admin, Role.User, Role.Owner] }, DEFAULT_PAGINATION)

    expect(mockUserRepoSearch).toHaveBeenCalledWith(
      { roles: [Role.User] },
      DEFAULT_PAGINATION,
    )
  })

  it('should default to user roles when all roles are filtered out', async () => {
    await searchUsers({ roles: [Role.Admin, Role.Owner] }, DEFAULT_PAGINATION)

    expect(mockUserRepoSearch).toHaveBeenCalledWith(
      { roles: [Role.User, Role.Enterprise] },
      DEFAULT_PAGINATION,
    )
  })

  it('should return users and pagination data', async () => {
    const result = await searchUsers({ roles: [Role.User] }, DEFAULT_PAGINATION)

    expect(result).toEqual({
      data: {
        users: mockSearchResult.users,
        pagination: mockSearchResult.pagination,
      },
    })
  })

  it('should preserve statuses in search params', async () => {
    await searchUsers(
      { roles: [Role.User], statuses: [Status.Active, Status.Active] },
      DEFAULT_PAGINATION,
    )

    expect(mockUserRepoSearch).toHaveBeenCalledWith(
      { roles: [Role.User], statuses: [Status.Active, Status.Active] },
      DEFAULT_PAGINATION,
    )
  })
})

describe('getUser', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockUser: User
  let mockFindById: any

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

    mockFindById = mock(async () => mockUser)

    await moduleMocker.mock('@/data', () => ({
      userRepo: { findById: mockFindById },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should return user when found', async () => {
    const result = await getUser(1)

    expect(mockFindById).toHaveBeenCalledWith(1)
    expect(result).toEqual({ data: { user: mockUser } })
  })

  it('should throw NotFound error when user does not exist', async () => {
    mockFindById.mockImplementation(async () => undefined)

    expect(getUser(999)).rejects.toThrow(AppError)
    expect(getUser(999)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'User not found',
    })
  })
})
