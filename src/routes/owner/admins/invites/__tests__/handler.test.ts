import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { HttpStatus } from '@/net/http'
import { Role, Status } from '@/types'

import { createInvitationHandler, resendInvitationHandler } from '../handler'

describe('createInvitationHandler', () => {
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
    await createInvitationHandler(mockContext)

    expect(mockInviteAdmin).toHaveBeenCalledWith(inviteAdminBody, testUuids.OWNER_1)
  })

  it('should return created admin with CREATED status', async () => {
    const result = await createInvitationHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith({ admin: mockAdmin }, HttpStatus.CREATED)
    expect(result.status).toBe(HttpStatus.CREATED)
  })

  it('should propagate error when inviteAdmin throws', async () => {
    mockInviteAdmin.mockImplementation(async () => {
      throw new Error('Email already in use')
    })

    expect(createInvitationHandler(mockContext)).rejects.toThrow('Email already in use')
  })
})

describe('resendInvitationHandler', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockContext: any
  let mockJson: any
  let mockResendAdminInvitation: any

  beforeEach(async () => {
    mockJson = mock((data: any, status: number) => ({ data, status }))

    mockContext = {
      req: {
        valid: mock(() => ({ adminId: testUuids.ADMIN_1 })),
      },
      get: mock(() => ({ id: testUuids.OWNER_1 })),
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

  it('should call resendAdminInvitation with admin id and inviter id', async () => {
    await resendInvitationHandler(mockContext)

    expect(mockResendAdminInvitation).toHaveBeenCalledWith(testUuids.ADMIN_1, testUuids.OWNER_1)
  })

  it('should return success with OK status', async () => {
    const result = await resendInvitationHandler(mockContext)

    expect(mockJson).toHaveBeenCalledWith({ success: true }, HttpStatus.OK)
    expect(result.status).toBe(HttpStatus.OK)
  })

  it('should propagate error when resendAdminInvitation throws', async () => {
    mockResendAdminInvitation.mockImplementation(async () => {
      throw new Error('Admin not found')
    })

    expect(resendInvitationHandler(mockContext)).rejects.toThrow('Admin not found')
  })
})
