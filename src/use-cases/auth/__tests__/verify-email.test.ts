import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { TokenRecord, UserRecord } from '@/data'
import type { DeviceInfo } from '@/net/http/device'

import { ModuleMocker } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { TOKEN_LENGTH, TokenStatus, TokenType } from '@/security/token'
import { Role, Status } from '@/types'
import { hour, hours, nowMinus, nowPlus } from '@/utils/chrono'

import verifyEmail from '../verify-email'

describe('Verify Email', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockDeviceInfo: DeviceInfo
  let mockTokenString: string
  let mockTokenRecord: TokenRecord
  let mockTokenRepo: any
  let mockUser: UserRecord
  let mockUserRepo: any
  let mockRefreshTokenRepo: any
  let mockTransaction: any

  let mockTokenValidator: any

  let mockJwtToken: string
  let mockCreateJwt: any

  let mockRefreshToken: string
  let mockRefreshTokenHash: string
  let mockRefreshExpiresAt: Date
  let mockGenerateHashedToken: any

  beforeEach(async () => {
    mockDeviceInfo = {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Test)',
    }
    mockTokenString = 'a'.repeat(TOKEN_LENGTH)
    mockTokenRecord = {
      id: 1,
      userId: 1,
      type: TokenType.EmailVerification,
      token: mockTokenString,
      status: TokenStatus.Pending,
      expiresAt: nowPlus(hours(48)),
      usedAt: null,
      metadata: null,
      createdAt: new Date(),
    }
    mockTokenRepo = {
      findByToken: mock(async () => mockTokenRecord),
      update: mock(async () => {}),
    }
    mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: Status.Verified,
      role: Role.User,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockUserRepo = {
      update: mock(async () => mockUser),
    }
    mockRefreshTokenRepo = {
      create: mock(async () => 1),
    }
    mockTransaction = {
      transaction: mock(async (callback: any) => callback({}) as Promise<void>),
    }

    await moduleMocker.mock('@/data', () => ({
      tokenRepo: mockTokenRepo,
      userRepo: mockUserRepo,
      refreshTokenRepo: mockRefreshTokenRepo,
      authRepo: {},
      db: mockTransaction,
    }))

    mockTokenValidator = {
      validate: mock(() => mockTokenRecord),
    }

    mockRefreshToken = 'refresh-token-123'
    mockRefreshTokenHash = 'hashed-refresh-token-123'
    mockRefreshExpiresAt = nowPlus(hours(168)) // 7 days
    mockGenerateHashedToken = mock(async () => ({
      token: { raw: mockRefreshToken, hashed: mockRefreshTokenHash },
      expiresAt: mockRefreshExpiresAt,
    }))

    await moduleMocker.mock('@/security/token', () => ({
      TokenValidator: mockTokenValidator,
      generateHashedToken: mockGenerateHashedToken,
      TokenStatus,
      TokenType,
    }))

    mockJwtToken = 'mock-verify-jwt-token'
    mockCreateJwt = mock(async () => mockJwtToken)

    await moduleMocker.mock('@/security/jwt', () => ({
      signJwt: mockCreateJwt,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('when token is valid and active', () => {
    it('should mark token as used, update user status, and return user with JWT token', async () => {
      const result = await verifyEmail(mockTokenString, mockDeviceInfo)

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockTokenString)
      expect(mockTokenRepo.findByToken).toHaveBeenCalledTimes(1)

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)

      expect(mockTokenRepo.update).toHaveBeenCalledWith(mockTokenRecord.id, {
        status: TokenStatus.Used,
        usedAt: expect.any(Date),
      }, {})
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)

      expect(mockUserRepo.update).toHaveBeenCalledWith(mockTokenRecord.userId, {
        status: Status.Verified,
      }, {})
      expect(mockUserRepo.update).toHaveBeenCalledTimes(1)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('refreshToken')
      expect(result.data).toHaveProperty('user')
      expect(result.data).toHaveProperty('accessToken')
      expect(result.data.user).not.toHaveProperty('tokenVersion')
      expect(result.data.user.email).toBe(mockUser.email)
      expect(result.data.accessToken).toBe(mockJwtToken)
      expect(result.refreshToken).toBe(mockRefreshToken)
    })

    it('should set correct timestamp when marking token as used', async () => {
      const beforeCall = Date.now()
      await verifyEmail(mockTokenString, mockDeviceInfo)
      const afterCall = Date.now()

      const updateCall = (mockTokenRepo.update).mock.calls[0]
      const usedAt = updateCall[1].usedAt as Date

      expect(usedAt.getTime()).toBeGreaterThanOrEqual(beforeCall)
      expect(usedAt.getTime()).toBeLessThanOrEqual(afterCall)
    })
  })

  describe('when token does not exist', () => {
    it('should throw TokenNotFound error', async () => {
      mockTokenRepo.findByToken.mockImplementation(async () => null)
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenNotFound)
      })

      try {
        await verifyEmail(mockTokenString, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenNotFound)
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockTokenString)
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is already used', () => {
    it('should throw TokenAlreadyUsed error', async () => {
      const usedTokenRecord = {
        ...mockTokenRecord,
        status: TokenStatus.Used,
        usedAt: nowMinus(hour()),
      }

      mockTokenRepo.findByToken.mockImplementation(async () => usedTokenRecord)
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenAlreadyUsed)
      })

      try {
        await verifyEmail(mockTokenString, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenAlreadyUsed)
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockTokenString)
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is deprecated', () => {
    it('should throw TokenDeprecated error', async () => {
      const deprecatedTokenRecord = {
        ...mockTokenRecord,
        status: TokenStatus.Deprecated,
      }

      mockTokenRepo.findByToken.mockImplementation(async () => deprecatedTokenRecord)
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenDeprecated)
      })

      try {
        await verifyEmail(mockTokenString, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenDeprecated)
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockTokenString)
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is expired', () => {
    it('should throw TokenExpired error', async () => {
      const expiredTokenRecord = {
        ...mockTokenRecord,
        expiresAt: nowMinus(hour()),
      }

      mockTokenRepo.findByToken.mockImplementation(async () => expiredTokenRecord)
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenExpired)
      })

      try {
        await verifyEmail(mockTokenString, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenExpired)
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockTokenString)
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token type is incorrect', () => {
    it('should throw TokenTypeMismatch error', async () => {
      const wrongTypeTokenRecord = {
        ...mockTokenRecord,
        type: TokenType.PasswordReset,
      }

      mockTokenRepo.findByToken.mockImplementation(async () => wrongTypeTokenRecord)
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenTypeMismatch, `expected ${TokenType.EmailVerification}, got ${TokenType.PasswordReset}`)
      })

      try {
        await verifyEmail(mockTokenString, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenTypeMismatch)
        expect((error as AppError).message).toContain(`expected ${TokenType.EmailVerification}`)
        expect((error as AppError).message).toContain(`got ${TokenType.PasswordReset}`)
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockTokenString)
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token repository operations fail', () => {
    it('should propagate findByToken errors', async () => {
      mockTokenRepo.findByToken.mockImplementation(async () => {
        throw new Error('Database connection failed')
      })

      try {
        await verifyEmail(mockTokenString, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockTokenString)
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })

    it('should propagate token update errors', async () => {
      mockTokenRepo.update.mockImplementation(async () => {
        throw new Error('Token update failed')
      })

      try {
        await verifyEmail(mockTokenString, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Token update failed')
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockTokenString)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })

    it('should propagate user update errors', async () => {
      mockUserRepo.update.mockImplementation(async () => {
        throw new Error('User update failed')
      })

      try {
        await verifyEmail(mockTokenString, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('User update failed')
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockTokenString)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('when user update fails', () => {
    it('should throw error when user update fails', async () => {
      mockUserRepo.update.mockImplementation(async () => {
        throw new AppError(ErrorCode.InternalError, 'Failed to update user')
      })

      try {
        await verifyEmail(mockTokenString, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.InternalError)
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockTokenString)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('should handle token that is exactly at expiry boundary', async () => {
      const boundaryTokenRecord = {
        ...mockTokenRecord,
        expiresAt: new Date(Date.now() + 1000),
      }

      mockTokenRepo.findByToken.mockImplementation(async () => boundaryTokenRecord)
      mockTokenValidator.validate.mockImplementation(() => boundaryTokenRecord)

      const result = await verifyEmail(mockTokenString, mockDeviceInfo)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('refreshToken')
      expect(result.data).toHaveProperty('user')
      expect(result.data).toHaveProperty('accessToken')
      expect(result.data.user.email).toBe(mockUser.email)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.update).toHaveBeenCalledTimes(1)
    })

    it('should handle token with different user ID', async () => {
      const differentUserTokenRecord = {
        ...mockTokenRecord,
        userId: 999,
      }

      mockTokenRepo.findByToken.mockImplementation(async () => differentUserTokenRecord)
      mockTokenValidator.validate.mockImplementation(() => differentUserTokenRecord)

      const result = await verifyEmail(mockTokenString, mockDeviceInfo)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('refreshToken')
      expect(result.data).toHaveProperty('user')
      expect(result.data).toHaveProperty('accessToken')
      expect(result.data.user.email).toBe(mockUser.email)
      expect(mockUserRepo.update).toHaveBeenCalledWith(999, {
        status: Status.Verified,
      }, {})
    })

    it('should handle various token string formats', async () => {
      const testTokens = [
        'a'.repeat(TOKEN_LENGTH), // all same character
        '1'.repeat(TOKEN_LENGTH), // all numbers
        'abcdef1234567890'.repeat(TOKEN_LENGTH / 16), // mixed hex
        'A'.repeat(TOKEN_LENGTH / 2) + 'a'.repeat(TOKEN_LENGTH / 2), // mixed case
      ]

      for (const testToken of testTokens) {
        const testTokenRecord = { ...mockTokenRecord, token: testToken }

        mockTokenRepo.findByToken.mockImplementation(async () => testTokenRecord)
        mockTokenValidator.validate.mockImplementation(() => testTokenRecord)

        const result = await verifyEmail(testToken, mockDeviceInfo)

        expect(result).toHaveProperty('data')
        expect(result).toHaveProperty('refreshToken')
        expect(result.data).toHaveProperty('user')
        expect(result.data).toHaveProperty('accessToken')
        expect(result.data.user.email).toBe(mockUser.email)
        expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(testToken)
      }
    })

    it('should handle token with null usedAt initially', async () => {
      const tokenWithNullUsedAt = {
        ...mockTokenRecord,
        usedAt: null,
      }

      mockTokenRepo.findByToken.mockImplementation(async () => tokenWithNullUsedAt)
      mockTokenValidator.validate.mockImplementation(() => tokenWithNullUsedAt)

      const result = await verifyEmail(mockTokenString, mockDeviceInfo)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('refreshToken')
      expect(result.data).toHaveProperty('user')
      expect(result.data).toHaveProperty('accessToken')
      expect(result.data.user.email).toBe(mockUser.email)
      expect(mockTokenRepo.update).toHaveBeenCalledWith(mockTokenRecord.id, {
        status: TokenStatus.Used,
        usedAt: expect.any(Date),
      }, {})
    })

    it('should handle token that has usedAt but status is still Active', async () => {
      const inconsistentTokenRecord = {
        ...mockTokenRecord,
        status: TokenStatus.Pending,
        usedAt: nowMinus(hour()),
      }

      mockTokenRepo.findByToken.mockImplementation(async () => inconsistentTokenRecord)
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenAlreadyUsed)
      })

      try {
        await verifyEmail(mockTokenString, mockDeviceInfo)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenAlreadyUsed)
      }
    })
  })
})
