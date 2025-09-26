import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker } from '@/__tests__/module-mocker'
import { AppError, ErrorCode } from '@/lib/catch'
import { TOKEN_LENGTH } from '@/lib/token/constants'
import { tokenRepo, userRepo } from '@/repositories'
import { Role, Status, Token, TokenStatus } from '@/types'

import verifyEmail from '../verify-email'

describe('Verify Email', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const mockToken = 'a'.repeat(TOKEN_LENGTH)
  const mockTokenRecord = {
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

  const mockUser = {
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

  const mockJwtToken = 'mock-verify-jwt-token'

  beforeEach(async () => {
    await moduleMocker.mock('@/repositories', () => ({
      tokenRepo: {
        findByToken: mock(() => Promise.resolve(mockTokenRecord)),
        update: mock(() => Promise.resolve()),
      },
      userRepo: {
        update: mock(() => Promise.resolve(mockUser)),
      },
      authRepo: {},
    }))

    await moduleMocker.mock('@/lib/jwt', () => ({
      default: {
        sign: mock(() => Promise.resolve(mockJwtToken)),
      },
    }))

    await moduleMocker.mock('@/lib/token', () => ({
      TokenValidator: {
        validate: mock(() => mockTokenRecord),
      },
    }))
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  describe('when token is valid and active', () => {
    it('should mark token as used, update user status, and return user with JWT token', async () => {
      const result = await verifyEmail(mockToken)

      expect(tokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(tokenRepo.findByToken).toHaveBeenCalledTimes(1)

      expect(tokenRepo.update).toHaveBeenCalledWith(mockTokenRecord.id, {
        status: TokenStatus.Used,
        usedAt: expect.any(Date),
      })
      expect(tokenRepo.update).toHaveBeenCalledTimes(1)

      expect(userRepo.update).toHaveBeenCalledWith(mockTokenRecord.userId, {
        status: Status.Verified,
      })
      expect(userRepo.update).toHaveBeenCalledTimes(1)

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

      const updateCall = (tokenRepo.update as any).mock.calls[0]
      const usedAt = updateCall[1].usedAt as Date

      expect(usedAt.getTime()).toBeGreaterThanOrEqual(beforeCall)
      expect(usedAt.getTime()).toBeLessThanOrEqual(afterCall)
    })
  })

  describe('when token does not exist', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories', () => ({
        tokenRepo: {
          findByToken: mock(() => Promise.resolve(null)),
          update: mock(() => Promise.resolve()),
        },
        userRepo: {
          update: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {},
      }))

      await moduleMocker.mock('@/lib/token', () => ({
        TokenValidator: {
          validate: mock(() => {
            throw new AppError(ErrorCode.TokenNotFound)
          }),
        },
      }))
    })

    it('should throw TokenNotFound error', async () => {
      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenNotFound)
      }

      expect(tokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(tokenRepo.update).not.toHaveBeenCalled()
      expect(userRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is already used', () => {
    beforeEach(async () => {
      const usedTokenRecord = {
        ...mockTokenRecord,
        status: TokenStatus.Used,
        usedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      }

      await moduleMocker.mock('@/repositories', () => ({
        tokenRepo: {
          findByToken: mock(() => Promise.resolve(usedTokenRecord)),
          update: mock(() => Promise.resolve()),
        },
        userRepo: {
          update: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {},
      }))

      await moduleMocker.mock('@/lib/token', () => ({
        TokenValidator: {
          validate: mock(() => {
            throw new AppError(ErrorCode.TokenAlreadyUsed)
          }),
        },
      }))
    })

    it('should throw TokenAlreadyUsed error', async () => {
      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenAlreadyUsed)
      }

      expect(tokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(tokenRepo.update).not.toHaveBeenCalled()
      expect(userRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is deprecated', () => {
    beforeEach(async () => {
      const deprecatedTokenRecord = {
        ...mockTokenRecord,
        status: TokenStatus.Deprecated,
      }

      await moduleMocker.mock('@/repositories', () => ({
        tokenRepo: {
          findByToken: mock(() => Promise.resolve(deprecatedTokenRecord)),
          update: mock(() => Promise.resolve()),
        },
        userRepo: {
          update: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {},
      }))

      await moduleMocker.mock('@/lib/token', () => ({
        TokenValidator: {
          validate: mock(() => {
            throw new AppError(ErrorCode.TokenDeprecated)
          }),
        },
      }))
    })

    it('should throw TokenDeprecated error', async () => {
      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenDeprecated)
      }

      expect(tokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(tokenRepo.update).not.toHaveBeenCalled()
      expect(userRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is expired', () => {
    beforeEach(async () => {
      const expiredTokenRecord = {
        ...mockTokenRecord,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      }

      await moduleMocker.mock('@/repositories', () => ({
        tokenRepo: {
          findByToken: mock(() => Promise.resolve(expiredTokenRecord)),
          update: mock(() => Promise.resolve()),
        },
        userRepo: {
          update: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {},
      }))

      await moduleMocker.mock('@/lib/token', () => ({
        TokenValidator: {
          validate: mock(() => {
            throw new AppError(ErrorCode.TokenExpired)
          }),
        },
      }))
    })

    it('should throw TokenExpired error', async () => {
      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenExpired)
      }

      expect(tokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(tokenRepo.update).not.toHaveBeenCalled()
      expect(userRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token type is incorrect', () => {
    beforeEach(async () => {
      const wrongTypeTokenRecord = {
        ...mockTokenRecord,
        type: Token.PasswordReset,
      }

      await moduleMocker.mock('@/repositories', () => ({
        tokenRepo: {
          findByToken: mock(() => Promise.resolve(wrongTypeTokenRecord)),
          update: mock(() => Promise.resolve()),
        },
        userRepo: {
          update: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {},
      }))

      await moduleMocker.mock('@/lib/token', () => ({
        TokenValidator: {
          validate: mock(() => {
            throw new AppError(ErrorCode.TokenTypeMismatch, `expected ${Token.EmailVerification}, got ${Token.PasswordReset}`)
          }),
        },
      }))
    })

    it('should throw TokenTypeMismatch error', async () => {
      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenTypeMismatch)
        expect((error as AppError).message).toContain(`expected ${Token.EmailVerification}`)
        expect((error as AppError).message).toContain(`got ${Token.PasswordReset}`)
      }

      expect(tokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(tokenRepo.update).not.toHaveBeenCalled()
      expect(userRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token repository operations fail', () => {
    it('should propagate findByToken errors', async () => {
      await moduleMocker.mock('@/repositories', () => ({
        tokenRepo: {
          findByToken: mock(() => Promise.reject(new Error('Database connection failed'))),
          update: mock(() => Promise.resolve()),
        },
        userRepo: {
          update: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {},
      }))

      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(tokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(tokenRepo.update).not.toHaveBeenCalled()
      expect(userRepo.update).not.toHaveBeenCalled()
    })

    it('should propagate token update errors', async () => {
      await moduleMocker.mock('@/repositories', () => ({
        tokenRepo: {
          findByToken: mock(() => Promise.resolve(mockTokenRecord)),
          update: mock(() => Promise.reject(new Error('Token update failed'))),
        },
        userRepo: {
          update: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {},
      }))

      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Token update failed')
      }

      expect(tokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(tokenRepo.update).toHaveBeenCalledTimes(1)
      expect(userRepo.update).not.toHaveBeenCalled()
    })

    it('should propagate user update errors', async () => {
      await moduleMocker.mock('@/repositories', () => ({
        tokenRepo: {
          findByToken: mock(() => Promise.resolve(mockTokenRecord)),
          update: mock(() => Promise.resolve()),
        },
        userRepo: {
          update: mock(() => Promise.reject(new Error('User update failed'))),
        },
        authRepo: {},
      }))

      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('User update failed')
      }

      expect(tokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(tokenRepo.update).toHaveBeenCalledTimes(1)
      expect(userRepo.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('when user update returns null', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories', () => ({
        tokenRepo: {
          findByToken: mock(() => Promise.resolve(mockTokenRecord)),
          update: mock(() => Promise.resolve()),
        },
        userRepo: {
          update: mock(() => Promise.resolve(null)),
        },
        authRepo: {},
      }))
    })

    it('should throw error when user update returns null', async () => {
      try {
        await verifyEmail(mockToken)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.InternalError)
      }

      expect(tokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(tokenRepo.update).toHaveBeenCalledTimes(1)
      expect(userRepo.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('should handle token that is exactly at expiry boundary', async () => {
      const boundaryTokenRecord = {
        ...mockTokenRecord,
        expiresAt: new Date(Date.now() + 1000), // 1 second from now
      }

      await moduleMocker.mock('@/repositories', () => ({
        tokenRepo: {
          findByToken: mock(() => Promise.resolve(boundaryTokenRecord)),
          update: mock(() => Promise.resolve()),
        },
        userRepo: {
          update: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {},
      }))

      await moduleMocker.mock('@/lib/token', () => ({
        TokenValidator: {
          validate: mock(() => boundaryTokenRecord),
        },
      }))

      const result = await verifyEmail(mockToken)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result.user.email).toBe(mockUser.email)
      expect(tokenRepo.update).toHaveBeenCalledTimes(1)
      expect(userRepo.update).toHaveBeenCalledTimes(1)
    })

    it('should handle token with different user ID', async () => {
      const differentUserTokenRecord = {
        ...mockTokenRecord,
        userId: 999,
      }

      await moduleMocker.mock('@/repositories', () => ({
        tokenRepo: {
          findByToken: mock(() => Promise.resolve(differentUserTokenRecord)),
          update: mock(() => Promise.resolve()),
        },
        userRepo: {
          update: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {},
      }))

      await moduleMocker.mock('@/lib/token', () => ({
        TokenValidator: {
          validate: mock(() => differentUserTokenRecord),
        },
      }))

      const result = await verifyEmail(mockToken)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result.user.email).toBe(mockUser.email)
      expect(userRepo.update).toHaveBeenCalledWith(999, {
        status: Status.Verified,
      })
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

        await moduleMocker.mock('@/repositories', () => ({
          tokenRepo: {
            findByToken: mock(() => Promise.resolve(testTokenRecord)),
            update: mock(() => Promise.resolve()),
          },
          userRepo: {
            update: mock(() => Promise.resolve(mockUser)),
          },
          authRepo: {},
        }))

        await moduleMocker.mock('@/lib/token', () => ({
          TokenValidator: {
            validate: mock(() => testTokenRecord),
          },
        }))

        const result = await verifyEmail(testToken)

        expect(result).toHaveProperty('user')
        expect(result).toHaveProperty('token')
        expect(result.user.email).toBe(mockUser.email)
        expect(tokenRepo.findByToken).toHaveBeenCalledWith(testToken)
      }
    })

    it('should handle token with null usedAt initially', async () => {
      const tokenWithNullUsedAt = {
        ...mockTokenRecord,
        usedAt: null,
      }

      await moduleMocker.mock('@/repositories', () => ({
        tokenRepo: {
          findByToken: mock(() => Promise.resolve(tokenWithNullUsedAt)),
          update: mock(() => Promise.resolve()),
        },
        userRepo: {
          update: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {},
      }))

      await moduleMocker.mock('@/lib/token', () => ({
        TokenValidator: {
          validate: mock(() => tokenWithNullUsedAt),
        },
      }))

      const result = await verifyEmail(mockToken)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result.user.email).toBe(mockUser.email)
      expect(tokenRepo.update).toHaveBeenCalledWith(mockTokenRecord.id, {
        status: TokenStatus.Used,
        usedAt: expect.any(Date),
      })
    })

    it('should handle token that has usedAt but status is still Active', async () => {
      const inconsistentTokenRecord = {
        ...mockTokenRecord,
        status: TokenStatus.Pending,
        usedAt: new Date(Date.now() - 60 * 60 * 1000), // has usedAt but status is Active
      }

      await moduleMocker.mock('@/repositories', () => ({
        tokenRepo: {
          findByToken: mock(() => Promise.resolve(inconsistentTokenRecord)),
          update: mock(() => Promise.resolve()),
        },
        userRepo: {
          update: mock(() => Promise.resolve(mockUser)),
        },
        authRepo: {},
      }))

      await moduleMocker.mock('@/lib/token', () => ({
        TokenValidator: {
          validate: mock(() => {
            throw new AppError(ErrorCode.TokenAlreadyUsed)
          }),
        },
      }))

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
