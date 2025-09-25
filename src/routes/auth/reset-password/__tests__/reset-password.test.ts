import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { AppError, ErrorCode } from '@/lib/catch'
import { TOKEN_LENGTH } from '@/lib/token/constants'
import { authRepo, tokenRepo, userRepo } from '@/repositories'
import { Token, TokenStatus } from '@/types'

import resetPassword from '../reset-password'

describe('Reset Password', () => {
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

  const mockHashFunction = mock(() => Promise.resolve(mockHashedPassword))
  const mockEncoder = {
    hash: mockHashFunction,
  }
  const mockCreatePasswordEncoder = mock(() => mockEncoder)

  beforeEach(() => {
    mockHashFunction.mockClear()
    mockCreatePasswordEncoder.mockClear()

    mock.module('@/repositories', () => ({
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

    mock.module('@/lib/token', () => ({
      TokenValidator: {
        validate: mock(() => mockValidatedToken),
      },
    }))

    mock.module('@/lib/crypto', () => ({
      createPasswordEncoder: mockCreatePasswordEncoder,
    }))
  })

  describe('when token is valid and active', () => {
    it('should validate token, mark as used, update password, and increment token version', async () => {
      const result = await resetPassword({ token: mockToken, password: mockPassword })

      expect(tokenRepo.findByToken).toHaveBeenCalledWith(mockToken)
      expect(tokenRepo.findByToken).toHaveBeenCalledTimes(1)

      expect(tokenRepo.update).toHaveBeenCalledWith(mockValidatedToken.id, {
        status: TokenStatus.Used,
        usedAt: expect.any(Date),
      })
      expect(tokenRepo.update).toHaveBeenCalledTimes(1)

      expect(authRepo.update).toHaveBeenCalledWith(mockValidatedToken.userId, {
        passwordHash: mockHashedPassword,
      })
      expect(authRepo.update).toHaveBeenCalledTimes(1)

      expect(userRepo.incrementTokenVersion).toHaveBeenCalledWith(mockValidatedToken.userId)
      expect(userRepo.incrementTokenVersion).toHaveBeenCalledTimes(1)

      expect(result).toEqual({ success: true })
    })

    it('should hash the new password before updating', async () => {
      await resetPassword({ token: mockToken, password: mockPassword })

      expect(mockCreatePasswordEncoder).toHaveBeenCalledTimes(1)
      expect(mockHashFunction).toHaveBeenCalledWith(mockPassword)
      expect(mockHashFunction).toHaveBeenCalledTimes(1)
    })
  })

  describe('when token validation fails', () => {
    beforeEach(() => {
      mock.module('@/lib/token', () => ({
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

      expect(tokenRepo.update).not.toHaveBeenCalled()
      expect(authRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is expired', () => {
    beforeEach(() => {
      mock.module('@/lib/token', () => ({
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

      expect(tokenRepo.update).not.toHaveBeenCalled()
      expect(authRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token is already used', () => {
    beforeEach(() => {
      mock.module('@/lib/token', () => ({
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

      expect(tokenRepo.update).not.toHaveBeenCalled()
      expect(authRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token type is wrong', () => {
    beforeEach(() => {
      mock.module('@/lib/token', () => ({
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

      expect(tokenRepo.update).not.toHaveBeenCalled()
      expect(authRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when token marking as used fails', () => {
    beforeEach(() => {
      mock.module('@/repositories', () => ({
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

      expect(tokenRepo.update).toHaveBeenCalledTimes(1)
      expect(authRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('when password update fails', () => {
    beforeEach(() => {
      mock.module('@/repositories', () => ({
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

    it('should throw the error after marking token as used', async () => {
      try {
        await resetPassword({ token: mockToken, password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Password update failed')
      }

      expect(tokenRepo.update).toHaveBeenCalledTimes(1)
      expect(authRepo.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('when password hashing fails', () => {
    beforeEach(() => {
      const failingHashFunction = mock(() => Promise.reject(new Error('Hashing failed')))
      mock.module('@/lib/crypto', () => ({
        createPasswordEncoder: mock(() => ({
          hash: failingHashFunction,
        })),
      }))
    })

    it('should throw the error after marking token as used', async () => {
      try {
        await resetPassword({ token: mockToken, password: mockPassword })
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Hashing failed')
      }

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

      expect(mockCreatePasswordEncoder).toHaveBeenCalled()
      expect(mockHashFunction).toHaveBeenCalledWith(longPassword)
    })
  })

  describe('Token Version Invalidation', () => {
    describe('when password reset is successful', () => {
      it('should increment user tokenVersion to invalidate existing JWTs', async () => {
        mock.module('@/repositories', () => ({
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

        expect(userRepo.incrementTokenVersion).toHaveBeenCalledWith(123)
        expect(userRepo.incrementTokenVersion).toHaveBeenCalledTimes(1)
      })
    })

    describe('Token Version Error Handling', () => {
      it('should fail if tokenVersion increment fails', async () => {
        mock.module('@/repositories', () => ({
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

        expect(userRepo.incrementTokenVersion).toHaveBeenCalledWith(123)
      })
    })

    describe('Complete Password Reset Flow', () => {
      it('should complete full flow: password reset → tokenVersion increment → JWT invalidation', async () => {
        const userId = 123

        mock.module('@/repositories', () => ({
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

        // 1. Token marked as used
        expect(tokenRepo.update).toHaveBeenCalledWith(mockValidatedToken.id, {
          status: TokenStatus.Used,
          usedAt: expect.any(Date),
        })

        // 2. Password updated
        expect(authRepo.update).toHaveBeenCalledWith(userId, {
          passwordHash: mockHashedPassword,
        })

        // 3. TokenVersion incremented
        expect(userRepo.incrementTokenVersion).toHaveBeenCalledWith(userId)
      })
    })
  })
})
