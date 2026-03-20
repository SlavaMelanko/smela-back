import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { TokenRecord, UserRoleRecord, UserTeamInfo } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { TOKEN_LENGTH, TokenStatus, TokenType } from '@/security/token'
import { Role } from '@/types'
import { hour, nowPlus } from '@/utils/chrono'

import { checkInvite } from '../check-invite'

describe('Check Invite', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)
  const MOCK_COMPANY_NAME = 'Test Company'

  let mockTokenString: string
  let mockTokenRecord: TokenRecord
  let mockTokenRepo: any
  let mockTeamRepo: any
  let mockRbacRepo: any

  let mockTokenValidator: any

  let mockTeam: UserTeamInfo
  let mockAdminRole: UserRoleRecord

  beforeEach(async () => {
    mockTokenString = `mock-invite-token-${'1'.repeat(TOKEN_LENGTH - 18)}`
    mockTokenRecord = {
      id: 1,
      userId: testUuids.ADMIN_1,
      type: TokenType.UserInvite,
      token: mockTokenString,
      status: TokenStatus.Pending,
      expiresAt: nowPlus(hour()),
      createdAt: new Date(),
      usedAt: null,
      metadata: null,
    }

    mockTeam = {
      id: testUuids.TEAM_1,
      name: 'Acme Corp',
      position: 'Team Member',
    }

    mockAdminRole = {
      userId: testUuids.ADMIN_1,
      role: Role.Admin,
      invitedBy: testUuids.OWNER_1,
      assignedAt: new Date(),
    }

    mockTokenRepo = {
      findByToken: mock(async () => mockTokenRecord),
    }
    mockTeamRepo = {
      findUserTeam: mock(async () => mockTeam),
    }
    mockRbacRepo = {
      findRole: mock(async () => mockAdminRole),
    }

    await moduleMocker.mock('@/data', () => ({
      tokenRepo: mockTokenRepo,
      teamRepo: mockTeamRepo,
      rbacRepo: mockRbacRepo,
    }))

    await moduleMocker.mock('@/env', () => ({
      default: { COMPANY_NAME: MOCK_COMPANY_NAME },
    }))

    mockTokenValidator = {
      validate: mock(() => mockTokenRecord),
    }

    await moduleMocker.mock('@/security/token', () => ({
      TokenValidator: mockTokenValidator,
      TokenType,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('when token is valid for member invite', () => {
    it('should return member type and team name for member invitation token', async () => {
      const result = await checkInvite(mockTokenString)

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockTokenString)
      expect(mockTokenRepo.findByToken).toHaveBeenCalledTimes(1)

      expect(mockTokenValidator.validate).toHaveBeenCalledWith(
        mockTokenRecord,
        TokenType.UserInvite,
      )
      expect(mockTokenValidator.validate).toHaveBeenCalledTimes(1)

      expect(mockTeamRepo.findUserTeam).toHaveBeenCalledWith(mockTokenRecord.userId)
      expect(mockTeamRepo.findUserTeam).toHaveBeenCalledTimes(1)

      expect(mockRbacRepo.findRole).not.toHaveBeenCalled()

      expect(result).toEqual({ type: 'member', teamName: 'Acme Corp' })
    })
  })

  describe('when token is valid for admin invite', () => {
    beforeEach(() => {
      mockTeamRepo.findUserTeam.mockResolvedValue(undefined)
    })

    it('should return admin type and company name for admin invitation token', async () => {
      const result = await checkInvite(mockTokenString)

      expect(mockTeamRepo.findUserTeam).toHaveBeenCalledWith(mockTokenRecord.userId)
      expect(mockRbacRepo.findRole).toHaveBeenCalledWith(mockTokenRecord.userId)
      expect(mockRbacRepo.findRole).toHaveBeenCalledTimes(1)

      expect(result).toEqual({ type: 'admin', teamName: MOCK_COMPANY_NAME })
    })
  })

  describe('when token is not found', () => {
    it('should throw TokenNotFound error', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenNotFound)
      })

      try {
        await checkInvite('invalid-token')
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenNotFound)
      }

      expect(mockTeamRepo.findUserTeam).not.toHaveBeenCalled()
    })
  })

  describe('when token is expired', () => {
    it('should throw TokenExpired error', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenExpired)
      })

      try {
        await checkInvite(mockTokenString)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenExpired)
      }

      expect(mockTeamRepo.findUserTeam).not.toHaveBeenCalled()
    })
  })

  describe('when token is already used', () => {
    it('should throw TokenAlreadyUsed error', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenAlreadyUsed)
      })

      try {
        await checkInvite(mockTokenString)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenAlreadyUsed)
      }

      expect(mockTeamRepo.findUserTeam).not.toHaveBeenCalled()
    })
  })

  describe('when token is cancelled', () => {
    it('should throw TokenCancelled error', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenCancelled)
      })

      try {
        await checkInvite(mockTokenString)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenCancelled)
      }

      expect(mockTeamRepo.findUserTeam).not.toHaveBeenCalled()
    })
  })

  describe('when token type is wrong', () => {
    it('should throw TokenTypeMismatch error', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenTypeMismatch)
      })

      try {
        await checkInvite(mockTokenString)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenTypeMismatch)
      }

      expect(mockTeamRepo.findUserTeam).not.toHaveBeenCalled()
    })
  })

  describe('when user has no team membership and no admin role', () => {
    it('should throw InternalError', async () => {
      mockTeamRepo.findUserTeam.mockResolvedValue(undefined)
      mockRbacRepo.findRole.mockResolvedValue(undefined)

      try {
        await checkInvite(mockTokenString)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.InternalError)
        expect((error as AppError).message).toBe('Invalid invitation state')
      }

      expect(mockTeamRepo.findUserTeam).toHaveBeenCalledWith(mockTokenRecord.userId)
      expect(mockRbacRepo.findRole).toHaveBeenCalledWith(mockTokenRecord.userId)
    })
  })

  describe('when user has non-admin role', () => {
    it('should throw InternalError', async () => {
      mockTeamRepo.findUserTeam.mockResolvedValue(undefined)
      mockRbacRepo.findRole.mockResolvedValue({
        ...mockAdminRole,
        role: Role.User,
      })

      try {
        await checkInvite(mockTokenString)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.InternalError)
        expect((error as AppError).message).toBe('Invalid invitation state')
      }
    })
  })

  describe('when database query fails', () => {
    it('should propagate the error', async () => {
      mockTeamRepo.findUserTeam.mockRejectedValue(new Error('Database connection failed'))

      try {
        await checkInvite(mockTokenString)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }
    })
  })
})
