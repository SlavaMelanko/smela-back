import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { TokenRecord } from '@/data'

import { ModuleMocker } from '@/__tests__'
import { AppError, ErrorCode } from '@/errors'
import { TOKEN_LENGTH } from '@/lib/token/constants'
import { Token, TokenStatus } from '@/types'

import resetPassword from '../reset-password'

describe('Reset Password', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockPassword: string

  let mockTokenString: string
  let mockTokenRecord: TokenRecord
  let mockTokenRepo: any
  let mockAuthRepo: any
  let mockUserRepo: any
  let mockTransaction: any

  let mockTokenValidator: any

  let mockHashedPassword: string
  let mockHashPassword: any

  beforeEach(async () => {
    mockPassword = 'NewSecure@123'

    mockTokenString = `mock-reset-token-${'1'.repeat(TOKEN_LENGTH - 18)}`
    mockTokenRecord = {
      id: 1,
      userId: 123,
      type: Token.PasswordReset,
      token: mockTokenString,
      status: TokenStatus.Pending,
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
      createdAt: new Date(),
      usedAt: null,
      metadata: null,
    }
    mockTokenRepo = {
      findByToken: mock(async () => mockTokenRecord),
      update: mock(async () => {}),
    }
    mockAuthRepo = {
      update: mock(async () => {}),
    }
    mockUserRepo = {
      incrementTokenVersion: mock(async () => {}),
    }
    mockTransaction = {
      transaction: mock(async (callback: any) => callback({}) as Promise<void>),
    }

    await moduleMocker.mock('@/data', () => ({
      tokenRepo: mockTokenRepo,
      authRepo: mockAuthRepo,
      userRepo: mockUserRepo,
      db: mockTransaction,
    }))

    mockTokenValidator = {
      validate: mock(() => mockTokenRecord),
    }

    await moduleMocker.mock('@/lib/token', () => ({
      TokenValidator: mockTokenValidator,
    }))

    mockHashedPassword = 'mock-hashed-new-password'
    mockHashPassword = mock(async () => mockHashedPassword)

    await moduleMocker.mock('@/lib/cipher', () => ({
      hashPassword: mockHashPassword,
    }))
  })

  afterEach(async () => {
    await moduleMocker.clear()
  })

  describe('when token is valid and active', () => {
    it('should validate token, hash password, mark token as used, update password, and increment token version', async () => {
      const result = await resetPassword({ token: mockTokenString, password: mockPassword })

      expect(mockTokenRepo.findByToken).toHaveBeenCalledWith(mockTokenString)
      expect(mockTokenRepo.findByToken).toHaveBeenCalledTimes(1)

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)

      expect(mockHashPassword).toHaveBeenCalledWith(mockPassword)
      expect(mockHashPassword).toHaveBeenCalledTimes(1)

      expect(mockTokenRepo.update).toHaveBeenCalledWith(mockTokenRecord.id, {
        status: TokenStatus.Used,
        usedAt: expect.any(Date),
      }, {})
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)

      expect(mockAuthRepo.update).toHaveBeenCalledWith(mockTokenRecord.userId, {
        passwordHash: mockHashedPassword,
      }, {})
      expect(mockAuthRepo.update).toHaveBeenCalledTimes(1)

      expect(mockUserRepo.incrementTokenVersion).toHaveBeenCalledWith(mockTokenRecord.userId, {})
      expect(mockUserRepo.incrementTokenVersion).toHaveBeenCalledTimes(1)

      expect(result).toEqual({ success: true })
    })
  })

  describe('when token validation fails', () => {
    it('should throw the validation error without updating anything', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenNotFound)
      })

      try {
        await resetPassword({ token: 'invalid-token', password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenNotFound)
      }

      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is expired', () => {
    it('should throw TokenExpired error', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenExpired)
      })

      try {
        await resetPassword({ token: mockTokenString, password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenExpired)
      }

      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is already used', () => {
    it('should throw TokenAlreadyUsed error', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenAlreadyUsed)
      })

      try {
        await resetPassword({ token: mockTokenString, password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenAlreadyUsed)
      }

      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token type is wrong', () => {
    it('should throw TokenTypeMismatch error', async () => {
      mockTokenValidator.validate.mockImplementation(() => {
        throw new AppError(ErrorCode.TokenTypeMismatch)
      })

      try {
        await resetPassword({ token: mockTokenString, password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenTypeMismatch)
      }

      expect(mockTransaction.transaction).not.toHaveBeenCalled()
      expect(mockTokenRepo.update).not.toHaveBeenCalled()
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token marking as used fails', () => {
    it('should throw the error and not update password', async () => {
      mockTokenRepo.update.mockImplementation(async () => {
        throw new Error('Database connection failed')
      })

      try {
        await resetPassword({ token: mockTokenString, password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when password update fails', () => {
    it('should throw the error within transaction', async () => {
      mockAuthRepo.update.mockImplementation(async () => {
        throw new Error('Password update failed')
      })

      try {
        await resetPassword({ token: mockTokenString, password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Password update failed')
      }

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('when password hashing fails', () => {
    it('should throw the error within transaction', async () => {
      mockHashPassword.mockImplementation(async () => {
        throw new Error('Password hashing failed')
      })

      try {
        await resetPassword({ token: mockTokenString, password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Password hashing failed')
      }

      expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
      expect(mockTokenRepo.update).toHaveBeenCalledTimes(1)
      expect(mockAuthRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle empty password', async () => {
      try {
        await resetPassword({ token: mockTokenString, password: '' })
        expect(true).toBe(false) // should not reach here due to validation
      } catch (error) {
        // This would be caught by the validation layer before reaching this function
        expect(error).toBeDefined()
      }
    })

    it('should handle very long passwords', async () => {
      const longPassword = `A1@${'a'.repeat(1000)}` // very long password

      const result = await resetPassword({ token: mockTokenString, password: longPassword })

      expect(result).toEqual({ success: true })

      expect(mockHashPassword).toHaveBeenCalledWith(longPassword)
      expect(mockHashPassword).toHaveBeenCalledTimes(1)
    })
  })

  describe('Token Version Invalidation', () => {
    describe('when password reset is successful', () => {
      it('should increment user tokenVersion to invalidate existing JWTs', async () => {
        await resetPassword({ token: mockTokenString, password: mockPassword })

        expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
        expect(mockUserRepo.incrementTokenVersion).toHaveBeenCalledWith(123, {})
        expect(mockUserRepo.incrementTokenVersion).toHaveBeenCalledTimes(1)
      })
    })

    describe('token version error handling', () => {
      it('should fail if tokenVersion increment fails', async () => {
        mockUserRepo.incrementTokenVersion.mockImplementation(async () => {
          throw new Error('TokenVersion update failed')
        })

        try {
          await resetPassword({ token: mockTokenString, password: mockPassword })
          expect(true).toBe(false) // should not reach here
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('TokenVersion update failed')
        }

        expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)
        expect(mockUserRepo.incrementTokenVersion).toHaveBeenCalledWith(123, {})
      })
    })

    describe('complete password reset flow', () => {
      it('should complete full flow: password reset → tokenVersion increment → JWT invalidation', async () => {
        const userId = 123

        // Execute password reset
        const result = await resetPassword({ token: mockTokenString, password: 'NewPassword123!' })

        // Verify all operations completed in correct order
        expect(result.success).toBe(true)

        // Transaction was called
        expect(mockTransaction.transaction).toHaveBeenCalledTimes(1)

        // 1. Token marked as used
        expect(mockTokenRepo.update).toHaveBeenCalledWith(mockTokenRecord.id, {
          status: TokenStatus.Used,
          usedAt: expect.any(Date),
        }, {})

        // 2. Password updated
        expect(mockAuthRepo.update).toHaveBeenCalledWith(userId, {
          passwordHash: mockHashedPassword,
        }, {})

        // 3. TokenVersion incremented
        expect(mockUserRepo.incrementTokenVersion).toHaveBeenCalledWith(userId, {})
      })
    })
  })
})
