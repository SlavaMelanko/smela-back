import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { SearchResult, User } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import AppError from '@/errors/app-error'
import ErrorCode from '@/errors/codes'
import { Role, Status } from '@/types'

import { getAdmin, getAdmins, inviteAdmin, resendAdminInvitation } from '../admins'

describe('getAdmins', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const DEFAULT_PAGINATION = { page: 1, limit: 25 }

  let mockSearchResult: SearchResult
  let mockUserRepoSearch: any

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

    await moduleMocker.mock('@/data', () => ({
      userRepo: { search: mockUserRepoSearch },
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
      data: { admins: mockSearchResult.users },
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
})

describe('getAdmin', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockAdmin: User
  let mockFindById: any

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

    mockFindById = mock(async () => mockAdmin)

    await moduleMocker.mock('@/data', () => ({
      userRepo: { findById: mockFindById },
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should return admin when found', async () => {
    const result = await getAdmin(testUuids.ADMIN_1)

    expect(mockFindById).toHaveBeenCalledWith(testUuids.ADMIN_1)
    expect(result).toEqual({ admin: mockAdmin })
  })

  it('should throw NotFound error when admin does not exist', async () => {
    mockFindById.mockImplementation(async () => undefined)

    expect(getAdmin(testUuids.NON_EXISTENT)).rejects.toThrow(AppError)
    expect(getAdmin(testUuids.NON_EXISTENT)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Admin not found',
    })
  })

  it('should throw NotFound error when user is not an Admin role', async () => {
    mockFindById.mockImplementation(async () => ({
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
    mockFindById.mockImplementation(async () => ({
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

describe('inviteAdmin', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockAdmin: User
  let mockFindByEmail: any
  let mockUserCreate: any
  let mockAuthCreate: any
  let mockTokenIssue: any
  let mockTransaction: any
  let mockSendUserInvitationEmail: any

  const inviteAdminParams = {
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

    mockFindByEmail = mock(async () => undefined)
    mockUserCreate = mock(async () => mockAdmin)
    mockAuthCreate = mock(async () => ({}))
    mockTokenIssue = mock(async () => ({}))
    mockSendUserInvitationEmail = mock(async () => {})

    // eslint-disable-next-line ts/no-unsafe-return
    mockTransaction = mock(async (callback: any) => callback({}))

    await moduleMocker.mock('@/data', () => ({
      userRepo: {
        findByEmail: mockFindByEmail,
        create: mockUserCreate,
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
        type: 'user_invitation',
        token: 'invitation-token-123',
        expiresAt: new Date('2024-01-08'),
      }),
      TokenType: { UserInvitation: 'user_invitation' },
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

    expect(inviteAdmin(inviteAdminParams)).rejects.toThrow(AppError)
    expect(inviteAdmin(inviteAdminParams)).rejects.toMatchObject({
      code: ErrorCode.EmailAlreadyInUse,
    })
  })

  it('should create admin with pending status and return admin data', async () => {
    const result = await inviteAdmin(inviteAdminParams)

    expect(mockUserCreate).toHaveBeenCalledWith(
      {
        firstName: 'New',
        lastName: 'Admin',
        email: 'newadmin@example.com',
        role: Role.Admin,
        status: Status.Pending,
      },
      expect.anything(),
    )
    expect(result).toEqual({ admin: mockAdmin })
  })

  it('should call email agent with correct parameters', async () => {
    await inviteAdmin(inviteAdminParams)

    expect(mockSendUserInvitationEmail).toHaveBeenCalledWith(
      'New',
      'newadmin@example.com',
      'invitation-token-123',
      'Test Company',
    )
  })
})

describe('resendAdminInvitation', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockAdmin: User
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

    mockFindById = mock(async () => mockAdmin)
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
        type: 'user_invitation',
        token: 'new-invitation-token',
        expiresAt: new Date('2024-01-08'),
      }),
      TokenType: { UserInvitation: 'user_invitation' },
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
    mockFindById.mockImplementation(async () => undefined)

    expect(resendAdminInvitation(testUuids.NON_EXISTENT)).rejects.toThrow(AppError)
    expect(resendAdminInvitation(testUuids.NON_EXISTENT)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Admin not found',
    })
  })

  it('should throw NotFound when user is not Admin role', async () => {
    mockFindById.mockImplementation(async () => ({
      ...mockAdmin,
      role: Role.User,
    }))

    expect(resendAdminInvitation(testUuids.ADMIN_1)).rejects.toThrow(AppError)
    expect(resendAdminInvitation(testUuids.ADMIN_1)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Admin not found',
    })
  })

  it('should throw BadRequest when admin has already accepted invitation', async () => {
    mockFindById.mockImplementation(async () => ({
      ...mockAdmin,
      status: Status.Active,
    }))

    expect(resendAdminInvitation(testUuids.ADMIN_1)).rejects.toThrow(AppError)
    expect(resendAdminInvitation(testUuids.ADMIN_1)).rejects.toMatchObject({
      code: ErrorCode.BadRequest,
      message: 'Admin has already accepted invitation',
    })
  })

  it('should issue new token and send invitation email', async () => {
    const result = await resendAdminInvitation(testUuids.ADMIN_1)

    expect(mockTokenIssue).toHaveBeenCalledWith(
      testUuids.ADMIN_1,
      {
        userId: testUuids.ADMIN_1,
        type: 'user_invitation',
        token: 'new-invitation-token',
        expiresAt: expect.any(Date),
      },
      expect.anything(),
    )
    expect(mockSendUserInvitationEmail).toHaveBeenCalledWith(
      'Admin',
      'admin@example.com',
      'new-invitation-token',
      'Test Company',
    )
    expect(result).toEqual({ success: true })
  })
})
