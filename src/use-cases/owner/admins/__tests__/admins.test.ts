import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { SearchResult, User } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import AppError from '@/errors/app-error'
import ErrorCode from '@/errors/codes'
import { Role, Status } from '@/types'

import { getAdmin, getAdmins } from '..'

describe('getAdmins', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const DEFAULT_PAGINATION = { page: 1, limit: 25 }

  let mockSearchResult: SearchResult
  let mockUserRepoSearch: any
  let mockFindInvites: any

  beforeEach(async () => {
    mockSearchResult = {
      users: [
        {
          id: testUuids.ADMIN_1,
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
    mockFindInvites = mock(async () => new Map())

    await moduleMocker.mock('@/data', () => ({
      userRepo: { search: mockUserRepoSearch },
      rbacRepo: { findInviters: mockFindInvites },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should always search with Admin role only', async () => {
    await getAdmins({ roles: [Role.User] }, DEFAULT_PAGINATION)

    expect(mockUserRepoSearch).toHaveBeenCalledWith(
      { roles: [Role.Admin] },
      DEFAULT_PAGINATION,
    )
  })

  it('should return admins and pagination data', async () => {
    const result = await getAdmins({ roles: [] }, DEFAULT_PAGINATION)

    expect(result).toEqual({
      data: {
        admins: mockSearchResult.users.map(u => ({ ...u, inviter: undefined })),
      },
      pagination: mockSearchResult.pagination,
    })
  })

  it('should preserve statuses in search params', async () => {
    await getAdmins(
      { roles: [], statuses: [Status.Active] },
      DEFAULT_PAGINATION,
    )

    expect(mockUserRepoSearch).toHaveBeenCalledWith(
      { roles: [Role.Admin], statuses: [Status.Active] },
      DEFAULT_PAGINATION,
    )
  })

  it('should include invite info when available', async () => {
    const inviteInfo = {
      id: testUuids.OWNER_1,
      firstName: 'Owner',
      lastName: 'User',
    }
    mockFindInvites.mockImplementation(
      async () => new Map([[testUuids.ADMIN_1, inviteInfo]]),
    )

    const result = await getAdmins({ roles: [] }, DEFAULT_PAGINATION)

    expect(mockFindInvites).toHaveBeenCalledWith([testUuids.ADMIN_1])
    expect(result.data.admins[0].inviter).toEqual(inviteInfo)
  })
})

describe('getAdmin', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockAdmin: User
  let mockFindByIdExtended: any
  let mockFindInvites: any

  beforeEach(async () => {
    mockAdmin = {
      id: testUuids.ADMIN_1,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: Role.Admin,
      status: Status.Active,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockFindByIdExtended = mock(async () => mockAdmin)
    mockFindInvites = mock(async () => new Map())

    await moduleMocker.mock('@/data', () => ({
      userRepo: { findByIdExtended: mockFindByIdExtended },
      rbacRepo: { findInviters: mockFindInvites },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should return admin when found', async () => {
    const result = await getAdmin(testUuids.ADMIN_1)

    expect(mockFindByIdExtended).toHaveBeenCalledWith(testUuids.ADMIN_1)
    expect(result).toEqual({ admin: { ...mockAdmin, inviter: undefined } })
  })

  it('should include invite info when available', async () => {
    const inviteInfo = {
      id: testUuids.OWNER_1,
      firstName: 'Owner',
      lastName: 'User',
    }
    mockFindInvites.mockImplementation(
      async () => new Map([[testUuids.ADMIN_1, inviteInfo]]),
    )

    const result = await getAdmin(testUuids.ADMIN_1)

    expect(mockFindInvites).toHaveBeenCalledWith([testUuids.ADMIN_1])
    expect(result.admin.inviter).toEqual(inviteInfo)
  })

  it('should throw NotFound error when admin does not exist', async () => {
    mockFindByIdExtended.mockImplementation(async () => undefined)

    expect(getAdmin(testUuids.NON_EXISTENT)).rejects.toThrow(AppError)
    expect(getAdmin(testUuids.NON_EXISTENT)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Admin not found',
    })
  })

  it('should throw NotFound error when user is not an Admin role', async () => {
    mockFindByIdExtended.mockImplementation(async () => ({
      ...mockAdmin,
      role: Role.User,
    }))

    expect(getAdmin(testUuids.ADMIN_1)).rejects.toThrow(AppError)
    expect(getAdmin(testUuids.ADMIN_1)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Admin not found',
    })
  })

  it('should throw NotFound error when user is Owner role', async () => {
    mockFindByIdExtended.mockImplementation(async () => ({
      ...mockAdmin,
      role: Role.Owner,
    }))

    expect(getAdmin(testUuids.ADMIN_1)).rejects.toThrow(AppError)
    expect(getAdmin(testUuids.ADMIN_1)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Admin not found',
    })
  })
})
