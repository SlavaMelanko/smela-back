import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker } from '@/__tests__'
import { AppError, ErrorCode } from '@/lib/catch'
import { TOKEN_LENGTH } from '@/lib/token/constants'
import { Role, Status, Token, TokenStatus } from '@/types'

import verifyEmail from '../verify-email'

describe('Verify Email', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockToken: string
  let mockTokenRecord: any
  let mockTokenRepo: any
  let mockUser: any
  let mockUserRepo: any
  let mockDb: any

  let mockTokenValidator: any

  let mockJwtToken: string
  let mockJwt: any

  beforeEach(async () => {
    mockToken = 'a'.repeat(TOKEN_LENGTH)
    mockTokenRecord = {
      id: 1,
      userId: 1,
      type: Token.EmailVerification,
      token: mockToken,
      status: TokenStatus.Pending,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockTokenRepo = {
      findByToken: mock(() => Promise.resolve(mockTokenRecord)),
      update: mock(() => Promise.resolve()),
    }
    mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: Status.Verified,
      role: Role.User,
      tokenVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockUserRepo = {
      update: mock(() => Promise.resolve(mockUser)),
    }
    mockDb = {
      transaction: mock(async (callback: any) => callback({})),
    }

    await moduleMocker.mock('@/data', () => ({
      tokenRepo: mockTokenRepo,
      userRepo: mockUserRepo,
      authRepo: {},
      db: mockDb,
    }))

    mockTokenValidator = {
      validate: mock(() => mockTokenRecord),
    }

    await moduleMocker.mock('@/lib/token', () => ({
      TokenValidator: mockTokenValidator,
    }))

    mockJwtToken = 'mock-verify-jwt-token'
    mockJwt = {
      sign: mock(() => Promise.resolve(mockJwtToken)),
    }

    await moduleMocker.mock('@/lib/jwt', () => ({
      default: mockJwt,
    }))
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  describe('when token is valid and active', () => {
    it('should mark token as used, update user status, and return user with JWT token', async () => {
      const result = await verifyEmail(mockToken)

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(mockTokenRepo.findByToken).toHaveBeenCalledTimes(1)

      expect(mockDb.transaction).toHaveBeenCalledTimes(1)

      expect(mockTokenRepo.update).toHaveBeenCalledWith(mockTokenRecord.id, {
        status: TokenStatus.Used,
        usedAt: expect.any(Date),
      }, {})
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)

      expect(mockUserRepo.update).toHaveBeenCalledWith(mockTokenRecord.userId, {
        status: Status.Verified,
      }, {})
      expect(mockUserRepo.update).toHaveBeenCalledTimes(1)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result.user).not.toHaveProperty('tokenVersion')
      expect(result.user.email).toBe(mockUser.email)
      expect(result.token).toBe(mockJwtToken)
    })

    it('should set correct timestamp when marking token as used', async () => {
      const beforeCall = Date.now()
      await verifyEmail(mockToken)
      const afterCall = Date.now()

      const updateCall = (mockTokenRepo.update as any).mock.calls[0]
      const usedAt = updateCall[1].usedAt as Date

      expect(usedAt.getTime()).toBeGreaterThanOrEqual(beforeCall)
      expect(usedAt.getTime()).toBeLessThanOrEqual(afterCall)
    })
  })

  describe('when token does not exist', () => {
    it('should throw TokenNotFound error', async () => {
      mockTokenRepo.findByToken.mockImplementation(() => Promise.resolve(null))
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenNotFound)
      })

      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenNotFound)
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is already used', () => {
    it('should throw TokenAlreadyUsed error', async () => {
      const usedTokenRecord = {
        ...mockTokenRecord,
        status: TokenStatus.Used,
        usedAt: new Date(Date.now() - 60 * 60 * 1000),
      }

      mockTokenRepo.findByToken.mockImplementation(() => Promise.resolve(usedTokenRecord))
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenAlreadyUsed)
      })

      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenAlreadyUsed)
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
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

      mockTokenRepo.findByToken.mockImplementation(() => Promise.resolve(deprecatedTokenRecord))
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenDeprecated)
      })

      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenDeprecated)
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is expired', () => {
    it('should throw TokenExpired error', async () => {
      const expiredTokenRecord = {
        ...mockTokenRecord,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000),
      }

      mockTokenRepo.findByToken.mockImplementation(() => Promise.resolve(expiredTokenRecord))
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenExpired)
      })

      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenExpired)
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token type is incorrect', () => {
    it('should throw TokenTypeMismatch error', async () => {
      const wrongTypeTokenRecord = {
        ...mockTokenRecord,
        type: Token.PasswordReset,
      }

      mockTokenRepo.findByToken.mockImplementation(() => Promise.resolve(wrongTypeTokenRecord))
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenTypeMismatch, `expected ${Token.EmailVerification}, got ${Token.PasswordReset}`)
      })

      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenTypeMismatch)
        expect((error as AppError).message).toContain(`expected ${Token.EmailVerification}`)
        expect((error as AppError).message).toContain(`got ${Token.PasswordReset}`)
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token repository operations fail', () => {
    it('should propagate findByToken errors', async () => {
      mockTokenRepo.findByToken.mockImplementation(() => Promise.reject(new Error('Database connection failed')))

      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })

    it('should propagate token update errors', async () => {
      mockTokenRepo.update.mockImplementation(() => Promise.reject(new Error('Token update failed')))

      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Token update failed')
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.update).not.toHaveBeenCalled()
    })

    it('should propagate user update errors', async () => {
      mockUserRepo.update.mockImplementation(() => Promise.reject(new Error('User update failed')))

      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('User update failed')
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('when user update fails', () => {
    it('should throw error when user update fails', async () => {
      mockUserRepo.update.mockImplementation(() => Promise.reject(new AppError(ErrorCode.InternalError, 'Failed to update user')))

      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.InternalError)
      }

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
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

      mockTokenRepo.findByToken.mockImplementation(() => Promise.resolve(boundaryTokenRecord))
      mockTokenValidator.validate.mockImplementation(() => boundaryTokenRecord)

      const result = await verifyEmail(mockToken)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result.user.email).toBe(mockUser.email)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockUserRepo.update).toHaveBeenCalledTimes(1)
    })

    it('should handle token with different user ID', async () => {
      const differentUserTokenRecord = {
        ...mockTokenRecord,
        userId: 999,
      }

      mockTokenRepo.findByToken.mockImplementation(() => Promise.resolve(differentUserTokenRecord))
      mockTokenValidator.validate.mockImplementation(() => differentUserTokenRecord)

      const result = await verifyEmail(mockToken)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result.user.email).toBe(mockUser.email)
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

        mockTokenRepo.findByToken.mockImplementation(() => Promise.resolve(testTokenRecord))
        mockTokenValidator.validate.mockImplementation(() => testTokenRecord)

        const result = await verifyEmail(testToken)

        expect(result).toHaveProperty('user')
        expect(result).toHaveProperty('token')
        expect(result.user.email).toBe(mockUser.email)
        expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(testToken)
      }
    })

    it('should handle token with null usedAt initially', async () => {
      const tokenWithNullUsedAt = {
        ...mockTokenRecord,
        usedAt: null,
      }

      mockTokenRepo.findByToken.mockImplementation(() => Promise.resolve(tokenWithNullUsedAt))
      mockTokenValidator.validate.mockImplementation(() => tokenWithNullUsedAt)

      const result = await verifyEmail(mockToken)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result.user.email).toBe(mockUser.email)
      expect(mockTokenRepo.update).toHaveBeenCalledWith(mockTokenRecord.id, {
        status: TokenStatus.Used,
        usedAt: expect.any(Date),
      }, {})
    })

    it('should handle token that has usedAt but status is still Active', async () => {
      const inconsistentTokenRecord = {
        ...mockTokenRecord,
        status: TokenStatus.Pending,
        usedAt: new Date(Date.now() - 60 * 60 * 1000),
      }

      mockTokenRepo.findByToken.mockImplementation(() => Promise.resolve(inconsistentTokenRecord))
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenAlreadyUsed)
      })

      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenAlreadyUsed)
      }
    })
  })
})
