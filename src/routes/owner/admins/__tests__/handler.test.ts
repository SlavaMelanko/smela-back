import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { Role, Status } from '@/types'

import { getAdminHandler, getAdminsHandler, inviteAdminHandler, resendAdminInvitationHandler } from '../handler'

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
        valid: mock(() => ({ id: testUuids.ADMIN_1 })),
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

describe('inviteAdminHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any

  let mockAdmin: User
  let mockInviteAdmin: any

  const inviteAdminBody = {
    firstName: 'New',
    lastName: 'Admin',
    email: 'newadmin@example.com',
    permissions: {
      view: true,
      edit: true,
      create: false,
      delete: false,
    },
  }

  beforeEach(async () => {
    mockAdmin = {
      id: testUuids.ADMIN_1,
      firstName: 'New',
      lastName: 'Admin',
      email: 'newadmin@example.com',
      role: Role.Admin,
      status: Status.Pending,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockJson = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock(() => inviteAdminBody),
      },
      get: mock(() => ({ id: testUuids.OWNER_1 })),
      json: mockJson,
    }

    mockInviteAdmin = mock(async () => ({ admin: mockAdmin }))

    await moduleMocker.mock('@/use-cases/owner', () => ({
      inviteAdmin: mockInviteAdmin,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call inviteAdmin with correct body parameters', async () => {
    await inviteAdminHandler(mockContext)

    expect(mockInviteAdmin).toHaveBeenCalledWith(inviteAdminBody, testUuids.OWNER_1)
  })

  it('should return created admin with CREATED status', async () => {
    const result = await inviteAdminHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith({ admin: mockAdmin }, HttpStatus.CREATED)
    expect(result.status).toBe(HttpStatus.CREATED)
  })

  it('should propagate error when inviteAdmin throws', async () => {
    mockInviteAdmin.mockImplementation(async () => {
      throw new Error('Email already in use')
    })

    expect(inviteAdminHandler(mockContext)).rejects.toThrow('Email already in use')
  })
})

describe('resendAdminInvitationHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockResendAdminInvitation: any

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock(() => ({ id: testUuids.ADMIN_1 })),
      },
      json: mockJson,
    }

    mockResendAdminInvitation = mock(async () => ({ success: true }))

    await moduleMocker.mock('@/use-cases/owner', () => ({
      resendAdminInvitation: mockResendAdminInvitation,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should call resendAdminInvitation with correct admin id', async () => {
    await resendAdminInvitationHandler(mockContext)

    expect(mockResendAdminInvitation).toHaveBeenCalledWith(testUuids.ADMIN_1)
  })

  it('should return success with OK status', async () => {
    const result = await resendAdminInvitationHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith({ success: true }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when resendAdminInvitation throws', async () => {
    mockResendAdminInvitation.mockImplementation(async () => {
      throw new Error('Admin not found')
    })

    expect(resendAdminInvitationHandler(mockContext)).rejects.toThrow('Admin not found')
  })
})
