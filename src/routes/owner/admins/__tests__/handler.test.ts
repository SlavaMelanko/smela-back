import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { Resource, Role, Status } from '@/types'

import {
  createAdminHandler,
  getAdminDefaultPermissionsHandler,
  getAdminsHandler,
} from '../handler'

describe('getAdminDefaultPermissionsHandler', () => {
  let mockJson: ReturnType<typeof mock>
  let mockContext: { json: typeof mockJson }

  beforeEach(() => {
    mockJson = mock((data: unknown, status: number) => ({ data, status }))
    mockContext = { json: mockJson }
  })

  it('should return default admin permissions with OK status', () => {
    getAdminDefaultPermissionsHandler(mockContext as any, async () => {})

    expect(mockJson).toHaveBeenCalledWith(
      {
        permissions: {
          [Resource.Users]: { view: true, manage: true },
          [Resource.Teams]: { view: true, manage: true },
        },
      },
      HttpStatus.OK,
    )
  })
})

describe('getAdminsHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const DEFAULT_LIMIT = 25

  let mockContext: any
  let mockJson: any

  let mockAdmins: User[]
  let mockGetAdmins: any

  beforeEach(async () => {
    mockAdmins = [
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
    ]

    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: {
        valid: mock(() => ({ statuses: undefined, page: 1, limit: DEFAULT_LIMIT })),
      },
      json: mockJson,
    }
    mockGetAdmins = mock(async () => ({
      data: { users: mockAdmins },
      pagination: { page: 1, limit: DEFAULT_LIMIT, total: 1, totalPages: 1 },
    }))

    await moduleMocker.mock('@/use-cases/owner', () => ({ getAdmins: mockGetAdmins }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getAdmins and return admins with pagination and OK status', async () => {
    const result = await getAdminsHandler(mockContext)

    expect(mockGetAdmins).toHaveBeenCalledWith(
      { search: undefined, roles: [], statuses: undefined },
      { page: 1, limit: DEFAULT_LIMIT },
    )
    expect(mockJson).toHaveBeenCalledWith(
      { users: mockAdmins, pagination: { page: 1, limit: DEFAULT_LIMIT, total: 1, totalPages: 1 } },
      HttpStatus.OK,
    )
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when getAdmins throws', async () => {
    mockGetAdmins.mockImplementation(async () => {
      throw new Error('Database connection failed')
    })

    expect(getAdminsHandler(mockContext)).rejects.toThrow('Database connection failed')
  })
})

describe('createAdminHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockInviteAdmin: any

  const body = {
    firstName: 'New',
    lastName: 'Admin',
    email: 'newadmin@example.com',
    permissions: {},
  }

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))
    mockContext = {
      req: { valid: mock(() => body) },
      get: mock(() => ({ id: testUuids.OWNER_1 })),
      json: mockJson,
    }
    mockInviteAdmin = mock(async () => ({ admin: { id: testUuids.ADMIN_1, ...body } }))

    await moduleMocker.mock('@/use-cases/owner', () => ({ inviteAdmin: mockInviteAdmin }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call inviteAdmin and return created admin with CREATED status', async () => {
    const result = await createAdminHandler(mockContext)

    expect(mockInviteAdmin).toHaveBeenCalledWith(body, testUuids.OWNER_1)
    expect(mockJson).toHaveBeenCalledWith(
      { admin: { id: testUuids.ADMIN_1, ...body } },
      HttpStatus.CREATED,
    )
    expect(result.status).toBe(HttpStatus.CREATED)
  })

  it('should propagate error when inviteAdmin throws', async () => {
    mockInviteAdmin.mockImplementation(async () => {
      throw new Error('Email already in use')
    })

    expect(createAdminHandler(mockContext)).rejects.toThrow('Email already in use')
  })
})
