import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { Team, TeamMember, User } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import AppError from '@/errors/app-error'
import ErrorCode from '@/errors/codes'
import { Role, Status } from '@/types'

import { cancelMemberInvite, inviteMember, resendMemberInvite } from '../invites'

const { TEAM_1, USER_1, USER_2 } = testUuids

describe('inviteMember', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockTeam: Team
  let mockInviter: User
  let mockTeamRepoFindById: any
  let mockUserRepoFindByEmail: any
  let mockUserRepoFindById: any
  let mockUserRepoCreate: any
  let mockAuthRepoCreate: any
  let mockTeamRepoCreateMember: any
  let mockTokenRepoIssue: any
  let mockRbacSet: any
  let mockTransaction: any
  let mockEmailAgent: any

  const inviteParams = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    position: 'Developer',
    permissions: {
      users: { view: true, manage: false },
      admins: { view: false, manage: false },
      teams: { view: true, manage: true },
    },
  }

  beforeEach(async () => {
    mockTeam = {
      id: TEAM_1,
      name: 'Acme Corp',
      website: 'https://acme.com',
      description: 'A test team',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockInviter = {
      id: USER_2,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      status: Status.Active,
      role: Role.Admin,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockTeamRepoFindById = mock(async () => mockTeam)
    mockUserRepoFindByEmail = mock(async () => undefined)
    mockUserRepoFindById = mock(async () => mockInviter)
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
    mockTeamRepoCreateMember = mock(async () => {})
    mockTokenRepoIssue = mock(async () => {})
    mockRbacSet = mock(async () => {})
    mockTransaction = mock(async <T>(callback: (tx: unknown) => Promise<T>): Promise<T> => {
      return callback({})
    })
    mockEmailAgent = {
      sendUserInvitationEmail: mock(async () => {}),
    }

    await moduleMocker.mock('@/data', () => ({
      teamRepo: {
        findById: mockTeamRepoFindById,
        createMember: mockTeamRepoCreateMember,
      },
      userRepo: {
        findByEmail: mockUserRepoFindByEmail,
        findById: mockUserRepoFindById,
        create: mockUserRepoCreate,
      },
      authRepo: { create: mockAuthRepoCreate },
      tokenRepo: { issue: mockTokenRepoIssue },
      rbacRepo: { setUserPermissions: mockRbacSet },
      db: { transaction: mockTransaction },
    }))

    await moduleMocker.mock('@/security/password', () => ({
      generatePasswordHash: mock(async () => 'hashed-password'),
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
      emailAgent: mockEmailAgent,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should throw NotFound when team does not exist', async () => {
    mockTeamRepoFindById.mockImplementation(async () => undefined)

    expect(inviteMember(TEAM_1, inviteParams, USER_2)).rejects.toThrow(AppError)
    expect(inviteMember(TEAM_1, inviteParams, USER_2)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Team not found',
    })
  })

  it('should throw EmailAlreadyInUse when user email already exists', async () => {
    mockUserRepoFindByEmail.mockImplementation(async () => ({
      id: 'existing-user',
      email: 'john@example.com',
    }))

    expect(inviteMember(TEAM_1, inviteParams, USER_2)).rejects.toThrow(AppError)
    expect(inviteMember(TEAM_1, inviteParams, USER_2)).rejects.toMatchObject({
      code: ErrorCode.EmailAlreadyInUse,
    })
  })

  it('should create user with pending status', async () => {
    await inviteMember(TEAM_1, inviteParams, USER_2)

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

  it('should add user to team with invitedBy', async () => {
    await inviteMember(TEAM_1, inviteParams, USER_2)

    expect(mockTeamRepoCreateMember).toHaveBeenCalledWith(
      {
        userId: USER_1,
        teamId: TEAM_1,
        position: 'Developer',
        invitedBy: USER_2,
      },
      expect.anything(),
    )
  })

  it('should send invitation email', async () => {
    await inviteMember(TEAM_1, inviteParams, USER_2)

    expect(mockEmailAgent.sendUserInvitationEmail).toHaveBeenCalledWith(
      'John',
      'john@example.com',
      'invitation-token-123',
      'Admin',
      'Acme Corp',
    )
  })

  it('should return member data with team details', async () => {
    const result = await inviteMember(TEAM_1, inviteParams, USER_2)

    expect(result.member).toEqual({
      id: USER_1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: Status.Pending,
      position: 'Developer',
      invitedBy: USER_2,
      joinedAt: expect.any(Date),
    })
  })
})

describe('resendMemberInvite', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockTeam: Team
  let mockMember: User
  let mockInviter: User
  let mockMembership: TeamMember
  let mockTeamRepoFindById: any
  let mockUserRepoFindById: any
  let mockTeamRepoFindMember: any
  let mockTokenRepoIssue: any
  let mockTransaction: any
  let mockEmailAgent: any

  beforeEach(async () => {
    mockTeam = {
      id: TEAM_1,
      name: 'Acme Corp',
      website: 'https://acme.com',
      description: 'A test team',
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

    mockInviter = {
      id: USER_2,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      status: Status.Active,
      role: Role.Admin,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockMembership = {
      id: 1,
      userId: USER_1,
      teamId: TEAM_1,
      position: 'Developer',
      invitedBy: USER_2,
      joinedAt: new Date('2024-01-01'),
    }

    mockTeamRepoFindById = mock(async () => mockTeam)
    mockUserRepoFindById = mock(async (id: string) => {
      if (id === USER_1) {
        return mockMember
      }
      if (id === USER_2) {
        return mockInviter
      }

      return undefined
    })
    mockTeamRepoFindMember = mock(async () => mockMembership)
    mockTokenRepoIssue = mock(async () => {})
    mockTransaction = mock(async <T>(callback: (tx: unknown) => Promise<T>): Promise<T> => {
      return callback({})
    })
    mockEmailAgent = {
      sendUserInvitationEmail: mock(async () => {}),
    }

    await moduleMocker.mock('@/data', () => ({
      teamRepo: {
        findById: mockTeamRepoFindById,
        findMember: mockTeamRepoFindMember,
      },
      userRepo: { findById: mockUserRepoFindById },
      tokenRepo: { issue: mockTokenRepoIssue },
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
      emailAgent: mockEmailAgent,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  it('should throw NotFound when team does not exist', async () => {
    mockTeamRepoFindById.mockImplementation(async () => undefined)

    expect(resendMemberInvite(TEAM_1, USER_1, USER_2)).rejects.toThrow(AppError)
    expect(resendMemberInvite(TEAM_1, USER_1, USER_2)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Team not found',
    })
  })

  it('should throw NotFound when member does not exist', async () => {
    mockUserRepoFindById.mockImplementation(async (id: string) => {
      if (id === USER_2) {
        return mockInviter
      }

      return undefined
    })

    expect(resendMemberInvite(TEAM_1, USER_1, USER_2)).rejects.toThrow(AppError)
    expect(resendMemberInvite(TEAM_1, USER_1, USER_2)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Member not found',
    })
  })

  it('should throw NotFound when member not in team', async () => {
    mockTeamRepoFindMember.mockImplementation(async () => undefined)

    expect(resendMemberInvite(TEAM_1, USER_1, USER_2)).rejects.toThrow(AppError)
    expect(resendMemberInvite(TEAM_1, USER_1, USER_2)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Member not found in this team',
    })
  })

  it('should throw BadRequest when member already accepted invitation', async () => {
    mockUserRepoFindById.mockImplementation(async (id: string) => {
      if (id === USER_1) {
        return { ...mockMember, status: Status.Active }
      }
      if (id === USER_2) {
        return mockInviter
      }

      return undefined
    })

    expect(resendMemberInvite(TEAM_1, USER_1, USER_2)).rejects.toThrow(AppError)
    expect(resendMemberInvite(TEAM_1, USER_1, USER_2)).rejects.toMatchObject({
      code: ErrorCode.BadRequest,
      message: 'Member has already accepted invitation',
    })
  })

  it('should throw NotFound when inviter does not exist', async () => {
    mockUserRepoFindById.mockImplementation(async (id: string) => {
      if (id === USER_1) {
        return mockMember
      }

      return undefined
    })

    expect(resendMemberInvite(TEAM_1, USER_1, USER_2)).rejects.toThrow(AppError)
    expect(resendMemberInvite(TEAM_1, USER_1, USER_2)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Inviter not found',
    })
  })

  it('should issue new token', async () => {
    await resendMemberInvite(TEAM_1, USER_1, USER_2)

    expect(mockTokenRepoIssue).toHaveBeenCalledWith(
      USER_1,
      {
        userId: USER_1,
        type: 'user_invite',
        token: 'new-invitation-token',
        expiresAt: expect.any(Date),
      },
      expect.anything(),
    )
  })

  it('should send invitation email with current inviter name', async () => {
    await resendMemberInvite(TEAM_1, USER_1, USER_2)

    expect(mockEmailAgent.sendUserInvitationEmail).toHaveBeenCalledWith(
      'John',
      'john@example.com',
      'new-invitation-token',
      'Admin',
      'Acme Corp',
    )
  })

  it('should return success true', async () => {
    const result = await resendMemberInvite(TEAM_1, USER_1, USER_2)

    expect(result).toEqual({ success: true })
  })
})

describe('cancelMemberInvite', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockMember: User
  let mockMembership: TeamMember
  let mockUserRepoFindById: any
  let mockTeamRepoFindMember: any
  let mockTokenDeprecate: any
  let mockUserUpdate: any
  let mockTransaction: any

  beforeEach(async () => {
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
      teamId: TEAM_1,
      position: 'Developer',
      invitedBy: USER_2,
      joinedAt: new Date('2024-01-01'),
    }

    mockUserRepoFindById = mock(async () => mockMember)
    mockTeamRepoFindMember = mock(async () => mockMembership)
    mockTokenDeprecate = mock(async () => {})
    mockUserUpdate = mock(async () => ({ ...mockMember, status: Status.Archived }))

    mockTransaction = mock(async <T>(callback: (tx: unknown) => Promise<T>): Promise<T> => {
      return callback({})
    })

    await moduleMocker.mock('@/data', () => ({
      userRepo: { findById: mockUserRepoFindById, update: mockUserUpdate },
      teamRepo: { findMember: mockTeamRepoFindMember },
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

  it('should throw NotFound when member does not exist', async () => {
    mockUserRepoFindById.mockImplementation(async () => undefined)

    expect(cancelMemberInvite(TEAM_1, USER_1)).rejects.toThrow(AppError)
    expect(cancelMemberInvite(TEAM_1, USER_1)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Member not found',
    })
  })

  it('should throw NotFound when member is not in team', async () => {
    mockTeamRepoFindMember.mockImplementation(async () => undefined)

    expect(cancelMemberInvite(TEAM_1, USER_1)).rejects.toThrow(AppError)
    expect(cancelMemberInvite(TEAM_1, USER_1)).rejects.toMatchObject({
      code: ErrorCode.NotFound,
      message: 'Member not found',
    })
  })

  it('should throw BadRequest when member has already accepted invitation', async () => {
    mockUserRepoFindById.mockImplementation(async () => ({ ...mockMember, status: Status.Active }))

    expect(cancelMemberInvite(TEAM_1, USER_1)).rejects.toThrow(AppError)
    expect(cancelMemberInvite(TEAM_1, USER_1)).rejects.toMatchObject({
      code: ErrorCode.BadRequest,
      message: 'Member has already accepted invitation',
    })
  })

  it('should deprecate token and archive user in a transaction', async () => {
    const result = await cancelMemberInvite(TEAM_1, USER_1)

    expect(mockTokenDeprecate).toHaveBeenCalledWith(USER_1, 'user_invite', expect.anything())
    expect(mockUserUpdate).toHaveBeenCalledWith(
      USER_1,
      { status: Status.Archived },
      expect.anything(),
    )
    expect(result).toEqual({ success: true })
  })
})
