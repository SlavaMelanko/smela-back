import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { Resource, Role, Status } from '@/types'

import { getAdminHandler, updateAdminHandler } from '../$id/handler'
import { getAdminDefaultPermissionsHandler, getAdminsHandler } from '../handler'

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

describe('ownerGetAdminsHandler', () => {
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
        valid: mock(() => ({
          statuses: undefined,
          page: 1,
          limit: DEFAULT_LIMIT,
        })),
      },
      json: mockJson,
    }

    mockGetAdmins = mock(async () => ({
      data: { users: mockAdmins },
      pagination: {
        page: 1,
        limit: DEFAULT_LIMIT,
        total: 1,
        totalPages: 1,
      },
    }))

    await moduleMocker.mock('@/use-cases/owner', () => ({
      getAdmins: mockGetAdmins,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getAdmins with correct parameters', async () => {
    await getAdminsHandler(mockContext)

    expect(mockGetAdmins).toHaveBeenCalledWith(
      { search: undefined, roles: [], statuses: undefined },
      { page: 1, limit: DEFAULT_LIMIT },
    )
  })

  it('should return admins and pagination with OK status', async () => {
    const result = await getAdminsHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith(
      {
        users: mockAdmins,
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

  it('should propagate error when getAdmins throws', async () => {
    mockGetAdmins.mockImplementation(async () => {
      throw new Error('Database connection failed')
    })

    expect(getAdminsHandler(mockContext)).rejects.toThrow('Database connection failed')
  })
})

describe('ownerGetAdminHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any

  let mockAdmin: User
  let mockGetAdmin: any

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

    mockJson = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock(() => ({ adminId: testUuids.ADMIN_1 })),
      },
      json: mockJson,
    }

    mockGetAdmin = mock(async () => ({ admin: mockAdmin }))

    await moduleMocker.mock('@/use-cases/owner', () => ({
      getAdmin: mockGetAdmin,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call getAdmin with correct admin id', async () => {
    await getAdminHandler(mockContext)

    expect(mockGetAdmin).toHaveBeenCalledWith(testUuids.ADMIN_1)
  })

  it('should return admin with OK status', async () => {
    const result = await getAdminHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith({ admin: mockAdmin }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when getAdmin throws', async () => {
    mockGetAdmin.mockImplementation(async () => {
      throw new Error('Admin not found')
    })

    expect(getAdminHandler(mockContext)).rejects.toThrow('Admin not found')
  })
})

describe('ownerUpdateAdminHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any

  let mockAdmin: User
  let mockUpdateAdmin: any

  beforeEach(async () => {
    mockAdmin = {
      id: testUuids.ADMIN_1,
      firstName: 'Updated',
      lastName: 'Name',
      email: 'admin@example.com',
      role: Role.Admin,
      status: Status.Active,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    }

    mockJson = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock((type: string) => {
          if (type === 'param') {
            return { adminId: testUuids.ADMIN_1 }
          }

          return { firstName: 'Updated', lastName: 'Name' }
        }),
      },
      json: mockJson,
    }

    mockUpdateAdmin = mock(async () => ({ admin: mockAdmin }))

    await moduleMocker.mock('@/use-cases/owner', () => ({
      updateAdmin: mockUpdateAdmin,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call updateAdmin with correct params and body', async () => {
    await updateAdminHandler(mockContext)

    expect(mockUpdateAdmin).toHaveBeenCalledWith(
      testUuids.ADMIN_1,
      { firstName: 'Updated', lastName: 'Name' },
    )
  })

  it('should return updated admin with OK status', async () => {
    const result = await updateAdminHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith({ admin: mockAdmin }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when updateAdmin throws', async () => {
    mockUpdateAdmin.mockImplementation(async () => {
      throw new Error('Admin not found')
    })

    expect(updateAdminHandler(mockContext)).rejects.toThrow('Admin not found')
  })
})
