import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { emailAgent } from '@/lib/email-agent'
import { AppError, ErrorCode } from '@/lib/errors'
import { tokenRepo, userRepo } from '@/repositories'
import { Status, Token } from '@/types'

import requestPasswordReset from '../request-password-reset'

describe('requestPasswordReset', () => {
  const mockUser = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    status: Status.Verified,
    role: 'user' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockToken = 'reset-token-123'
  const mockExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

  beforeEach(() => {
    // Mock repository methods
    mock.module('@/repositories', () => ({
      userRepo: {
        findByEmail: mock(() => Promise.resolve(mockUser)),
      },
      tokenRepo: {
        deprecateOld: mock(() => Promise.resolve()),
        create: mock(() => Promise.resolve()),
      },
      authRepo: {},
    }))

    // Mock token module
    mock.module('@/lib/token', () => ({
      generateToken: mock(() => ({
        type: Token.PasswordReset,
        token: mockToken,
        expiresAt: mockExpiresAt,
      })),
      PASSWORD_RESET_EXPIRY_HOURS: 1,
    }))

    // Mock email agent
    mock.module('@/lib/email-agent', () => ({
      emailAgent: {
        sendResetPasswordEmail: mock(() => Promise.resolve()),
      },
    }))
  })

  describe('when user exists and is active', () => {
    it('should deprecate old tokens and create a new password reset token', async () => {
      const result = await requestPasswordReset(mockUser.email)

      expect(tokenRepo.deprecateOld).toHaveBeenCalledWith(mockUser.id, Token.PasswordReset)
      expect(tokenRepo.deprecateOld).toHaveBeenCalledTimes(1)

      expect(tokenRepo.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        type: Token.PasswordReset,
        token: mockToken,
        expiresAt: mockExpiresAt,
      })
      expect(tokenRepo.create).toHaveBeenCalledTimes(1)

      expect(result).toEqual({ success: true })
    })

    it('should send a reset password email with the new token', async () => {
      await requestPasswordReset(mockUser.email)

      expect(emailAgent.sendResetPasswordEmail).toHaveBeenCalledWith({
        firstName: mockUser.firstName,
        email: mockUser.email,
        token: mockToken,
      })
      expect(emailAgent.sendResetPasswordEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('when user does not exist', () => {
    beforeEach(() => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.resolve()),
          create: mock(() => Promise.resolve()),
        },
        authRepo: {},
      }))
    })

    it('should throw Unauthorized error to prevent email enumeration', async () => {
      try {
        await requestPasswordReset('nonexistent@example.com')
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe(ErrorCode.Unauthorized)
      }

      expect(tokenRepo.deprecateOld).not.toHaveBeenCalled()
      expect(tokenRepo.create).not.toHaveBeenCalled()
      expect(emailAgent.sendResetPasswordEmail).not.toHaveBeenCalled()
    })
  })

  describe('when user is not active', () => {
    const inactiveStatuses = [Status.New, Status.Suspended, Status.Archived]

    inactiveStatuses.forEach((status) => {
      describe(`when user status is ${status}`, () => {
        beforeEach(() => {
          const inactiveUser = { ...mockUser, status }
          mock.module('@/repositories', () => ({
            userRepo: {
              findByEmail: mock(() => Promise.resolve(inactiveUser)),
            },
            tokenRepo: {
              deprecateOld: mock(() => Promise.resolve()),
              create: mock(() => Promise.resolve()),
            },
            authRepo: {},
          }))
        })

        it('should throw Forbidden error', async () => {
          try {
            await requestPasswordReset(mockUser.email)
            expect(true).toBe(false) // Should not reach here
          } catch (error) {
            expect(error).toBeInstanceOf(AppError)
            expect((error as AppError).code).toBe(ErrorCode.Forbidden)
          }

          expect(tokenRepo.deprecateOld).not.toHaveBeenCalled()
          expect(tokenRepo.create).not.toHaveBeenCalled()
          expect(emailAgent.sendResetPasswordEmail).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('when token creation fails', () => {
    beforeEach(() => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.resolve()),
          create: mock(() => Promise.reject(new Error('Database connection failed'))),
        },
        authRepo: {},
      }))
    })

    it('should throw the error and not send email', async () => {
      try {
        await requestPasswordReset(mockUser.email)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(tokenRepo.deprecateOld).toHaveBeenCalledTimes(1)
      expect(tokenRepo.create).toHaveBeenCalledTimes(1)
      expect(emailAgent.sendResetPasswordEmail).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle email with different cases', async () => {
      const uppercaseEmail = mockUser.email.toUpperCase()
      await requestPasswordReset(uppercaseEmail)

      expect(userRepo.findByEmail).toHaveBeenCalledWith(uppercaseEmail)
      expect(emailAgent.sendResetPasswordEmail).toHaveBeenCalledWith({
        firstName: mockUser.firstName,
        email: mockUser.email, // Should use the original email from user record
        token: mockToken,
      })
    })

    it('should handle users with minimal names', async () => {
      const userWithShortName = { ...mockUser, firstName: 'A', lastName: 'B' }
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(userWithShortName)),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.resolve()),
          create: mock(() => Promise.resolve()),
        },
        authRepo: {},
      }))

      await requestPasswordReset(mockUser.email)

      expect(emailAgent.sendResetPasswordEmail).toHaveBeenCalledWith({
        firstName: 'A',
        email: mockUser.email,
        token: mockToken,
      })
    })
  })

  describe('when email sending fails', () => {
    beforeEach(() => {
      mock.module('@/lib/email-agent', () => ({
        emailAgent: {
          sendResetPasswordEmail: mock(() => Promise.reject(new Error('Email service unavailable'))),
        },
      }))
    })

    it('should throw the email error after creating token', async () => {
      try {
        await requestPasswordReset(mockUser.email)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Email service unavailable')
      }

      // Token should still be created before email fails
      expect(tokenRepo.deprecateOld).toHaveBeenCalledTimes(1)
      expect(tokenRepo.create).toHaveBeenCalledTimes(1)
      expect(emailAgent.sendResetPasswordEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('when deprecateOld fails', () => {
    beforeEach(() => {
      mock.module('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        tokenRepo: {
          deprecateOld: mock(() => Promise.reject(new Error('Database connection failed'))),
          create: mock(() => Promise.resolve()),
        },
        authRepo: {},
      }))
    })

    it('should throw the error and not proceed with token creation or email', async () => {
      try {
        await requestPasswordReset(mockUser.email)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(tokenRepo.deprecateOld).toHaveBeenCalledTimes(1)
      expect(tokenRepo.create).not.toHaveBeenCalled()
      expect(emailAgent.sendResetPasswordEmail).not.toHaveBeenCalled()
    })
  })
})
