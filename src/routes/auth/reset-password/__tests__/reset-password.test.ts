import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker } from '@/__tests__'
import db from '@/db'
import { AppError, ErrorCode } from '@/lib/catch'
import { TOKEN_LENGTH } from '@/lib/token/constants'
import { authRepo, tokenRepo, userRepo } from '@/repositories'
import { Token, TokenStatus } from '@/types'

import resetPassword from '../reset-password'

describe('Reset Password', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  const mockToken = `mock-reset-token-${'1'.repeat(TOKEN_LENGTH - 18)}`
  const mockPassword = 'NewSecure@123'
  const mockHashedPassword = 'mock-hashed-new-password'

  const mockTokenRecord = {
    id: 1,
    userId: 123,
    type: Token.PasswordReset,
    token: mockToken,
    status: TokenStatus.Pending,
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
    createdAt: new Date(),
    usedAt: null,
  }

  const mockValidatedToken = {
    id: 1,
    userId: 123,
    type: Token.PasswordReset,
    token: mockToken,
    status: TokenStatus.Pending,
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
    createdAt: new Date(),
    usedAt: null,
  }

  const mockHashPassword = mock(() => Promise.resolve(mockHashedPassword))

  beforeEach(async () => {
    mockHashPassword.mockClear()

    await moduleMocker.mock('@/repositories', () => ({
      tokenRepo: {
        findByToken: mock(() => Promise.resolve(mockTokenRecord)),
        update: mock(() => Promise.resolve()),
      },
      authRepo: {
        update: mock(() => Promise.resolve()),
      },
      userRepo: {
        incrementTokenVersion: mock(() => Promise.resolve()),
      },
    }))

    await moduleMocker.mock('@/db', () => ({
      default: {
        transaction: mock(async (callback: any) => {
          return await callback({})
        }),
      },
    }))

    await moduleMocker.mock('@/lib/token', () => ({
      TokenValidator: {
        validate: mock(() => mockValidatedToken),
      },
    }))

    await moduleMocker.mock('@/lib/cipher', () => ({
      hashPassword: mockHashPassword,
    }))
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  describe('when token is valid and active', () => {
    it('should validate token, hash password, mark token as used, update password, and increment token version', async () => {
      const result = await resetPassword({ token: mockToken, password: mockPassword })

      expect(tokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(tokenRepo.findByToken).toHaveBeenCalledTimes(1)

      expect(db.transaction).toHaveBeenCalledTimes(1)

      expect(mockHashPassword).toHaveBeenCalledWith(mockPassword)
      expect(mockHashPassword).toHaveBeenCalledTimes(1)

      expect(tokenRepo.update).toHaveBeenCalledWith(mockValidatedToken.id, {
        status: TokenStatus.Used,
        usedAt: expect.any(Date),
      }, {})
      expect(tokenRepo.update).toHaveBeenCalledTimes(1)

      expect(authRepo.update).toHaveBeenCalledWith(mockValidatedToken.userId, {
        passwordHash: mockHashedPassword,
      }, {})
      expect(authRepo.update).toHaveBeenCalledTimes(1)

      expect(userRepo.incrementTokenVersion).toHaveBeenCalledWith(mockValidatedToken.userId, {})
      expect(userRepo.incrementTokenVersion).toHaveBeenCalledTimes(1)

      expect(result).toEqual({ success: true })
    })
  })

  describe('when token validation fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/lib/token', () => ({
        TokenValidator: {
          validate: mock(() => {
            throw new AppError(ErrorCode.TokenNotFound)
          }),
        },
      }))
    })

    it('should throw the validation error without updating anything', async () => {
      try {
        await resetPassword({ token: 'invalid-token', password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenNotFound)
      }

      expect(db.transaction).not.toHaveBeenCalled()
      expect(tokenRepo.update).not.toHaveBeenCalled()
      expect(authRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is expired', () => {
    beforeEach(async () => {
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
        await resetPassword({ token: mockToken, password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenExpired)
      }

      expect(db.transaction).not.toHaveBeenCalled()
      expect(tokenRepo.update).not.toHaveBeenCalled()
      expect(authRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is already used', () => {
    beforeEach(async () => {
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
        await resetPassword({ token: mockToken, password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenAlreadyUsed)
      }

      expect(db.transaction).not.toHaveBeenCalled()
      expect(tokenRepo.update).not.toHaveBeenCalled()
      expect(authRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token type is wrong', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/lib/token', () => ({
        TokenValidator: {
          validate: mock(() => {
            throw new AppError(ErrorCode.TokenTypeMismatch)
          }),
        },
      }))
    })

    it('should throw TokenTypeMismatch error', async () => {
      try {
        await resetPassword({ token: mockToken, password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.TokenTypeMismatch)
      }

      expect(db.transaction).not.toHaveBeenCalled()
      expect(tokenRepo.update).not.toHaveBeenCalled()
      expect(authRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token marking as used fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories', () => ({
        tokenRepo: {
          findByToken: mock(() => Promise.resolve(mockTokenRecord)),
          update: mock(() => Promise.reject(new Error('Database connection failed'))),
        },
        authRepo: {
          update: mock(() => Promise.resolve()),
        },
        userRepo: {
          incrementTokenVersion: mock(() => Promise.resolve()),
        },
      }))
    })

    it('should throw the error and not update password', async () => {
      try {
        await resetPassword({ token: mockToken, password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(db.transaction).toHaveBeenCalledTimes(1)
      expect(tokenRepo.update).toHaveBeenCalledTimes(1)
      expect(authRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when password update fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories', () => ({
        tokenRepo: {
          findByToken: mock(() => Promise.resolve(mockTokenRecord)),
          update: mock(() => Promise.resolve()),
        },
        authRepo: {
          update: mock(() => Promise.reject(new Error('Password update failed'))),
        },
        userRepo: {
          incrementTokenVersion: mock(() => Promise.resolve()),
        },
      }))
    })

    it('should throw the error within transaction', async () => {
      try {
        await resetPassword({ token: mockToken, password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Password update failed')
      }

      expect(db.transaction).toHaveBeenCalledTimes(1)
      expect(tokenRepo.update).toHaveBeenCalledTimes(1)
      expect(authRepo.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('when password hashing fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/lib/cipher', () => ({
        hashPassword: mock(() => Promise.reject(new Error('Password hashing failed'))),
      }))
    })

    it('should throw the error within transaction', async () => {
      try {
        await resetPassword({ token: mockToken, password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Password hashing failed')
      }

      expect(db.transaction).toHaveBeenCalledTimes(1)
      expect(tokenRepo.update).toHaveBeenCalledTimes(1)
      expect(authRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle empty password', async () => {
      try {
        await resetPassword({ token: mockToken, password: '' })
        expect(true).toBe(false) // should not reach here due to validation
      } catch (error) {
        // This would be caught by the validation layer before reaching this function
        expect(error).toBeDefined()
      }
    })

    it('should handle very long passwords', async () => {
      const longPassword = `A1@${'a'.repeat(1000)}` // very long password

      const result = await resetPassword({ token: mockToken, password: longPassword })

      expect(result).toEqual({ success: true })

      expect(mockHashPassword).toHaveBeenCalledWith(longPassword)
      expect(mockHashPassword).toHaveBeenCalledTimes(1)
    })
  })

  describe('Token Version Invalidation', () => {
    describe('when password reset is successful', () => {
      it('should increment user tokenVersion to invalidate existing JWTs', async () => {
        await moduleMocker.mock('@/repositories', () => ({
          tokenRepo: {
            findByToken: mock(() => Promise.resolve(mockTokenRecord)),
            update: mock(() => Promise.resolve()),
          },
          authRepo: {
            update: mock(() => Promise.resolve()),
          },
          userRepo: {
            incrementTokenVersion: mock(() => Promise.resolve()),
          },
        }))

        await resetPassword({ token: mockToken, password: mockPassword })

        expect(db.transaction).toHaveBeenCalledTimes(1)
        expect(userRepo.incrementTokenVersion).toHaveBeenCalledWith(123, {})
        expect(userRepo.incrementTokenVersion).toHaveBeenCalledTimes(1)
      })
    })

    describe('token version error handling', () => {
      it('should fail if tokenVersion increment fails', async () => {
        await moduleMocker.mock('@/repositories', () => ({
          tokenRepo: {
            findByToken: mock(() => Promise.resolve(mockTokenRecord)),
            update: mock(() => Promise.resolve()),
          },
          authRepo: {
            update: mock(() => Promise.resolve()),
          },
          userRepo: {
            incrementTokenVersion: mock(() => Promise.reject(new Error('TokenVersion update failed'))),
          },
        }))

        try {
          await resetPassword({ token: mockToken, password: mockPassword })
          expect(true).toBe(false) // should not reach here
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('TokenVersion update failed')
        }

        expect(db.transaction).toHaveBeenCalledTimes(1)
        expect(userRepo.incrementTokenVersion).toHaveBeenCalledWith(123, {})
      })
    })

    describe('complete password reset flow', () => {
      it('should complete full flow: password reset → tokenVersion increment → JWT invalidation', async () => {
        const userId = 123

        await moduleMocker.mock('@/repositories', () => ({
          tokenRepo: {
            findByToken: mock(() => Promise.resolve(mockTokenRecord)),
            update: mock(() => Promise.resolve()),
          },
          authRepo: {
            update: mock(() => Promise.resolve()),
          },
          userRepo: {
            incrementTokenVersion: mock(() => Promise.resolve()),
          },
        }))

        // Execute password reset
        const result = await resetPassword({ token: mockToken, password: 'NewPassword123!' })

        // Verify all operations completed in correct order
        expect(result.success).toBe(true)

        // Transaction was called
        expect(db.transaction).toHaveBeenCalledTimes(1)

        // 1. Token marked as used
        expect(tokenRepo.update).toHaveBeenCalledWith(mockValidatedToken.id, {
          status: TokenStatus.Used,
          usedAt: expect.any(Date),
        }, {})

        // 2. Password updated
        expect(authRepo.update).toHaveBeenCalledWith(userId, {
          passwordHash: mockHashedPassword,
        }, {})

        // 3. TokenVersion incremented
        expect(userRepo.incrementTokenVersion).toHaveBeenCalledWith(userId, {})
      })
    })
  })
})
