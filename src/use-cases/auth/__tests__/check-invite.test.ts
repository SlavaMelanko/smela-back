import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { Company, TokenRecord, UserCompanyWithCompany } from '@/data'

import { ModuleMocker, testUuids } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { TOKEN_LENGTH, TokenStatus, TokenType } from '@/security/token'
import { hour, nowPlus } from '@/utils/chrono'

import checkInvite from '../check-invite'

describe('Check Invite', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockTokenString: string
  let mockTokenRecord: TokenRecord
  let mockTokenRepo: any
  let mockCompanyRepo: any

  let mockTokenValidator: any

  let mockCompany: Company
  let mockUserCompanyWithCompany: UserCompanyWithCompany

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

    mockCompany = {
      id: testUuids.TEAM_1,
      name: 'Acme Corp',
      website: 'https://acme.com',
      description: 'Test company',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockUserCompanyWithCompany = {
      id: 1,
      userId: testUuids.ADMIN_1,
      companyId: testUuids.TEAM_1,
      position: 'Developer',
      invitedBy: testUuids.OWNER_1,
      joinedAt: new Date(),
      company: mockCompany,
    }

    mockTokenRepo = {
      findByToken: mock(async () => mockTokenRecord),
    }
    mockCompanyRepo = {
      findUserCompanies: mock(async () => [mockUserCompanyWithCompany]),
    }

    await moduleMocker.mock('@/data', () => ({
      tokenRepo: mockTokenRepo,
      companyRepo: mockCompanyRepo,
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

  describe('when token is valid', () => {
    it('should return team name for valid invitation token', async () => {
      const result = await checkInvite(mockTokenString)

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockTokenString)
      expect(mockTokenRepo.findByToken).toHaveBeenCalledTimes(1)

      expect(mockTokenValidator.validate).toHaveBeenCalledWith(
        mockTokenRecord,
        TokenType.UserInvite,
      )
      expect(mockTokenValidator.validate).toHaveBeenCalledTimes(1)

      expect(mockCompanyRepo.findUserCompanies).toHaveBeenCalledWith(mockTokenRecord.userId)
      expect(mockCompanyRepo.findUserCompanies).toHaveBeenCalledTimes(1)

      expect(result).toEqual({ teamName: 'Acme Corp' })
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

      expect(mockCompanyRepo.findUserCompanies).not.toHaveBeenCalled()
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

      expect(mockCompanyRepo.findUserCompanies).not.toHaveBeenCalled()
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

      expect(mockCompanyRepo.findUserCompanies).not.toHaveBeenCalled()
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

      expect(mockCompanyRepo.findUserCompanies).not.toHaveBeenCalled()
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

      expect(mockCompanyRepo.findUserCompanies).not.toHaveBeenCalled()
    })
  })

  describe('when user has no team membership', () => {
    it('should throw InternalError', async () => {
      mockCompanyRepo.findUserCompanies.mockResolvedValue([])

      try {
        await checkInvite(mockTokenString)
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.InternalError)
        expect((error as AppError).message).toBe('User has no team membership')
      }

      expect(mockCompanyRepo.findUserCompanies).toHaveBeenCalledWith(mockTokenRecord.userId)
    })
  })

  describe('when database query fails', () => {
    it('should propagate the error', async () => {
      mockCompanyRepo.findUserCompanies.mockRejectedValue(new Error('Database connection failed'))

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
