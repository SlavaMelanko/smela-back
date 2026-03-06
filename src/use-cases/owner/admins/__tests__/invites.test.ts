import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { User } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import AppError from '@/errors/app-error'
import ErrorCode from '@/errors/codes'
import { Role, Status } from '@/types'

import { cancelAdminInvite, inviteAdmin, resendAdminInvite } from '../invites'

describe('inviteAdmin', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockAdmin: User
  let mockFindByEmail: any
  let mockUserCreate: any
  let mockUserFindById: any
  let mockUserRoleAssign: any
  let mockAuthCreate: any
  let mockTokenIssue: any
  let mockRbacSet: any
  let mockTransaction: any
  let mockSendUserInvitationEmail: any

  const inviteAdminParams = {
    firstName: 'New',
    lastName: 'Admin',
    email: 'newadmin@example.com',
    permissions: {
      users: { view: true, manage: false },
      admins: { view: true, manage: false },
      teams: { view: false, manage: false },
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

    mockFindByEmail = mock(async () => undefined)
    mockUserCreate = mock(async () => mockAdmin)
    mockUserFindById = mock(async () => mockAdmin)
    mockUserRoleAssign = mock(async () => ({}))
    mockAuthCreate = mock(async () => ({}))
    mockTokenIssue = mock(async () => ({}))
    mockRbacSet = mock(async () => {})
    mockSendUserInvitationEmail = mock(async () => {})

    // eslint-disable-next-line ts/no-unsafe-return
    mockTransaction = mock(async (callback: any) => callback({}))

    await moduleMocker.mock('@/data', () => ({
      userRepo: {
        findByEmail: mockFindByEmail,
        findById: mockUserFindById,
        create: mockUserCreate,
      },
      rbacRepo: {
        assignRole: mockUserRoleAssign,
        setUserPermissions: mockRbacSet,
      },
      authRepo: { create: mockAuthCreate },
      tokenRepo: { issue: mockTokenIssue },
      db: { transaction: mockTransaction },
    }))

    await moduleMocker.mock('@/crypto', () => ({
      createRandomBytesGenerator: () => ({
        generate: () => 'random-placeholder-password',
      }),
    }))

    await moduleMocker.mock('@/security/password', () => ({
      hashPassword: async () => 'hashed-placeholder',
    }))

    await moduleMocker.mock('@/security/token', () => ({
      generateToken: () => ({
        type: 'user_invite',
        token: 'invitation-token-123',
        expiresAt: new Date('2024-01-08'),
      }),
      TokenType: { UserInvite: 'user_invite' },
    }))

    await moduleMocker.mock('@/services/email', () => ({
      emailAgent: {
        sendUserInvitationEmail: mockSendUserInvitationEmail,
      },
    }))

    await moduleMocker.mock('@/env', () => ({
      default: { COMPANY_NAME: 'Test Company' },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should throw EmailAlreadyInUse when email exists', async () => {
    mockFindByEmail.mockImplementation(async () => mockAdmin)

    expect(inviteAdmin(inviteAdminParams, testUuids.OWNER_1)).rejects.toThrow(AppError)
    expect(inviteAdmin(inviteAdminParams, testUuids.OWNER_1)).rejects.toMatchObject({
      code: ErrorCode.EmailAlreadyInUse,
    })
  })

  it('should create admin with pending status and return admin data', async () => {
    const result = await inviteAdmin(inviteAdminParams, testUuids.OWNER_1)

    expect(mockUserCreate).toHaveBeenCalledWith(
      {
        firstName: 'New',
        lastName: 'Admin',
        email: 'newadmin@example.com',
        status: Status.Pending,
      },
      expect.anything(),
    )
    expect(mockUserRoleAssign).toHaveBeenCalledWith(
      {
        userId: mockAdmin.id,
        role: Role.Admin,
        invitedBy: testUuids.OWNER_1,
      },
      expect.anything(),
    )
    expect(result).toEqual({ admin: mockAdmin })
  })

  it('should call email agent with correct parameters', async () => {
    await inviteAdmin(inviteAdminParams, testUuids.OWNER_1)

    expect(mockSendUserInvitationEmail).toHaveBeenCalledWith(
      'New',
      'newadmin@example.com',
      'invitation-token-123',
      'New',
      'Test Company',
    )
  })
})

describe('resendAdminInvite', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockAdmin: User
  let mockInviter: User
  let mockFindById: any
  let mockTokenIssue: any
  let mockTransaction: any
  let mockSendUserInvitationEmail: any

  beforeEach(async () => {
    mockAdmin = {
      id: testUuids.ADMIN_1,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: Role.Admin,
      status: Status.Pending,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockInviter = {
      id: testUuids.OWNER_1,
      firstName: 'Owner',
      lastName: 'User',
      email: 'owner@example.com',
      role: Role.Owner,
      status: Status.Active,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockFindById = mock(async (id: string) => {
      if (id === testUuids.ADMIN_1) {
        return mockAdmin
      }
      if (id === testUuids.OWNER_1) {
        return mockInviter
      }

      return undefined
    })
    mockTokenIssue = mock(async () => ({}))
    mockSendUserInvitationEmail = mock(async () => {})

    // eslint-disable-next-line ts/no-unsafe-return
    mockTransaction = mock(async (callback: any) => callback({}))

    await moduleMocker.mock('@/data', () => ({
      userRepo: { findById: mockFindById },
      tokenRepo: { issue: mockTokenIssue },
      db: { transaction: mockTransaction },
    }))

    await moduleMocker.mock('@/security/token', () => ({
      generateToken: () => ({
        type: 'user_invite',
        token: 'new-invitation-token',
        expiresAt: new Date('2024-01-08'),
      }),
      TokenType: { UserInvite: 'user_invite' },
    }))

    await moduleMocker.mock('@/services/email', () => ({
      emailAgent: {
        sendUserInvitationEmail: mockSendUserInvitationEmail,
      },
    }))

    await moduleMocker.mock('@/env', () => ({
      default: { COMPANY_NAME: 'Test Company' },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should throw NotFound when admin does not exist', async () => {
    mockFindById.mockImplementation(async (id: string) => {
      if (id === testUuids.OWNER_1) {
        return mockInviter
      }

      return undefined
    })

    expect(resendAdminInvite(
      testUuids.NON_EXISTENT,
      testUuids.OWNER_1,
    )).rejects.toThrow(AppError)
    expect(resendAdminInvite(
      testUuids.NON_EXISTENT,
      testUuids.OWNER_1,
    )).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Admin not found',
    })
  })

  it('should throw NotFound when user is not Admin role', async () => {
    mockFindById.mockImplementation(async (id: string) => {
      if (id === testUuids.ADMIN_1) {
        return { ...mockAdmin, role: Role.User }
      }
      if (id === testUuids.OWNER_1) {
        return mockInviter
      }

      return undefined
    })

    expect(resendAdminInvite(testUuids.ADMIN_1, testUuids.OWNER_1)).rejects.toThrow(AppError)
    expect(resendAdminInvite(testUuids.ADMIN_1, testUuids.OWNER_1)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Admin not found',
    })
  })

  it('should throw BadRequest when admin has already accepted invitation', async () => {
    mockFindById.mockImplementation(async (id: string) => {
      if (id === testUuids.ADMIN_1) {
        return { ...mockAdmin, status: Status.Active }
      }
      if (id === testUuids.OWNER_1) {
        return mockInviter
      }

      return undefined
    })

    expect(resendAdminInvite(testUuids.ADMIN_1, testUuids.OWNER_1)).rejects.toThrow(AppError)
    expect(resendAdminInvite(testUuids.ADMIN_1, testUuids.OWNER_1)).rejects.toMatchObject({
      code: ErrorCode.BadRequest,
      message: 'Admin has already accepted invitation',
    })
  })

  it('should throw NotFound when inviter does not exist', async () => {
    mockFindById.mockImplementation(async (id: string) => {
      if (id === testUuids.ADMIN_1) {
        return mockAdmin
      }

      return undefined
    })

    expect(resendAdminInvite(
      testUuids.ADMIN_1,
      testUuids.NON_EXISTENT,
    )).rejects.toThrow(AppError)
    expect(resendAdminInvite(
      testUuids.ADMIN_1,
      testUuids.NON_EXISTENT,
    )).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Inviter not found',
    })
  })

  it('should issue new token and send invitation email with current inviter name', async () => {
    const result = await resendAdminInvite(testUuids.ADMIN_1, testUuids.OWNER_1)

    expect(mockTokenIssue).toHaveBeenCalledWith(
      testUuids.ADMIN_1,
      {
        userId: testUuids.ADMIN_1,
        type: 'user_invite',
        token: 'new-invitation-token',
        expiresAt: expect.any(Date),
      },
      expect.anything(),
    )
    expect(mockSendUserInvitationEmail).toHaveBeenCalledWith(
      'Admin',
      'admin@example.com',
      'new-invitation-token',
      'Owner',
      'Test Company',
    )
    expect(result).toEqual({ success: true })
  })
})

describe('cancelAdminInvite', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockAdmin: User
  let mockFindById: any
  let mockTokenDeprecate: any
  let mockUserUpdate: any
  let mockTransaction: any

  beforeEach(async () => {
    mockAdmin = {
      id: testUuids.ADMIN_1,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: Role.Admin,
      status: Status.Pending,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockFindById = mock(async () => mockAdmin)
    mockTokenDeprecate = mock(async () => {})
    mockUserUpdate = mock(async () => ({ ...mockAdmin, status: Status.Archived }))

    // eslint-disable-next-line ts/no-unsafe-return
    mockTransaction = mock(async (callback: any) => callback({}))

    await moduleMocker.mock('@/data', () => ({
      userRepo: { findById: mockFindById, update: mockUserUpdate },
      tokenRepo: { deprecate: mockTokenDeprecate },
      db: { transaction: mockTransaction },
    }))

    await moduleMocker.mock('@/security/token', () => ({
      TokenType: { UserInvite: 'user_invite' },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should throw NotFound when admin does not exist', async () => {
    mockFindById.mockImplementation(async () => undefined)

    expect(cancelAdminInvite(testUuids.NON_EXISTENT)).rejects.toThrow(AppError)
    expect(cancelAdminInvite(testUuids.NON_EXISTENT)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Admin not found',
    })
  })

  it('should throw NotFound when user is not Admin role', async () => {
    mockFindById.mockImplementation(async () => ({ ...mockAdmin, role: Role.User }))

    expect(cancelAdminInvite(testUuids.ADMIN_1)).rejects.toThrow(AppError)
    expect(cancelAdminInvite(testUuids.ADMIN_1)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Admin not found',
    })
  })

  it('should throw BadRequest when admin has already accepted invitation', async () => {
    mockFindById.mockImplementation(async () => ({ ...mockAdmin, status: Status.Active }))

    expect(cancelAdminInvite(testUuids.ADMIN_1)).rejects.toThrow(AppError)
    expect(cancelAdminInvite(testUuids.ADMIN_1)).rejects.toMatchObject({
      code: ErrorCode.BadRequest,
      message: 'Admin has already accepted invitation',
    })
  })

  it('should deprecate token and archive user in a transaction', async () => {
    const result = await cancelAdminInvite(testUuids.ADMIN_1)

    expect(mockTokenDeprecate).toHaveBeenCalledWith(testUuids.ADMIN_1, 'user_invite', expect.anything())
    expect(mockUserUpdate).toHaveBeenCalledWith(
      testUuids.ADMIN_1,
      { status: Status.Archived },
      expect.anything(),
    )
    expect(result).toEqual({ success: true })
  })
})
