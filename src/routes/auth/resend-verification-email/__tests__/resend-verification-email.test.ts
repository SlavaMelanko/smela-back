import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ModuleMocker } from '@/__tests__'
import { emailAgent } from '@/lib/email-agent'
import { tokenRepo, userRepo } from '@/repositories'
import { Role, Status, Token } from '@/types'

import resendVerificationEmail from '../resend-verification-email'

describe('Resend Verification Email', () => {
  const moduleMocker = new ModuleMocker(import.meta.url)

  let mockUser: any
  let mockToken: string
  let mockExpiresAt: Date

  beforeEach(async () => {
    mockUser = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: Status.New,
      role: Role.User,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockToken = 'mock-resend-verification-token-123'
    mockExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await moduleMocker.mock('@/repositories', () => ({
      userRepo: {
        findByEmail: mock(() => Promise.resolve(mockUser)),
      },
      tokenRepo: {
        replace: mock(() => Promise.resolve()),
      },
      authRepo: {},
    }))

    await moduleMocker.mock('@/lib/token', () => ({
      generateToken: mock(() => ({
        type: Token.EmailVerification,
        token: mockToken,
        expiresAt: mockExpiresAt,
      })),
    }))

    await moduleMocker.mock('@/lib/email-agent', () => ({
      emailAgent: {
        sendWelcomeEmail: mock(() => Promise.resolve()),
      },
    }))
  })

  afterEach(() => {
    moduleMocker.clear()
  })

  describe('when user exists and is not verified', () => {
    it('should replace token with new verification token', async () => {
      const result = await resendVerificationEmail(mockUser.email)

      expect(tokenRepo.replace).toHaveBeenCalledWith(mockUser.id, {
        userId: mockUser.id,
        type: Token.EmailVerification,
        token: mockToken,
        expiresAt: mockExpiresAt,
      })
      expect(tokenRepo.replace).toHaveBeenCalledTimes(1)

      expect(result).toEqual({ success: true })
    })

    it('should send a welcome email with the new token', async () => {
      await resendVerificationEmail(mockUser.email)

      expect(emailAgent.sendWelcomeEmail).toHaveBeenCalledWith({
        firstName: mockUser.firstName,
        email: mockUser.email,
        token: mockToken,
      })
      expect(emailAgent.sendWelcomeEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('when user does not exist', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(null)),
        },
        tokenRepo: {
          replace: mock(() => Promise.resolve()),
        },
        authRepo: {},
      }))
    })

    it('should return success response to prevent email enumeration', async () => {
      const result = await resendVerificationEmail('nonexistent@example.com')

      expect(result).toEqual({ success: true })
      expect(tokenRepo.replace).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when user is already verified', () => {
    const verifiedUser = {
      ...mockUser,
      status: Status.Verified,
    }

    beforeEach(async () => {
      await moduleMocker.mock('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(verifiedUser)),
        },
        tokenRepo: {
          replace: mock(() => Promise.resolve()),
        },
        authRepo: {},
      }))
    })

    it('should return success response to prevent email enumeration', async () => {
      const result = await resendVerificationEmail(verifiedUser.email)

      expect(result).toEqual({ success: true })
      expect(tokenRepo.replace).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when user is suspended', () => {
    const suspendedUser = {
      ...mockUser,
      status: Status.Suspended,
    }

    beforeEach(async () => {
      await moduleMocker.mock('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(suspendedUser)),
        },
        tokenRepo: {
          replace: mock(() => Promise.resolve()),
        },
        authRepo: {},
      }))
    })

    it('should return success response to prevent email enumeration', async () => {
      const result = await resendVerificationEmail(suspendedUser.email)

      expect(result).toEqual({ success: true })
      expect(tokenRepo.replace).not.toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('when token replacement fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        tokenRepo: {
          replace: mock(() => Promise.reject(new Error('Database error'))),
        },
        authRepo: {},
      }))
    })

    it('should throw the error and not send email', async () => {
      try {
        await resendVerificationEmail(mockUser.email)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database error')
      }

      expect(tokenRepo.replace).toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle email with different cases', async () => {
      const upperCaseEmail = 'JOHN@EXAMPLE.COM'
      const result = await resendVerificationEmail(upperCaseEmail)

      expect(userRepo.findByEmail).toHaveBeenCalledWith(upperCaseEmail)
      expect(result.success).toBe(true)
    })

    it('should reject users with ineligible statuses to prevent enumeration', async () => {
      const ineligibleStatuses = [
        Status.Trial,
        Status.Active,
        Status.Archived,
        Status.Pending,
      ]

      for (const status of ineligibleStatuses) {
        const userWithStatus = { ...mockUser, status }

        await moduleMocker.mock('@/repositories', () => ({
          userRepo: {
            findByEmail: mock(() => Promise.resolve(userWithStatus)),
          },
          tokenRepo: {
            replace: mock(() => Promise.resolve()),
          },
          authRepo: {},
        }))

        const result = await resendVerificationEmail(userWithStatus.email)

        expect(result).toEqual({ success: true })
        expect(tokenRepo.replace).not.toHaveBeenCalled()
        expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
      }
    })
  })

  describe('when email sending fails', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        tokenRepo: {
          replace: mock(() => Promise.resolve()),
        },
        authRepo: {},
      }))

      await moduleMocker.mock('@/lib/email-agent', () => ({
        emailAgent: {
          sendWelcomeEmail: mock(() => Promise.reject(new Error('Email service unavailable'))),
        },
      }))
    })

    it('should complete successfully even if email fails', async () => {
      const result = await resendVerificationEmail(mockUser.email)

      expect(result).toEqual({ success: true })

      expect(tokenRepo.replace).toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).toHaveBeenCalled()
    })
  })

  describe('when replace fails due to transaction error', () => {
    beforeEach(async () => {
      await moduleMocker.mock('@/repositories', () => ({
        userRepo: {
          findByEmail: mock(() => Promise.resolve(mockUser)),
        },
        tokenRepo: {
          replace: mock(() => Promise.reject(new Error('Database connection failed'))),
        },
        authRepo: {},
      }))
    })

    it('should throw the error and not send email', async () => {
      try {
        await resendVerificationEmail(mockUser.email)
        expect(true).toBe(false) // should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database connection failed')
      }

      expect(tokenRepo.replace).toHaveBeenCalled()
      expect(emailAgent.sendWelcomeEmail).not.toHaveBeenCalled()
    })
  })
})
