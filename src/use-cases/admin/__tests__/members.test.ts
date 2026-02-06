import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { Company, User, UserCompany } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import AppError from '@/errors/app-error'
import ErrorCode from '@/errors/codes'
import { Role, Status } from '@/types'

import { inviteMember, resendMemberInvitation } from '../members'

const { COMPANY_1, USER_1, USER_2 } = testUuids

describe('inviteMember', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockCompany: Company
  let mockCompanyRepoFindById: any
  let mockUserRepoFindByEmail: any
  let mockUserRepoCreate: any
  let mockAuthRepoCreate: any
  let mockCompanyRepoAddUser: any
  let mockTokenRepoIssue: any
  let mockTransaction: any
  let mockEmailAgent: any

  const inviteParams = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    position: 'Developer',
  }

  beforeEach(async () => {
    mockCompany = {
      id: COMPANY_1,
      name: 'Acme Corp',
      website: 'https://acme.com',
      description: 'A test company',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockCompanyRepoFindById = mock(async () => mockCompany)
    mockUserRepoFindByEmail = mock(async () => undefined)
    mockUserRepoCreate = mock(async () => ({
      id: USER_1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: Status.Pending,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }))
    mockAuthRepoCreate = mock(async () => {})
    mockCompanyRepoAddUser = mock(async () => {})
    mockTokenRepoIssue = mock(async () => {})
    mockTransaction = mock(async <T>(callback: (tx: unknown) => Promise<T>): Promise<T> => {
      return callback({})
    })
    mockEmailAgent = {
      sendUserInvitationEmail: mock(async () => {}),
    }

    await moduleMocker.mock('@/data', () => ({
      companyRepo: {
        findById: mockCompanyRepoFindById,
        addUser: mockCompanyRepoAddUser,
      },
      userRepo: {
        findByEmail: mockUserRepoFindByEmail,
        create: mockUserRepoCreate,
      },
      authRepo: { create: mockAuthRepoCreate },
      tokenRepo: { issue: mockTokenRepoIssue },
      db: { transaction: mockTransaction },
    }))

    await moduleMocker.mock('@/security/password', () => ({
      generatePasswordHash: mock(async () => 'hashed-password'),
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
      emailAgent: mockEmailAgent,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should throw NotFound when company does not exist', async () => {
    mockCompanyRepoFindById.mockImplementation(async () => undefined)

    expect(inviteMember(COMPANY_1, inviteParams, USER_2)).rejects.toThrow(AppError)
    expect(inviteMember(COMPANY_1, inviteParams, USER_2)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Company not found',
    })
  })

  it('should throw EmailAlreadyInUse when user email already exists', async () => {
    mockUserRepoFindByEmail.mockImplementation(async () => ({
      id: 'existing-user',
      email: 'john@example.com',
    }))

    expect(inviteMember(COMPANY_1, inviteParams, USER_2)).rejects.toThrow(AppError)
    expect(inviteMember(COMPANY_1, inviteParams, USER_2)).rejects.toMatchObject({
      code: ErrorCode.EmailAlreadyInUse,
    })
  })

  it('should create user with pending status', async () => {
    await inviteMember(COMPANY_1, inviteParams, USER_2)

    expect(mockUserRepoCreate).toHaveBeenCalledWith(
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: Status.Pending,
      },
      expect.anything(),
    )
  })

  it('should add user to company with invitedBy', async () => {
    await inviteMember(COMPANY_1, inviteParams, USER_2)

    expect(mockCompanyRepoAddUser).toHaveBeenCalledWith(
      {
        userId: USER_1,
        companyId: COMPANY_1,
        position: 'Developer',
        invitedBy: USER_2,
      },
      expect.anything(),
    )
  })

  it('should send invitation email', async () => {
    await inviteMember(COMPANY_1, inviteParams, USER_2)

    expect(mockEmailAgent.sendUserInvitationEmail).toHaveBeenCalledWith(
      'John',
      'john@example.com',
      'invitation-token-123',
      'Acme Corp',
    )
  })

  it('should return user data with role', async () => {
    const result = await inviteMember(COMPANY_1, inviteParams, USER_2)

    expect(result.user).toEqual({
      id: USER_1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: Status.Pending,
      role: Role.User,
    })
  })
})

describe('resendMemberInvitation', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockCompany: Company
  let mockMember: User
  let mockMembership: UserCompany
  let mockCompanyRepoFindById: any
  let mockUserRepoFindById: any
  let mockCompanyRepoFindUserCompany: any
  let mockTokenRepoIssue: any
  let mockTransaction: any
  let mockEmailAgent: any

  beforeEach(async () => {
    mockCompany = {
      id: COMPANY_1,
      name: 'Acme Corp',
      website: 'https://acme.com',
      description: 'A test company',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockMember = {
      id: USER_1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: Status.Pending,
      role: Role.User,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockMembership = {
      id: 1,
      userId: USER_1,
      companyId: COMPANY_1,
      position: 'Developer',
      invitedBy: USER_2,
      joinedAt: new Date('2024-01-01'),
    }

    mockCompanyRepoFindById = mock(async () => mockCompany)
    mockUserRepoFindById = mock(async () => mockMember)
    mockCompanyRepoFindUserCompany = mock(async () => mockMembership)
    mockTokenRepoIssue = mock(async () => {})
    mockTransaction = mock(async <T>(callback: (tx: unknown) => Promise<T>): Promise<T> => {
      return callback({})
    })
    mockEmailAgent = {
      sendUserInvitationEmail: mock(async () => {}),
    }

    await moduleMocker.mock('@/data', () => ({
      companyRepo: {
        findById: mockCompanyRepoFindById,
        findUserCompany: mockCompanyRepoFindUserCompany,
      },
      userRepo: { findById: mockUserRepoFindById },
      tokenRepo: { issue: mockTokenRepoIssue },
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
      emailAgent: mockEmailAgent,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should throw NotFound when company does not exist', async () => {
    mockCompanyRepoFindById.mockImplementation(async () => undefined)

    expect(resendMemberInvitation(COMPANY_1, USER_1)).rejects.toThrow(AppError)
    expect(resendMemberInvitation(COMPANY_1, USER_1)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Company not found',
    })
  })

  it('should throw NotFound when member does not exist', async () => {
    mockUserRepoFindById.mockImplementation(async () => undefined)

    expect(resendMemberInvitation(COMPANY_1, USER_1)).rejects.toThrow(AppError)
    expect(resendMemberInvitation(COMPANY_1, USER_1)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Member not found',
    })
  })

  it('should throw NotFound when member not in company', async () => {
    mockCompanyRepoFindUserCompany.mockImplementation(async () => undefined)

    expect(resendMemberInvitation(COMPANY_1, USER_1)).rejects.toThrow(AppError)
    expect(resendMemberInvitation(COMPANY_1, USER_1)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Member not found in this company',
    })
  })

  it('should throw BadRequest when member already accepted invitation', async () => {
    mockUserRepoFindById.mockImplementation(async () => ({
      ...mockMember,
      status: Status.Active,
    }))

    expect(resendMemberInvitation(COMPANY_1, USER_1)).rejects.toThrow(AppError)
    expect(resendMemberInvitation(COMPANY_1, USER_1)).rejects.toMatchObject({
      code: ErrorCode.BadRequest,
      message: 'Member has already accepted invitation',
    })
  })

  it('should issue new token', async () => {
    await resendMemberInvitation(COMPANY_1, USER_1)

    expect(mockTokenRepoIssue).toHaveBeenCalledWith(
      USER_1,
      {
        userId: USER_1,
        type: 'user_invitation',
        token: 'new-invitation-token',
        expiresAt: expect.any(Date),
      },
      expect.anything(),
    )
  })

  it('should send invitation email', async () => {
    await resendMemberInvitation(COMPANY_1, USER_1)

    expect(mockEmailAgent.sendUserInvitationEmail).toHaveBeenCalledWith(
      'John',
      'john@example.com',
      'new-invitation-token',
      'Acme Corp',
    )
  })

  it('should return success true', async () => {
    const result = await resendMemberInvitation(COMPANY_1, USER_1)

    expect(result).toEqual({ success: true })
  })
})
