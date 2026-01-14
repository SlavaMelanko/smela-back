import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { SearchResult, User } from '@/data'

import { ModuleMocker } from '@/__tests__'
import AppError from '@/errors/app-error'
import ErrorCode from '@/errors/codes'
import { Role, Status } from '@/types'

import { getAdmin, searchAdmins } from '../admins'

describe('searchAdmins', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const DEFAULT_PAGINATION = { page: 1, limit: 25 }

  let mockSearchResult: SearchResult
  let mockUserRepoSearch: any

  beforeEach(async () => {
    mockSearchResult = {
      users: [
        {
          id: 1,
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          role: Role.Admin,
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

  it('should always search with Admin role only', async () => {
    await searchAdmins({ roles: [Role.User, Role.Enterprise] }, DEFAULT_PAGINATION)

    expect(mockUserRepoSearch).toHaveBeenCalledWith(
      { roles: [Role.Admin] },
      DEFAULT_PAGINATION,
    )
  })

  it('should return admins and pagination data', async () => {
    const result = await searchAdmins({ roles: [] }, DEFAULT_PAGINATION)

    expect(result).toEqual({
      data: { users: mockSearchResult.users },
      pagination: mockSearchResult.pagination,
    })
  })

  it('should preserve statuses in search params', async () => {
    await searchAdmins(
      { roles: [], statuses: [Status.Active] },
      DEFAULT_PAGINATION,
    )

    expect(mockUserRepoSearch).toHaveBeenCalledWith(
      { roles: [Role.Admin], statuses: [Status.Active] },
      DEFAULT_PAGINATION,
    )
  })
})

describe('getAdmin', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockAdmin: User
  let mockFindById: any

  beforeEach(async () => {
    mockAdmin = {
      id: 1,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: Role.Admin,
      status: Status.Active,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockFindById = mock(async () => mockAdmin)

    await moduleMocker.mock('@/data', () => ({
      userRepo: { findById: mockFindById },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should return admin when found', async () => {
    const result = await getAdmin(1)

    expect(mockFindById).toHaveBeenCalledWith(1)
    expect(result).toEqual({ data: { user: mockAdmin } })
  })

  it('should throw NotFound error when admin does not exist', async () => {
    mockFindById.mockImplementation(async () => undefined)

    expect(getAdmin(999)).rejects.toThrow(AppError)
    expect(getAdmin(999)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Admin not found',
    })
  })

  it('should throw NotFound error when user is not an Admin role', async () => {
    mockFindById.mockImplementation(async () => ({
      ...mockAdmin,
      role: Role.User,
    }))

    expect(getAdmin(1)).rejects.toThrow(AppError)
    expect(getAdmin(1)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Admin not found',
    })
  })

  it('should throw NotFound error when user is Owner role', async () => {
    mockFindById.mockImplementation(async () => ({
      ...mockAdmin,
      role: Role.Owner,
    }))

    expect(getAdmin(1)).rejects.toThrow(AppError)
    expect(getAdmin(1)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Admin not found',
    })
  })
})
